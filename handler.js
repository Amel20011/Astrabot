const fs = require('fs-extra');
const path = require('path');
const CONFIG = require('./config');

// Import modules
const menu = require('./libs/menu');
const store = require('./libs/store');
const owner = require('./libs/owner');
const payment = require('./libs/payment');
const settings = require('./libs/settings');

async function messageHandler(sock, msg) {
    try {
        const from = msg.key.remoteJid;
        const messageType = Object.keys(msg.message)[0];
        let text = '';
        
        // Extract text message
        if (messageType === 'conversation') {
            text = msg.message.conversation.toLowerCase();
        } else if (messageType === 'extendedTextMessage') {
            text = msg.message.extendedTextMessage.text.toLowerCase();
        } else {
            return; // Skip non-text messages
        }
        
        // Check if message starts with prefix
        if (!text.startsWith(CONFIG.prefix)) {
            // Auto reply untuk pesan pertama
            if (text.includes('halo') || text.includes('hai') || text.includes('hi')) {
                await sock.sendMessage(from, {
                    text: `👋 Halo! Selamat datang di *${CONFIG.storeName || 'Toko Online'}*!\n\nKetik *${CONFIG.prefix}menu* untuk melihat daftar menu.`
                });
            }
            return;
        }
        
        // Remove prefix and split command
        const args = text.slice(CONFIG.prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        
        console.log(`Command: ${command} dari ${from}`);
        
        // Handle commands
        switch (command) {
            case 'menu':
            case 'help':
                await menu.showMenu(sock, from);
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
                    text: `🏪 *Status Toko*\n\nToko: ${CONFIG.storeName || 'Toko Online'}\nStatus: ${CONFIG.isOpen ? '🟢 BUKA' : '🔴 TUTUP'}\nJam Operasi: ${CONFIG.openingHours || '09:00-21:00'}`
                });
                break;
                
            case 'info':
                await sock.sendMessage(from, {
                    text: `📱 *BOT TOKO ONLINE*\n\nVersi: 1.0.0\nDibuat dengan: @whiskeysockets/baileys\n\nKetik *${CONFIG.prefix}menu* untuk melihat semua perintah.`
                });
                break;
                
            default:
                await sock.sendMessage(from, {
                    text: `❌ Perintah tidak dikenali. Ketik *${CONFIG.prefix}menu* untuk melihat daftar perintah.`
                });
        }
        
    } catch (error) {
        console.error('Error handling message:', error);
    }
}

module.exports = { messageHandler };
