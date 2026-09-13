@echo off
title Uploading to GitHub...
cd /d "C:\Users\Administrator\.gemini\antigravity-ide\scratch\roblox-scripthub"
"C:\Program Files\Git\cmd\git.exe" push -u -f origin main
echo.
echo ========================================================
echo Done! All files and folders have been uploaded.
echo ========================================================
pause
