@echo off
title Discord Shop Bot (Ticket & Slip Verify)
chcp 65001 >nul
echo ========================================================
echo       🤖 กำลังเริ่มการทำงาน Discord Shop Bot
echo    (ระบบเปิดตั๋วสั่งซื้อ + ตรวจสลิปซ้ำ QR Code ฟรี 100%)
echo ========================================================
echo.

if not exist .env (
    echo [!] ไม่พบไฟล์ .env
    echo [*] กำลังคัดลอก .env.example ไปเป็น .env...
    copy .env.example .env
    echo.
    echo [!] กรุณาเปิดไฟล์ .env แล้วใส่ DISCORD_TOKEN ให้เรียบร้อยก่อนเปิดบอทครับ!
    echo.
    pause
    exit /b
)

node index.js
pause
