import time
from collections import defaultdict, deque
from threading import Lock
from typing import Deque, Dict

from fastapi import HTTPException, status

from app.config import Settings


class RateLimiter:
    """In-memory sliding window rate limiter scoped per user ID."""

    def __init__(self, window_seconds: int = 60):
        self.window_seconds = window_seconds
        self._records: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check_rate_limit(self, user_id: str, max_requests: int) -> None:
        """Checks if a user has exceeded their request quota in the rolling window."""
        now = time.time()
        cutoff = now - self.window_seconds

        with self._lock:
            timestamps = self._records[user_id]
            # Evict timestamps outside rolling window
            while timestamps and timestamps[0] < cutoff:
                timestamps.popleft()

            if len(timestamps) >= max_requests:
                # Calculate remaining wait time before the oldest request drops out
                retry_after = max(1, int(timestamps[0] + self.window_seconds - now))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Maximum {max_requests} requests per minute allowed.",
                    headers={"Retry-After": str(retry_after)},
                )

            timestamps.append(now)


# Global instance for backend routes
rate_limiter = RateLimiter(window_seconds=60)


def enforce_rate_limit(user_id: str) -> None:
    settings = Settings.from_env()
    rate_limiter.check_rate_limit(
        user_id=user_id,
        max_requests=settings.rate_limit_requests_per_minute,
    )
