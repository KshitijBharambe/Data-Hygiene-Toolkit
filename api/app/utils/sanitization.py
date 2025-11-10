"""
Utilities for defensively sanitizing untrusted input before it flows into the
application. These helpers enforce consistent stripping of control characters,
length limits, and recursive cleaning across common container types.
"""

from __future__ import annotations

import re
from typing import Any, Mapping

CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")
WHITESPACE_RE = re.compile(r"\s+")
MAX_STRING_LENGTH = 10_000


def _sanitize_string(value: str) -> str:
    """Strip dangerous characters while keeping useful whitespace semantics."""
    # Remove ASCII control characters (NUL, bell, etc.)
    cleaned = CONTROL_CHARS_RE.sub("", value)
    # Normalize whitespace to single spaces to mitigate injection via odd spacing
    cleaned = WHITESPACE_RE.sub(" ", cleaned)
    # Trim and enforce a hard length ceiling
    cleaned = cleaned.strip()
    if len(cleaned) > MAX_STRING_LENGTH:
        cleaned = cleaned[:MAX_STRING_LENGTH]
    return cleaned


def sanitize_input(data: Any) -> Any:
    """
    Recursively sanitize supported data structures. Unknown types are returned
    verbatim so that Pydantic or downstream validators can handle them.
    """
    if isinstance(data, str):
        return _sanitize_string(data)

    if isinstance(data, Mapping):
        return {sanitize_input(key): sanitize_input(value) for key, value in data.items()}

    if isinstance(data, (list, tuple, set, frozenset)):
        sanitized_items = [sanitize_input(item) for item in data]
        if isinstance(data, tuple):
            return tuple(sanitized_items)
        if isinstance(data, set):
            return set(sanitized_items)
        if isinstance(data, frozenset):
            return frozenset(sanitized_items)
        return sanitized_items

    return data


def ensure_max_length(value: str, max_length: int = MAX_STRING_LENGTH) -> str:
    """Apply length guard to arbitrary strings."""
    if not isinstance(value, str):
        return value
    return value[:max_length]


def sanitize_identifier(identifier: str, max_length: int = 255) -> str:
    """
    Sanitize identifiers used in path or query parameters. Keeps alphanumerics,
    dashes, underscores, and standard UUID formatting characters.
    """
    if not isinstance(identifier, str):
        return identifier
    sanitized = re.sub(r"[^a-zA-Z0-9\-_.:]", "", identifier)
    return sanitized[:max_length]


def validate_identifier(identifier: str, *, field_name: str, allow_empty: bool = False, max_length: int = 255) -> str:
    """
    Sanitize an identifier and ensure it is not empty unless allowed. Raises
    ValueError when the identifier becomes empty after sanitization.
    """
    sanitized = sanitize_identifier(identifier, max_length=max_length)
    if not sanitized and not allow_empty:
        raise ValueError(f"Invalid {field_name}")
    return sanitized
