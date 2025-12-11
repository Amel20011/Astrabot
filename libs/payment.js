const fs = require('fs-extra');
const path = require('path');
const CONFIG = require('../config');

async function showPaymentOptions(sock, from) {
    const paymentText = `
💳 *METODE PEMBAYARAN*

Kami menerima pembayaran melalui:

1. *QRIS* (Semua e-wallet & bank)
   - Scan QR Code untuk pembayaran
   - Otomatis terdeteksi oleh aplikasi bank/e-wallet

2. *Transfer Bank*
   - Bank: ${CONFIG.payment.bankName}
   - No. Rek: ${CONFIG.payment.bankAccount}
   - Atas Nama: ${CONFIG.payment.accountName}

📌 *Instruksi:*
1. Lakukan pembayaran sesuai total
2. Setelah bayar, kirim bukti transfer ke owner
3. Pesanan akan segera diproses

Ketik *${CONFIG.prefix}bayar* untuk melihat QRIS
    `;
    
    await sock.sendMessage(from, {
        text: paymentText,
        footer: 'Pilih metode pembayaran',
        buttons: [
            { buttonId: `${CONFIG.prefix}bayar`, buttonText: { displayText: '📱 QRIS' }, type: 1 },
            { buttonId: `${CONFIG.prefix}owner`, buttonText: { displayText: '👤 Konfirmasi Bayar' }, type: 1 }
        ]
    });
}

async function showQRIS(sock, from) {
    try {
        const qrisPath = path.join(__dirname, '../assets/qris.png');
        
        // Cek apakah file QRIS ada
        if (await fs.pathExists(qrisPath)) {
            const image = await fs.readFile(qrisPath);
            
            await sock.sendMessage(from, {
                image: image,
                caption: `📱 *QRIS PEMBAYARAN*\n\nScan QR code di atas untuk pembayaran melalui semua e-wallet dan bank.\n\n*Cara Bayar:*\n1. Buka aplikasi bank/e-wallet\n2. Pilih scan/bayar\n3. Scan QR code ini\n4. Masukkan nominal sesuai total\n5. Konfirmasi pembayaran\n\nSetelah bayar, kirim bukti ke owner dengan ketik *${CONFIG.prefix}owner*`
            });
        } else {
            // Jika tidak ada QRIS, berikan info rekening
            await sock.sendMessage(from, {
                text: `🏦 *PEMBAYARAN TRANSFER*\n\nBank: ${CONFIG.payment.bankName}\nNo. Rekening: ${CONFIG.payment.bankAccount}\nAtas Nama: ${CONFIG.payment.accountName}\n\n*Catatan:* Setelah transfer, kirim bukti ke owner dengan ketik *${CONFIG.prefix}owner*`
            });
        }
        
    } catch (error) {
        console.error('Error showing QRIS:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal memuat QRIS. Silakan hubungi owner untuk info pembayaran.'
        });
    }
}

module.exports = { showPaymentOptions, showQRIS };
