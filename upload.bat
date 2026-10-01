@echo off
title Uploading to GitHub and Vercel...
cd /d "%~dp0"

echo [1/2] Adding changes to Git...
"C:\Program Files\Git\cmd\git.exe" add -A
"C:\Program Files\Git\cmd\git.exe" commit -m "fix: optimize monetag multi-tag and add anti-spam cooldown to executor downloads" 2>nul

echo.
echo [2/2] Pushing to GitHub...
"C:\Program Files\Git\cmd\git.exe" push origin main

echo.
echo ========================================================
echo Done! All files and folders have been uploaded.
echo ========================================================
pause

