from datetime import datetime, timedelta


def calculate_next_review(correct: bool, interval: int, ease_factor: float) -> dict:
    if correct:
        interval = int(interval * ease_factor)
        ease_factor = round(ease_factor + 0.1, 2)
    else:
        interval = 1
        ease_factor = round(max(1.3, ease_factor - 0.2), 2)

    due_at = datetime.utcnow() + timedelta(days=interval)

    return {"interval": interval, "ease_factor": ease_factor, "due_at": due_at}
