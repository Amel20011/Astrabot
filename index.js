const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const qrcode = require('qrcode-terminal');

// Import handler
const { messageHandler } = require('./handler');

// Config
const CONFIG = require('./config');

// Initialize
async function init() {
    const folders = ['data', 'libs', 'assets', 'auth_info'];
    folders.forEach(folder => {
        if (!fs.existsSync(path.join(__dirname, folder))) {
            fs.mkdirSync(path.join(__dirname, folder), { recursive: true });
        }
    });
    
    // Default files
    const defaultFiles = {
        'data/products.json': [
            {
                id: 1,
                name: "ALIGHT MOTION PREMIUM",
                description: "Aplikasi edit video premium dengan fitur lengkap",
                price: 15000,
                stock: 16,
                category: "APK Premium"
            },
            {
                id: 2,
                name: "CANVA LIFETIME",
                description: "Canva Pro lifetime account",
                price: 25000,
                stock: 8,
                category: "Design Tools"
            },
            {
                id: 3,
                name: "CANVA PRO",
                description: "Canva Pro account 1 tahun",
                price: 20000,
                stock: 13,
                category: "Design Tools"
            },
            {
                id: 4,
                name: "CAPCUT PRO",
                description: "Capcut Pro unlimited export",
                price: 18000,
                stock: 193,
                category: "APK Premium"
            },
            {
                id: 5,
                name: "CAPCUT PRO HEAD",
                description: "Capcut Pro for header/banner",
                price: 10000,
                stock: 20,
                category: "APK Premium"
            }
        ],
        'data/settings.json': {
            storeName: "Toko Digital Liviaa",
            ownerName: "Liviaa",
            whatsappNumber: "13658700681",
            prefix: ".",
            isOpen: true,
            openingHours: "24 Jam",
            features: {
                useButtons: true,
                useLists: true,
                antiLink: true,
                welcomeMessage: true
            }
        },
        'data/admins.json': ["13658700681"],
        'data/groups.json': {},
        'data/orders.json': [],
        'data/carts.json': {}
    };
    
    for (const [filePath, content] of Object.entries(defaultFiles)) {
        const fullPath = path.join(__dirname, filePath);
        if (!fs.existsSync(fullPath)) {
            await fs.writeJson(fullPath, content, { spaces: 2 });
        }
    }
}

// Display QR with timer
let qrTimer = 60;
function showQR(qr) {
    console.clear();
    console.log(chalk.yellow('╔══════════════════════════════════════╗'));
    console.log(chalk.yellow('║          📱 SCAN QR CODE             ║'));
    console.log(chalk.yellow('╚══════════════════════════════════════╝\n'));
    
    console.log(chalk.cyan(`⏰ Waktu tersisa: ${qrTimer} detik`));
    console.log(chalk.cyan('📱 Cara scan:'));
    console.log(chalk.white('1. WhatsApp → Settings'));
    console.log(chalk.white('2. Linked Devices → Link a Device'));
    console.log(chalk.white('3. Scan QR di bawah:\n'));
    
    qrcode.generate(qr, { small: true });
    
    const timer = setInterval(() => {
        qrTimer--;
        if (qrTimer <= 0) {
            clearInterval(timer);
            console.log(chalk.red('\n⏰ Waktu habis! Restarting...'));
            setTimeout(() => process.exit(1), 2000);
        }
    }, 1000);
}

async function connectToWhatsApp() {
    await init();
    
    console.log(chalk.cyan('╔══════════════════════════════════════╗'));
    console.log(chalk.cyan('║     🤖 BOT TOKO LIVIAA v6.0          ║'));
    console.log(chalk.cyan('║     📱 BUTTON & LIST MENU            ║'));
    console.log(chalk.cyan('╚══════════════════════════════════════╝\n'));
    
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ['Toko Bot', 'Chrome', '110.0.5481.100']
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            qrTimer = 60;
            showQR(qr);
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log(chalk.yellow('🔄 Reconnecting...'));
                setTimeout(connectToWhatsApp, 3000);
            }
        }
        
        if (connection === 'open') {
            console.clear();
            console.log(chalk.green('╔══════════════════════════════════════╗'));
            console.log(chalk.green('║     ✅ BOT TERHUBUNG KE WA           ║'));
            console.log(chalk.green('╚══════════════════════════════════════╝\n'));
            
            console.log(chalk.cyan(`🤖 Bot Name: ${sock.user?.name || 'Toko Liviaa'}`));
            console.log(chalk.cyan(`🔧 Prefix: ${CONFIG.prefix}`));
            console.log(chalk.cyan(`👤 Owner: ${CONFIG.ownerName}`));
            console.log(chalk.cyan(`📞 WA: ${CONFIG.ownerNumber}`));
            console.log(chalk.cyan(`⏰ ${new Date().toLocaleString()}\n`));
            
            console.log(chalk.yellow('✨ FITUR AKTIF:'));
            console.log(chalk.white('✓ Button Menu & List (3 garis)'));
            console.log(chalk.white('✓ Store dengan produk'));
            console.log(chalk.white('✓ QRIS Payment'));
            console.log(chalk.white('✓ Owner Contact'));
            console.log(chalk.white('✓ Group Features'));
            console.log(chalk.white('✓ Admin System\n'));
            
            console.log(chalk.green('🚀 BOT SIAP DIGUNAKAN!'));
            console.log(chalk.green('📱 Kirim .menu untuk mulai\n'));
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        try {
            await messageHandler(sock, msg);
        } catch (error) {
            console.error('Error:', error.message);
        }
    });

    sock.ev.on('creds.update', saveCreds);
    
    return sock;
}

// Start bot
connectToWhatsApp().catch(error => {
    console.error('Fatal error:', error);
    setTimeout(connectToWhatsApp, 5000);
});
