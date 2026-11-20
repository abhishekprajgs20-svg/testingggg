#!/usr/bin/env python3
"""Build QUIZINOX Windows installer through GitHub Actions and package it locally.

Requires Python 3.9+, Git, and a GitHub Personal Access Token.
The token is requested with hidden input and is never written to disk.
"""
from __future__ import annotations

import base64
import getpass
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path

API = "https://api.github.com"
WORKFLOW = "build-windows-installer.yml"
ARTIFACT_NAME = "QUIZINOX-Windows-Installer"
ROOT = Path(__file__).resolve().parent
POLL_SECONDS = 15
MAX_WAIT_SECONDS = 30 * 60


def say(message: str) -> None:
    print(f"\n[QUIZINOX] {message}", flush=True)


def api_request(token: str, method: str, path: str, payload=None):
    url = path if path.startswith("https://") else API + path
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    req.add_header("Authorization", f"Bearer {token}")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            raw = response.read()
            return json.loads(raw.decode()) if raw else None
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")
        try:
            detail = json.loads(body).get("message", body)
        except Exception:
            detail = body
        raise RuntimeError(f"GitHub API error ({exc.code}): {detail}") from exc


def run(command, *, cwd=ROOT, env=None, check=True):
    result = subprocess.run(command, cwd=cwd, env=env, text=True,
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if result.stdout.strip():
        print(result.stdout.rstrip())
    if check and result.returncode:
        raise RuntimeError(f"Command failed ({result.returncode}): {' '.join(command)}")
    return result


def ensure_git():
    if not shutil.which("git"):
        raise RuntimeError("Git install nahi mila. Git for Windows install karke dobara run karein: https://git-scm.com/download/win")


def create_or_get_repo(token: str, repo_name: str, private: bool):
    try:
        repo = api_request(token, "POST", "/user/repos", {
            "name": repo_name,
            "description": "QUIZINOX desktop app and automated Windows installer",
            "private": private,
            "auto_init": False,
        })
        say(f"GitHub repository created: {repo['html_url']}")
        return repo
    except RuntimeError as exc:
        # If the repository already exists under the authenticated account, reuse it.
        if "already exists" not in str(exc).lower() and "name already exists" not in str(exc).lower():
            raise
        user = api_request(token, "GET", "/user")
        repo = api_request(token, "GET", f"/repos/{user['login']}/{urllib.parse.quote(repo_name, safe='')}")
        say(f"Existing repository will be used: {repo['html_url']}")
        return repo


def git_push(token: str, clone_url: str):
    git_dir = ROOT / ".git"
    if git_dir.exists():
        raise RuntimeError("Project folder mein pehle se .git folder hai. Safety ke liye script ne overwrite nahi kiya.")

    run(["git", "init", "-b", "main"])
    run(["git", "config", "user.name", "QUIZINOX Build"])
    run(["git", "config", "user.email", "quizinox-build@users.noreply.github.com"])
    run(["git", "add", "-A"])
    run(["git", "commit", "-m", "Prepare QUIZINOX Windows build"])
    run(["git", "remote", "add", "origin", clone_url])

    # Supply credentials only to this Git process; never save them in .git/config.
    basic = base64.b64encode(f"x-access-token:{token}".encode()).decode()
    env = os.environ.copy()
    env["GIT_CONFIG_COUNT"] = "1"
    env["GIT_CONFIG_KEY_0"] = "http.https://github.com/.extraheader"
    env["GIT_CONFIG_VALUE_0"] = f"AUTHORIZATION: basic {basic}"
    run(["git", "-c", "credential.helper=", "push", "-u", "origin", "main"], env=env)


def find_build_run(token: str, owner: str, repo: str, started_after: datetime):
    path = f"/repos/{owner}/{repo}/actions/workflows/{WORKFLOW}/runs?branch=main&per_page=20"
    data = api_request(token, "GET", path)
    candidates = []
    for item in data.get("workflow_runs", []):
        created = datetime.fromisoformat(item["created_at"].replace("Z", "+00:00"))
        if created >= started_after and item.get("head_branch") == "main":
            candidates.append(item)
    return candidates[0] if candidates else None


def wait_for_build(token: str, owner: str, repo: str, started_after: datetime):
    say("GitHub Actions Windows build start hone ka wait kar raha hai...")
    deadline = time.time() + MAX_WAIT_SECONDS
    build = None
    while time.time() < deadline:
        build = find_build_run(token, owner, repo, started_after)
        if build:
            break
        time.sleep(POLL_SECONDS)
    if not build:
        raise RuntimeError("30 minutes mein workflow run nahi mila. GitHub repository ke Actions tab mein workflow status check karein.")

    run_id = build["id"]
    say(f"Build run detected: {build.get('html_url', run_id)}")
    while time.time() < deadline:
        current = api_request(token, "GET", f"/repos/{owner}/{repo}/actions/runs/{run_id}")
        status = current.get("status")
        conclusion = current.get("conclusion")
        print(f"  Build status: {status}" + (f" / {conclusion}" if conclusion else ""), flush=True)
        if status == "completed":
            if conclusion != "success":
                raise RuntimeError(f"GitHub Actions build {conclusion}. Logs dekhein: {current.get('html_url')}")
            return current
        time.sleep(POLL_SECONDS)
    raise RuntimeError(f"Build 30 minutes mein complete nahi hua. Status: {build.get('html_url')}")


def download_artifact(token: str, owner: str, repo: str, run_id: int):
    data = api_request(token, "GET", f"/repos/{owner}/{repo}/actions/runs/{run_id}/artifacts")
    artifact = next((a for a in data.get("artifacts", [])
                     if a.get("name") == ARTIFACT_NAME and not a.get("expired")), None)
    if not artifact:
        raise RuntimeError("Build successful hai, lekin expected installer artifact nahi mila.")

    # First request is authenticated; follow the temporary signed URL without forwarding the PAT.
    url = f"{API}/repos/{owner}/{repo}/actions/artifacts/{artifact['id']}/zip"
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            return None

    req = urllib.request.Request(url, headers={
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
    })
    opener = urllib.request.build_opener(NoRedirect)
    try:
        with opener.open(req, timeout=60) as response:
            signed_url = response.geturl()
            content = response.read()
    except urllib.error.HTTPError as redirect:
        if redirect.code not in (301, 302, 303, 307, 308):
            raise RuntimeError(f"Artifact download failed: HTTP {redirect.code}") from redirect
        signed_url = redirect.headers.get("Location")
        if not signed_url:
            raise RuntimeError("GitHub ne artifact download URL return nahi kiya.")
        # The signed URL is fetched separately; the GitHub PAT is NOT forwarded.
        with urllib.request.urlopen(signed_url, timeout=180) as response:
            content = response.read()
    if not content:
        raise RuntimeError("GitHub artifact download empty mila.")

    temp_zip = ROOT / "release" / "github-artifact.zip"
    temp_zip.parent.mkdir(parents=True, exist_ok=True)
    temp_zip.write_bytes(content)
    extracted = ROOT / "release" / "artifact-extracted"
    if extracted.exists():
        shutil.rmtree(extracted)
    extracted.mkdir(parents=True)
    with zipfile.ZipFile(temp_zip) as zf:
        zf.extractall(extracted)
    temp_zip.unlink(missing_ok=True)

    installers = list(extracted.rglob("*.exe"))
    if not installers:
        raise RuntimeError("Artifact ZIP mein koi .exe file nahi mili.")
    release = ROOT / "release"
    final_paths = []
    for installer in installers:
        destination = release / installer.name
        shutil.copy2(installer, destination)
        final_paths.append(destination)
    shutil.rmtree(extracted, ignore_errors=True)
    return final_paths


def make_complete_zip():
    parent = ROOT.parent
    output = parent / "QUIZINOX_v2.3_Windows_Complete.zip"
    if output.exists():
        output.unlink()
    excluded_dirs = {".git", "node_modules", "dist", "android", ".vite", "__pycache__"}
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for path in ROOT.rglob("*"):
            if not path.is_file():
                continue
            relative = path.relative_to(ROOT)
            if any(part in excluded_dirs for part in relative.parts):
                continue
            if path.suffix in {".pyc"} or path.name == "github-artifact.zip":
                continue
            zf.write(path, Path(ROOT.name) / relative)
    return output


def main():
    print("=" * 66)
    print("       QUIZINOX — AUTOMATIC WINDOWS INSTALLER BUILDER")
    print("=" * 66)
    print("Ye script GitHub par project upload karegi, Windows .exe build karegi,\n"
          "aur installer ko project ke saath ek naye ZIP mein pack karegi.\n")
    ensure_git()

    username = input("GitHub username: ").strip()
    if not username:
        raise RuntimeError("GitHub username required hai.")
    token = getpass.getpass("GitHub Personal Access Token (input hidden): ").strip()
    if not token:
        raise RuntimeError("PAT required hai.")

    me = api_request(token, "GET", "/user")
    owner = me["login"]
    if owner.lower() != username.lower():
        say(f"Entered username '{username}' token account '{owner}' se match nahi karta. Token account use hoga.")
    default_repo = "QUIZINOX-Windows-App"
    repo_name = input(f"Repository name [{default_repo}]: ").strip() or default_repo
    visibility = input("Private repository? [Y/n]: ").strip().lower()
    private = visibility not in {"n", "no", "public"}

    repo = create_or_get_repo(token, repo_name, private)
    if repo.get("archived"):
        raise RuntimeError("Selected GitHub repository archived hai.")
    started_after = datetime.now(timezone.utc)
    git_push(token, repo["clone_url"])
    say("Project GitHub par push ho gaya. Windows runner ab installer compile karega.")

    build = wait_for_build(token, owner, repo_name, started_after)
    installers = download_artifact(token, owner, repo_name, build["id"])
    say("Installer download ho gaya:")
    for item in installers:
        print(f"  - {item.relative_to(ROOT)}")
    output = make_complete_zip()
    print("\n" + "=" * 66)
    say("ALL DONE! Complete ZIP ready:")
    print(f"  {output}")
    print(f"  GitHub repo: {repo['html_url']}")
    print("Ab ZIP ke release folder mein Windows installer (.exe) bhi included hai.")
    print("=" * 66)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nUser ne process cancel kar diya.")
        sys.exit(130)
    except Exception as exc:
        print(f"\nERROR: {exc}")
        print("Tip: PAT mein repository create/push aur Actions read access hona chahiye.\n"
              "Classic PAT ke liye 'repo' + 'workflow' scopes use karein; fine-grained PAT mein\n"
              "Contents: Read and write, Actions: Read and write, Workflows: Read and write.\n"
              "Agar build fail ho, GitHub repo ke Actions tab se logs dekhein.")
        sys.exit(1)
