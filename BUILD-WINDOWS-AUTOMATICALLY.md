# Automatic Windows installer build (GitHub)

1. Extract this ZIP on your Windows laptop.
2. Install **Git for Windows** and **Python 3.9+** if they are not already installed.
3. Open the extracted `QUIZINOX` folder and double-click `RUN-WINDOWS-BUILD.bat` (or run `python BUILD-WINDOWS-VIA-GITHUB.py`).
4. Enter your GitHub username and a Personal Access Token when asked. The token input is hidden and the script does not save it.
5. The script creates a private GitHub repository by default, pushes the project, waits for GitHub Actions to build the Windows installer (without attempting GitHub Release publishing), downloads the `.exe`, and creates `QUIZINOX_v2.4_Windows_Complete.zip` one folder above the project.

## GitHub token permissions

For a **classic PAT**, use both `repo` and `workflow` scopes. For a **fine-grained PAT**, grant access to the selected account/repository with:

- Contents: Read and write
- Actions: Read and write
- Workflows: Read and write

Creating a new repository also requires account-level repository creation permission. You can create the repository manually first if your token cannot create repositories.

## Notes

- Internet access is required while pushing the project and downloading the build.
- GitHub Actions uses a Windows runner, so the installer is built for 64-bit Windows.
- The script does not embed or save your PAT in the project. Avoid sharing your token with anyone.
- If a build fails, open the repository's **Actions** tab and inspect the failed run logs.
- The script needs permission to create a repository or push to an existing repository. If reusing a repository, it must be empty and not already have a `.git` folder in this extracted project.
