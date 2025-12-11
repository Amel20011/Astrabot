const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.cyan('╔══════════════════════════════════════╗'));
console.log(chalk.cyan('║     🤖 SETUP BOT TOKO LIVIAA         ║'));
console.log(chalk.cyan('╚══════════════════════════════════════╝'));

// Buat folder yang diperlukan
const folders = ['data', 'libs', 'assets', 'auth_info', 'temp'];
folders.forEach(folder => {
    if (!fs.existsSync(path.join(__dirname, folder))) {
        fs.mkdirSync(path.join(__dirname, folder), { recursive: true });
        console.log(chalk.green(`✅ Folder ${folder} dibuat`));
    }
});

// Data produk default
const defaultProducts = [
    {
        id: 1,
        name: "ALIGHT MOTION PREMIUM",
        description: "Aplikasi edit video premium dengan fitur lengkap",
        price: 15000,
        stock: 16,
        category: "APK Premium",
        type: "digital"
    },
    {
        id: 2,
        name: "CANVA LIFETIME",
        description: "Canva Pro lifetime account",
        price: 25000,
        stock: 8,
        category: "Design Tools",
        type: "digital"
    },
    {
        id: 3,
        name: "CANVA PRO",
        description: "Canva Pro account 1 tahun",
        price: 20000,
        stock: 13,
        category: "Design Tools",
        type: "digital"
    },
    {
        id: 4,
        name: "CAPCUT PRO",
        description: "Capcut Pro unlimited export",
        price: 18000,
        stock: 193,
        category: "APK Premium",
        type: "digital"
    },
    {
        id: 5,
        name: "CAPCUT PRO HEAD",
        description: "Capcut Pro for header/banner",
        price: 10000,
        stock: 20,
        category: "APK Premium",
        type: "digital"
    },
    {
        id: 6,
        name: "CHATGPT PLUS",
        description: "ChatGPT Plus account 1 bulan",
        price: 35000,
        stock: 32,
        category: "AI Tools",
        type: "digital"
    },
    {
        id: 7,
        name: "PICSART PRO",
        description: "Picsart Pro lifetime",
        price: 22000,
        stock: 4,
        category: "APK Premium",
        type: "digital"
    },
    {
        id: 8,
        name: "PRIME VIDEO",
        description: "Amazon Prime Video account",
        price: 30000,
        stock: 4,
        category: "Streaming",
        type: "digital"
    },
    {
        id: 9,
        name: "SCRIBD PREMIUM",
        description: "Scribd Premium unlimited",
        price: 25000,
        stock: 0,
        category: "E-book",
        type: "digital"
    },
    {
        id: 10,
        name: "SPOTIFY PREMIUM",
        description: "Spotify Premium family",
        price: 28000,
        stock: 0,
        category: "Music",
        type: "digital"
    }
];

// Simpan produk
const productsPath = path.join(__dirname, 'data', 'products.json');
if (!fs.existsSync(productsPath)) {
    fs.writeJsonSync(productsPath, defaultProducts, { spaces: 2 });
    console.log(chalk.green('✅ Data produk dibuat'));
}

// Settings default
const settings = {
    storeName: "Toko Digital Liviaa",
    ownerName: "Liviaa",
    whatsappNumber: "13658700681",
    prefix: ".",
    isOpen: true,
    openingHours: "24 Jam",
    address: "Online Store",
    features: {
        antiLink: true,
        welcomeMessage: true,
        autoReply: true,
        useButtons: true,
        useLists: true
    },
    payment: {
        qrisPath: "./assets/qris.png",
        bankName: "Bank Liviaa",
        bankAccount: "1234567890",
        accountName: "LIVIAA STORE"
    }
};

// Simpan settings
const settingsPath = path.join(__dirname, 'data', 'settings.json');
if (!fs.existsSync(settingsPath)) {
    fs.writeJsonSync(settingsPath, settings, { spaces: 2 });
    console.log(chalk.green('✅ Settings dibuat'));
}

// File lainnya
const otherFiles = {
    'data/admins.json': ["13658700681"],
    'data/groups.json': {},
    'data/orders.json': [],
    'data/carts.json': {},
    'data/users.json': [],
    'libs/menu.js': '// Menu module\nmodule.exports = {};',
    'libs/store.js': '// Store module\nmodule.exports = {};',
    'libs/owner.js': '// Owner module\nmodule.exports = {};',
    'libs/payment.js': '// Payment module\nmodule.exports = {};',
    'libs/admin.js': '// Admin module\nmodule.exports = {};',
    'libs/group.js': '// Group module\nmodule.exports = {};',
    'libs/utils.js': '// Utils module\nmodule.exports = {};',
    'libs/approval.js': '// Approval module\nmodule.exports = {};',
    'libs/broadcast.js': '// Broadcast module\nmodule.exports = {};'
};

// Buat file lainnya
Object.entries(otherFiles).forEach(([filePath, content]) => {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        if (typeof content === 'string') {
            fs.writeFileSync(fullPath, content);
        } else {
            fs.writeJsonSync(fullPath, content, { spaces: 2 });
        }
        console.log(chalk.green(`✅ File ${filePath} dibuat`));
    }
});

console.log(chalk.cyan('\n🎉 SETUP SELESAI!'));
console.log(chalk.cyan('\n📋 Langkah selanjutnya:'));
console.log(chalk.white('1. Install dependencies: npm install'));
console.log(chalk.white('2. Edit config.js jika perlu'));
console.log(chalk.white('3. Taruh QRIS di assets/qris.png'));
console.log(chalk.white('4. Jalankan bot: npm start'));
console.log(chalk.white('5. Gunakan prefix: . (titik)'));
