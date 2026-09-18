const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    if (!exists) return;
    const stats = fs.statSync(src);
    const isDirectory = stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

// Copy essential web files to public/
const itemsToCopy = [
    'index.html',
    'admin.html',
    'css',
    'js',
    'data',
    'assets',
    'Logo.ico',
    'favicon.ico',
    'Logo.png',
    'Banner.png',
    'popup.png'
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
