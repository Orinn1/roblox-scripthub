@echo off
title Discord Multi-Bot Master Runner
chcp 65001 >nul
color 0B

echo ========================================================
echo       🚀 กำลังเปิดบอท Discord ทั้ง 4 ตัวพร้อมกัน...
echo ========================================================
echo.
echo [1] 🤖 Bot 1: BlacklistScriptx (Roblox Script Hub)
echo [2] 🌸 Bot 2: แม่พระของเซนโย (Super Bot 24 ชม.)
echo [3] 🐰 Bot 3: BunnyHelper (Fresshy Shop Bot ตรวจสลิป)
echo [4] 🟣 Bot 4: blacklisthub (สถานะสตรีมมิ่งสีม่วง 24 ชม.)
echo.
echo * หมายเหตุ: ทุกตัวจะเริ่มทำงานแบบเว้นระยะห่าง 4 วินาที
echo * เพื่อป้องกัน Discord Gateway Rate Limit
echo * หากต้องการปิดบอททั้งหมด ให้กดปิดหน้าต่างนี้ หรือกด Ctrl + C
echo ========================================================
echo.

node run-all-bots.js
pause
