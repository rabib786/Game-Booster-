import sys
from unittest.mock import MagicMock

# Mock eel before importing main to prevent it from messing up with decorators
mock_eel = MagicMock()
def mock_expose(func):
    return func
mock_eel.expose = mock_expose
sys.modules['eel'] = mock_eel

mock_psutil = MagicMock()
sys.modules['psutil'] = mock_psutil
sys.modules['tkinter'] = MagicMock()

import main

import sys


# Define a mock decorator that returns the function itself
def mock_expose(func):
    return func

mock_eel.expose = mock_expose

sys.modules['psutil'] = MagicMock()

import unittest
from unittest.mock import patch
import os

# Now import clean_system from main
from main import clean_system

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
        # Setup
        mock_environ_get.return_value = 'C:\\Temp'
        mock_exists.return_value = True

        # Create mock DirEntry objects
        mock_file_entry = MagicMock()
        mock_file_entry.path = 'C:\\Temp\\locked_file.txt'
        mock_file_entry.is_file.return_value = True
        mock_file_entry.is_dir.return_value = False
        mock_file_entry.stat.return_value.st_size = 1024

        mock_dir_entry = MagicMock()
        mock_dir_entry.path = 'C:\\Temp\\locked_dir'
        mock_dir_entry.is_file.return_value = False
        mock_dir_entry.is_dir.return_value = True

        mock_scandir.return_value = [mock_file_entry, mock_dir_entry]

        # Scenario 1: locked_file.txt is a file and raises OSError when unlinked
        mock_unlink.side_effect = OSError("File is locked")

        # Scenario 2: locked_dir is a directory and raises OSError when rmdir'd
        mock_walk.return_value = [('C:\\Temp\\locked_dir', ['subdir'], ['file_in_dir.txt'])]
        mock_rmdir.side_effect = OSError("Directory is locked")

        # Execute
        result = clean_system()

        # Assertions
        self.assertEqual(result['status'], 'success')
        # Freed space should be 0.00 MB because both attempts to delete failed
        self.assertIn("Cleaned 0.00 MB of Junk", result['message'])

        # Verify that unlink was called for the file and rmdir for the directory
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
        # Setup
        mock_environ_get.return_value = 'C:\\Temp'
        mock_exists.return_value = True

        # Create mock DirEntry objects
        mock_normal_file = MagicMock()
        mock_normal_file.path = 'C:\\Temp\\normal_file.txt'
        mock_normal_file.is_file.return_value = True
        mock_normal_file.is_dir.return_value = False
        mock_normal_file.stat.return_value.st_size = 1024 * 1024  # 1MB

        mock_locked_file = MagicMock()
        mock_locked_file.path = 'C:\\Temp\\locked_file.txt'
        mock_locked_file.is_file.return_value = True
        mock_locked_file.is_dir.return_value = False
        mock_locked_file.stat.return_value.st_size = 1024 * 1024  # 1MB

        # The loop will process both files because scandir is mock to return both
        mock_scandir.return_value = [mock_normal_file, mock_locked_file]

        def unlink_side_effect(path):
            if 'locked_file.txt' in path:
                raise OSError("Locked")
            return None
        mock_unlink.side_effect = unlink_side_effect

        # Execute
        result = clean_system()

        # Assertions
        self.assertEqual(result['status'], 'success')
        # Freed space should be 1.00 MB (from normal_file.txt)
        # 1MB / (1024*1024) = 1.0
        self.assertIn("Cleaned 5.00 MB of Junk", result['message'])

if __name__ == '__main__':
    unittest.main()


@patch('subprocess.run')
def test_set_power_plan_success(mock_run):
    from main import set_power_plan

    # Mock successful powercfg execution
    mock_run.return_value.returncode = 0

    # Test High Performance
    result = set_power_plan('high_performance')
    mock_run.assert_called_with(
        ['powercfg', '/setactive', '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'],
        capture_output=True,
        text=True,
        creationflags=0x08000000
    )
    assert result['status'] == 'success'

    # Test Balanced
    result = set_power_plan('balanced')
    mock_run.assert_called_with(
        ['powercfg', '/setactive', '381b4222-f694-41f0-9685-ff5bb260df2e'],
        capture_output=True,
        text=True,
        creationflags=0x08000000
    )
    assert result['status'] == 'success'

@patch('subprocess.run')
def test_flush_dns_and_reset_success(mock_run):
    from main import flush_dns_and_reset

    # Mock successful network flush execution
    mock_run.return_value.returncode = 0

    result = flush_dns_and_reset()

    # Ensure subprocess.run was called for the 4 expected commands
    assert mock_run.call_count == 4

    calls = mock_run.call_args_list
    assert calls[0][0][0] == ['ipconfig', '/release']
    assert calls[1][0][0] == ['ipconfig', '/renew']
    assert calls[2][0][0] == ['ipconfig', '/flushdns']
    assert calls[3][0][0] == ['netsh', 'int', 'ip', 'reset']

    assert result['status'] == 'success'

@patch("main.scan_games")
def test_scan_games(mock_scan):

    # For testing, we just mock the return of scan_games since mocking the entire OS/winreg flow is complex across platforms
    mock_scan.return_value = [{
        "id": "730",
        "title": "Counter-Strike 2",
        "exe_path": "/mock/path/cs2.exe",
        "exe_name": "cs2.exe",
        "icon_path": None,
        "profile": {
            "high_priority": True,
            "network_flush": True,
            "power_plan": True,
            "suspend_services": True,
            "ram_purge": True
        }
    }]


    result = main.scan_games()

    assert len(result) > 0
    assert result[0]['title'] == 'Counter-Strike 2'
    assert result[0]['exe_name'] == 'cs2.exe'

@patch('main.scan_games')
@patch('os.path.exists')
@patch('subprocess.Popen')
@patch('main.purge_ram')
@patch('main.start_monitor')
@patch('main.suspend_services')
@patch('main.flush_dns_and_reset')
@patch('main.set_power_plan')
def test_launch_game(mock_power, mock_flush, mock_suspend, mock_monitor, mock_purge, mock_subprocess, mock_exists, mock_scan):
    # Mock the system modification functions
    mock_exists.return_value = True
    mock_scan.return_value = [{
        "id": "730",
        "title": "Counter-Strike 2",
        "exe_path": "/mock/cs2.exe",
        "exe_name": "cs2.exe",
        "icon_path": None,
        "profile": {}
    }]

    profile = {
        "high_priority": True,
        "network_flush": True,
        "power_plan": True,
            "suspend_services": True,
            "ram_purge": True
    }

    result = main.launch_game("730", profile, "/mock/untrusted.exe", "untrusted.exe")

    assert result['status'] == 'success'
    mock_power.assert_called_once_with('high_performance')
    mock_flush.assert_called_once()
    mock_suspend.assert_called_once()
    mock_monitor.assert_called_once_with('cs2.exe')
    mock_purge.assert_called_once()
    mock_subprocess.assert_called_once()

@patch('main.scan_games')
@patch('os.path.exists')
@patch('subprocess.Popen')
@patch('main.purge_ram')
@patch('main.start_monitor')
@patch('main.suspend_services')
@patch('main.flush_dns_and_reset')
@patch('main.set_power_plan')
def test_launch_game_no_profile(mock_power, mock_flush, mock_suspend, mock_monitor, mock_purge, mock_subprocess, mock_exists, mock_scan):
    # Mock the system modification functions
    mock_exists.return_value = True
    mock_scan.return_value = [{
        "id": "730",
        "title": "Counter-Strike 2",
        "exe_path": "/mock/cs2.exe",
        "exe_name": "cs2.exe",
        "icon_path": None,
        "profile": {}
    }]

    profile = {
        "high_priority": False,
        "network_flush": False,
        "power_plan": False,
        "suspend_services": False,
        "ram_purge": False
    }

    result = main.launch_game("730", profile, "/mock/untrusted.exe", "untrusted.exe")

    assert result['status'] == 'success'
    mock_power.assert_not_called()
    mock_flush.assert_not_called()
    mock_suspend.assert_not_called()
    mock_monitor.assert_not_called()
    mock_purge.assert_not_called()
    mock_subprocess.assert_called_once()

@patch('main.scan_games')
def test_launch_game_untrusted(mock_scan):
    # Mock an empty game list
    mock_scan.return_value = []

    profile = {
        "high_priority": False,
        "network_flush": False,
        "power_plan": False,
        "suspend_services": False,
        "ram_purge": False
    }

    result = main.launch_game("730", profile, "/mock/cs2.exe", "cs2.exe")

    assert result['status'] == 'error'
    assert 'not found in trusted library' in result['message']

@patch('main.scan_games')
def test_get_prime_games(mock_scan):
    from main import get_prime_games

    # Mock some installed games
    mock_scan.return_value = [
        {"id": "1", "title": "Cyberpunk 2077"},
        {"id": "2", "title": "Warzone"},
        {"id": "3", "title": "Call of Duty: Warzone"},
        {"id": "4", "title": "Other Game"}
    ]

    result = get_prime_games()

    # We expect 3 prime games (Cyberpunk 2077, Warzone, and Call of Duty: Warzone)
    # based on exact matches in SUPPORTED_PRIME_GAMES.
    assert len(result) == 3

    titles = [g['name'] for g in result]
    assert "Cyberpunk 2077" in titles
    assert "Warzone" in titles
    assert "Call of Duty: Warzone" in titles
    assert "Other Game" not in titles
