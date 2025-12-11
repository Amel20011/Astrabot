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
    try {
        console.log(chalk.yellow('🔧 Menyiapkan koneksi WhatsApp...'));
        
        const { state, saveCreds } = await useMultiFileAuthState(CONFIG.authFolder);
        
        const { version } = await fetchLatestBaileysVersion();
        
        console.log(chalk.blue(`📱 Menggunakan Baileys version: ${version.join('.')}`));
        
        const sock = makeWASocket({
            version,
            auth: state,
            browser: CONFIG.browser,
            logger: CONFIG.logger,
            printQRInTerminal: false, // Tidak digunakan, kita handle sendiri
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log(chalk.yellow('\n📱 Scan QR Code ini dengan WhatsApp:'));
                console.log(chalk.yellow('1. Buka WhatsApp di HP'));
                console.log(chalk.yellow('2. Pilih Linked Devices'));
                console.log(chalk.yellow('3. Pilih Link a Device'));
                console.log(chalk.yellow('4. Scan QR Code di bawah ini:\n'));
                qrcode.generate(qr, { small: true });
                console.log(chalk.yellow('\n⚠️ QR Code akan berubah setiap 30 detik'));
            }
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log(chalk.red('⚠️ Koneksi terputus...'));
                
                if (shouldReconnect) {
                    console.log(chalk.yellow('🔄 Mencoba menyambung kembali...'));
                    setTimeout(connectToWhatsApp, 5000);
                } else {
                    console.log(chalk.red('❌ Login diperlukan ulang, hapus folder auth dan scan ulang QR'));
                }
            } else if (connection === 'open') {
                console.log(chalk.green('✅ Berhasil terhubung ke WhatsApp!'));
                console.log(chalk.blue(`🤖 Bot siap digunakan sebagai ${sock.user?.name || 'Toko Online'}`));
                console.log(chalk.cyan(`📞 Nomor: ${sock.user?.id.split(':')[0] || 'Unknown'}`));
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            try {
                const msg = m.messages[0];
                if (!msg.message || msg.key.fromMe) return;
                
                await messageHandler(sock, msg);
            } catch (error) {
                console.error('Error handling message:', error);
            }
        });

        sock.ev.on('creds.update', saveCreds);
        
        // Error handler
        sock.ev.on('connection.connecting', () => {
            console.log(chalk.yellow('🔄 Menghubungkan ke WhatsApp...'));
        });
        
        sock.ev.on('connection.error', (err) => {
            console.error(chalk.red('❌ Connection error:'), err);
        });
        
        return sock;
    } catch (error) {
        console.error(chalk.red('❌ Error in connectToWhatsApp:'), error.message);
        throw error;
    }
}

// Handle shutdown dengan baik
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n🛑 Bot dimatikan dengan Ctrl+C...'));
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
async function startBot() {
    console.log(chalk.cyan('========================================'));
    console.log(chalk.cyan('🚀 Starting WhatsApp Bot Store v1.0.0'));
    console.log(chalk.cyan('========================================\n'));
    
    console.log(chalk.blue('📦 Dependencies:'));
    console.log(chalk.blue('• @whiskeysockets/baileys (modified)'));
    console.log(chalk.blue('• pino logger'));
    console.log(chalk.blue('• Node.js ' + process.version));
    console.log('');
    
    try {
        await connectToWhatsApp();
    } catch (error) {
        console.error(chalk.red('❌ Fatal error starting bot:'), error.message);
        console.log(chalk.yellow('🔄 Restarting in 10 seconds...'));
        setTimeout(startBot, 10000);
    }
}

startBot();
