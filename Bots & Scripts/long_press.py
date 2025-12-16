#!/usr/bin/env python3
import subprocess, time, sys, signal, cv2
import numpy as np

X, Y = 557, 1716          # tap location (adjust as needed)
INTERVAL = 1.5            # seconds between actions

# Calibration: pixels to ms (you must calibrate this for your game)
PIXELS_PER_MS = 1.2       # e.g., 2 pixels = 1 ms press

# Graceful Ctrl‑C handling
signal.signal(signal.SIGINT, lambda *_: sys.exit(0))

def get_screenshot():
    subprocess.run(["adb", "shell", "screencap", "-p", "/sdcard/screen.png"])
    subprocess.run(["adb", "pull", "/sdcard/screen.png", "screen.png"], stdout=subprocess.DEVNULL)
    img = cv2.imread("screen.png")
    return img

def find_obstacle_distance(img):
    # Use y=1620 for character, y=1800 for obstacle
    y_char = 1620
    y_obs = 1800

    # Define color range for black (BGR)
    lower_black = np.array([0, 0, 0])
    upper_black = np.array([40, 160, 200])

    # Character: search in left half
    row_char = img[y_char, :img.shape[1] // 2, :]
    char_indices = np.where(
        np.all((row_char >= lower_black) & (row_char <= upper_black), axis=1)
    )[0]
    if len(char_indices) == 0:
        print("Character not found!")
        return 0
    character_x = int(char_indices[0])  # Use the first black pixel as location

    # Obstacle: search in right half
    row_obs = img[y_obs, img.shape[1] // 2:, :]
    obs_indices = np.where(
        np.all((row_obs >= lower_black) & (row_obs <= upper_black), axis=1)
    )[0]
    if len(obs_indices) == 0:
        print("Obstacle not found!")
        return 0
    # Use the first black pixel as obstacle location (adjust x to full image coordinates)
    obstacle_x = int(obs_indices[0] + img.shape[1] // 2)

    distance = obstacle_x - character_x
    return max(distance, 0)

while True:
    img = get_screenshot()
    distance = find_obstacle_distance(img)
    duration_ms = int(distance / PIXELS_PER_MS)
    print(f"Distance: {distance} px, Duration: {duration_ms} ms")

    subprocess.run(
        ["adb", "shell", "input", "swipe", str(X), str(Y), str(X), str(Y), str(duration_ms)],
        stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT
    )
    time.sleep(INTERVAL)