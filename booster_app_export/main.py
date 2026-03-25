import sys
import ctypes
import eel
import psutil
import os

try:
    import winreg
except ImportError:
    winreg = None

# Initialize Eel with the 'web' folder
eel.init('web')

@eel.expose
def boost_game():
    """
    Loops through running processes and safely kills non-essential 
    background applications to free up RAM and CPU.
    """
    # Target processes (common resource hogs)
    targets = ['spotify.exe', 'discord.exe', 'chrome.exe', 'msedge.exe', 'slack.exe', 'teams.exe']
    freed_memory = 0
    closed_apps = []

    for proc in psutil.process_iter(['pid', 'name', 'memory_info']):
        try:
            name = proc.info.get('name')
            if name and name.lower() in targets:
                # Get memory usage in MB
                mem = proc.info['memory_info'].rss / (1024 * 1024) 
                freed_memory += mem
                closed_apps.append(name)
                proc.kill() # Safely terminate the process
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            # Ignore processes we can't access or that already died
            pass

    unique_closed = list(set(closed_apps))
    return {
        "status": "success",
        "message": f"Freed {freed_memory:.2f} MB of RAM.",
        "details": f"Closed: {', '.join(unique_closed) if unique_closed else 'No target apps found running.'}"
    }

@eel.expose
def clean_system():
    """
    Targets the Windows %TEMP% directory and safely deletes 
    temporary files to free up disk space.
    """
    temp_dir = os.environ.get('TEMP')
    freed_space = 0

    if not temp_dir or not os.path.exists(temp_dir):
        return {"status": "error", "message": "Temp directory not found."}

    for item in os.listdir(temp_dir):
        item_path = os.path.join(temp_dir, item)
        try:
            if os.path.isfile(item_path):
                size = os.path.getsize(item_path)
                os.unlink(item_path)
                freed_space += size
            elif os.path.isdir(item_path):
                # ⚡ Bolt Optimization: Use a single bottom-up traversal to calculate size
                # and delete simultaneously. This replaces the previous double-traversal
                # (os.walk for size + shutil.rmtree for deletion), cutting I/O operations by ~50%.
                dir_size = 0
                for dirpath, dirnames, filenames in os.walk(item_path, topdown=False):
                    for f in filenames:
                        fp = os.path.join(dirpath, f)
                        try:
                            if not os.path.islink(fp):
                                f_size = os.path.getsize(fp)
                                os.unlink(fp)
                                dir_size += f_size
                            else:
                                os.unlink(fp)
                        except Exception:
                            pass
                    for d in dirnames:
                        dp = os.path.join(dirpath, d)
                        try:
                            os.rmdir(dp)
                        except Exception:
                            pass
                try:
                    os.rmdir(item_path)
                except Exception:
                    pass
                freed_space += dir_size
        except Exception as e:
            # Files currently in use by Windows will throw an exception.
            # We safely skip them.
            pass

    return {
        "status": "success",
        "message": f"Cleaned {freed_space / (1024 * 1024):.2f} MB of Junk."
    }

@eel.expose
def optimize_startup():
    """
    Identifies and disables non-essential startup programs by modifying the registry.
    """
    if winreg is None:
        return {"status": "error", "message": "Startup optimization is only supported on Windows."}

    # Target non-essential apps to disable from startup
    targets = ['spotify', 'discord', 'skype', 'onedrive', 'steam', 'epicgameslauncher', 'battlenet', 'teams', 'slack']
    disabled_apps = []
    
    try:
        # Open the Run key for the current user
        key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_ALL_ACCESS)
        
        i = 0
        while True:
            try:
                name, value, _ = winreg.EnumValue(key, i)
                name_lower = name.lower()
                value_lower = value.lower()
                
                # Check if it's a target non-essential app
                is_target = any(target in name_lower or target in value_lower for target in targets)
                if is_target:
                    # Disable it by deleting the registry value
                    winreg.DeleteValue(key, name)
                    disabled_apps.append(name)
                    # Don't increment i because we deleted an item, the next item shifts to index i
                else:
                    i += 1
            except OSError:
                # No more values
                break
                
        winreg.CloseKey(key)
        
    except Exception as e:
        return {"status": "error", "message": f"Failed to access registry: {str(e)}"}
        
    if disabled_apps:
        return {
            "status": "success",
            "message": f"Disabled {len(disabled_apps)} startup programs.",
            "details": f"Disabled: {', '.join(disabled_apps)}"
        }
    else:
        return {
            "status": "success",
            "message": "No non-essential startup programs found.",
            "details": ""
        }


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

if __name__ == '__main__':
    # Start the app. port=0 automatically selects an available port.
    eel.start('index.html', size=(1000, 650), port=0)

