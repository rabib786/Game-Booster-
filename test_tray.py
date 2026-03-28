import pystray
from PIL import Image
import threading
import time

def run_tray():
    image = Image.new('RGB', (64, 64), color=(0, 255, 0))
    def on_quit(icon, item):
        icon.stop()
    menu = pystray.Menu(pystray.MenuItem('Quit', on_quit))
    icon = pystray.Icon("Test", image, "Test Tray", menu)
    icon.run()

t = threading.Thread(target=run_tray)
t.start()
print("Tray started in thread. Waiting 2 seconds...")
time.sleep(2)
print("Done.")
