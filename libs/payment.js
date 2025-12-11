const fs = require('fs-extra');
const path = require('path');
const utils = require('./utils');

async function showPaymentOptions(sock, from, settings) {
    const paymentText = `💳 *METODE PEMBAYARAN*\n\n`
        + `Kami menerima pembayaran via:\n\n`
        + `1. *QRIS* (Semua e-wallet & bank)\n`
        + `   - Scan QR code untuk bayar\n`
        + `   - Support OVO, Dana, Gopay, dll\n\n`
        + `2. *Transfer Bank*\n`
        + `   - Bank: ${settings.payment?.bankName || 'Bank Liviaa'}\n`
        + `   - No. Rek: ${settings.payment?.bankAccount || '1234567890'}\n`
        + `   - Atas Nama: ${settings.payment?.accountName || 'LIVIAA STORE'}\n\n`
        + `📌 *INSTRUKSI:*\n`
        + `1. Transfer sesuai total order\n`
        + `2. Screenshot bukti transfer\n`
        + `3. Kirim ke owner untuk konfirmasi`;
    
    await sock.sendMessage(from, {
        text: paymentText,
        footer: 'Pilih metode pembayaran',
        buttons: [
            { buttonId: 'show_qris', buttonText: { displayText: '📱 QRIS' }, type: 1 },
            { buttonId: 'menu_owner', buttonText: { displayText: '👤 KONFIRMASI' }, type: 1 },
            { buttonId: 'menu_store', buttonText: { displayText: '🛍️ PRODUK' }, type: 1 }
        ]
    });
}

async function showQRIS(sock, from, settings) {
    try {
        const qrisPath = path.join(__dirname, '../assets/qris.png');
        
        if (await fs.pathExists(qrisPath)) {
            const image = await fs.readFile(qrisPath);
            
            await sock.sendMessage(from, {
                image: image,
                caption: `📱 *QRIS PEMBAYARAN*\n\n`
                    + `Scan QR code di atas untuk pembayaran via:\n`
                    + `• OVO\n• Dana\n• Gopay\n• LinkAja\n• Bank transfer\n\n`
                    + `📌 *CARA BAYAR:*\n`
                    + `1. Buka aplikasi e-wallet/bank\n`
                    + `2. Pilih scan QRIS\n`
                    + `3. Scan gambar di atas\n`
                    + `4. Input nominal sesuai order\n`
                    + `5. Konfirmasi pembayaran\n\n`
                    + `⚠️ *SETELAH BAYAR:*\n`
                    + `• Screenshot bukti transfer\n`
                    + `• Kirim ke owner untuk konfirmasi\n`
                    + `• Produk akan dikirim via chat`
            });
        } else {
            await sock.sendMessage(from, {
                text: `🏦 *TRANSFER BANK*\n\n`
                    + `Bank: ${settings.payment?.bankName || 'Bank Liviaa'}\n`
                    + `No. Rekening: ${settings.payment?.bankAccount || '1234567890'}\n`
                    + `Atas Nama: ${settings.payment?.accountName || 'LIVIAA STORE'}\n\n`
                    + `📌 *SETELAH TRANSFER:*\n`
                    + `1. Screenshot bukti transfer\n`
                    + `2. Kirim ke owner untuk konfirmasi\n`
                    + `3. Produk dikirim via chat`
            });
        }
        
    } catch (error) {
        console.error('Error showing QRIS:', error);
        await sock.sendMessage(from, {
            text: '❌ QRIS tidak tersedia. Silakan hubungi owner untuk info pembayaran.'
        });
    }
}

async function showDonation(sock, from, settings) {
    try {
        const qrisPath = path.join(__dirname, '../assets/qris.png');
        
        if (await fs.pathExists(qrisPath)) {
            const image = await fs.readFile(qrisPath);
            
            await sock.sendMessage(from, {
                image: image,
                caption: `❤️ *DONASI PENGEMBANGAN*\n\n`
                    + `Terima kasih atas niat baik Anda untuk berdonasi!\n\n`
                    + `💝 Donasi digunakan untuk:\n`
                    + `• Maintenance server bot\n`
                    + `• Pengembangan fitur baru\n`
                    + `• Biaya operasional\n\n`
                    + `📱 Scan QR code di atas untuk donasi via QRIS\n\n`
                    + `🙏 Terima kasih atas support Anda!`
            });
        } else {
            await sock.sendMessage(from, {
                text: `❤️ *DONASI VIA TRANSFER*\n\n`
                    + `Bank: ${settings.payment?.bankName || 'Bank Liviaa'}\n`
                    + `No. Rekening: ${settings.payment?.bankAccount || '1234567890'}\n`
                    + `Atas Nama: ${settings.payment?.accountName || 'LIVIAA STORE'}\n\n`
                    + `💝 Donasi digunakan untuk pengembangan bot.\n`
                    + `🙏 Terima kasih atas support Anda!`
            });
        }
        
    } catch (error) {
        console.error('Error showing donation:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal memuat QRIS donasi.'
        });
    }
}

module.exports = {
    showPaymentOptions,
    showQRIS,
    showDonation
};
