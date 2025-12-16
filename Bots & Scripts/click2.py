import pyautogui
import time
import pywinctl as gw

# Define the coordinates to click
x_coordinate = 673  
y_coordinate = 548

# Define the number of clicks and the interval between clicks
num_clicks = 20
interval_seconds = 1 # seconds

# Define the title of the window to click on
window_title = "BlueStacks Air" # *** Replace with the actual window title ***

print(f"Attempting to click at ({x_coordinate}, {y_coordinate}) {num_clicks} times with {interval_seconds} second interval on window '{window_title}'...")

try:
    # Find the window and bring it to the foreground using pygetwindow
    target_window = gw.getWindowsWithTitle(window_title)

    if target_window:
        # pygetwindow returns a list of window objects, activate the first one
        target_window[0].activate()
        print(f"Window '{window_title}' found and activated.")
        time.sleep(1)  # Give the window a moment to become active

        for i in range(num_clicks):
            pyautogui.click(x_coordinate, y_coordinate)
            print(f"Clicked {i + 1} times")
            time.sleep(interval_seconds)

        print("Done.")
    else:
        print(f"Window with title '{window_title}' not found.")

except Exception as e:
    print(f"An error occurred: {e}")

print("Script finished.")