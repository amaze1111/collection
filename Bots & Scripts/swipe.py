import subprocess, time, sys, signal

X1, Y1 = 470, 600         # ← swipe start coordinates
X2, Y2 = 2100, 570         # ← swipe end coordinates
DURATION = 200             # duration in ms
INTERVAL = 0.35            # seconds between swipes

# Graceful Ctrl‑C handling
signal.signal(signal.SIGINT, lambda *_: sys.exit(0))

while True:
    subprocess.run(
        ["adb", "shell", "input", "swipe", str(X1), str(Y1), str(X2), str(Y2), str(DURATION)],
        stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT
    )
    time.sleep(INTERVAL)