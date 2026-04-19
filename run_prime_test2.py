import sys
sys.path.append('./booster_app_export')
from main import _clean_game_title
print(_clean_game_title("Cyberpunk 2077®"))
print(_clean_game_title("Call of Duty®: Warzone™"))
