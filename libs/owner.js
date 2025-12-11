const fs = require('fs-extra');
const path = require('path');

async function showOwnerInfo(sock, from) {
    try {
        const settings = await fs.readJson(path.join(__dirname, '../data/settings.json'));
        
        const ownerInfo = `
👤 *INFORMASI PEMILIK TOKO*

🏪 *Nama Toko:* ${settings.storeName}
👤 *Owner:* ${settings.ownerName}
📞 *WhatsApp:* ${settings.whatsappNumber}
📍 *Alamat:* ${settings.address}
⏰ *Jam Operasi:* ${settings.openingHours}

📞 *Hubungi Owner:*
https://wa.me/${settings.whatsappNumber.replace('+', '')}

📋 *Cara Order:*
1. Pilih produk dengan *!store*
2. Tambah ke keranjang dengan *!beli [id] [jumlah]*
3. Cek keranjang dengan *!keranjang*
4. Checkout dengan *!checkout*
5. Bayar dengan *!bayar*
6. Konfirmasi ke owner

*Terima kasih telah berbelanja!* 🛍️
        `;
        
        await sock.sendMessage(from, {
            text: ownerInfo,
            footer: 'Hubungi owner untuk pertanyaan lebih lanjut',
            buttons: [
                { buttonId: 'https://wa.me/' + settings.whatsappNumber.replace('+', ''), buttonText: { displayText: '📞 Chat Owner' }, type: 2 },
                { buttonId: '!store', buttonText: { displayText: '🏪 Lihat Produk' }, type: 1 }
            ]
        });
        
    } catch (error) {
        console.error('Error showing owner info:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal memuat info owner. Silakan hubungi admin langsung.'
        });
    }
}

module.exports = { showOwnerInfo };
