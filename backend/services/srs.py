from datetime import datetime, timedelta

def calculate_next_review(grade: int, interval: int, ease_factor: float) -> dict:
    """
    grade: 0=Again, 1=Hard, 2=Good, 3=Easy
    """
    if grade == 0:  # Again
        interval    = 1
        ease_factor = round(max(1.3, ease_factor - 0.2), 2)

    elif grade == 1:  # Hard
        interval    = max(1, int(interval * 1.2))
        ease_factor = round(max(1.3, ease_factor - 0.15), 2)

    elif grade == 2:  # Good
        interval    = max(1, int(interval * ease_factor))
        ease_factor = round(ease_factor, 2)

    elif grade == 3:  # Easy
        interval    = max(1, int(interval * ease_factor * 1.3))
        ease_factor = round(ease_factor + 0.15, 2)

    due_at = datetime.utcnow() + timedelta(days=interval)

    return {
        "interval":    interval,
        "ease_factor": ease_factor,
        "due_at":      due_at
    }