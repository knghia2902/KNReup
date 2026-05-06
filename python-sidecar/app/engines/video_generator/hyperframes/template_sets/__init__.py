"""Template Sets registry for HyperFrames composition — auto-discover.

Scans subdirectories for set.py modules and loads meta.json metadata.
Adding a new template set requires only creating a new folder with set.py + meta.json.
"""
import importlib
import json
import os
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

_SETS_DIR = os.path.dirname(__file__)


def _discover_sets():
    """Scan subdirectories for set.py modules and meta.json."""
    modules = {}
    info_list = []

    for name in sorted(os.listdir(_SETS_DIR)):
        set_dir = os.path.join(_SETS_DIR, name)
        set_py = os.path.join(set_dir, "set.py")

        if not os.path.isdir(set_dir) or not os.path.exists(set_py):
            continue
        if name.startswith("_") or name == "shared":
            continue

        try:
            # Use importlib for hyphenated folder names (can't use normal import)
            mod = importlib.import_module(f".{name}.set", package=__package__)
            modules[name] = mod
        except Exception as e:
            logger.warning(f"Failed to import template set '{name}': {e}")
            continue

        # Load metadata
        meta_path = os.path.join(set_dir, "meta.json")
        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
        else:
            meta = {"id": name, "name": name.replace("-", " ").title(), "description": ""}

        info_list.append(meta)

    return modules, info_list


TEMPLATE_SET_MODULES, TEMPLATE_SET_INFO = _discover_sets()


def get_set_module(set_id: str):
    """Get template set module by ID. Falls back to 'default' if not found."""
    return TEMPLATE_SET_MODULES.get(set_id, TEMPLATE_SET_MODULES.get("default"))


def get_set_meta(set_id: str) -> dict:
    """Get meta.json dict for a template set by ID."""
    for info in TEMPLATE_SET_INFO:
        if info.get("id") == set_id:
            return info
    # Fallback with minimal fonts
    return {"id": set_id, "fonts": ["Inter:wght@400;500;600;700"]}


def list_sets() -> List[dict]:
    """Return list of all available template set metadata."""
    return list(TEMPLATE_SET_INFO)
