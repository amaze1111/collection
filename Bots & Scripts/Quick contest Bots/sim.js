"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var NUM_GAMES = 50;
var CONTEST_SIZE = 4;
var ENTRY_FEE = 10;
var WIN_AMOUNTS = [25, 10];
var MAX_BOTS = 3;
var NUM_CONTESTS = 2;
var botAccountBalance = 0;
var botIdCounter = 1;
var userIdCounter = 1;
var contestIdCounter = 1;
// Simulate a pool of users joining over time
function getNextUserJoinTime(lastJoinTime) {
    // Users join every 0-2 minutes randomly
    return lastJoinTime + Math.floor(Math.random() * 3);
}
function getTimestamp(offset) {
    var base = new Date();
    base.setMinutes(base.getMinutes() + offset);
    return base.toISOString();
}
function randomScore() {
    return Math.floor(Math.random() * 1000) + 1;
}
// ...existing code...
// Helper to get the score needed for a bot to win a target rank, using rule 14 logic and rule 6
function getBotTargetScore(participants, winAmounts, botAccountBalance, botsInContest) {
    var _a, _b;
    // Calculate total entry fees paid by all bots in this contest (excluding the one about to join)
    var totalBotEntryFees = botsInContest * ENTRY_FEE;
    // Calculate expected win amounts for bots who have posted scores
    var sortedScores = __spreadArray([], participants.filter(function (p) { return p.score > 0; }), true).sort(function (a, b) { return b.score - a.score; });
    var expectedWinAmount = 0;
    for (var i = 0; i < sortedScores.length; i++) {
        if (sortedScores[i].type === 'bot' && i < winAmounts.length) {
            expectedWinAmount += winAmounts[i];
        }
    }
    // Modified Rule: If value < -10, target 25 (rank 1); else target 10 (rank 2)
    var value = botAccountBalance - totalBotEntryFees + expectedWinAmount;
    var targetWinAmount;
    var targetRank;
    if (value < -10) {
        targetWinAmount = 25;
        targetRank = 1;
    }
    else {
        targetWinAmount = 10;
        targetRank = 2;
    }
    // Find the score to beat for that rank (0-based index)
    var scoreToBeat = (_b = (_a = sortedScores[targetRank - 1]) === null || _a === void 0 ? void 0 : _a.score) !== null && _b !== void 0 ? _b : 0;
    var score = scoreToBeat + Math.floor(Math.random() * 10) + 1;
    return { score: score, targetWinAmount: targetWinAmount, targetRank: targetRank };
}
function simulateContests() {
    var events = [];
    var contests = [];
    var globalTime = 0;
    var nextUserJoinTime = [0, 0]; // for each contest
    var userQueue = [0, 0]; // how many users have joined each contest
    // Initialize contests
    for (var i = 0; i < NUM_CONTESTS; i++) {
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
    var totalGames = 0;
    while (totalGames < NUM_GAMES) {
        // For each contest, process user and bot entries
        for (var c = 0; c < NUM_CONTESTS; c++) {
            var contest = contests[c];
            // If contest is full or settled, respawn
            if (contest.isFull || contest.isSettled) {
                // Settle contest
                if (!contest.isSettled && contest.entries.length > 0) {
                    // Settlement logic
                    var sorted = __spreadArray([], contest.entries, true).sort(function (a, b) { return b.score - a.score; });
                    for (var i = 0; i < sorted.length; i++) {
                        var p = sorted[i];
                        var winAmount = 0;
                        var result = 'loss';
                        var rank = i + 1;
                        if (i < WIN_AMOUNTS.length) {
                            winAmount = WIN_AMOUNTS[i];
                            result = 'win';
                            if (p.type === 'bot')
                                botAccountBalance += winAmount;
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
                            winAmount: winAmount,
                            targetWinAmount: 0,
                            score: p.score,
                            rank: rank,
                            result: result,
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
            if (contest.entries.length < CONTEST_SIZE &&
                userQueue[c] < CONTEST_SIZE - 1 && // leave at least 1 slot for bot if needed
                globalTime >= nextUserJoinTime[c]) {
                var participantId = "user".concat(userIdCounter++);
                var entryTime = globalTime;
                var score = randomScore();
                // Entry event
                events.push({
                    transactionId: 0,
                    gameId: contest.gameId,
                    contestId: contest.contestId,
                    entryType: 'user',
                    participantId: participantId,
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
                    participantId: participantId,
                    eventType: 'score_posted',
                    timestamp: getTimestamp(entryTime),
                    accountBalance: 0,
                    entryFeePaid: 0,
                    winAmount: 0,
                    targetWinAmount: 0,
                    score: score,
                    rank: 0,
                    result: '',
                });
                contest.entries.push({ id: participantId, type: 'user', score: score, entryTime: entryTime });
                userQueue[c]++;
                nextUserJoinTime[c] = getNextUserJoinTime(globalTime);
            }
            // Bot entry logic (only after at least 1 user has joined)
            if (contest.entries.length < CONTEST_SIZE &&
                contest.entries.filter(function (e) { return e.type === 'user'; }).length > 0 &&
                contest.botsInContest < MAX_BOTS &&
                (contest.entries.length === userQueue[c] || // only after all users for now
                    contest.entries.length < CONTEST_SIZE)) {
                // Wait 1 min after last user entry for each bot
                var botEntryTime = contest.startTime + contest.entries.length + 1;
                if (globalTime >= botEntryTime) {
                    contest.botsInContest++;
                    var entryType = 'bot';
                    var participantId = "bot".concat(botIdCounter++);
                    var entryTime = globalTime;
                    // Bot can see all user scores before posting its own
                    var score = 0;
                    var targetWinAmount = 0;
                    var targetRank = 0;
                    var botTarget = getBotTargetScore(contest.entries, WIN_AMOUNTS, botAccountBalance, contest.botsInContest - 1);
                    score = botTarget.score;
                    targetWinAmount = botTarget.targetWinAmount;
                    targetRank = botTarget.targetRank;
                    // Entry event
                    events.push({
                        transactionId: 0,
                        gameId: contest.gameId,
                        contestId: contest.contestId,
                        entryType: entryType,
                        participantId: participantId,
                        eventType: 'entry',
                        timestamp: getTimestamp(entryTime),
                        accountBalance: botAccountBalance,
                        entryFeePaid: ENTRY_FEE,
                        winAmount: 0,
                        targetWinAmount: targetWinAmount,
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
                        entryType: entryType,
                        participantId: participantId,
                        eventType: 'score_posted',
                        timestamp: getTimestamp(entryTime),
                        accountBalance: botAccountBalance,
                        entryFeePaid: 0,
                        winAmount: 0,
                        targetWinAmount: targetWinAmount,
                        score: score,
                        rank: 0,
                        result: '',
                    });
                    contest.entries.push({ id: participantId, type: entryType, score: score, entryTime: entryTime });
                }
            }
            // Mark contest as full if 4 entries and settle immediately
            if (contest.entries.length === CONTEST_SIZE && !contest.isFull) {
                contest.isFull = true;
                contest.isSettled = false;
                // Immediate settlement
                var sorted = __spreadArray([], contest.entries, true).sort(function (a, b) { return b.score - a.score; });
                for (var i = 0; i < sorted.length; i++) {
                    var p = sorted[i];
                    var winAmount = 0;
                    var result = 'loss';
                    var rank = i + 1;
                    if (i < WIN_AMOUNTS.length) {
                        winAmount = WIN_AMOUNTS[i];
                        result = 'win';
                        if (p.type === 'bot')
                            botAccountBalance += winAmount;
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
                        winAmount: winAmount,
                        targetWinAmount: 0,
                        score: p.score,
                        rank: rank,
                        result: result,
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
var allEvents = simulateContests();
// Sort all events by timestamp, then by eventType (entry < score_posted < settlement)
var eventOrder = { entry: 1, score_posted: 2, settlement: 3 };
allEvents.sort(function (a, b) {
    if (a.timestamp < b.timestamp)
        return -1;
    if (a.timestamp > b.timestamp)
        return 1;
    return eventOrder[a.eventType] - eventOrder[b.eventType];
});
// Assign transaction IDs in time order
allEvents.forEach(function (e, idx) { e.transactionId = idx + 1; });
// Write to CSV
var header = [
    'transactionId',
    'gameId', 'contestId', 'entryType', 'participantId', 'eventType', 'timestamp',
    'accountBalance', 'entryFeePaid', 'winAmount', 'targetWinAmount', 'score', 'rank', 'result'
].join(',');
var csvRows = allEvents.map(function (e) {
    return [
        e.transactionId,
        e.gameId, e.contestId, e.entryType, e.participantId, e.eventType, e.timestamp,
        e.accountBalance, e.entryFeePaid, e.winAmount, e.targetWinAmount, e.score, e.rank, e.result
    ].join(',');
});
fs.writeFileSync('simulation_events.csv', __spreadArray([header], csvRows, true).join('\n'));
console.log('Simulation complete. Output: simulation_events.csv');
