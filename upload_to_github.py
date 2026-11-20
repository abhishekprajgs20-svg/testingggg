#!/usr/bin/env python3
# QUIZINOX v2.6 — GitHub uploader + automatic Android APK / Windows installer downloader
#
# Usage: keep this file inside (or next to) the QUIZINOX project folder and run:
#     python upload_to_github.py
# Install dependency once:  python -m pip install requests
#
# What it does
#   1. Uploads the project source to your GitHub repository (creates it if needed)
#   2. Starts the GitHub Actions builds you choose (Android APK, Windows installer or both)
#   3. Waits for them and downloads QUIZINOX.apk and/or QUIZINOX-Setup-x.y.z.exe next to this script
# Your token is asked with hidden input and is never saved to disk.
import base64, getpass, io, json, os, sys, time, traceback, zipfile
try:
    import requests
except ImportError:
    print("Missing 'requests'. Run:  python -m pip install requests")
    input("Press Enter to exit..."); sys.exit(1)

API = "https://api.github.com"
HERE = os.path.dirname(os.path.abspath(__file__))
BATCH = 1_500_000
SKIP_DIRS = {"node_modules", ".git", "dist", "android", "release", "out", "__pycache__", ".vite", ".idea", ".vscode"}
SKIP_FILES = {".DS_Store", "Thumbs.db", "QUIZINOX.apk", "package-lock.json"}
SKIP_EXT = {".apk", ".exe", ".pyc"}
TARGETS = {
    "android": {"workflow": "build-apk.yml", "artifact": "QUIZINOX-APK", "label": "Android APK"},
    "windows": {"workflow": "build-windows-installer.yml", "artifact": "QUIZINOX-Windows-Installer", "label": "Windows installer"},
}

class UploadError(Exception):
    pass

def find_project_dir():
    for c in (HERE, os.path.join(HERE, "QUIZINOX"), os.path.join(HERE, "QUIZINOX_Offline_Android"),
              os.path.join(os.path.dirname(HERE), "QUIZINOX"), os.path.join(os.path.dirname(HERE), "QUIZINOX_Offline_Android")):
        if (os.path.isfile(os.path.join(c, "package.json")) and os.path.isfile(os.path.join(c, "capacitor.config.json"))
                and os.path.isdir(os.path.join(c, "src")) and os.path.isdir(os.path.join(c, ".github", "workflows"))):
            return os.path.abspath(c)
    return None

PROJECT_DIR = find_project_dir()

def app_version():
    try:
        with open(os.path.join(PROJECT_DIR, "package.json"), encoding="utf-8") as f:
            return json.load(f).get("version", "2.6.1")
    except Exception:
        return "2.6.1"

def api(method, path, token, **kwargs):
    headers = {"Authorization": "Bearer " + token, "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    url = path if path.startswith("https://") else API + path
    for attempt in range(1, 8):
        try:
            r = requests.request(method, url, headers=headers, timeout=90, **kwargs)
        except requests.RequestException as e:
            print(f"  Network issue ({type(e).__name__}), retry {attempt}/7...")
            time.sleep(attempt * 3); continue
        if r.status_code == 429 or (r.status_code == 403 and any(x in r.text.lower() for x in ("rate limit", "abuse", "secondary"))):
            wait = int(r.headers.get("Retry-After", 0) or 20 * attempt)
            print(f"  GitHub rate limit; waiting {wait}s..."); time.sleep(wait); continue
        if r.status_code >= 500:
            print(f"  GitHub server error {r.status_code}; retrying..."); time.sleep(attempt * 4); continue
        return r
    raise UploadError(f"GitHub API failed repeatedly: {method} {path}")

def collect():
    if not PROJECT_DIR:
        raise UploadError("QUIZINOX project files were not found. Keep package.json, capacitor.config.json, "
                          "src\\ and .github\\workflows together with this uploader.")
    print("Project folder:", PROJECT_DIR)
    out = []
    for dp, dn, fn in os.walk(PROJECT_DIR):
        dn[:] = [d for d in dn if d not in SKIP_DIRS]
        for name in fn:
            if name in SKIP_FILES or os.path.splitext(name)[1].lower() in SKIP_EXT:
                continue
            full = os.path.join(dp, name)
            out.append((os.path.relpath(full, PROJECT_DIR).replace(os.sep, "/"), full))
    if not out:
        raise UploadError("No project files found.")
    return out

def entries_for(token, repo, files):
    out = []
    for rel, full in files:
        with open(full, "rb") as f:
            data = f.read()
        mode = "100755" if rel.endswith("gradlew") else "100644"
        try:
            txt = data.decode("utf-8")
            if "\x00" in txt:
                raise UnicodeDecodeError("utf8", b"", 0, 1, "binary")
            out.append(({"path": rel, "mode": mode, "type": "blob", "content": txt}, len(data)))
        except UnicodeDecodeError:
            r = api("POST", repo + "/git/blobs", token, json={"content": base64.b64encode(data).decode(), "encoding": "base64"})
            if r.status_code != 201:
                raise UploadError(f"Binary upload failed for {rel}: {r.status_code} {r.text[:200]}")
            out.append(({"path": rel, "mode": mode, "type": "blob", "sha": r.json()["sha"]}, 200))
        print("  Prepared:", rel)
    return out

def commit(token, repo, branch, parent, base_tree, entries, message):
    batches, cur, size = [], [], 0
    for item, n in entries:
        if cur and size + n > BATCH:
            batches.append(cur); cur, size = [], 0
        cur.append(item); size += n
    if cur:
        batches.append(cur)
    tree = base_tree
    for i, b in enumerate(batches, 1):
        r = api("POST", repo + "/git/trees", token, json={"base_tree": tree, "tree": b})
        if r.status_code != 201:
            raise UploadError(f"Git tree failed: {r.status_code} {r.text[:300]}")
        tree = r.json()["sha"]; print(f"  Uploaded tree batch {i}/{len(batches)}")
    r = api("POST", repo + "/git/commits", token, json={"message": message, "tree": tree, "parents": [parent]})
    if r.status_code != 201:
        raise UploadError(f"Commit failed: {r.status_code} {r.text[:300]}")
    sha = r.json()["sha"]
    r = api("PATCH", repo + "/git/refs/heads/" + branch, token, json={"sha": sha})
    if r.status_code != 200:
        raise UploadError(f"Branch update failed: {r.status_code} {r.text[:300]}")
    return sha

def find_run(token, repo, workflow, sha):
    r = api("GET", f"{repo}/actions/workflows/{workflow}/runs?head_sha={sha}&per_page=5", token)
    if r.status_code == 200:
        runs = r.json().get("workflow_runs", [])
        if runs:
            return runs[0]
    return None

def dispatch(token, repo, workflow, branch):
    r = api("POST", f"{repo}/actions/workflows/{workflow}/dispatches", token, json={"ref": branch})
    return r.status_code == 204

def download_artifact(token, repo, run_id, target, version):
    info = TARGETS[target]
    r = api("GET", f"{repo}/actions/runs/{run_id}/artifacts", token)
    arts = r.json().get("artifacts", []) if r.status_code == 200 else []
    art = next((a for a in arts if a["name"] == info["artifact"]), None)
    if not art:
        print(f"  {info['label']}: build finished but artifact '{info['artifact']}' was not found."); return None
    print(f"  Downloading {info['label']}...")
    r = requests.get(art["archive_download_url"], headers={"Authorization": "Bearer " + token, "Accept": "application/vnd.github+json"}, timeout=600)
    if r.status_code != 200:
        print(f"  Auto-download failed ({r.status_code}). Download it from the Actions page."); return None
    ext = ".apk" if target == "android" else ".exe"
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        name = next((n for n in z.namelist() if n.lower().endswith(ext)), None)
        if not name:
            print(f"  Artifact did not contain a {ext} file."); return None
        dest = os.path.join(HERE, "QUIZINOX.apk" if target == "android" else f"QUIZINOX-Setup-{version}.exe")
        with open(dest, "wb") as f:
            f.write(z.read(name))
    return dest

def wait_and_download(token, repo, sha, branch, targets, actions_url, version):
    print("\nWaiting for GitHub Actions (Android ~5–15 min, Windows ~5–12 min)...")
    runs, started, dispatched = {}, time.time(), set()
    while len(runs) < len(targets) and time.time() - started < 240:
        for t in targets:
            if t in runs:
                continue
            run = find_run(token, repo, TARGETS[t]["workflow"], sha)
            if run:
                runs[t] = run["id"]; print(f"  {TARGETS[t]['label']}: build started (run {run['id']})")
            elif time.time() - started > 45 and t not in dispatched:
                if dispatch(token, repo, TARGETS[t]["workflow"], branch):
                    print(f"  {TARGETS[t]['label']}: started the workflow manually")
                dispatched.add(t)
        if len(runs) < len(targets):
            time.sleep(10)
    missing = [t for t in targets if t not in runs]
    for t in missing:
        print(f"  {TARGETS[t]['label']}: workflow not detected. Open {actions_url} and run it manually.")
    results, done, deadline = {}, set(), time.time() + 50 * 60
    while len(done) < len(runs) and time.time() < deadline:
        for t, rid in runs.items():
            if t in done:
                continue
            r = api("GET", f"{repo}/actions/runs/{rid}", token)
            if r.status_code != 200:
                continue
            run = r.json()
            if run.get("status") == "completed":
                done.add(t)
                if run.get("conclusion") == "success":
                    path = download_artifact(token, repo, rid, t, version)
                    if path:
                        results[t] = path; print(f"  ✓ {TARGETS[t]['label']} saved: {path}")
                else:
                    print(f"  ✕ {TARGETS[t]['label']} build failed ({run.get('conclusion')}). Logs: {run.get('html_url', actions_url)}")
        if len(done) < len(runs):
            status = ", ".join(f"{TARGETS[t]['label']}: {'done' if t in done else 'building'}" for t in runs)
            print(f"  {time.strftime('%H:%M:%S')} · {status}")
            time.sleep(20)
    return results

def ask_targets():
    print("\nWhat should GitHub build?")
    print("  1) Android APK")
    print("  2) Windows installer (.exe)")
    print("  3) Both  [default]")
    c = input("Choose 1 / 2 / 3: ").strip() or "3"
    return {"1": ["android"], "2": ["windows"]}.get(c, ["android", "windows"])

def main():
    version = "?"
    print("=" * 62 + "\n QUIZINOX — GITHUB UPLOADER · ANDROID APK + WINDOWS INSTALLER\n" + "=" * 62)
    files = collect(); version = app_version()
    print(f"QUIZINOX version {version} · {len(files)} files")
    targets = ask_targets()
    repo_name = input("\nGitHub repository name: ").strip()
    username = input("GitHub username: ").strip()
    token = getpass.getpass("GitHub Personal Access Token (needs 'repo' + 'workflow'): ").strip()
    if not all((repo_name, username, token)):
        raise UploadError("Repository name, username and token are required.")
    if "/" in repo_name or " " in repo_name:
        raise UploadError("Use a repository name without spaces or slashes.")
    r = api("GET", "/user", token)
    if r.status_code != 200:
        raise UploadError(f"Token check failed: {r.status_code} {r.text[:200]}")
    actual = r.json()["login"]
    if actual.lower() != username.lower():
        print(f"Note: the token belongs to @{actual}; using that account.")
    username = actual
    repo = f"/repos/{username}/{repo_name}"
    r = api("GET", repo, token)
    if r.status_code == 404:
        r = api("POST", "/user/repos", token, json={"name": repo_name, "description": "QUIZINOX offline-first quiz app for Android and Windows", "private": False, "auto_init": True})
        if r.status_code != 201:
            raise UploadError(f"Could not create repository: {r.status_code} {r.text[:300]}")
        branch = r.json().get("default_branch", "main"); print("Repository created."); time.sleep(3)
    elif r.status_code == 200:
        branch = r.json().get("default_branch", "main"); print("Repository exists; updating it.")
    else:
        raise UploadError(f"Repository check failed: {r.status_code} {r.text[:250]}")
    r = api("GET", repo + "/git/ref/heads/" + branch, token)
    if r.status_code != 200:
        raise UploadError(f"Could not read branch '{branch}': {r.status_code} {r.text[:250]}")
    parent = r.json()["object"]["sha"]
    r = api("GET", repo + "/git/commits/" + parent, token)
    if r.status_code != 200:
        raise UploadError("Could not read the current commit.")
    tree = r.json()["tree"]["sha"]
    print("\nUploading app source...")
    message = f"QUIZINOX v{version}: smart navigation, analytics, revision, search, multi-language, AI analyst/tutor/generator, multi-key Gemini"
    sha = commit(token, repo, branch, parent, tree, entries_for(token, repo, files), message)
    actions_url = f"https://github.com/{username}/{repo_name}/actions"
    print(f"\nUpload complete: https://github.com/{username}/{repo_name}")
    results = wait_and_download(token, repo, sha, branch, targets, actions_url, version)
    print("\n" + "=" * 62)
    if results:
        for t, path in results.items():
            print(f" {TARGETS[t]['label']}: {path}")
        if "android" in results:
            print(" Install the APK on your phone (debug build for direct install).")
        if "windows" in results:
            print(" Run the .exe on Windows. If SmartScreen appears: More info → Run anyway.")
    else:
        print(" No file was downloaded. Check the builds here:", actions_url)
    print("=" * 62)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nCancelled.")
    except Exception as e:
        print("\nERROR:", e); traceback.print_exc()
    input("\nPress Enter to close...")
