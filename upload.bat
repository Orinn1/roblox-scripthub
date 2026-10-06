@echo off
title Uploading to GitHub...
cd /d "%~dp0"
set "PATH=C:\Program Files\GitHub CLI;C:\Program Files\Git\cmd;%PATH%"

echo [1/2] Staging and committing changes...
git add -A
git commit -m "feat: enhance Security Access Gate with cyber bloom, skip button and fade-in entrance" 2>nul

echo.
echo [2/2] Pushing to GitHub (https://github.com/Orinn1/roblox-scripthub.git)...
git push origin main

echo.
echo ========================================================
echo Done! All files have been uploaded to GitHub.
echo ========================================================
pause


