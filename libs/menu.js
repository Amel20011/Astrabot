const fs = require('fs-extra');
const path = require('path');
const CONFIG = require('../config');

async function showMenu(sock, from) {
    const menuText = `
🎪 *MENU TOKO ONLINE* 🎪

🏪 *TOKO*
• ${CONFIG.prefix}store - Lihat produk yang dijual
• ${CONFIG.prefix}beli [id] [jumlah] - Beli produk
• ${CONFIG.prefix}keranjang - Lihat keranjang belanja
• ${CONFIG.prefix}checkout - Checkout pesanan
• ${CONFIG.prefix}status - Cek status toko

💳 *PEMBAYARAN*
• ${CONFIG.prefix}bayar - Tampilkan QRIS pembayaran
• ${CONFIG.prefix}payment - Info pembayaran

👤 *LAINNYA*
• ${CONFIG.prefix}owner - Hubungi owner
• ${CONFIG.prefix}info - Info bot
${from.includes(CONFIG.ownerNumber.replace('+', '')) ? `• ${CONFIG.prefix}setting - Pengaturan (Owner Only)` : ''}

📌 *Contoh Penggunaan:*
${CONFIG.prefix}beli 1 2
${CONFIG.prefix}store
    `;
    
    await sock.sendMessage(from, {
        text: menuText,
        footer: 'Bot Toko Online © 2024',
        buttons: [
            { buttonId: `${CONFIG.prefix}store`, buttonText: { displayText: '🏪 Lihat Produk' }, type: 1 },
            { buttonId: `${CONFIG.prefix}owner`, buttonText: { displayText: '👤 Hubungi Owner' }, type: 1 },
            { buttonId: `${CONFIG.prefix}payment`, buttonText: { displayText: '💳 Cara Bayar' }, type: 1 }
        ],
        headerType: 1
    });
}

module.exports = { showMenu };
