const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Import modules
const menu = require('./libs/menu');
const store = require('./libs/store');
const owner = require('./libs/owner');
const payment = require('./libs/payment');
const admin = require('./libs/admin');
const group = require('./libs/group');
const utils = require('./libs/utils');

// Config
const CONFIG = require('./config');

// Load settings
async function loadSettings() {
    try {
        const settings = await fs.readJson(path.join(__dirname, 'data', 'settings.json'));
        return settings;
    } catch (error) {
        console.error('Error loading settings:', error);
        return CONFIG;
    }
}

// Cek apakah admin
async function isAdmin(sender) {
    try {
        const admins = await fs.readJson(path.join(__dirname, 'data', 'admins.json'));
        const cleanSender = sender.replace(/\D/g, '');
        return admins.some(admin => admin.replace(/\D/g, '') === cleanSender);
    } catch (error) {
        return false;
    }
}

// Cek apakah owner
function isOwner(sender) {
    const cleanSender = sender.replace(/\D/g, '');
    const cleanOwner = CONFIG.ownerNumber.replace(/\D/g, '');
    return cleanSender === cleanOwner;
}

// Main message handler
async function messageHandler(sock, msg) {
    try {
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || from;
        const messageType = Object.keys(msg.message)[0];
        let text = '';
        let buttonId = '';

        // Extract message content
        if (messageType === 'conversation') {
            text = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            text = msg.message.extendedTextMessage.text;
        } else if (messageType === 'imageMessage') {
            text = msg.message.imageMessage.caption || '';
        } else if (messageType === 'buttonsResponseMessage') {
            buttonId = msg.message.buttonsResponseMessage.selectedButtonId;
            text = buttonId || '';
        } else if (messageType === 'listResponseMessage') {
            // Handle list response
            buttonId = msg.message.listResponseMessage.singleSelectReply?.selectedRowId || '';
            text = buttonId || '';
        } else {
            return; // Skip other message types
        }

        // Load settings
        const settings = await loadSettings();
        const prefix = settings.prefix || CONFIG.prefix;
        const isGroup = from.endsWith('@g.us');

        console.log(chalk.cyan(`📨 Message from ${sender}: ${text.substring(0, 50)}`));

        // Handle button responses
        if (buttonId) {
            console.log(chalk.yellow(`🔘 Button pressed: ${buttonId}`));
            
            switch (true) {
                case buttonId === 'menu_store':
                    await store.showProductsList(sock, from, settings);
                    return;
                    
                case buttonId === 'menu_owner':
                    await owner.sendOwnerContact(sock, from, settings);
                    return;
                    
                case buttonId === 'menu_payment':
                    await payment.showPaymentOptions(sock, from, settings);
                    return;
                    
                case buttonId === 'menu_donate':
                    await payment.showDonation(sock, from, settings);
                    return;
                    
                case buttonId === 'menu_cart':
                    await store.showCart(sock, from, settings);
                    return;
                    
                case buttonId === 'menu_status':
                    await store.showStoreStatus(sock, from, settings);
                    return;
                    
                case buttonId.startsWith('buy_'):
                    const productId = buttonId.split('_')[1];
                    await store.processOrder(sock, from, productId, 1, settings);
                    return;
                    
                case buttonId.startsWith('page_'):
                    const page = parseInt(buttonId.split('_')[1]);
                    await store.showProductsList(sock, from, settings, page);
                    return;
            }
        }

        // Auto reply untuk salam
        if (!text.startsWith(prefix) && !isGroup) {
            const textLower = text.toLowerCase();
            if (textLower.includes('halo') || textLower.includes('hai') || 
                textLower.includes('hi') || textLower === 'p' || textLower === 'menu') {
                await menu.showMainMenu(sock, from, settings);
                return;
            }
        }

        // Cek jika command dimulai dengan prefix
        if (!text.startsWith(prefix)) {
            return;
        }

        // Remove prefix dan parse command
        const args = text.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        console.log(chalk.cyan(`📨 Command: ${command} from ${sender}`));

        // Handle commands
        switch (command) {
            // Menu & Help
            case 'menu':
            case 'help':
            case 'start':
                await menu.showMainMenu(sock, from, settings);
                break;
                
            // Store commands
            case 'store':
            case 'produk':
            case 'list':
                await store.showProductsList(sock, from, settings);
                break;
                
            case 'beli':
            case 'buy':
            case 'order':
                if (args.length > 0) {
                    await store.processOrder(sock, from, args[0], args[1] || 1, settings);
                } else {
                    await utils.sendMessage(sock, from, {
                        text: `❌ Format: ${prefix}beli [id] [jumlah]\nContoh: ${prefix}beli 1 2`
                    });
                }
                break;
                
            case 'keranjang':
            case 'cart':
                await store.showCart(sock, from, settings);
                break;
                
            case 'checkout':
            case 'bayar':
                await payment.showPaymentOptions(sock, from, settings);
                break;
                
            // Payment & Donation
            case 'qris':
            case 'payment':
                await payment.showQRIS(sock, from, settings);
                break;
                
            case 'donasi':
            case 'donate':
                await payment.showDonation(sock, from, settings);
                break;
                
            // Owner & Info
            case 'owner':
            case 'admin':
            case 'kontak':
                await owner.sendOwnerContact(sock, from, settings);
                break;
                
            case 'status':
            case 'toko':
                await store.showStoreStatus(sock, from, settings);
                break;
                
            case 'info':
            case 'about':
                await utils.sendMessage(sock, from, {
                    text: `🤖 *BOT TOKO LIVIAA*\n\n` +
                          `Versi: 5.0\n` +
                          `Prefix: ${prefix}\n` +
                          `Owner: ${settings.ownerName}\n` +
                          `WA: ${settings.whatsappNumber}\n` +
                          `Support: 24 Jam`
                });
                break;
                
            // Admin commands
            default:
                const adminStatus = await isAdmin(sender) || isOwner(sender);
                if (adminStatus) {
                    await handleAdminCommand(sock, from, sender, command, args, settings);
                } else {
                    await utils.sendMessage(sock, from, {
                        text: `❌ Perintah tidak dikenali. Ketik *${prefix}menu* untuk menu.`
                    });
                }
                break;
        }

    } catch (error) {
        console.error(chalk.red('❌ Error in messageHandler:'), error);
    }
}

// Handle admin commands
async function handleAdminCommand(sock, from, sender, command, args, settings) {
    const prefix = settings.prefix || CONFIG.prefix;
    
    switch (command) {
        case 'setprefix':
            if (args[0]) {
                await admin.setPrefix(sock, from, args[0], settings);
            }
            break;
            
        case 'addadmin':
            if (args[0]) {
                await admin.addAdmin(sock, from, args[0], settings);
            }
            break;
            
        case 'antilink':
            if (from.endsWith('@g.us')) {
                const action = args[0];
                if (action === 'enable' || action === 'disable') {
                    await group.setAntiLink(sock, from, action === 'enable');
                }
            }
            break;
            
        case 'setwelcome':
            if (from.endsWith('@g.us')) {
                const type = args[0];
                const content = args.slice(1).join(' ');
                await group.setWelcome(sock, from, type, content, settings);
            }
            break;
            
        case 'orders':
            await admin.showOrders(sock, from, settings);
            break;
            
        case 'broadcast':
            const message = args.join(' ');
            if (message) {
                await admin.broadcast(sock, from, message, settings);
            }
            break;
            
        case 'settings':
            await admin.showSettings(sock, from, settings);
            break;
            
        default:
            await utils.sendMessage(sock, from, {
                text: `❌ Perintah admin tidak dikenal.\n\n` +
                      `Gunakan:\n` +
                      `• ${prefix}setprefix [karakter]\n` +
                      `• ${prefix}addadmin [nomor]\n` +
                      `• ${prefix}antilink enable/disable\n` +
                      `• ${prefix}setwelcome [text/video]\n` +
                      `• ${prefix}orders\n` +
                      `• ${prefix}broadcast [pesan]\n` +
                      `• ${prefix}settings`
            });
            break;
    }
}

module.exports = { messageHandler };
