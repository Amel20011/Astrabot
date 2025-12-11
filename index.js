const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const qrcode = require('qrcode-terminal');
const moment = require('moment');

// Import handler
const { messageHandler } = require('./handler');

// Config
const CONFIG = require('./config');

// Buat folder data jika belum ada
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Simpan produk default jika belum ada
const productsPath = path.join(__dirname, 'data', 'products.json');
if (!fs.existsSync(productsPath)) {
    const defaultProducts = [
        {
            id: 1,
            name: "Kaos Basic Premium",
            description: "Kaos katun 100% premium quality",
            price: 85000,
            stock: 50,
            category: "Fashion"
        },
        {
            id: 2,
            name: "Sepatu Sneakers",
            description: "Sepatu sneakers casual untuk sehari-hari",
            price: 250000,
            stock: 30,
            category: "Fashion"
        },
        {
            id: 3,
            name: "Powerbank 10000mAh",
            description: "Powerbank fast charging dengan kapasitas besar",
            price: 150000,
            stock: 25,
            category: "Elektronik"
        },
        {
            id: 4,
            name: "Tas Ransel Waterproof",
            description: "Tas ransel anti air dengan banyak kompartemen",
            price: 180000,
            stock: 40,
            category: "Aksesoris"
        }
    ];
    fs.writeJsonSync(productsPath, defaultProducts, { spaces: 2 });
}

// Simpan settings default jika belum ada
const settingsPath = path.join(__dirname, 'data', 'settings.json');
if (!fs.existsSync(settingsPath)) {
    const defaultSettings = {
        storeName: "Toko Online Saya",
        ownerName: "Pemilik Toko",
        whatsappNumber: "6281234567890",
        isOpen: true,
        openingHours: "09:00 - 21:00",
        address: "Jl. Contoh No. 123, Kota Anda",
        qrisPath: "./assets/qris.png"
    };
    fs.writeJsonSync(settingsPath, defaultSettings, { spaces: 2 });
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(CONFIG.authFolder);
    
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        printQRInTerminal: false,
        auth: state,
        browser: CONFIG.browser,
        logger: CONFIG.logger,
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log(chalk.yellow('\n📱 Scan QR Code ini dengan WhatsApp:'));
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red('⚠️ Koneksi terputus, mencoba menyambung kembali...'));
            
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log(chalk.green('✅ Berhasil terhubung ke WhatsApp!'));
            console.log(chalk.blue(`🤖 Bot siap digunakan sebagai ${sock.user?.name || 'Toko Online'}`));
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        await messageHandler(sock, msg);
    });

    sock.ev.on('creds.update', saveCreds);
    
    return sock;
}

// Handle shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n🛑 Bot dimatikan...'));
    process.exit(0);
});

// Start bot
console.log(chalk.cyan('🚀 Starting WhatsApp Bot Store...'));
connectToWhatsApp().catch(err => {
    console.error(chalk.red('❌ Error starting bot:'), err);
    process.exit(1);
});
