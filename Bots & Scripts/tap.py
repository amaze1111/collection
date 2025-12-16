#!/usr/bin/env python3
import subprocess, time, sys, signal

X, Y = 548, 1623          # ← pixel coordinates to tap
INTERVAL = 0.1          # seconds between taps

# Graceful Ctrl‑C handling
signal.signal(signal.SIGINT, lambda *_: sys.exit(0))

while True:
    subprocess.run(
        ["adb", "shell", "input", "tap", str(X), str(Y)],
        stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT
    )
    time.sleep(INTERVAL)
