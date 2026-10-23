@echo off
cd /d "%~dp0.."
title Multi-Bot Launcher (Separate Windows)
chcp 65001 >nul

echo ========================================================
echo   กำลังเปิดหน้าต่างแยกสำหรับบอทแต่ละตัว (4 หน้าต่าง)...
echo ========================================================
echo.

start "🤖 Bot 1: RobloxHub" cmd /k "chcp 65001 >nul && node bot/index.js"
timeout /t 4 /nobreak >nul

start "🌸 Bot 2: แม่พระของเซนโย" cmd /k "chcp 65001 >nul && node super-bot/index.js"
timeout /t 4 /nobreak >nul

start "🐰 Bot 3: BunnyHelper (Shop)" cmd /k "chcp 65001 >nul && node shop-bot/index.js"
timeout /t 4 /nobreak >nul

start "🟣 Bot 4: สตรีมม่วง 24/7" cmd /k "chcp 65001 >nul && node bot/presence-stream.js"

echo.
echo ✅ บอททั้ง 4 ตัวถูกเปิดแยกหน้าต่างเรียบร้อยแล้วครับ!
echo คุณสามารถย่อหน้าต่างเก็บไว้ที่ Taskbar เพื่อให้ออนไลน์ 24 ชม. ได้เลย
echo.
pause
