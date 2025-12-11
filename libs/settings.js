const fs = require('fs-extra');
const path = require('path');

async function showSettings(sock, from) {
    try {
        const settings = await fs.readJson(path.join(__dirname, '../data/settings.json'));
        
        const settingsText = `
⚙️ *PENGATURAN TOKO* (Owner Only)

📝 *Informasi Toko:*
• Nama Toko: ${settings.storeName}
• Nama Owner: ${settings.ownerName}
• WhatsApp: ${settings.whatsappNumber}
• Alamat: ${settings.address}
• Jam Buka: ${settings.openingHours}
• Status: ${settings.isOpen ? '🟢 BUKA' : '🔴 TUTUP'}

🛠️ *Perintah Admin:*
• Edit settings.json untuk mengubah data
• Tambah produk di data/products.json
• QRIS di assets/qris.png

📁 *Struktur Data:*
• data/products.json - Data produk
• data/settings.json - Pengaturan toko
• assets/ - Gambar & QRIS
        `;
        
        await sock.sendMessage(from, {
            text: settingsText,
            footer: 'Edit file secara manual untuk mengubah pengaturan'
        });
        
    } catch (error) {
        console.error('Error showing settings:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal memuat pengaturan.'
        });
    }
}

module.exports = { showSettings };
