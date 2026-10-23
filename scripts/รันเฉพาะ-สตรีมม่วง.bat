@echo off
cd /d "%~dp0.."
title 🟣 Selfbot - blacklisthub (สถานะสตรีมมิ่งสีม่วง 24/7)
chcp 65001 >nul
color 05

echo ========================================================
echo       🟣 กำลังเริ่มรักษาสถานะสตรีมมิ่งสีม่วง 24/7
echo ========================================================
echo.

node bot/presence-stream.js
pause
