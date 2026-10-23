const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    if (!exists) return;
    const baseName = path.basename(src);
    if (baseName === '.git' || baseName === '.gitmodules') return;
    const stats = fs.statSync(src);
    const isDirectory = stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            if (childItemName === '.git') return;
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

// ไฟล์เว็บทั้งหมดแก้ใน public/ โดยตรงแล้ว เหลือแค่ sync data/ (ที่ db.js เขียน) ไป public/data
const itemsToCopy = [
    'data'
];

for (const item of itemsToCopy) {
    const srcPath = path.join(__dirname, item);
    const destPath = path.join(publicDir, item);
    if (fs.existsSync(srcPath)) {
        copyRecursiveSync(srcPath, destPath);
        console.log(`Copied ${item} to public/`);
    }
}

console.log('Build complete! Static files ready in public/');
