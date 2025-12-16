import * as fs from 'fs';

type EntryType = 'user' | 'bot';
type EventType = 'entry' | 'settlement' | 'score_posted' | 'decision';

interface Event {
  transactionId: number;
  gameId: number;
  contestId: number;
  entryType: EntryType;
  participantId: string;
  eventType: EventType;
  timestamp: string;
  accountBalance: number;
  entryFeePaid: number;
  winAmount: number;
  targetWinAmount: number;
  score: number;
  rank: number;
  result: 'win' | 'loss' | '';
}

const NUM_GAMES = 50;
const CONTEST_SIZE = 4;
const ENTRY_FEE = 10;
const WIN_AMOUNTS = [25, 10];
const MAX_BOTS = 3;
const NUM_CONTESTS = 2;

let botAccountBalance = 0;
let botIdCounter = 1;
let userIdCounter = 1;
let contestIdCounter = 1;

// Simulate a pool of users joining over time
function getNextUserJoinTime(lastJoinTime: number): number {
  // Users join every 0-2 minutes randomly
  return lastJoinTime + Math.floor(Math.random() * 3);
}

function getTimestamp(offset: number) {
  const base = new Date();
  base.setMinutes(base.getMinutes() + offset);
  return base.toISOString();
}

function randomScore() {
  return Math.floor(Math.random() * 1000) + 1;
}

// Helper to get the score needed for a bot to win a target rank, using rule 14 logic and rule 6
function getBotTargetScore(
  participants: { id: string, type: EntryType, score: number }[],
  winAmounts: number[],
  botAccountBalance: number,
  botsInContest: number
): {score: number, targetWinAmount: number, targetRank: number} {
  // Calculate total entry fees paid by all bots in this contest (excluding the one about to join)
  const totalBotEntryFees = botsInContest * ENTRY_FEE;

  // Calculate expected win amounts for bots who have posted scores
  const sortedScores = [...participants.filter(p => p.score > 0)].sort((a, b) => b.score - a.score);
  let expectedWinAmount = 0;
  for (let i = 0; i < sortedScores.length; i++) {
    if (sortedScores[i].type === 'bot' && i < winAmounts.length) {
      expectedWinAmount += winAmounts[i];
    }
  }

  const value = botAccountBalance - totalBotEntryFees + expectedWinAmount;
  let targetWinAmount: number;
  let targetRank: number;
  if (value < -10) {
    targetWinAmount = 25;
    targetRank = 1;
  } else {
    targetWinAmount = 10;
    targetRank = 2;
  }

  // Find the score to beat for that rank (0-based index)
  const scoreToBeat = sortedScores[targetRank - 1]?.score ?? 0;
  const score = scoreToBeat + Math.floor(Math.random() * 10) + 1;

  return {score, targetWinAmount, targetRank};
}

interface ContestState {
  contestId: number;
  gameId: number;
  startTime: number;
  entries: { id: string, type: EntryType, score: number, entryTime: number }[];
  botsInContest: number;
  isFull: boolean;
  isSettled: boolean;
}

function simulateContests(): Event[] {
  const events: Event[] = [];
  let contests: ContestState[] = [];
  let globalTime = 0;
  let nextUserJoinTime = [0, 0]; // for each contest
  let userQueue: number[] = [0, 0]; // how many users have joined each contest

  // Initialize contests
  for (let i = 0; i < NUM_CONTESTS; i++) {
    contests.push({
      contestId: contestIdCounter++,
      gameId: i + 1,
      startTime: 0,
      entries: [],
      botsInContest: 0,
      isFull: false,
      isSettled: false,
    });
  }

  // Simulate until enough games are played
  let totalGames = 0;
  while (totalGames < NUM_GAMES) {
    // For each contest, process user and bot entries
    for (let c = 0; c < NUM_CONTESTS; c++) {
      let contest = contests[c];

      // If contest is full or settled, respawn
      if (contest.isFull || contest.isSettled) {
        // Settle contest
        if (!contest.isSettled && contest.entries.length > 0) {
          // Settlement logic
          const sorted = [...contest.entries].sort((a, b) => b.score - a.score);
          for (let i = 0; i < sorted.length; i++) {
            const p = sorted[i];
            let winAmount = 0;
            let result: 'win' | 'loss' | '' = 'loss';
            let rank = i + 1;
            if (i < WIN_AMOUNTS.length) {
              winAmount = WIN_AMOUNTS[i];
              result = 'win';
              if (p.type === 'bot') botAccountBalance += winAmount;
            }
            events.push({
              transactionId: 0, // will be assigned after sorting
              gameId: contest.gameId,
              contestId: contest.contestId,
              entryType: p.type,
              participantId: p.id,
              eventType: 'settlement',
              timestamp: getTimestamp(contest.startTime + 10),
              accountBalance: p.type === 'bot' ? botAccountBalance : 0,
              entryFeePaid: 0,
              winAmount,
              targetWinAmount: 0,
              score: p.score,
              rank,
              result,
            });
          }
        }
        // Respawn contest
        totalGames++;
        contests[c] = {
          contestId: contestIdCounter++,
          gameId: totalGames + NUM_CONTESTS,
          startTime: globalTime,
          entries: [],
          botsInContest: 0,
          isFull: false,
          isSettled: false,
        };
        userQueue[c] = 0;
        nextUserJoinTime[c] = globalTime;
        continue;
      }

      // User entry logic
      if (
        contest.entries.length < CONTEST_SIZE &&
        userQueue[c] < CONTEST_SIZE - 1 && // leave at least 1 slot for bot if needed
        globalTime >= nextUserJoinTime[c]
      ) {
        const participantId = `user${userIdCounter++}`;
        const entryTime = globalTime;
        const score = randomScore();

        // Entry event
        events.push({
          transactionId: 0,
          gameId: contest.gameId,
          contestId: contest.contestId,
          entryType: 'user',
          participantId,
          eventType: 'entry',
          timestamp: getTimestamp(entryTime),
          accountBalance: 0,
          entryFeePaid: ENTRY_FEE,
          winAmount: 0,
          targetWinAmount: 0,
          score: 0,
          rank: 0,
          result: '',
        });

        // Score posted event
        events.push({
          transactionId: 0,
          gameId: contest.gameId,
          contestId: contest.contestId,
          entryType: 'user',
          participantId,
          eventType: 'score_posted',
          timestamp: getTimestamp(entryTime),
          accountBalance: 0,
          entryFeePaid: 0,
          winAmount: 0,
          targetWinAmount: 0,
          score,
          rank: 0,
          result: '',
        });

        contest.entries.push({ id: participantId, type: 'user', score, entryTime });
        userQueue[c]++;
        nextUserJoinTime[c] = getNextUserJoinTime(globalTime);
      }

      // Bot entry logic (only after at least 1 user has joined)
      if (
        contest.entries.length < CONTEST_SIZE &&
        contest.entries.filter(e => e.type === 'user').length > 0 &&
        contest.botsInContest < MAX_BOTS &&
        (contest.entries.length === userQueue[c] || // only after all users for now
          contest.entries.length < CONTEST_SIZE)
      ) {
        // Wait 1 min after last user entry for each bot
        const botEntryTime = contest.startTime + contest.entries.length + 1;
        if (globalTime >= botEntryTime) {
          contest.botsInContest++;
          const entryType: EntryType = 'bot';
          const participantId = `bot${botIdCounter++}`;
          const entryTime = globalTime;

          // Bot can see all user scores before posting its own
          let score = 0;
          let targetWinAmount = 0;
          let targetRank = 0;
          const botTarget = getBotTargetScore(
            contest.entries,
            WIN_AMOUNTS,
            botAccountBalance,
            contest.botsInContest - 1
          );
          score = botTarget.score;
          targetWinAmount = botTarget.targetWinAmount;
          targetRank = botTarget.targetRank;

          // Entry event
          events.push({
            transactionId: 0,
            gameId: contest.gameId,
            contestId: contest.contestId,
            entryType,
            participantId,
            eventType: 'entry',
            timestamp: getTimestamp(entryTime),
            accountBalance: botAccountBalance,
            entryFeePaid: ENTRY_FEE,
            winAmount: 0,
            targetWinAmount,
            score: 0,
            rank: 0,
            result: '',
          });

          botAccountBalance -= ENTRY_FEE;

          // Score posted event (after seeing all user scores)
          events.push({
            transactionId: 0,
            gameId: contest.gameId,
            contestId: contest.contestId,
            entryType,
            participantId,
            eventType: 'score_posted',
            timestamp: getTimestamp(entryTime),
            accountBalance: botAccountBalance,
            entryFeePaid: 0,
            winAmount: 0,
            targetWinAmount,
            score,
            rank: 0,
            result: '',
          });

          contest.entries.push({ id: participantId, type: entryType, score, entryTime });
        }
      }

      // Mark contest as full if 4 entries and settle immediately
      if (contest.entries.length === CONTEST_SIZE && !contest.isFull) {
        contest.isFull = true;
        contest.isSettled = false;
        // Immediate settlement
        const sorted = [...contest.entries].sort((a, b) => b.score - a.score);
        for (let i = 0; i < sorted.length; i++) {
          const p = sorted[i];
          let winAmount = 0;
          let result: 'win' | 'loss' | '' = 'loss';
          let rank = i + 1;
          if (i < WIN_AMOUNTS.length) {
            winAmount = WIN_AMOUNTS[i];
            result = 'win';
            if (p.type === 'bot') botAccountBalance += winAmount;
          }
          events.push({
            transactionId: 0,
            gameId: contest.gameId,
            contestId: contest.contestId,
            entryType: p.type,
            participantId: p.id,
            eventType: 'settlement',
            timestamp: getTimestamp(globalTime), // settlement at current time
            accountBalance: p.type === 'bot' ? botAccountBalance : 0,
            entryFeePaid: 0,
            winAmount,
            targetWinAmount: 0,
            score: p.score,
            rank,
            result,
          });
        }
        contest.isSettled = true;
      }
    }
    globalTime++;
  }
  return events;
}

// Main simulation
let allEvents = simulateContests();

// Sort all events by timestamp, then by eventType (entry < score_posted < settlement)
const eventOrder = { entry: 1, score_posted: 2, settlement: 3 };
allEvents.sort((a, b) => {
  if (a.timestamp < b.timestamp) return -1;
  if (a.timestamp > b.timestamp) return 1;
  return eventOrder[a.eventType] - eventOrder[b.eventType];
});

// Assign transaction IDs in time order
allEvents.forEach((e, idx) => { e.transactionId = idx + 1; });

// Write to CSV
const header = [
  'transactionId',
  'gameId', 'contestId', 'entryType', 'participantId', 'eventType', 'timestamp',
  'accountBalance', 'entryFeePaid', 'winAmount', 'targetWinAmount', 'score', 'rank', 'result'
].join(',');

const csvRows = allEvents.map(e =>
  [
    e.transactionId,
    e.gameId, e.contestId, e.entryType, e.participantId, e.eventType, e.timestamp,
    e.accountBalance, e.entryFeePaid, e.winAmount, e.targetWinAmount, e.score, e.rank, e.result
  ].join(',')
);

fs.writeFileSync('simulation_events.csv', [header, ...csvRows].join('\n'));
console.log('Simulation complete. Output: simulation_events.csv');