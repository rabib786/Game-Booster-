#!/usr/bin/env python3
"""Test script to verify backend functionality"""

import sys
import os
import json

# Add booster_app_export to path
sys.path.insert(0, 'booster_app_export')

# Try to import main module
try:
    import main
    print("[OK] Successfully imported main module")
    
    # Check if config loads
    try:
        config = main.load_config()
        print(f"[OK] Config loaded: {len(config.get('boost_profiles', {}))} profiles")
    except Exception as e:
        print(f"[FAIL] Config load failed: {e}")
    
    # Check critical dependencies
    deps_to_check = [
        ('psutil', 'psutil'),
        ('eel', 'eel'),
        ('pynvml', 'pynvml'),
        ('keyboard', 'keyboard'),
        ('pystray', 'pystray'),
        ('PIL', 'PIL.Image'),
    ]
    
    print("\nDependency Check:")
    for import_name, module_name in deps_to_check:
        try:
            __import__(module_name.split('.')[0])
            print(f"  [OK] {import_name}")
        except ImportError:
            print(f"  [MISSING] {import_name}")
    
    # Test a simple function
    print("\nTesting simple functions:")
    try:
        # Test telemetry
        if hasattr(main, 'get_telemetry'):
            result = main.get_telemetry()
            print(f"  [OK] get_telemetry: {result}")
        else:
            print("  [FAIL] get_telemetry not exposed")
            
        # Test process listing
        if hasattr(main, 'get_live_processes'):
            result = main.get_live_processes()
            print(f"  [OK] get_live_processes: {len(result)} processes")
        else:
            print("  [FAIL] get_live_processes not exposed")
            
    except Exception as e:
        print(f"  [FAIL] Function test failed: {e}")
        
except ImportError as e:
    print(f"[FAIL] Failed to import main: {e}")
    print(f"Python path: {sys.path}")

print("\nSystem Info:")
print(f"  Python: {sys.version}")
print(f"  Platform: {sys.platform}")
print(f"  Current dir: {os.getcwd()}")