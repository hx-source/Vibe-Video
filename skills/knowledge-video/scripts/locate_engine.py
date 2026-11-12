"""Read-only discovery of Remotion or an explicitly selected legacy engine."""
import argparse
import json
import os
from pathlib import Path
import sys

NEW_NAME = "knowledge-video-remotion-template"
KNOWN_ROOT = Path("D:/Documents/dy/Vibe-Knowledge-Video") / NEW_NAME
ENGINES = {
    NEW_NAME: ("0.1.0", "remotion", ("src/index.ts", "scripts/cli.mjs", "src/timeline/compile.mjs", "docs/AUDIO-WORKFLOW.md")),
    "knowledge-video-template": ("0.3.0", "canvas-legacy", ("scripts/cli.mjs", "engine/film.js", "engine/audio-plan.js", "docs/AUDIO-WORKFLOW-v0.3.md")),
}

def read_json(file):
    return json.loads(file.read_text(encoding="utf-8-sig"))

def inspect(root):
    root = Path(root).expanduser().resolve()
    meta = read_json(root / "package.json")
    expected = ENGINES.get(meta.get("name"))
    if not expected:
        raise ValueError(f"Not a supported knowledge-video engine: {root}")
    version, kind, required = expected
    if meta.get("version") != version:
        raise ValueError(f"Engine version {meta.get('version')} is not validated; inspect changes before migration: {root}")
    missing = [name for name in required if not (root / name).is_file()]
    if missing:
        raise ValueError("Incomplete engine: " + ", ".join(missing))
    starter = read_json(root / "templates/starter/project.json")
    if starter.get("templateVersion") != version:
        raise ValueError("Starter and engine versions disagree")
    if kind == "remotion" and (starter.get("contract") != "knowledge-video-remotion" or starter.get("contractVersion") != 1):
        raise ValueError("Unsupported Remotion project contract")
    if kind == "canvas-legacy" and starter.get("schemaVersion") != 2:
        raise ValueError("Unsupported legacy project schema")
    return {"engineRoot": str(root), "engineKind": kind, "engineVersion": version,
            "dependenciesPresent": (root / "node_modules").is_dir(), "readme": str(root / "README.md"),
            "audioGuide": str(root / required[-1]), "note": "Read-only discovery. Run doctor for runtime checks."}

def discover(explicit=None, cwd=None, environ=None):
    env = os.environ if environ is None else environ
    selected = explicit or env.get("KNOWLEDGE_VIDEO_ENGINE")
    if selected:
        return inspect(selected)
    here = Path(cwd or Path.cwd()).resolve()
    candidates = {}
    for base in (here, *here.parents):
        for candidate in (base, base / NEW_NAME):
            package = candidate / "package.json"
            if not package.is_file():
                continue
            if read_json(package).get("name") == NEW_NAME:
                candidates[os.path.normcase(str(candidate.resolve()))] = candidate.resolve()
    if not candidates:
        for base in Path(__file__).resolve().parents:
            candidate = base / NEW_NAME
            if (candidate / "package.json").is_file():
                candidates[os.path.normcase(str(candidate.resolve()))] = candidate.resolve()
        if not candidates and KNOWN_ROOT.is_dir():
            candidates[os.path.normcase(str(KNOWN_ROOT.resolve()))] = KNOWN_ROOT.resolve()
    if len(candidates) != 1:
        raise ValueError("Specify --root or KNOWLEDGE_VIDEO_ENGINE; expected one Remotion engine, found: " + "; ".join(map(str, candidates.values())))
    return inspect(next(iter(candidates.values())))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", help="Explicit engine root; invalid choices never fall back")
    args = parser.parse_args()
    try:
        print(json.dumps(discover(args.root), ensure_ascii=False, indent=2))
    except (OSError, ValueError) as error:
        print(json.dumps({"error": str(error)}, ensure_ascii=False), file=sys.stderr)
        return 2
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
