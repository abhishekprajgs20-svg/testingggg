@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ================================================================
echo       QUIZINOX - AUTOMATIC WINDOWS INSTALLER BUILDER
echo ================================================================
where python >nul 2>nul
if errorlevel 1 (
  echo Python 3.9+ not found. Install Python from https://www.python.org/downloads/
  pause
  exit /b 1
)
where git >nul 2>nul
if errorlevel 1 (
  echo Git for Windows not found. Install it from https://git-scm.com/download/win
  pause
  exit /b 1
)
python BUILD-WINDOWS-VIA-GITHUB.py
if errorlevel 1 (
  echo.
  echo Build process failed. Read the error shown above.
) else (
  echo.
  echo Complete ZIP created in the parent folder.
)
pause
