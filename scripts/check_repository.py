#!/usr/bin/env python3
"""Pemeriksaan repository-only; tidak menjalankan atau meluluskan tes aplikasi."""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {
    ".git", ".codex", ".agents", ".aws", ".ssh", ".idea", ".vscode",
    "node_modules", "dist", "build", "coverage", ".vite", ".cache",
    "__pycache__", "storage", "uploads", "raw", "private", "staging",
    "import-staging", "backups", "dumps", "logs", "tmp", "temp",
    "playwright-report", "test-results",
}
PRIVATE_SUFFIXES = {
    ".pem", ".key", ".p12", ".pfx", ".keystore", ".dump", ".backup",
    ".sqlite", ".sqlite3", ".csv", ".tsv", ".xls", ".xlsx", ".xlsm",
    ".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".webp", ".mp4",
    ".zip", ".tar", ".gz", ".log", ".tmp", ".pyc", ".pyo",
}
PATTERNS = {
    "private-key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "github-token": re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})"),
    "aws-access-key": re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    "credential-url": re.compile(r"(?i)(?:postgres(?:ql)?|mysql|https?)://[^\s<>/:]+:[^\s<>/@]+@"),
}
TECH_BRANCHES = {
    "chore/project-foundation", "feature/auth-rbac",
    "feature/shared-import-framework", "feature/frontend-app-shell",
}


def private_path(path):
    """Default-deny untuk berkas yang memerlukan review tambahan sebelum tracking."""
    if path == Path("planning/sprints/SPRINT_01_WORKLOAD.csv"):
        return False
    if any(part in SKIP_DIRS for part in path.parts):
        return True
    if path.name == ".env" or (path.name.startswith(".env.") and path.name != ".env.example"):
        return True
    if path.name in {".npmrc", ".netrc", ".DS_Store", "Thumbs.db"}:
        return True
    if path.suffix.lower() in PRIVATE_SUFFIXES:
        return True
    if path.suffix.lower() == ".sql" and path.parts[:2] not in {
        ("database", "migrations"), ("database", "seeds"),
    }:
        return True
    return False


def collect(mode):
    if mode == "tracked":
        result = subprocess.run(
            ["git", "ls-files", "-z"], cwd=ROOT, capture_output=True,
            check=False,
        )
        if result.returncode:
            raise ValueError("Git index tidak tersedia; pemeriksaan tracked tidak dijalankan.")
        return [Path(p) for p in result.stdout.decode().split("\0") if p], 0
    paths, excluded = [], 0
    # Path.rglob tidak mengikuti directory symlink; file symlink ditolak di main.
    for full in ROOT.rglob("*"):
        rel = full.relative_to(ROOT)
        if full.is_file() or full.is_symlink():
            if private_path(rel):
                excluded += 1
            else:
                paths.append(rel)
    return paths, excluded


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group(required=True)
    modes.add_argument("--workspace", action="store_true")
    modes.add_argument("--tracked", action="store_true")
    args = parser.parse_args()
    mode = "tracked" if args.tracked else "workspace"
    errors, notices = [], []
    try:
        files, excluded = collect(mode)
        manifest = json.loads((ROOT / ".github/publish-candidates.json").read_text())
        registry = json.loads((ROOT / "scripts/branches.json").read_text())
    except (OSError, ValueError) as exc:
        print("BLOCKED: " + str(exc))
        return 2

    names = {p.as_posix() for p in files}
    required = set(manifest["files"])
    missing = sorted(required - names)
    if missing:
        errors.append("Kandidat publish yang belum tersedia/tracked: " + ", ".join(missing))
    local_only = set(manifest["local_only_link_targets"])
    if local_only & names:
        errors.append("Arsip lokal masuk candidate/tracked set: " + ", ".join(sorted(local_only & names)))
    if registry.get("origin") != "https://github.com/adamyudhistiramuhtar-byte/SIRIS.git":
        errors.append("Target origin registry tidak sesuai instruksi.")
    if registry.get("base_branch") != "develop" or registry.get("permanent_branches") != ["main", "develop"]:
        errors.append("Registry baseline branch tidak sesuai main/develop.")
    branches = registry.get("branches", [])
    branch_names = {b["name"] for b in branches}
    uc_ids = [int(m.group(1)) for b in branch_names if (m := re.match(r"feature/uc-(\d{2})-", b))]
    if len(branches) != 20 or len(branch_names) != 20 or sorted(uc_ids) != list(range(1, 17)):
        errors.append("Registry harus berisi 16 branch UC unik dan 4 branch teknis.")
    if not TECH_BRANCHES <= branch_names:
        errors.append("Nama branch teknis tidak lengkap.")
    for branch in branches:
        if branch["owner"] not in {"DEV-01", "DEV-02", "DEV-03", "DEV-04"}:
            errors.append("Owner branch tidak memakai placeholder tim: " + branch["name"])
        if branch["owner"] == branch["reviewer"] or not branch.get("purpose"):
            errors.append("Reviewer/purpose branch tidak memenuhi aturan: " + branch["name"])

    doc_ids = sorted(p.name[:2] for p in files if p.parent == Path("development-docs") and re.match(r"\d{2}_.*\.md$", p.name))
    if doc_ids != [f"{i:02d}" for i in range(19)]:
        errors.append("Dokumen DOC-00–DOC-18 harus tersedia tepat sekali.")
    checked = 0
    for relative in sorted(files):
        full = ROOT / relative
        if private_path(relative):
            errors.append("Path berisiko sudah tracked: " + relative.as_posix())
            continue
        if full.is_symlink() or not full.resolve().is_relative_to(ROOT):
            errors.append("Symlink/path di luar root tidak dipublikasikan: " + relative.as_posix())
            continue
        try:
            data = full.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            errors.append("Berkas nonteks/tidak terbaca perlu review: " + relative.as_posix())
            continue
        checked += 1
        for label, pattern in PATTERNS.items():
            for match in pattern.finditer(data):
                line = data[:match.start()].count("\n") + 1
                errors.append(f"Pola {label}: {relative}:{line}; nilai tidak dicetak.")
        if relative.name == ".env.example":
            for line in data.splitlines():
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    if re.search(r"SECRET|TOKEN|PASSWORD|DATABASE_URL", key) and value.strip():
                        errors.append("Template environment berisi nilai sensitif: " + relative.as_posix())
        if relative.suffix == ".json":
            try:
                json.loads(data)
            except ValueError:
                errors.append("JSON tidak valid: " + relative.as_posix())
        if relative.suffix != ".md":
            continue
        # Fenced code may contain illustrative paths; only real Markdown links are checked.
        prose = re.sub(r"```.*?```", "", data, flags=re.S)
        for target in re.findall(r"\]\(([^\s)]+)\)", prose):
            parsed = urlsplit(target)
            if parsed.scheme or target.startswith("#"):
                continue
            dest = (full.parent / unquote(parsed.path)).resolve()
            if not dest.is_relative_to(ROOT):
                errors.append(f"Link lokal di luar root: {relative}; target perlu review.")
                continue
            dest_name = dest.relative_to(ROOT).as_posix()
            if dest_name in local_only:
                notices.append("Tautan arsip lokal tidak dipublikasikan: " + dest_name)
            elif not dest.exists() or (mode == "tracked" and dest_name not in names):
                errors.append(f"Link lokal hilang/tidak tracked: {relative} → {dest_name}")

    for number, date in [(1, "9–15 November 2026"), (2, "16–22 November 2026"), (3, "23–29 November 2026")]:
        path = ROOT / f"planning/sprints/SPRINT_{number:02d}.md"
        if path.exists():
            data = path.read_text()
            if not all(value in data for value in [date, "Asia/Jakarta", "29 November 2026", "NOT RUN"]):
                errors.append("Tanggal/status sprint tidak sesuai: " + path.name)

    for notice in sorted(set(notices)):
        print("INFO: " + notice)
    for error in errors:
        print("ERROR: " + error)
    print(f"Repository checks: mode={mode}, files={checked}, excluded_local={excluded}, findings={len(errors)}")
    print("Batas: tidak menguji aplikasi, semua histori Git, kerahasiaan semantik, atau eksekusi CI remote.")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
