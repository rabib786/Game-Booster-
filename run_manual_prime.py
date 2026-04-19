import sys
sys.path.append('./booster_app_export')
import main
from main import get_prime_games, _SUPPORTED_PRIME_GAMES_LOWER, _clean_game_title
print("Supported lower:")
print(_SUPPORTED_PRIME_GAMES_LOWER)

test_title = "Counter-Strike 2 (Mock)"
print(f"Cleaned test title: {_clean_game_title(test_title)}")
