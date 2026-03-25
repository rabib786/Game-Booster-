import sys
from unittest.mock import MagicMock

# Mock eel before importing main to prevent it from messing up with decorators
mock_eel = MagicMock()
sys.modules['eel'] = mock_eel

# Define a mock decorator that returns the function itself
def mock_expose(func):
    return func

mock_eel.expose = mock_expose

sys.modules['psutil'] = MagicMock()

import unittest
from unittest.mock import patch
import os
import shutil

# Now import clean_system from main
from main import clean_system

class TestCleanSystem(unittest.TestCase):
    @patch('os.environ.get')
    @patch('os.path.exists')
    @patch('os.listdir')
    @patch('os.path.isfile')
    @patch('os.path.isdir')
    @patch('os.path.getsize')
    @patch('os.unlink')
    @patch('os.walk')
    @patch('shutil.rmtree')
    def test_clean_system_locked_file(self, mock_rmtree, mock_walk, mock_unlink,
                                     mock_getsize, mock_isdir, mock_isfile,
                                     mock_listdir, mock_exists, mock_environ_get):
        """Test that locked files/directories don't cause the function to crash."""
        # Setup
        mock_environ_get.return_value = 'C:\\Temp'
        mock_exists.return_value = True
        mock_listdir.return_value = ['locked_file.txt', 'locked_dir']

        # Scenario 1: locked_file.txt is a file and raises OSError when unlinked
        mock_isfile.side_effect = lambda path: 'locked_file.txt' in path
        mock_isdir.side_effect = lambda path: 'locked_dir' in path
        mock_getsize.return_value = 1024
        mock_unlink.side_effect = OSError("File is locked")

        # Scenario 2: locked_dir is a directory and raises OSError when rmtree'd
        mock_walk.return_value = [('C:\\Temp\\locked_dir', [], ['file_in_dir.txt'])]
        mock_rmtree.side_effect = OSError("Directory is locked")

        # Execute
        result = clean_system()

        # Assertions
        self.assertEqual(result['status'], 'success')
        # Freed space should be 0.00 MB because both attempts to delete failed
        self.assertIn("Cleaned 0.00 MB of Junk", result['message'])

        # Verify that unlink was called for the file and rmtree for the directory
        mock_unlink.assert_called()
        mock_rmtree.assert_called()

    @patch('os.environ.get')
    @patch('os.path.exists')
    @patch('os.listdir')
    @patch('os.path.isfile')
    @patch('os.path.isdir')
    @patch('os.path.getsize')
    @patch('os.unlink')
    @patch('os.walk')
    @patch('shutil.rmtree')
    def test_clean_system_mixed_files(self, mock_rmtree, mock_walk, mock_unlink,
                                     mock_getsize, mock_isdir, mock_isfile,
                                     mock_listdir, mock_exists, mock_environ_get):
        """Test that some files are deleted even if others are locked."""
        # Setup
        mock_environ_get.return_value = 'C:\\Temp'
        mock_exists.return_value = True
        mock_listdir.return_value = ['normal_file.txt', 'locked_file.txt']

        mock_isfile.return_value = True
        mock_isdir.return_value = False

        mock_getsize.return_value = 1024 * 1024 # 1MB

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
        self.assertIn("Cleaned 1.00 MB of Junk", result['message'])

if __name__ == '__main__':
    unittest.main()
