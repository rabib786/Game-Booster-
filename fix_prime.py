def _clean_game_title(title):
    import re
    RE_CLEAN_TITLE = re.compile(r'[^a-z0-9]')
    return RE_CLEAN_TITLE.sub('', title.lower())

SUPPORTED_PRIME_GAMES = {
    "Cyberpunk 2077": "Enables DLSS and disables V-Sync for maximum framerates.",
    "Warzone": "Enables DLSS and disables V-Sync for competitive advantage.",
    "Call of Duty: Warzone": "Enables DLSS and disables V-Sync for competitive advantage."
}

_SUPPORTED_PRIME_GAMES_LOWER = {_clean_game_title(k): v for k, v in SUPPORTED_PRIME_GAMES.items()}

def get_prime_games(installed):
    prime_games = []
    for game in installed:
        title = game.get('title', '')
        title_clean = _clean_game_title(title)

        # Original logic was probably:
        # for k, v in _SUPPORTED_PRIME_GAMES_LOWER.items():
        #     if k in title_clean:
        #         prime_games.append(...)

        for k, v in _SUPPORTED_PRIME_GAMES_LOWER.items():
            if k in title_clean:
                prime_games.append({
                    "id": game.get('id'),
                    "name": title,
                    "primeDescription": v
                })
                break
    return prime_games

installed = [
    {
        "id": "mock_csgo",
        "title": "Counter-Strike 2 (Mock)",
    },
    {
        "id": "mock_cyberpunk",
        "title": "Cyberpunk 2077® (Steam)",
    }
]

print(get_prime_games(installed))
