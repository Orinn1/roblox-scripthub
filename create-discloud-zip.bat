@echo off
chcp 65001 >nul
title Creating DisCloud Zip Package...
cd /d "%~dp0"

echo ========================================================
echo   กำลังสร้างไฟล์ discloud-bot.zip สำหรับอัปโหลด DisCloud
echo   (รวมบอทครบทั้ง 4 ตัว + ปรับแต่ง RAM ให้พอดี 100MB)
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0create-discloud-zip.ps1"

if exist discloud-bot.zip (
    echo.
    echo ========================================================
    echo  [สำเร็จ] สร้างไฟล์ discloud-bot.zip เรียบร้อยแล้ว!
    echo ========================================================
    echo ตำแหน่งไฟล์: %~dp0discloud-bot.zip
    echo.
    echo วิธีนำไปใช้:
    echo 1. เปิดเว็บ https://discloud.com แล้วล็อกอินด้วย Discord
    echo 2. ไปที่เมนู "Add App" (เพิ่มแอป)
    echo 3. ลากไฟล์ discloud-bot.zip นี้ไปวาง แล้วกดยืนยันได้ทันที!
    echo ========================================================
) else (
    echo.
    echo [ข้อผิดพลาด] ไม่สามารถสร้างไฟล์ zip ได้ กรุณาตรวจสอบสิทธิ์
)

echo.
pause
