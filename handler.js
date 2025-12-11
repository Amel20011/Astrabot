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

// Load config
const CONFIG = require('./config');

// Load settings
async function loadSettings() {
    try {
        return await fs.readJson(path.join(__dirname, 'data/settings.json'));
    } catch (error) {
        return CONFIG;
    }
}

// Check if admin
async function isAdmin(sender) {
    try {
        const admins = await fs.readJson(path.join(__dirname, 'data/admins.json'));
        const cleanSender = sender.replace(/\D/g, '');
        return admins.some(adminNum => adminNum.replace(/\D/g, '') === cleanSender);
    } catch (error) {
        return false;
    }
}

// Main handler
async function messageHandler(sock, msg) {
    try {
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || from;
        const messageType = Object.keys(msg.message)[0];
        let text = '';
        let buttonId = '';
        
        // Extract message
        if (messageType === 'conversation') {
            text = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            text = msg.message.extendedTextMessage.text;
        } else if (messageType === 'imageMessage') {
            text = msg.message.imageMessage.caption || '';
        } else if (messageType === 'buttonsResponseMessage') {
            buttonId = msg.message.buttonsResponseMessage.selectedButtonId;
            text = buttonId;
        } else if (messageType === 'listResponseMessage') {
            buttonId = msg.message.listResponseMessage.singleSelectReply?.selectedRowId || '';
            text = buttonId;
        } else {
            return;
        }
        
        // Load settings
        const settings = await loadSettings();
        const prefix = settings.prefix || CONFIG.prefix;
        const isGroup = from.endsWith('@g.us');
        
        console.log(chalk.cyan(`📨 ${sender}: ${text.substring(0, 50)}`));
        
        // Handle button responses
        if (buttonId) {
            console.log(chalk.yellow(`🔘 Button pressed: ${buttonId}`));
            
            switch (buttonId) {
                case 'menu_store':
                case 'store_menu':
                    await store.showProducts(sock, from, settings);
                    return;
                    
                case 'menu_owner':
                case 'owner_menu':
                    await owner.showOwnerInfo(sock, from, settings);
                    return;
                    
                case 'menu_payment':
                case 'payment_menu':
                    await payment.showPaymentOptions(sock, from, settings);
                    return;
                    
                case 'menu_donate':
                    await payment.showDonation(sock, from, settings);
                    return;
                    
                case 'menu_cart':
                    await store.showCart(sock, from, settings);
                    return;
                    
                case 'menu_status':
                    await store.showStoreStatus(sock, from, settings);
                    return;
                    
                case 'back_menu':
                    await menu.showMainMenu(sock, from, settings);
                    return;
                    
                case buttonId.startsWith('buy_') && buttonId:
                    const productId = buttonId.split('_')[1];
                    await store.buyProduct(sock, from, productId, 1, settings);
                    return;
                    
                case buttonId.startsWith('page_') && buttonId:
                    const page = parseInt(buttonId.split('_')[1]);
                    await store.showProducts(sock, from, settings, page);
                    return;
            }
        }
        
        // Auto reply untuk salam
        if (!text.startsWith(prefix) && !isGroup) {
            const textLower = text.toLowerCase();
            if (textLower.includes('halo') || textLower.includes('hai') || 
                textLower.includes('hi') || textLower === 'p') {
                await menu.showMainMenu(sock, from, settings);
                return;
            }
        }
        
        // Check if command starts with prefix
        if (!text.startsWith(prefix)) {
            return;
        }
        
        // Remove prefix and parse
        const args = text.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        
        console.log(chalk.cyan(`📨 Command: ${command}`));
        
        // Handle commands
        switch (command) {
            case 'menu':
            case 'help':
            case 'start':
                await menu.showMainMenu(sock, from, settings);
                break;
                
            case 'store':
            case 'produk':
            case 'list':
                await store.showProducts(sock, from, settings);
                break;
                
            case 'beli':
            case 'buy':
            case 'order':
                if (args.length > 0) {
                    await store.buyProduct(sock, from, args[0], args[1] || 1, settings);
                } else {
                    await store.showProducts(sock, from, settings);
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
                
            case 'qris':
            case 'payment':
                await payment.showQRIS(sock, from, settings);
                break;
                
            case 'donasi':
            case 'donate':
                await payment.showDonation(sock, from, settings);
                break;
                
            case 'owner':
            case 'admin':
            case 'kontak':
                await owner.showOwnerInfo(sock, from, settings);
                break;
                
            case 'status':
            case 'toko':
                await store.showStoreStatus(sock, from, settings);
                break;
                
            case 'info':
            case 'about':
                await sock.sendMessage(from, {
                    text: `🤖 *BOT TOKO LIVIAA*\n\n` +
                          `Versi: 6.0\n` +
                          `Prefix: ${prefix}\n` +
                          `Owner: ${settings.ownerName}\n` +
                          `WA: ${settings.whatsappNumber}\n` +
                          `Support: 24 Jam\n\n` +
                          `📱 Fitur:\n` +
                          `• Button & List Menu\n` +
                          `• Store Produk\n` +
                          `• QRIS Payment\n` +
                          `• Owner Contact\n` +
                          `• Group Features`
                });
                break;
                
            default:
                // Admin commands
                const adminStatus = await isAdmin(sender);
                if (adminStatus) {
                    await handleAdminCommand(sock, from, command, args, settings);
                } else {
                    await sock.sendMessage(from, {
                        text: `❌ Perintah tidak dikenal\n\n` +
                              `Ketik *${prefix}menu* untuk menu utama`
                    });
                }
                break;
        }
        
    } catch (error) {
        console.error(chalk.red('❌ Handler error:'), error);
    }
}

// Handle admin commands
async function handleAdminCommand(sock, from, command, args, settings) {
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
            await sock.sendMessage(from, {
                text: `❌ Perintah admin tidak dikenal\n\n` +
                      `📋 Admin Commands:\n` +
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
