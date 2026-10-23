# 🌌 Standalone Bio Link Website (slat.cc / guns.lol Style)

โปรเจกต์หน้าเว็บไซต์รวบรวมโปรไฟล์และลิงก์โซเชียลส่วนตัว (Link-in-Bio) ในธีม **Cyber Dark + Glassmorphism + ดาวตก/อนุภาคเรืองแสง** สไตล์ `slat.cc` และ `guns.lol`

---

## ✨ ฟีเจอร์เด่น (Key Features)

1. **[ Click to Enter ] Splash Screen:**
   - หน้าจอต้อนรับแบบบรรยากาศมืดมน มีแสงนีออนกระพริบ
   - ปลดล็อคและเปิดเล่นเพลงพื้นหลังอัตโนมัติเมื่อผู้ใช้แตะหน้าจอ (ผ่านระบบ Audio Autoplay Restriction ของเบราว์เซอร์ทุกรุ่น)
2. **Interactive 3D Tilt Card:**
   - การ์ดกระจกแก้ว (Glassmorphic Card) เบลอฉากหลัง 28px พร้อมไฮไลท์ขอบเรืองแสง
   - หมุนเอียง 3 มิติตามพิกัดเมาส์ (Desktop 3D Tilt)
3. **Cyber Particles & Starfield Canvas:**
   - ละอองดาวและเส้นกลุ่มดาวแบบเรืองแสงขยับบนฉากหลังอย่างลื่นไหล
4. **Custom Music Player & Waveform Visualizer:**
   - แถบเครื่องเล่นเพลงมินิมอลในตัว พร้อมคลื่นเสียง Visualizer ขยับตามจังหวะเพลง
   - ปุ่มเปิด/ปิดเสียง และปุ่ม Play / Pause
5. **Discord Copy Interaction:**
   - ป้าย Discord Tag สามารถกดเพื่อคัดลอกชื่อไปใช้งานได้ทันที พร้อมแจ้งเตือน Toast สวยๆ
6. **Social Links Card List:**
   - ลิงก์ไปยัง BlacklistScript Hub (Official), YouTube Channel, และ Discord Server
   - ป้ายกำกับแท็ก เช่น `POPULAR`, `SUBSCRIBE`, `JOIN US`
7. **Visitor View Counter:**
   - ตัวนับจำนวนครั้งที่เข้าชม (View Counter) นับขึ้นแบบแอนิเมชัน

---

## 🛠️ วิธีแก้ไขข้อมูลส่วนตัวและลิงก์ (Customization)

คุณสามารถเปิดไฟล์ `config.js` และแก้ไขได้ทันที:
- **`profile.username` / `displayName`:** ชื่อที่แสดงบนหน้าเว็บ
- **`profile.bio`:** คำโปรยใต้ชื่อ
- **`profile.avatar`:** ลิงก์รูปโปรไฟล์ (รองรับไฟล์ `.gif` / `.png` / `.jpg`)
- **`links`:** เพิ่มหรือแก้ไขลิงก์โซเชียลมีเดีย
- **`music`:** เปลี่ยนเพลงพื้นหลัง (ใส่ URL ลิงก์ไฟล์เสียง `.mp3`)

---

## 🚀 วิธีเปิดใช้งาน

### 1. รันในเครื่อง (Localhost):
```bash
node server.js
```
เปิดเบราว์เซอร์ไปที่: `http://localhost:5000`

### 2. นำไปขึ้นเว็บออนไลน์ฟรี:
- **Cloudflare Pages / Workers:** ลากโฟลเดอร์นี้ขึ้น Cloudflare Pages ได้ฟรี 100%
- **GitHub Pages:** สร้าง Repository ใหม่บน GitHub แล้วเปิด GitHub Pages ที่ Settings
- **Vercel / Netlify:** รองรับการเชื่อมต่อและเปิดใช้งานได้ทันที
