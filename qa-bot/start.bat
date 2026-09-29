@echo off
chcp 65001 > nul
title Discord AI Q&A Bot
color 0b

echo ========================================================
echo        🤖 Discord AI Q&A Bot - Blacklist Script Hub
echo ========================================================
echo.

cd /d "%~dp0"

:: ตรวจสอบ Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] ไม่พบ Node.js ในเครื่อง!
    echo กรุณาดาวน์โหลดและติดตั้ง Node.js จาก https://nodejs.org
    echo.
    pause
    exit /b
)

:: ตรวจสอบ node_modules
if not exist "node_modules\" (
    echo [1/3] กำลังติดตั้ง Dependencies (discord.js, dotenv)...
    call npm install
    echo.
)

:: ตรวจสอบไฟล์ .env
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" > nul
        echo [INFO] สร้างไฟล์ .env ให้แล้ว กรุณาเปิดไฟล์ .env เพื่อใส่ DISCORD_TOKEN และ GEMINI_API_KEY
    )
)

echo [2/3] กำลังเริ่มต้นบอท...
echo [3/3] กด Ctrl+C เพื่อหยุดการทำงาน
echo.

node index.js

if %errorlevel% neq 0 (
    echo.
    echo [!] บอทหยุดการทำงาน หรือเกิดข้อผิดพลาดด้านบน
)

pause
