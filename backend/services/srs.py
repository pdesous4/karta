from datetime import datetime, timedelta, timezone

LEARNING_STEPS = [1, 10]            # minutes
RELEARNING_STEPS = [10]             # minutes
GRADUATING_INTERVAL = 1             # days
EASY_INTERVAL = 4                   # days
STARTING_EASE = 2.5
MIN_EASE = 1.3
EASY_BONUS = 1.3
HARD_INTERVAL_FACTOR = 1.2
LAPSE_NEW_INTERVAL_FACTOR = 0.0
LAPSE_MIN_INTERVAL = 1              # days
LEARN_AHEAD_MINUTES = 20


def _hard_step_delay(steps, cur_step):
    """Anki Hard-button delay (in minutes) for a learning/relearning step."""
    if len(steps) == 1:
        return min(steps[0] * 1.5, steps[0] + 1440)
    if cur_step == 0:
        return round((steps[0] + steps[1]) / 2)
    return steps[cur_step]


def calculate_next_review(grade, state, learning_step, interval, ease_factor):
    """
    Anki-style scheduler.

    grade: 0=Again, 1=Hard, 2=Good, 3=Easy
    state: 'new' | 'learning' | 'review' | 'relearning'
    """
    now = datetime.now(timezone.utc)

    if state in ("new", "learning"):
        return _schedule_learning(grade, state, learning_step, interval, ease_factor, now)
    if state == "relearning":
        return _schedule_relearning(grade, learning_step, interval, ease_factor, now)
    if state == "review":
        return _schedule_review(grade, interval, ease_factor, now)

    raise ValueError(f"Unknown state {state!r}")


def _result(state, step, interval, ease_factor, due_at):
    return {
        "state": state,
        "learning_step": step,
        "interval": interval,
        "ease_factor": round(ease_factor, 2),
        "due_at": due_at,
    }


def _schedule_learning(grade, state, step, interval, ease, now):
    steps = LEARNING_STEPS

    if grade == 0:
        return _result("learning", 0, interval, ease, now + timedelta(minutes=steps[0]))

    if grade == 1:
        cur = step if state == "learning" else 0
        cur = max(0, min(cur, len(steps) - 1))
        delay = _hard_step_delay(steps, cur)
        return _result("learning", cur, interval, ease, now + timedelta(minutes=delay))

    if grade == 2:
        # New cards are implicitly at step 0; Good advances to step 1.
        nxt = (step + 1) if state == "learning" else 1
        if nxt >= len(steps):
            return _result("review", 0, GRADUATING_INTERVAL, ease,
                           now + timedelta(days=GRADUATING_INTERVAL))
        return _result("learning", nxt, interval, ease, now + timedelta(minutes=steps[nxt]))

    if grade == 3:
        # First-time Easy graduates with the 1d graduating interval.
        new_interval = GRADUATING_INTERVAL if state == "new" else EASY_INTERVAL
        return _result("review", 0, new_interval, ease,
                       now + timedelta(days=new_interval))


def _schedule_relearning(grade, step, interval, ease, now):
    steps = RELEARNING_STEPS

    # No relearning steps configured — graduate straight back to review with 1d.
    if not steps:
        new_interval = max(LAPSE_MIN_INTERVAL, interval)
        return _result("review", 0, new_interval, ease,
                       now + timedelta(days=new_interval))

    if grade == 0:
        return _result("relearning", 0, interval, ease, now + timedelta(minutes=steps[0]))

    if grade == 1:
        cur = max(0, min(step, len(steps) - 1))
        delay = _hard_step_delay(steps, cur)
        return _result("relearning", cur, interval, ease, now + timedelta(minutes=delay))

    if grade == 2:
        nxt = step + 1
        if nxt >= len(steps):
            new_interval = max(LAPSE_MIN_INTERVAL, interval)
            return _result("review", 0, new_interval, ease,
                           now + timedelta(days=new_interval))
        return _result("relearning", nxt, interval, ease, now + timedelta(minutes=steps[nxt]))

    if grade == 3:
        new_interval = max(EASY_INTERVAL, interval)
        return _result("review", 0, new_interval, ease,
                       now + timedelta(days=new_interval))


def _schedule_review(grade, interval, ease, now):
    if grade == 0:
        new_ease = max(MIN_EASE, ease - 0.20)
        new_interval = max(LAPSE_MIN_INTERVAL, int(interval * LAPSE_NEW_INTERVAL_FACTOR))
        # Empty relearning steps → skip relearning, go straight to a 1d review.
        if not RELEARNING_STEPS:
            return _result("review", 0, new_interval, new_ease,
                           now + timedelta(days=new_interval))
        return _result("relearning", 0, new_interval, new_ease,
                       now + timedelta(minutes=RELEARNING_STEPS[0]))

    hard_int = max(1, int(interval * HARD_INTERVAL_FACTOR))
    good_int = max(hard_int + 1, int(interval * ease))
    easy_int = max(good_int + 1, int(interval * ease * EASY_BONUS))

    if grade == 1:
        new_ease = max(MIN_EASE, ease - 0.15)
        return _result("review", 0, hard_int, new_ease,
                       now + timedelta(days=hard_int))

    if grade == 2:
        return _result("review", 0, good_int, ease,
                       now + timedelta(days=good_int))

    if grade == 3:
        new_ease = ease + 0.15
        return _result("review", 0, easy_int, new_ease,
                       now + timedelta(days=easy_int))
