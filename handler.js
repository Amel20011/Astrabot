const fs = require('fs-extra');
const path = require('path');

// Import modules
const menu = require('./libs/menu');
const store = require('./libs/store');
const owner = require('./libs/owner');
const payment = require('./libs/payment');
const settings = require('./libs/settings');

// Load config
const CONFIG = require('./config');

async function loadSettings() {
    try {
        const settings = await fs.readJson(path.join(__dirname, 'data', 'settings.json'));
        return settings;
    } catch (error) {
        console.error('Error loading settings:', error);
        return {
            storeName: CONFIG.storeName,
            isOpen: CONFIG.isOpen,
            openingHours: CONFIG.openingHours
        };
    }
}

async function messageHandler(sock, msg) {
    try {
        const from = msg.key.remoteJid;
        const messageType = Object.keys(msg.message)[0];
        let text = '';
        
        // Extract text message
        if (messageType === 'conversation') {
            text = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            text = msg.message.extendedTextMessage.text;
        } else {
            return;
        }
        
        // Convert to lowercase for command checking
        const textLower = text.toLowerCase();
        
        // Load current settings
        const currentSettings = await loadSettings();
        
        // Auto reply untuk pesan pertama
        if (!textLower.startsWith(CONFIG.prefix)) {
            if (textLower.includes('halo') || textLower.includes('hai') || textLower.includes('hi')) {
                await sock.sendMessage(from, {
                    text: `👋 Halo! Selamat datang di *${currentSettings.storeName || 'Toko Online'}*!\n\nToko saat ini: ${currentSettings.isOpen ? '🟢 BUKA' : '🔴 TUTUP'}\nJam: ${currentSettings.openingHours || '09:00-21:00'}\n\nKetik *${CONFIG.prefix}menu* untuk melihat daftar menu.`
                });
            }
            return;
        }
        
        // Remove prefix and split command
        const args = text.slice(CONFIG.prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        
        console.log(`📨 Command: ${command} dari ${from}`);
        
        // Handle commands
        switch (command) {
            case 'menu':
            case 'help':
                await menu.showMenu(sock, from, currentSettings);
                break;
                
            case 'store':
            case 'toko':
            case 'produk':
                await store.showProducts(sock, from);
                break;
                
            case 'beli':
            case 'order':
                if (args.length > 0) {
                    await store.processOrder(sock, from, args[0], args[1] || 1);
                } else {
                    await sock.sendMessage(from, {
                        text: '❌ Format: !beli [id_produk] [jumlah]\nContoh: !beli 1 2'
                    });
                }
                break;
                
            case 'keranjang':
            case 'cart':
                await store.showCart(sock, from);
                break;
                
            case 'checkout':
                await payment.showPaymentOptions(sock, from);
                break;
                
            case 'bayar':
            case 'payment':
                await payment.showQRIS(sock, from);
                break;
                
            case 'owner':
            case 'admin':
                await owner.showOwnerInfo(sock, from);
                break;
                
            case 'setting':
            case 'pengaturan':
                // Cek apakah pengirim adalah owner
                if (from.includes(CONFIG.ownerNumber.replace('+', ''))) {
                    await settings.showSettings(sock, from);
                } else {
                    await sock.sendMessage(from, {
                        text: '⚠️ Maaf, hanya owner yang bisa mengakses pengaturan.'
                    });
                }
                break;
                
            case 'status':
                await sock.sendMessage(from, {
                    text: `🏪 *Status Toko*\n\nToko: ${currentSettings.storeName || 'Toko Online'}\nStatus: ${currentSettings.isOpen ? '🟢 BUKA' : '🔴 TUTUP'}\nJam Operasi: ${currentSettings.openingHours || '09:00-21:00'}\nAlamat: ${currentSettings.address || '-'}`
                });
                break;
                
            case 'info':
                await sock.sendMessage(from, {
                    text: `📱 *BOT TOKO ONLINE*\n\nVersi: 1.0.0\nDibuat dengan: @whiskeysockets/baileys (modified)\nPrefix: ${CONFIG.prefix}\n\nKetik *${CONFIG.prefix}menu* untuk melihat semua perintah.`
                });
                break;
                
            default:
                await sock.sendMessage(from, {
                    text: `❌ Perintah tidak dikenali. Ketik *${CONFIG.prefix}menu* untuk melihat daftar perintah.`
                });
        }
        
    } catch (error) {
        console.error('❌ Error handling message:', error);
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Terjadi kesalahan saat memproses pesan. Silakan coba lagi nanti.'
            });
        } catch (e) {
            console.error('❌ Gagal mengirim pesan error:', e);
        }
    }
}

module.exports = { messageHandler };
