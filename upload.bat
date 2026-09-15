@echo off
title Uploading to GitHub & Vercel...
cd /d "C:\Users\Administrator\.gemini\antigravity-ide\scratch\roblox-scripthub"

echo [1/3] Building static files to public/...
node build.js

echo.
echo [2/3] Adding changes to Git...
"C:\Program Files\Git\cmd\git.exe" add -A
"C:\Program Files\Git\cmd\git.exe" commit -m "fix: sync admin config, lootlabs token gate and static files" 2>nul

echo.
echo [3/3] Pushing to GitHub...
"C:\Program Files\Git\cmd\git.exe" push origin main

echo.
echo ========================================================
echo Done! All files and folders have been uploaded.
echo ========================================================
pause
