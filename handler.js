const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Import semua modules
const menu = require('./libs/menu');
const store = require('./libs/store');
const owner = require('./libs/owner');
const payment = require('./libs/payment');
const admin = require('./libs/admin');
const group = require('./libs/group');
const approval = require('./libs/approval');
const utils = require('./libs/utils');

// Config
const CONFIG = require('./config');

// Load settings
async function loadSettings() {
    try {
        return await fs.readJson(path.join(__dirname, 'data/settings.json'));
    } catch (error) {
        console.error('Error loading settings:', error);
        return CONFIG;
    }
}

// Cek apakah admin
async function isAdmin(senderId) {
    try {
        const admins = await fs.readJson(path.join(__dirname, 'data/admins.json'));
        const cleanSender = senderId.replace(/\D/g, '');
        return admins.some(admin => admin.replace(/\D/g, '') === cleanSender);
    } catch (error) {
        return false;
    }
}

// Cek apakah owner
function isOwner(senderId) {
    const cleanSender = senderId.replace(/\D/g, '');
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
        let isButton = false;

        // Extract message content
        if (messageType === 'conversation') {
            text = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            text = msg.message.extendedTextMessage.text;
        } else if (messageType === 'imageMessage') {
            text = msg.message.imageMessage.caption || '';
        } else if (messageType === 'videoMessage') {
            text = msg.message.videoMessage.caption || '';
        } else if (messageType === 'buttonsResponseMessage') {
            buttonId = msg.message.buttonsResponseMessage.selectedButtonId;
            text = buttonId;
            isButton = true;
        } else if (messageType === 'listResponseMessage') {
            // Handle list response (3 garis menu)
            const selected = msg.message.listResponseMessage;
            if (selected.singleSelectReply.selectedRowId) {
                buttonId = selected.singleSelectReply.selectedRowId;
                text = buttonId;
                isButton = true;
            }
        } else {
            return; // Skip other message types
        }

        // Load settings
        const settings = await loadSettings();
        const prefix = settings.prefix || CONFIG.prefix;
        const isGroup = from.endsWith('@g.us');

        // ==================== HANDLE BUTTON/LIST RESPONSES ====================
        if (isButton && buttonId) {
            console.log(chalk.cyan(`🔘 Button/List pressed: ${buttonId} from ${sender}`));
            
            // Handle berdasarkan buttonId
            switch (buttonId) {
                // Store buttons
                case 'store_products':
                case 'lihat_produk':
                    await store.showProductsList(sock, from, settings);
                    return;
                
                case 'beli_1': case 'beli_2': case 'beli_3': case 'beli_4': case 'beli_5':
                case 'beli_6': case 'beli_7': case 'beli_8': case 'beli_9': case 'beli_10':
                    const productId = buttonId.split('_')[1];
                    await store.showProductPayment(sock, from, productId, settings);
                    return;
                
                // Owner buttons
                case 'contact_owner':
                case 'hubungi_owner':
                    await owner.sendOwnerContact(sock, from, settings);
                    return;
                
                // Payment buttons
                case 'payment_qris':
                case 'bayar_qris':
                    await payment.showPaymentQRIS(sock, from, settings);
                    return;
                
                case 'donasi_button':
                case 'donasi':
                    await payment.showDonationQRIS(sock, from, settings);
                    return;
                
                // Navigation buttons
                case 'back_menu':
                case 'kembali_menu':
                    await menu.showMainMenu(sock, from, settings);
                    return;
                
                case 'cart_view':
                case 'lihat_keranjang':
                    await store.showCart(sock, from, settings);
                    return;
                
                // Admin approval buttons
                case buttonId.match(/^approve_/)?.input:
                case buttonId.match(/^reject_/)?.input:
                    await approval.handleApprovalResponse(sock, from, buttonId, settings);
                    return;
                
                // List menu responses (format: menu_[action])
                case buttonId.match(/^menu_/)?.input:
                    const action = buttonId.split('_')[1];
                    await handleListMenu(sock, from, action, settings);
                    return;
                
                default:
                    // Coba parse sebagai command
                    if (buttonId.startsWith(prefix)) {
                        text = buttonId;
                        isButton = false;
                    } else {
                        await utils.sendMessage(sock, from, {
                            text: '❌ Aksi tidak dikenali. Ketik !menu untuk melihat menu.'
                        });
                        return;
                    }
            }
        }

        // ==================== HANDLE TEXT COMMANDS ====================
        // Auto reply untuk salam
        if (!isButton && !text.startsWith(prefix) && !isGroup) {
            const textLower = text.toLowerCase();
            if (textLower.includes('halo') || textLower.includes('hai') || textLower.includes('hi') || textLower.includes('p')) {
                await menu.showMainMenu(sock, from, settings);
                return;
            }
        }

        // Cek jika command dimulai dengan prefix
        if (!isButton && !text.startsWith(prefix)) {
            return;
        }

        // Remove prefix dan parse command
        const cleanText = isButton ? text : text.startsWith(prefix) ? text.slice(prefix.length) : text;
        const args = cleanText.trim().split(/ +/);
        const command = args.shift().toLowerCase();

        console.log(chalk.cyan(`📨 Command: ${command} from ${sender}`));

        // ==================== PUBLIC COMMANDS ====================
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
                    await store.showProductsList(sock, from, settings);
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
                await payment.showPaymentQRIS(sock, from, settings);
                break;
            
            case 'donasi':
            case 'donate':
                await payment.showDonationQRIS(sock, from, settings);
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
                    text: `🤖 *BOT TOKO DIGITAL v3.0*\n\n` +
                          `📱 Fitur Lengkap:\n` +
                          `• Store dengan List Produk\n` +
                          `• Button & Menu 3 Garis\n` +
                          `• Sistem Approval Owner\n` +
                          `• Anti-link Group\n` +
                          `• Welcome Video\n` +
                          `• QRIS Payment\n` +
                          `• Donasi\n\n` +
                          `Prefix: ${prefix}\n` +
                          `Owner: ${settings.ownerName}\n` +
                          `Support 24 Jam`
                });
                break;
            
            // ==================== ADMIN/OWNER COMMANDS ====================
            default:
                const adminStatus = await isAdmin(sender);
                const ownerStatus = isOwner(sender);
                
                if (adminStatus || ownerStatus) {
                    await handleAdminCommands(sock, from, command, args, settings, { adminStatus, ownerStatus });
                } else {
                    await utils.sendMessage(sock, from, {
                        text: `❌ Perintah tidak dikenali. Ketik *${prefix}menu* untuk menu utama.`
                    });
                }
                break;
        }

    } catch (error) {
        console.error(chalk.red('❌ Error in messageHandler:'), error);
        try {
            const from = msg.key.remoteJid;
            await utils.sendMessage(sock, from, {
                text: '❌ Terjadi kesalahan. Silakan coba lagi nanti.'
            });
        } catch (e) {
            console.error('Failed to send error message:', e);
        }
    }
}

// Handle list menu responses
async function handleListMenu(sock, from, action, settings) {
    switch (action) {
        case 'store':
            await store.showProductsList(sock, from, settings);
            break;
        case 'payment':
            await payment.showPaymentOptions(sock, from, settings);
            break;
        case 'owner':
            await owner.sendOwnerContact(sock, from, settings);
            break;
        case 'cart':
            await store.showCart(sock, from, settings);
            break;
        case 'status':
            await store.showStoreStatus(sock, from, settings);
            break;
        case 'donasi':
            await payment.showDonationQRIS(sock, from, settings);
            break;
        default:
            await menu.showMainMenu(sock, from, settings);
    }
}

// Handle admin commands
async function handleAdminCommands(sock, from, command, args, settings, { adminStatus, ownerStatus }) {
    const prefix = settings.prefix || CONFIG.prefix;
    
    switch (command) {
        // Prefix settings
        case 'setprefix':
            if (args[0] && args[0].length === 1) {
                await admin.setPrefix(sock, from, args[0], settings);
            } else {
                await utils.sendMessage(sock, from, {
                    text: '❌ Format: !setprefix [karakter]\nContoh: !setprefix .'
                });
            }
            break;
        
        // Admin management
        case 'addadmin':
            if (args[0]) {
                await admin.addAdmin(sock, from, args[0], settings);
            } else {
                await utils.sendMessage(sock, from, {
                    text: '❌ Format: !addadmin [nomor]\nContoh: !addadmin 6281234567890'
                });
            }
            break;
        
        case 'removeadmin':
            if (args[0]) {
                await admin.removeAdmin(sock, from, args[0], settings);
            }
            break;
        
        case 'listadmin':
            await admin.listAdmins(sock, from, settings);
            break;
        
        // Group settings (hanya untuk grup)
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
                await group.setWelcomeMessage(sock, from, type, content, settings);
            }
            break;
        
        // Product management
        case 'addproduct':
            await admin.addProduct(sock, from, args, settings);
            break;
        
        case 'editproduct':
            await admin.editProduct(sock, from, args, settings);
            break;
        
        case 'deleteproduct':
            if (args[0]) {
                await admin.deleteProduct(sock, from, args[0], settings);
            }
            break;
        
        // Order management
        case 'orders':
            await admin.showOrders(sock, from, settings);
            break;
        
        case 'approve':
            if (args[0]) {
                await approval.approveOrder(sock, from, args[0], settings);
            }
            break;
        
        case 'reject':
            if (args[0]) {
                await approval.rejectOrder(sock, from, args[0], settings);
            }
            break;
        
        // Broadcast
        case 'broadcast':
            const message = args.join(' ');
            if (message) {
                await admin.broadcastMessage(sock, from, message, settings);
            }
            break;
        
        // Settings
        case 'settings':
        case 'pengaturan':
            await admin.showSettings(sock, from, settings);
            break;
        
        default:
            await utils.sendMessage(sock, from, {
                text: `❌ Perintah admin tidak dikenali.\n\n` +
                      `📋 *Admin Commands:*\n` +
                      `• ${prefix}setprefix [karakter]\n` +
                      `• ${prefix}addadmin [nomor]\n` +
                      `• ${prefix}antilink enable/disable\n` +
                      `• ${prefix}setwelcome [teks/video]\n` +
                      `• ${prefix}orders\n` +
                      `• ${prefix}broadcast [pesan]\n` +
                      `• ${prefix}settings`
            });
            break;
    }
}

// Group handler (export sebagai object)
const groupHandler = {
    handleGroupMessage: require('./libs/group').handleGroupMessage,
    handleParticipantsUpdate: require('./libs/group').handleParticipantsUpdate
};

module.exports = { messageHandler, groupHandler };
