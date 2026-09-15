@echo off
chcp 65001 >nul
title Creating Discloud Zip Package...
cd /d "%~dp0"

echo ========================================================
echo   กำลังสร้างไฟล์ discloud-bot.zip สำหรับอัปโหลด Discloud
echo ========================================================
echo.

powershell -NoProfile -Command "Compress-Archive -Path 'discloud.config', 'package.json', 'package-lock.json', 'db.js', '.env', 'bot', 'data' -DestinationPath 'discloud-bot.zip' -Force"

if exist discloud-bot.zip (
    echo.
    echo [สำเร็จ] สร้างไฟล์ discloud-bot.zip เรียบร้อยแล้ว!
    echo ตำแหน่งไฟล์: %~dp0discloud-bot.zip
    echo คุณสามารถลากไฟล์นี้ไปวางในหน้าเว็บ Discloud ได้ทันที
) else (
    echo.
    echo [ข้อผิดพลาด] ไม่สามารถสร้างไฟล์ zip ได้
)

echo.
pause
