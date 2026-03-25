LANGUAGES = ["greek", "spanish"]

TOPICS = [
    "basics",
    "numbers",
    "verbs",
    "adjectives",
    "sport",
    "animals",
    "countries",
    "body",
    "house",
    "food",
    "school",
    "nature",
    "transportation",
    "city",
    "hospital",
    "jobs",
    "business",
    "devices",
]

# Generates ["1-50", "51-100", ..., "951-1000"]
FREQUENCY_RANGES = [f"{i}-{i + 49}" for i in range(1, 1001, 50)]


def build_url(language, topic):
    return f"https://flashcardo.com/{language}-flashcards/{topic}/1"


def build_frequency_url(language, range_str):
    return f"https://flashcardo.com/{language}-flashcards/f/{range_str}/1"
