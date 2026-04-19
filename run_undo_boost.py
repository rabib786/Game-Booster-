import sys
sys.path.append('./booster_app_export')
from main import boost_game, undo_boost, killed_processes_history
print("Before undo:", killed_processes_history)
res = undo_boost()
print(res)
