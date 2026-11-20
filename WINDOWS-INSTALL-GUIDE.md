# Install QUIZINOX on Windows

## Easiest method — create the installer using GitHub Actions

This method does not require Node.js on your laptop and does not require a GitHub PAT or environment variable for publishing. The workflow builds the installer and uploads it as an Actions artifact; it does not publish a GitHub Release.

1. Create a GitHub repository and upload the **contents** of this `QUIZINOX` folder to the repository's root.
2. Open the repository's **Actions** tab.
3. Select **Build QUIZINOX Windows Installer** from the left side.
4. Click **Run workflow** and wait for the green check mark.
5. Open the completed workflow run and download the artifact named **QUIZINOX-Windows-Installer**.
6. Extract the downloaded artifact ZIP and double-click `QUIZINOX-Setup-2.5.0.exe`.
7. Follow the installer. A Desktop shortcut and Start Menu entry are created.

## Build directly on your Windows laptop

1. Install Node.js 22 LTS from https://nodejs.org/.
2. Extract this project ZIP.
3. Open the `QUIZINOX` folder and double-click `BUILD-WINDOWS.bat`.
4. After the build completes, open `release` and run `QUIZINOX-Setup-2.5.0.exe`.

## Portable build (no installation)

Open PowerShell in the project folder and run:

```powershell
npm install
npm run desktop:portable
```

Run the generated `QUIZINOX-Portable-2.5.0.exe` from the `release` folder.

## Important

- Windows installer is 64-bit (x64).
- Quiz data and attempt history are saved locally in the Windows app profile. They are not synced automatically between Android and Windows. Use **Settings → Export backup** and **Restore backup** to move data between devices.
- Quiz creation, saved quizzes, exam/practice mode, reports, and bundled offline tools work without internet. Online translation and Gemini-powered features still require internet.
- The first Windows build downloads Electron and build dependencies, so an internet connection is needed while building. The installed app itself does not need internet for offline features.
