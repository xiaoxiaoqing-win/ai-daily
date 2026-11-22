"""Load checkout-local secrets without replacing Actions or shell settings."""
from pathlib import Path

from dotenv import load_dotenv


def load_local_env(root=None):
    root = Path(root) if root is not None else Path(__file__).resolve().parents[1]
    # Shell/Actions > .env.local > .env. Disable interpolation for literal secrets.
    for name in (".env.local", ".env"):
        load_dotenv(root / name, override=False, interpolate=False)
