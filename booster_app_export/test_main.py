import sys
import unittest
from unittest.mock import MagicMock, patch
import os

# 1. Mock external dependencies BEFORE importing main to ensure decorators work correctly
mock_eel = MagicMock()
def mock_expose(func):
    return func
mock_eel.expose = mock_expose
sys.modules['eel'] = mock_eel

# Mock other heavy dependencies
sys.modules['psutil'] = MagicMock()
sys.modules['tkinter'] = MagicMock()
sys.modules['pystray'] = MagicMock()
sys.modules['PIL'] = MagicMock()
sys.modules['keyboard'] = MagicMock()
sys.modules['icoextract'] = MagicMock()
sys.modules['winreg'] = MagicMock()
sys.modules['pynvml'] = MagicMock()

# 2. Import main and functions to test
import main
from main import (
    clean_system, clean_shader_caches, full_system_clean, set_power_plan,
    flush_dns_and_reset, validate_config, get_prime_games,
    suspend_services, restore_services, purge_ram
)

class TestCleanSystem(unittest.TestCase):
    @patch('os.environ.get')
    @patch('os.path.exists')
    @patch('os.scandir')
    @patch('os.unlink')
    @patch('os.walk')
    @patch('os.rmdir')
    def test_clean_system_locked_file(self, mock_rmdir, mock_walk, mock_unlink,
                                     mock_scandir, mock_exists, mock_environ_get):
        """Test that locked files/directories don't cause the function to crash."""
        mock_environ_get.return_value = 'C:\\Temp'
        mock_exists.return_value = True

        file_entry = MagicMock()
        file_entry.name = 'locked_file.txt'
        file_entry.path = 'C:\\Temp\\locked_file.txt'
        file_entry.is_symlink.return_value = False
        file_entry.is_file.return_value = True
        file_entry.is_dir.return_value = False
        file_entry.stat.return_value.st_size = 1024

        dir_entry = MagicMock()
        dir_entry.name = 'locked_dir'
        dir_entry.path = 'C:\\Temp\\locked_dir'
        dir_entry.is_symlink.return_value = False
        dir_entry.is_file.return_value = False
        dir_entry.is_dir.return_value = True

        mock_unlink.side_effect = OSError("File is locked")
        mock_walk.return_value = [('C:\\Temp\\locked_dir', ['subdir'], ['file_in_dir.txt'])]
        mock_rmdir.side_effect = OSError("Directory is locked")

        inner_file_entry = MagicMock()
        inner_file_entry.name = 'file_in_dir.txt'
        inner_file_entry.path = 'C:\\Temp\\locked_dir\\file_in_dir.txt'
        inner_file_entry.is_symlink.return_value = False
        inner_file_entry.is_file.return_value = True
        inner_file_entry.is_dir.return_value = False
        inner_file_entry.stat.return_value.st_size = 1024

        def scandir_side_effect(path):
            mock_cm = MagicMock()
            if path == 'C:\\Temp':
                mock_cm.__enter__.return_value = [file_entry, dir_entry]
            elif path == 'C:\\Temp\\locked_dir':
                mock_cm.__enter__.return_value = [inner_file_entry]
            else:
                mock_cm.__enter__.return_value = []
            return mock_cm
        mock_scandir.side_effect = scandir_side_effect

        result = clean_system()
        self.assertEqual(result['status'], 'success')
        self.assertIn("Cleaned 0.00 MB of Temp Junk", result['message'])
        mock_unlink.assert_called()
        mock_rmdir.assert_called()

    @patch('os.environ.get')
    @patch('os.path.exists')
    @patch('os.scandir')
    @patch('os.unlink')
    @patch('os.walk')
    @patch('os.rmdir')
    def test_clean_system_mixed_files(self, mock_rmdir, mock_walk, mock_unlink,
                                     mock_scandir, mock_exists, mock_environ_get):
        """Test that some files are deleted even if others are locked."""
        mock_environ_get.return_value = 'C:\\Temp'
        mock_exists.return_value = True

        normal_entry = MagicMock()
        normal_entry.name = 'normal_file.txt'
        normal_entry.path = 'C:\\Temp\\normal_file.txt'
        normal_entry.is_symlink.return_value = False
        normal_entry.is_file.return_value = True
        normal_entry.is_dir.return_value = False
        normal_entry.stat.return_value.st_size = 1024 * 1024 # 1MB

        locked_entry = MagicMock()
        locked_entry.name = 'locked_file.txt'
        locked_entry.path = 'C:\\Temp\\locked_file.txt'
        locked_entry.is_symlink.return_value = False
        locked_entry.is_file.return_value = True
        locked_entry.is_dir.return_value = False
        locked_entry.stat.return_value.st_size = 1024 * 1024 # 1MB

        normal_dir_entry = MagicMock()
        normal_dir_entry.name = 'normal_dir'
        normal_dir_entry.path = 'C:\\Temp\\normal_dir'
        normal_dir_entry.is_symlink.return_value = False
        normal_dir_entry.is_file.return_value = False
        normal_dir_entry.is_dir.return_value = True

        inner_file = MagicMock()
        inner_file.name = 'inner.txt'
        inner_file.path = 'C:\\Temp\\normal_dir\\inner.txt'
        inner_file.is_symlink.return_value = False
        inner_file.is_file.return_value = True
        inner_file.is_dir.return_value = False
        inner_file.stat.return_value.st_size = 1024 * 1024 * 4 # 4MB

        def scandir_side_effect(path):
            mock_cm = MagicMock()
            if path == 'C:\\Temp':
                mock_cm.__enter__.return_value = [normal_entry, locked_entry, normal_dir_entry]
            elif path == 'C:\\Temp\\normal_dir':
                mock_cm.__enter__.return_value = [inner_file]
            else:
                mock_cm.__enter__.return_value = []
            return mock_cm
        mock_scandir.side_effect = scandir_side_effect

        def unlink_side_effect(path):
            if 'locked_file.txt' in path:
                raise OSError("Locked")
            return None
        mock_unlink.side_effect = unlink_side_effect

        result = clean_system()
        self.assertEqual(result['status'], 'success')
        self.assertIn("Cleaned 5.00 MB of Temp Junk", result['message'])

    @patch('main.clean_system')
    @patch('main.clean_shader_caches')
    def test_full_system_clean(self, mock_clean_shaders, mock_clean_sys):
        mock_clean_sys.return_value = {
            'status': 'success',
            'message': 'Cleaned 10.00 MB of Temp Junk.'
        }
        mock_clean_shaders.return_value = {
            'status': 'success',
            'message': 'Cleaned 5.00 MB of Shader/Prefetch Junk.',
            'details': 'Cleaned GPU Shaders and Prefetch files: 5.00 MB'
        }

        result = full_system_clean(include_shaders=False)
        self.assertEqual(result['status'], 'success')
        self.assertIn("10.00", result['message'])
        mock_clean_shaders.assert_not_called()

        result = full_system_clean(include_shaders=True)
        self.assertEqual(result['status'], 'success')
        self.assertIn("15.00 MB", result['message'])
        self.assertIn("System Temp: 10.00 MB | Cleaned GPU Shaders and Prefetch files: 5.00 MB", result['details'])

class TestCleanShaderCaches(unittest.TestCase):
    @patch('os.environ.get')
    @patch('main._delete_target_dirs')
    def test_clean_shader_caches_success(self, mock_delete, mock_environ_get):
        def environ_side_effect(key, default=''):
            if key == 'LOCALAPPDATA': return 'C:\\Users\\User\\AppData\\Local'
            if key == 'WINDIR': return 'C:\\Windows'
            return default
        mock_environ_get.side_effect = environ_side_effect
        mock_delete.return_value = 1024 * 1024 * 5 # 5MB

        result = clean_shader_caches()

        self.assertEqual(result['status'], 'success')
        self.assertIn("Cleaned 5.00 MB of Shader/Prefetch Junk.", result['message'])
        self.assertIn("Cleaned GPU Shaders and Prefetch files: 5.00 MB", result['details'])

        expected_dirs = [
            os.path.join('C:\\Windows', 'Prefetch'),
            os.path.join('C:\\Users\\User\\AppData\\Local', 'NVIDIA', 'DXCache'),
            os.path.join('C:\\Users\\User\\AppData\\Local', 'NVIDIA', 'GLCache'),
            os.path.join('C:\\Users\\User\\AppData\\Local', 'AMD', 'DxCache')
        ]
        mock_delete.assert_called_once_with(expected_dirs)

    @patch('os.environ.get')
    @patch('main._delete_target_dirs')
    def test_clean_shader_caches_empty(self, mock_delete, mock_environ_get):
        mock_environ_get.return_value = ''
        mock_delete.return_value = 0

        result = clean_shader_caches()

        self.assertEqual(result['status'], 'success')
        self.assertIn("Cleaned 0.00 MB of Shader/Prefetch Junk.", result['message'])
        self.assertEqual(result['details'], "No matching caches found.")

class TestPowerPlanAndNetwork(unittest.TestCase):
    @patch('subprocess.run')
    def test_set_power_plan_success(self, mock_run):
        mock_run.return_value.returncode = 0
        result = set_power_plan('high_performance')
        powercfg_path = os.path.join(os.environ.get('SystemRoot', r'C:\Windows'), 'System32', 'powercfg.exe')
        kwargs = {'creationflags': 0x08000000} if sys.platform == 'win32' else {}
        mock_run.assert_called_with(
            [powercfg_path, '/setactive', '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'],
            capture_output=True,
            text=True,
            **kwargs
        )
        self.assertEqual(result['status'], 'success')

        result = set_power_plan('balanced')
        mock_run.assert_called_with(
            [powercfg_path, '/setactive', '381b4222-f694-41f0-9685-ff5bb260df2e'],
            capture_output=True,
            text=True,
            **kwargs
        )
        self.assertEqual(result['status'], 'success')

    @patch('subprocess.run')
    def test_flush_dns_and_reset_success(self, mock_run):
        mock_run.return_value.returncode = 0
        result = flush_dns_and_reset()
        self.assertEqual(mock_run.call_count, 4)
        calls = mock_run.call_args_list
        ipconfig_path = os.path.join(os.environ.get('SystemRoot', r'C:\Windows'), 'System32', 'ipconfig.exe')
        netsh_path = os.path.join(os.environ.get('SystemRoot', r'C:\Windows'), 'System32', 'netsh.exe')
        self.assertEqual(calls[0][0][0], [ipconfig_path, '/release'])
        self.assertEqual(calls[1][0][0], [ipconfig_path, '/renew'])
        self.assertEqual(calls[2][0][0], [ipconfig_path, '/flushdns'])
        self.assertEqual(calls[3][0][0], [netsh_path, 'int', 'ip', 'reset'])

class TestConfigAndGames(unittest.TestCase):
    def test_validate_config_recovers_invalid_shape(self):
        normalized, is_valid = validate_config({"boost_profiles": "oops", "user_preferences": {"tray_active": "yes"}})
        self.assertFalse(is_valid)
        self.assertIsInstance(normalized["boost_profiles"]["Aggressive"], list)
        self.assertTrue(normalized["user_preferences"]["tray_active"])

    def test_validate_config_preserves_valid_values(self):
        raw = {
            "boost_profiles": {
                "Aggressive": ["Discord.EXE", "Chrome.exe"],
                "Conservative": [],
                "Custom": ["MyApp.exe"]
            },
            "user_preferences": {"tray_active": False}
        }
        normalized, is_valid = validate_config(raw)
        self.assertFalse(is_valid)
        self.assertEqual(normalized["boost_profiles"]["Aggressive"], ["discord.exe", "chrome.exe"])
        self.assertEqual(normalized["boost_profiles"]["Custom"], ["myapp.exe"])
        self.assertEqual(normalized["user_preferences"]["tray_active"], False)

    @patch("main.scan_games")
    def test_scan_games(self, mock_scan):
        mock_scan.return_value = [{
            "id": "730", "title": "Counter-Strike 2", "exe_path": "/mock/cs2.exe", "exe_name": "cs2.exe",
            "icon_path": None, "profile": {"high_priority": True, "network_flush": True, "power_plan": True, "suspend_services": True, "ram_purge": True}
        }]
        result = main.scan_games()
        self.assertGreater(len(result), 0)
        self.assertEqual(result[0]['title'], 'Counter-Strike 2')

    @patch('main.scan_games')
    @patch('os.path.exists')
    @patch('subprocess.Popen')
    @patch('main.purge_ram')
    @patch('main.start_monitor')
    @patch('main.suspend_services')
    @patch('main.flush_dns_and_reset')
    @patch('main.set_power_plan')
    def test_launch_game(self, mock_power, mock_flush, mock_suspend, mock_monitor, mock_purge, mock_subprocess, mock_exists, mock_scan):
        mock_exists.return_value = True
        mock_scan.return_value = [{"id": "730", "title": "Counter-Strike 2", "exe_path": "/mock/cs2.exe", "exe_name": "cs2.exe", "icon_path": None, "profile": {}}]
        profile = {"high_priority": True, "network_flush": True, "power_plan": True, "suspend_services": True, "ram_purge": True}
        result = main.launch_game("730", profile, "/mock/untrusted.exe", "untrusted.exe")
        self.assertEqual(result['status'], 'success')
        mock_power.assert_called_once_with('high_performance')
        mock_subprocess.assert_called_once()

    @patch('main.scan_games')
    def test_launch_game_untrusted(self, mock_scan):
        mock_scan.return_value = []
        result = main.launch_game("730", {}, "/mock/cs2.exe", "cs2.exe")
        self.assertEqual(result['status'], 'error')
        self.assertIn('not found in trusted library', result['message'])

    @patch('main.scan_games')
    def test_get_prime_games(self, mock_scan):
        mock_scan.return_value = [{"id": "1", "title": "Cyberpunk 2077®"}, {"id": "2", "title": "Call of Duty®: Warzone™"}]
        result = get_prime_games()
        self.assertEqual(len(result), 2)
        titles = [g['name'] for g in result]
        self.assertIn("Cyberpunk 2077®", titles)
        self.assertIn("Call of Duty®: Warzone™", titles)

class TestServiceManagement(unittest.TestCase):
    @patch('subprocess.Popen')
    def test_suspend_services_success(self, mock_popen):
        mock_process_success = MagicMock()
        mock_process_success.returncode = 0
        mock_process_success.communicate.return_value = ('SUCCESS', '')
        mock_process_1062 = MagicMock()
        mock_process_1062.returncode = 1
        mock_process_1062.communicate.return_value = ('error 1062', '')
        mock_popen.side_effect = [mock_process_success, mock_process_1062, mock_process_success, mock_process_success]
        main.suspended_services_list = []
        result = suspend_services()
        self.assertEqual(result['status'], 'success')
        self.assertIn('Suspended 3 non-essential services.', result['message'])
        self.assertEqual(main.suspended_services_list, ['Spooler', 'SysMain', 'DiagTrack'])

    @patch('subprocess.Popen')
    def test_suspend_services_exception(self, mock_popen):
        mock_process_success = MagicMock()
        mock_process_success.returncode = 0
        mock_process_success.communicate.return_value = ('SUCCESS', '')

        def popen_side_effect(cmd, **kwargs):
            if cmd[2] == 'Spooler': raise Exception("Popen Exception")
            if cmd[2] == 'SysMain':
                m = MagicMock()
                m.communicate.side_effect = Exception("Communicate Exception")
                return m
            return mock_process_success

        mock_popen.side_effect = popen_side_effect
        main.suspended_services_list = []
        result = suspend_services()
        self.assertEqual(result['status'], 'success')
        self.assertIn('Suspended 2 non-essential services.', result['message'])
        self.assertEqual(main.suspended_services_list, ['TabletInputService', 'DiagTrack'])

    @patch('subprocess.Popen')
    def test_restore_services_success(self, mock_popen):
        mock_process_success = MagicMock()
        mock_process_success.returncode = 0
        mock_process_success.communicate.return_value = ('SUCCESS', '')
        mock_popen.return_value = mock_process_success
        main.suspended_services_list = ['Spooler', 'SysMain']
        result = restore_services()
        self.assertEqual(result['status'], 'success')
        self.assertIn('Restored 2 services.', result['message'])
        self.assertEqual(main.suspended_services_list, [])
        self.assertEqual(mock_popen.call_count, 2)

    @patch('subprocess.Popen')
    def test_restore_services_partial_failure(self, mock_popen):
        mock_process_success = MagicMock()
        mock_process_success.returncode = 0
        mock_process_success.communicate.return_value = ('SUCCESS', '')
        mock_process_failure = MagicMock()
        mock_process_failure.returncode = 1
        mock_process_failure.communicate.return_value = ('FAILED', 'error')
        mock_popen.side_effect = [mock_process_success, mock_process_failure]
        main.suspended_services_list = ['Spooler', 'SysMain']
        result = restore_services()
        self.assertEqual(result['status'], 'success')
        self.assertIn('Restored 1 services.', result['message'])
        self.assertEqual(main.suspended_services_list, [])

class TestUndoBoost(unittest.TestCase):
    @patch('main.subprocess.Popen')
    @patch('main.os.path.exists')
    @patch('main.load_config')
    def test_undo_boost_success(self, mock_load_config, mock_exists, mock_popen):
        mock_load_config.return_value = {
            "boost_profiles": {
                "Aggressive": ["discord.exe"]
            }
        }
        mock_exists.return_value = True

        main.killed_processes_history = [
            "/mock/path/discord.exe"
        ]

        result = main.undo_boost()

        self.assertEqual(result['status'], 'success')
        self.assertIn('Restarted 1 applications', result['message'])
        self.assertEqual(len(main.killed_processes_history), 0)
        mock_popen.assert_called_once()

    def test_undo_boost_empty_history(self):
        main.killed_processes_history = []
        result = main.undo_boost()
        self.assertEqual(result['status'], 'error')
        self.assertEqual(result['message'], 'No applications to restart.')

    @patch('main.subprocess.Popen')
    @patch('main.os.path.exists')
    @patch('main.load_config')
    def test_undo_boost_untrusted_app(self, mock_load_config, mock_exists, mock_popen):
        mock_load_config.return_value = {
            "boost_profiles": {
                "Aggressive": ["discord.exe"]
            }
        }
        mock_exists.return_value = True

        main.killed_processes_history = [
            "/mock/path/malicious.exe"
        ]

        result = main.undo_boost()

        self.assertEqual(result['status'], 'success')
        self.assertIn('Failed to restart 1', result['message'])
        self.assertEqual(len(main.killed_processes_history), 0)
        mock_popen.assert_not_called()

class TestPurgeRam(unittest.TestCase):
    @patch('main.ctypes')
    @patch('main.psutil')
    def test_purge_ram_success(self, mock_psutil, mock_ctypes):
        mock_ctypes.windll.kernel32.OpenProcess.return_value = 'mock_handle'
        mock_psutil.pids.return_value = [100, 200, 300]
        result = purge_ram()
        self.assertEqual(result['status'], 'success')
        self.assertIn('Successfully purged RAM for 3 processes', result['message'])

    @patch('main.ctypes')
    def test_purge_ram_unsupported_os(self, mock_ctypes):
        del mock_ctypes.windll
        result = purge_ram()
        self.assertEqual(result['status'], 'error')
        self.assertEqual(result['message'], 'RAM Purge is only supported on Windows.')

    @patch('main.ctypes')
    @patch('main.psutil')
    def test_purge_ram_partial_success_with_errors(self, mock_psutil, mock_ctypes):
        mock_ctypes.windll.kernel32.OpenProcess.return_value = 'mock_handle'
        mock_ctypes.windll.psapi.EmptyWorkingSet.side_effect = [None, Exception("Access Denied"), None]
        mock_psutil.pids.return_value = [100, 200, 300]
        result = purge_ram()
        self.assertEqual(result['status'], 'success')
        self.assertIn('Successfully purged RAM for 2 processes', result['message'])

if __name__ == '__main__':
    unittest.main()
