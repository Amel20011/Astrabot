const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const qrcode = require('qrcode-terminal');
const { Boom } = require('@hapi/boom');

// Import handler
const { messageHandler } = require('./handler');

// Config
const CONFIG = require('./config');

// Inisialisasi folder
async function init() {
    const folders = ['data', 'assets', 'auth_info'];
    folders.forEach(folder => {
        if (!fs.existsSync(path.join(__dirname, folder))) {
            fs.mkdirSync(path.join(__dirname, folder), { recursive: true });
        }
    });
    
    // Cek file penting
    const requiredFiles = [
        'data/settings.json',
        'data/products.json',
        'data/admins.json'
    ];
    
    for (const file of requiredFiles) {
        if (!fs.existsSync(path.join(__dirname, file))) {
            console.log(chalk.red(`❌ File ${file} tidak ditemukan!`));
            console.log(chalk.yellow('⚠️ Jalankan: node setup.js terlebih dahulu'));
            process.exit(1);
        }
    }
}

// Tampilkan QR dengan countdown
let qrCountdown = 60; // 1 menit
function displayQR(qr) {
    console.clear();
    console.log(chalk.yellow('╔══════════════════════════════════════╗'));
    console.log(chalk.yellow('║     📱 SCAN QR CODE UNTUK LOGIN      ║'));
    console.log(chalk.yellow('╚══════════════════════════════════════╝\n'));
    
    console.log(chalk.cyan('⏰ Waktu tersisa:'), chalk.green.bold(`${qrCountdown} detik`));
    console.log(chalk.cyan('📱 Cara scan:'));
    console.log(chalk.white('1. Buka WhatsApp → Settings'));
    console.log(chalk.white('2. Linked Devices → Link a Device'));
    console.log(chalk.white('3. Scan QR code di bawah:\n'));
    
    qrcode.generate(qr, { small: true });
    
    console.log(chalk.yellow('\n⚠️ QR akan berubah setiap 30 detik'));
    console.log(chalk.yellow('🔄 Bot akan restart otomatis setelah 1 menit'));
    
    // Start countdown
    const countdownInterval = setInterval(() => {
        qrCountdown--;
        if (qrCountdown <= 0) {
            clearInterval(countdownInterval);
            console.log(chalk.red('\n⏰ Waktu habis! Restarting...'));
            setTimeout(() => process.exit(1), 2000);
        }
    }, 1000);
}

async function connectToWhatsApp() {
    await init();
    
    console.log(chalk.cyan('╔══════════════════════════════════════╗'));
    console.log(chalk.cyan('║     🤖 BOT TOKO LIVIAA v5.0          ║'));
    console.log(chalk.cyan('║     📱 KIUUR/BAILEYS MODIFIED        ║'));
    console.log(chalk.cyan('╚══════════════════════════════════════╝\n'));
    
    console.log(chalk.blue('🔧 Memulai koneksi WhatsApp...'));
    
    const { state, saveCreds } = await useMultiFileAuthState(CONFIG.authFolder);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    console.log(chalk.blue(`📱 Baileys Version: ${version.join('.')}`));
    console.log(chalk.blue(`✅ Latest: ${isLatest ? 'Yes' : 'No'}`));
    
    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        logger: CONFIG.logger,
        printQRInTerminal: false,
        browser: CONFIG.browser,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
            return {
                conversation: "Message not found"
            }
        }
    });

    // Event handlers
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            displayQR(qr);
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut);
            
            console.log(chalk.red('⚠️ Koneksi terputus, reason:'), lastDisconnect.error);
            
            if (shouldReconnect) {
                console.log(chalk.yellow('🔄 Mencoba reconnect...'));
                setTimeout(connectToWhatsApp, 5000);
            } else {
                console.log(chalk.red('❌ Logged out, silakan scan ulang QR'));
                process.exit(1);
            }
        }
        
        if (connection === 'open') {
            console.clear();
            console.log(chalk.green('╔══════════════════════════════════════╗'));
            console.log(chalk.green('║     ✅ BOT BERHASIL TERHUBUNG       ║'));
            console.log(chalk.green('╚══════════════════════════════════════╝\n'));
            
            console.log(chalk.cyan(`🤖 Nama Bot: ${sock.user?.name || 'Toko Liviaa'}`));
            console.log(chalk.cyan(`📞 Nomor Bot: ${sock.user?.id.split(':')[0] || 'Unknown'}`));
            console.log(chalk.cyan(`🔧 Prefix: ${CONFIG.prefix}`));
            console.log(chalk.cyan(`👤 Owner: ${CONFIG.ownerName} (${CONFIG.ownerNumber})`));
            console.log(chalk.cyan(`🏪 Toko: ${CONFIG.storeName}`));
            console.log(chalk.cyan(`⏰ Dibuat: ${new Date().toLocaleString()}\n`));
            
            console.log(chalk.yellow('📋 FITUR AKTIF:'));
            console.log(chalk.white('• Store dengan list produk'));
            console.log(chalk.white('• Button & List menu (3 garis)'));
            console.log(chalk.white('• Anti-link grup'));
            console.log(chalk.white('• Welcome message'));
            console.log(chalk.white('• QRIS payment'));
            console.log(chalk.white('• Approval system'));
            console.log(chalk.white('• Admin commands\n'));
            
            console.log(chalk.green('🚀 BOT SIAP DIGUNAKAN!'));
        }
    });

    // Handle messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        try {
            await messageHandler(sock, msg);
        } catch (error) {
            console.error(chalk.red('❌ Error handling message:'), error);
        }
    });

    // Handle group events
    sock.ev.on('group-participants.update', async (update) => {
        try {
            const groupModule = require('./libs/group');
            await groupModule.handleParticipantsUpdate(sock, update);
        } catch (error) {
            console.error(chalk.red('❌ Error handling group update:'), error);
        }
    });

    // Save credentials
    sock.ev.on('creds.update', saveCreds);
    
    return sock;
}

// Helper function untuk membuat key store
function makeCacheableSignalKeyStore(keys, logger) {
    // Implementasi sederhana untuk kiuur/baileys
    return {
        async get(key) {
            return keys.get(key);
        },
        async set(key, value) {
            return keys.set(key, value);
        }
    };
}

// Handle process events
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n🛑 Bot dimatikan oleh user'));
    console.log(chalk.yellow('👋 Sampai jumpa!'));
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error(chalk.red('❌ Uncaught Exception:'), error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('❌ Unhandled Rejection at:'), promise, 'reason:', reason);
});

// Start bot
connectToWhatsApp().catch(error => {
    console.error(chalk.red('❌ Fatal error:'), error);
    console.log(chalk.yellow('🔄 Restarting in 5 seconds...'));
    setTimeout(connectToWhatsApp, 5000);
});
