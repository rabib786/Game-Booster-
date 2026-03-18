import importlib
import sys
import types
from pathlib import Path

import pytest


@pytest.fixture()
def backend_module(monkeypatch):
    exposed_functions = {}

    def expose(fn=None, name=None):
        def decorator(func):
            exposed_functions[name or func.__name__] = func
            return func

        if fn is None:
            return decorator
        return decorator(fn)

    eel_stub = types.SimpleNamespace(init=lambda *_args, **_kwargs: None, expose=expose)
    psutil_stub = types.SimpleNamespace(
        process_iter=lambda *_args, **_kwargs: [],
        NoSuchProcess=RuntimeError,
        AccessDenied=PermissionError,
        ZombieProcess=RuntimeError,
    )
    monkeypatch.setitem(sys.modules, 'eel', eel_stub)
    monkeypatch.setitem(sys.modules, 'psutil', psutil_stub)

    if 'main' in sys.modules:
        del sys.modules['main']

    module = importlib.import_module('main')
    return module


class FakeProcess:
    def __init__(self, name, memory_mb):
        self.info = {
            'pid': id(self),
            'name': name,
            'memory_info': types.SimpleNamespace(rss=memory_mb * 1024 * 1024),
        }
        self.killed = False

    def kill(self):
        self.killed = True


def test_boost_game_closes_only_target_processes(backend_module, monkeypatch):
    chrome = FakeProcess('chrome.exe', 250)
    discord = FakeProcess('discord.exe', 125)
    vscode = FakeProcess('Code.exe', 512)

    monkeypatch.setattr(
        backend_module.psutil,
        'process_iter',
        lambda *_args, **_kwargs: [chrome, discord, vscode],
    )

    result = backend_module.boost_game()

    assert result['status'] == 'success'
    assert result['message'] == 'Freed 375.00 MB of RAM.'
    assert 'chrome.exe' in result['details']
    assert 'discord.exe' in result['details']
    assert chrome.killed is True
    assert discord.killed is True
    assert vscode.killed is False


def test_clean_system_removes_temp_files_and_directories(backend_module, monkeypatch, tmp_path):
    temp_dir = tmp_path / 'temp'
    temp_dir.mkdir()

    temp_file = temp_dir / 'cache.bin'
    temp_file.write_bytes(b'a' * (1024 * 1024))

    nested_dir = temp_dir / 'nested'
    nested_dir.mkdir()
    nested_file = nested_dir / 'nested-cache.bin'
    nested_file.write_bytes(b'b' * (2 * 1024 * 1024))

    monkeypatch.setenv('TEMP', str(temp_dir))

    result = backend_module.clean_system()

    assert result['status'] == 'success'
    assert result['message'] == 'Cleaned 3.00 MB of Junk.'
    assert list(temp_dir.iterdir()) == []


def test_clean_system_returns_error_when_temp_missing(backend_module, monkeypatch):
    missing_dir = Path('/tmp/does-not-exist-for-nexus-booster')
    monkeypatch.setenv('TEMP', str(missing_dir))

    result = backend_module.clean_system()

    assert result == {'status': 'error', 'message': 'Temp directory not found.'}


def test_optimize_startup_requires_windows_registry(backend_module, monkeypatch):
    monkeypatch.setattr(backend_module, 'winreg', None)

    result = backend_module.optimize_startup()

    assert result == {
        'status': 'error',
        'message': 'Startup optimization is only supported on Windows.',
    }
