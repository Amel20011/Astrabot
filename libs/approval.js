const fs = require('fs-extra');
const path = require('path');

async function sendApproval(sock, orderId, orderData, settings) {
    try {
        const ownerJid = settings.whatsappNumber + '@s.whatsapp.net';
        
        await sock.sendMessage(ownerJid, {
            text: `📦 *ORDER BARU*\n\n` +
                  `🆔 ID: ${orderId}\n` +
                  `👤 Pembeli: ${orderData.buyer}\n` +
                  `📦 Produk: ${orderData.productName}\n` +
                  `💰 Total: Rp ${orderData.total.toLocaleString('id-ID')}\n\n` +
                  `⚠️ Menunggu approval owner.`
        });
        
    } catch (error) {
        console.error('Error sending approval:', error);
    }
}

module.exports = {
    sendApproval
};
