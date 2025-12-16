import pyautogui
import time

# Define the coordinates to click
x_coordinate = 750
y_coordinate = 5125

# Define the number of clicks and the interval between clicks
num_clicks = 25
interval_seconds = 2 # seconds

try:
    while True:
        x, y = pyautogui.position()
        print(f"Mouse pointer is at: x={x}, y={y}", end='\r')
        time.sleep(0.1)  # Update every 0.1 seconds
except KeyboardInterrupt:
    print("\nStopped tracking.")

# print(f"Clicking at ({x_coordinate}, {y_coordinate}) {num_clicks} times with {interval_seconds} second interval...")

# for i in range(num_clicks):
#     pyautogui.click(x_coordinate, y_coordinate)
#     print(f"Clicked {i + 1} times")
#     time.sleep(interval_seconds)

print("Done.")