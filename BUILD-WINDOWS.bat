@echo off
setlocal
cd /d "%~dp0"
echo =============================================
echo          QUIZINOX WINDOWS BUILDER
echo =============================================
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 LTS is required. Install it from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)
echo Installing required packages. This may take a few minutes...
call npm install
if errorlevel 1 goto failed
echo Building QUIZINOX Windows installer...
call npm run desktop:dist
if errorlevel 1 goto failed
echo.
echo SUCCESS! Open the release folder and run QUIZINOX-Setup-2.3.0.exe
explorer "%~dp0release"
pause
exit /b 0
:failed
echo.
echo Build failed. Check the error shown above and try again.
pause
exit /b 1
