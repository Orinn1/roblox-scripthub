@echo off
title 🐰 Shop Bot - BunnyHelper (Fresshy Shop)
chcp 65001 >nul
color 0A

echo ========================================================
echo       🐰 กำลังเริ่มการทำงาน BunnyHelper (Shop Bot)
echo    (ระบบเปิดตั๋วสั่งซื้อ + ตรวจสลิปซ้ำ QR Code 100%)
echo ========================================================
echo.

node shop-bot/index.js
pause
