import sys
sys.path.append('./booster_app_export')
from main import get_prime_games, scan_games

print(scan_games())
print(get_prime_games())
