@echo off
chcp 65001 > nul
title Deploy Slash Commands - AI Q&A Bot
color 0a

echo ========================================================
echo        🚀 Deploy Slash Commands to Discord
echo ========================================================
echo.

cd /d "%~dp0"
node deploy-commands.js

echo.
pause
