import sys
import ctypes
import eel
import psutil
import os
import threading
import time
import subprocess

try:
    import winreg
except ImportError:
    winreg = None

# Initialize Eel with the 'web' folder
eel.init('web')


# Phase 1: Core Boost Engine variables
monitor_thread = None
monitoring_active = False
target_game_exe = ""
suspended_services_list = []

def monitor_game_process():
    global monitoring_active, target_game_exe

    # Define priorities based on OS
    if hasattr(psutil, 'HIGH_PRIORITY_CLASS'):
        HIGH_PRIO = psutil.HIGH_PRIORITY_CLASS
        LOW_PRIO = psutil.IDLE_PRIORITY_CLASS
        NORMAL_PRIO = psutil.NORMAL_PRIORITY_CLASS
    else:
        # Fallback for non-Windows (or just ignore if windows only)
        HIGH_PRIO = -10
        LOW_PRIO = 10
        NORMAL_PRIO = 0

    while monitoring_active:
        found_game = False
        game_proc = None

        # 1. Find the game process
        for proc in psutil.process_iter(['name']):
            try:
                name = proc.info.get('name')
                if name and name.lower() == target_game_exe.lower():
                    found_game = True
                    game_proc = proc
                    break
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        # 2. Adjust priorities
        if found_game and game_proc:
            # Set game to high priority
            try:
                if game_proc.nice() != HIGH_PRIO:
                    game_proc.nice(HIGH_PRIO)
                    try:
                        eel.add_log(f"Set {target_game_exe} to High Priority")()
                    except:
                        pass
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

            # Set background apps to low priority
            bg_targets = ['chrome.exe', 'discord.exe', 'msedge.exe', 'spotify.exe']
            for proc in psutil.process_iter(['name']):
                try:
                    name = proc.info.get('name')
                    if name and name.lower() in bg_targets:
                        if proc.nice() != LOW_PRIO:
                            proc.nice(LOW_PRIO)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
        else:
            # If game not found, maybe restore priorities (optional, skipping for now to keep simple)
            pass

        time.sleep(5)

@eel.expose
def start_monitor(target_exe):
    global monitor_thread, monitoring_active, target_game_exe

    if not target_exe:
        return {"status": "error", "message": "No target executable provided."}

    target_game_exe = target_exe

    if monitoring_active:
        return {"status": "success", "message": f"Already monitoring for {target_exe}"}

    monitoring_active = True
    monitor_thread = threading.Thread(target=monitor_game_process, daemon=True)
    monitor_thread.start()

    return {"status": "success", "message": f"Started monitoring for {target_exe}"}

@eel.expose
def stop_monitor():
    global monitoring_active
    monitoring_active = False
    return {"status": "success", "message": "Stopped monitoring process priorities."}



@eel.expose
def suspend_services():
    global suspended_services_list
    services_to_suspend = ['Spooler', 'TabletInputService', 'SysMain', 'DiagTrack']
    suspended = []

    for service in services_to_suspend:
        try:
            # CREATE_NO_WINDOW is 0x08000000
            result = subprocess.run(['sc', 'stop', service], capture_output=True, text=True, creationflags=0x08000000)
            # sc stop returns 0 on success, or output contains FAILED
            if result.returncode == 0 or 'SUCCESS' in result.stdout:
                suspended.append(service)
            elif '1062' in result.stdout:
                # 1062 means service has not been started, which is fine
                pass
        except Exception:
            pass

    suspended_services_list.extend(suspended)
    return {
        "status": "success",
        "message": f"Suspended {len(suspended)} non-essential services.",
        "details": f"Suspended: {', '.join(suspended)}" if suspended else ""
    }

@eel.expose
def restore_services():
    global suspended_services_list
    restored = []

    for service in suspended_services_list:
        try:
            result = subprocess.run(['sc', 'start', service], capture_output=True, text=True, creationflags=0x08000000)
            if result.returncode == 0 or 'SUCCESS' in result.stdout:
                restored.append(service)
        except Exception:
            pass

    suspended_services_list = []
    return {
        "status": "success",
        "message": f"Restored {len(restored)} services.",
        "details": f"Restored: {', '.join(restored)}" if restored else ""
    }


@eel.expose
def purge_ram():
    """
    Purges RAM by clearing the working set of all processes the app has access to.
    """
    try:
        if not hasattr(ctypes, 'windll'):
            return {"status": "error", "message": "RAM Purge is only supported on Windows."}

        # PROCESS_SET_QUOTA | PROCESS_QUERY_INFORMATION
        rights = 0x0100 | 0x0400

        # We need to explicitly check if psapi is available
        if not hasattr(ctypes.windll, 'psapi'):
            ctypes.windll.LoadLibrary("psapi")

        count = 0
        for proc in psutil.process_iter(['pid']):
            try:
                pid = proc.info.get('pid')
                if pid:
                    handle = ctypes.windll.kernel32.OpenProcess(rights, False, pid)
                    if handle:
                        ctypes.windll.psapi.EmptyWorkingSet(handle)
                        ctypes.windll.kernel32.CloseHandle(handle)
                        count += 1
            except Exception:
                pass

        return {"status": "success", "message": f"Successfully purged RAM for {count} processes."}
    except Exception as e:
        return {"status": "error", "message": f"Failed to purge RAM: {str(e)}"}

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

    # Whitelist the current process and all its children (e.g., the browser spawned by eel)
    whitelist_pids = set()
    try:
        current_process = psutil.Process()
        whitelist_pids.add(current_process.pid)
        for child in current_process.children(recursive=True):
            whitelist_pids.add(child.pid)
    except Exception:
        pass

    # ⚡ Bolt Optimization: Only request the cheap 'name' attribute during process_iter
    # Fetching 'memory_info' for *every* running process involves expensive OS calls.
    # We instead only call proc.memory_info() on the matched target processes.
    for proc in psutil.process_iter(['name']):
        try:
            if proc.pid in whitelist_pids:
                continue

            name = proc.info.get('name')
            if name and name.lower() in targets:
                # Get memory usage in MB only for target processes
                mem = proc.memory_info().rss / (1024 * 1024)
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

