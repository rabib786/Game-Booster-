import re

with open('booster_app_export/main.py', 'r') as f:
    content = f.read()

additions = """
import sys
import ctypes

@eel.expose
def close_window():
    sys.exit(0)

@eel.expose
def minimize_window():
    try:
        hwnd = ctypes.windll.user32.GetForegroundWindow()
        ctypes.windll.user32.ShowWindow(hwnd, 6) # SW_MINIMIZE
    except Exception:
        pass

@eel.expose
def maximize_window():
    try:
        hwnd = ctypes.windll.user32.GetForegroundWindow()
        # We can try to maximize
        ctypes.windll.user32.ShowWindow(hwnd, 3) # SW_MAXIMIZE
    except Exception:
        pass
"""

# Insert before if __name__ == '__main__':
content = content.replace("if __name__ == '__main__':", additions + "\nif __name__ == '__main__':")

with open('booster_app_export/main.py', 'w') as f:
    f.write(content)
