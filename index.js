const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, getAggregateVotesInPollMessage } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const qrcode = require('qrcode-terminal');
const moment = require('moment');
const NodeCache = require('node-cache');

// Import handler dan modules
const { messageHandler, groupHandler } = require('./handler');
const CONFIG = require('./config');

// Cache untuk session
const msgCache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

// Buat folder yang diperlukan
async function initFolders() {
    const folders = ['data', 'assets', 'auth_info', 'temp', 'assets/videos'];
    folders.forEach(folder => {
        if (!fs.existsSync(path.join(__dirname, folder))) {
            fs.mkdirSync(path.join(__dirname, folder), { recursive: true });
        }
    });

    // File default
    const defaultFiles = {
        'data/products.json': [
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
        ],
        'data/settings.json': {
            storeName: "Toko Digital Pro",
            ownerName: "Admin Toko",
            whatsappNumber: "6281234567890",
            isOpen: true,
            openingHours: "24 Jam",
            address: "Online Store",
            prefix: "!",
            features: {
                antiLink: true,
                welcomeMessage: true,
                autoReply: true,
                useButtons: true,
                useLists: true
            },
            welcome: {
                private: "👋 Halo! Selamat datang di toko kami. Ketik !menu untuk melihat menu.",
                group: "👋 Selamat datang di grup! Bot toko online siap melayani."
            }
        },
        'data/admins.json': ["6281234567890"],
        'data/groups.json': {},
        'data/orders.json': [],
        'data/carts.json': {},
        'data/users.json': []
    };

    for (const [filePath, content] of Object.entries(defaultFiles)) {
        const fullPath = path.join(__dirname, filePath);
        if (!fs.existsSync(fullPath)) {
            await fs.writeJson(fullPath, content, { spaces: 2 });
        }
    }
}

// Display pairing code dengan style
function displayPairingCode(code) {
    console.log(chalk.yellow('\n╔══════════════════════════════════════╗'));
    console.log(chalk.yellow('║         🔢 PAIRING CODE              ║'));
    console.log(chalk.yellow('╚══════════════════════════════════════╝'));
    console.log(chalk.cyan('\n   📱 Kode Pairing Anda:'));
    console.log(chalk.green.bold(`   ┌──────────────────────┐`));
    console.log(chalk.green.bold(`   │      ${code.padEnd(10)}      │`));
    console.log(chalk.green.bold(`   └──────────────────────┘`));
    console.log(chalk.white('\n   📋 Cara penggunaan:'));
    console.log(chalk.white('   1. Buka WhatsApp di HP'));
    console.log(chalk.white('   2. Settings → Linked Devices'));
    console.log(chalk.white('   3. Pilih "Link a Device"'));
    console.log(chalk.white('   4. Pilih "Link with Phone Number"'));
    console.log(chalk.white('   5. Masukkan kode di atas'));
    console.log(chalk.yellow('\n   ⚠️  Kode berlaku 30 detik'));
    console.log(chalk.yellow('   🔄 Menunggu koneksi...\n'));
}

// Function untuk connect WhatsApp
async function connectToWhatsApp() {
    try {
        await initFolders();
        
        console.log(chalk.yellow('🔧 Initializing WhatsApp Connection...'));
        
        const { state, saveCreds } = await useMultiFileAuthState(CONFIG.authFolder);
        
        const { version } = await fetchLatestBaileysVersion();
        
        console.log(chalk.blue(`📱 Using Baileys version: ${version.join('.')}`));
        
        const sock = makeWASocket({
            version,
            auth: state,
            browser: CONFIG.browser,
            logger: CONFIG.logger,
            printQRInTerminal: false,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            emitOwnEvents: true,
            defaultQueryTimeoutMs: 0,
            syncFullHistory: false,
            generateHighQualityLinkPreview: true,
            markOnlineOnConnect: true
        });

        // Event: Connection Update
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr, pairingCode } = update;
            
            if (pairingCode) {
                displayPairingCode(pairingCode);
            } else if (qr) {
                console.log(chalk.yellow('\n📱 QR Code Mode (fallback):'));
                qrcode.generate(qr, { small: true });
                console.log(chalk.yellow('\nScan QR code dengan WhatsApp Mobile'));
            }
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                
                if (shouldReconnect) {
                    console.log(chalk.red('⚠️ Connection closed, reconnecting...'));
                    setTimeout(connectToWhatsApp, 5000);
                } else {
                    console.log(chalk.red('❌ Logged out, please delete auth_info folder and restart'));
                }
            } 
            
            if (connection === 'open') {
                console.log(chalk.green('\n✅ Successfully connected to WhatsApp!'));
                console.log(chalk.cyan(`🤖 Bot Name: ${sock.user?.name || 'Toko Bot'}`));
                console.log(chalk.cyan(`📞 Bot Number: ${sock.user?.id.split(':')[0] || 'Unknown'}`));
                console.log(chalk.cyan(`⏰ Connected at: ${moment().format('DD/MM/YYYY HH:mm:ss')}`));
                
                // Update settings dengan nomor bot
                try {
                    const settings = await fs.readJson(path.join(__dirname, 'data/settings.json'));
                    if (!settings.botNumber) {
                        settings.botNumber = sock.user?.id.split(':')[0];
                        await fs.writeJson(path.join(__dirname, 'data/settings.json'), settings, { spaces: 2 });
                    }
                } catch (e) {
                    console.error('Error updating bot number:', e);
                }
            }
        });

        // Event: Messages
        sock.ev.on('messages.upsert', async (m) => {
            try {
                const msg = m.messages[0];
                if (!msg.message || msg.key.fromMe) return;
                
                // Handle message
                await messageHandler(sock, msg);
                
                // Jika grup, handle group message
                if (msg.key.remoteJid.endsWith('@g.us')) {
                    await groupHandler.handleGroupMessage(sock, msg);
                }
            } catch (error) {
                console.error('❌ Error in messages.upsert:', error);
            }
        });

        // Event: Group Participants Update
        sock.ev.on('group-participants.update', async (update) => {
            try {
                await groupHandler.handleParticipantsUpdate(sock, update);
            } catch (error) {
                console.error('❌ Error in group-participants.update:', error);
            }
        });

        // Event: Group Update
        sock.ev.on('groups.update', async (updates) => {
            for (const update of updates) {
                console.log(`📢 Group updated: ${update.id} - ${update.subject || 'No subject'}`);
            }
        });

        // Event: Message Receipts (read/delivered)
        sock.ev.on('message-receipt.update', (receipts) => {
            receipts.forEach(({ key, receipt }) => {
                const msgId = key.id;
                const status = receipt.type;
                // Bisa digunakan untuk tracking pengiriman pesan
            });
        });

        // Event: Creds Update
        sock.ev.on('creds.update', saveCreds);

        // Event: Connection Events
        sock.ev.on('connection.connecting', () => {
            console.log(chalk.yellow('🔄 Connecting to WhatsApp...'));
        });

        sock.ev.on('connection.error', (err) => {
            console.error(chalk.red('❌ Connection error:'), err.message);
        });

        return sock;

    } catch (error) {
        console.error(chalk.red('❌ Error in connectToWhatsApp:'), error.message);
        console.log(chalk.yellow('🔄 Restarting in 10 seconds...'));
        setTimeout(connectToWhatsApp, 10000);
        return null;
    }
}

// Handle process events
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n🛑 Bot stopped by user (Ctrl+C)'));
    console.log(chalk.yellow('👋 Goodbye!'));
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
    console.log(chalk.cyan('╔══════════════════════════════════════╗'));
    console.log(chalk.cyan('║     🤖 TOKO DIGITAL BOT v3.0         ║'));
    console.log(chalk.cyan('║     📱 PAIRING CODE + ALL FEATURES   ║'));
    console.log(chalk.cyan('╚══════════════════════════════════════╝'));
    
    console.log(chalk.blue('\n📦 Features Included:'));
    console.log(chalk.blue('• Pairing Code Authentication'));
    console.log(chalk.blue('• Store with List Products'));
    console.log(chalk.blue('• Button & List Menu (3 garis)'));
    console.log(chalk.blue('• Group Features (Anti-link, Welcome)'));
    console.log(chalk.blue('• Admin System & Approval'));
    console.log(chalk.blue('• QRIS Payment & Donation'));
    console.log(chalk.blue('• Broadcast System'));
    console.log(chalk.blue('• Node.js ' + process.version));
    console.log('');
    
    try {
        await connectToWhatsApp();
    } catch (error) {
        console.error(chalk.red('❌ Fatal error:'), error.message);
        process.exit(1);
    }
}

// Start the bot
startBot();
