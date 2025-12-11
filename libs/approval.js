const fs = require('fs-extra');
const path = require('path');
const utils = require('./utils');

async function sendApprovalRequest(sock, buyerJid, orderId, orderData, settings) {
    try {
        const ownerNumber = settings.whatsappNumber || CONFIG.ownerNumber;
        const ownerJid = ownerNumber.includes('@s.whatsapp.net') ? ownerNumber : ownerNumber + '@s.whatsapp.net';
        
        const buyerNumber = buyerJid.split('@')[0];
        
        const approvalText = `📦 *ORDER BARU MENUNGGU PERSETUJUAN*\n\n`
            + `🆔 Order ID: ${orderId}\n`
            + `👤 Pembeli: ${buyerNumber}\n`
            + `📦 Produk: ${orderData.productName}\n`
            + `📊 Jumlah: ${orderData.quantity}\n`
            + `💰 Total: Rp ${orderData.total.toLocaleString('id-ID')}\n`
            + `⏰ Waktu: ${new Date(orderData.createdAt).toLocaleString('id-ID')}\n\n`
            + `📌 *TINDAKAN:*\n`
            + `Pilih tindakan untuk order ini:`;
        
        // Kirim ke owner dengan button approve/reject
        await sock.sendMessage(ownerJid, {
            text: approvalText,
            footer: 'Pilih tindakan untuk order ini',
            buttons: [
                { buttonId: `approve_${orderId}_${buyerJid}`, buttonText: { displayText: '✅ APPROVE' }, type: 1 },
                { buttonId: `reject_${orderId}_${buyerJid}`, buttonText: { displayText: '❌ TOLAK' }, type: 1 }
            ]
        });
        
        console.log(`📤 Approval request sent to owner for order ${orderId}`);
        
    } catch (error) {
        console.error('Error sending approval request:', error);
    }
}

async function handleApprovalResponse(sock, from, buttonId, settings) {
    try {
        const parts = buttonId.split('_');
        const action = parts[0]; // approve atau reject
        const orderId = parts[1];
        const buyerJid = parts.slice(2).join('_');
        
        // Load order
        const orders = await fs.readJson(path.join(__dirname, '../data/orders.json'));
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) {
            await sock.sendMessage(from, { text: '❌ Order tidak ditemukan.' });
            return;
        }
        
        const order = orders[orderIndex];
        const buyerNumber = buyerJid.split('@')[0];
        
        if (action === 'approve') {
            // Update order status
            orders[orderIndex].status = 'approved';
            orders[orderIndex].approvedAt = new Date().toISOString();
            orders[orderIndex].approvedBy = from.split('@')[0];
            
            await fs.writeJson(path.join(__dirname, '../data/orders.json'), orders, { spaces: 2 });
            
            // Kirim konfirmasi ke owner
            await sock.sendMessage(from, {
                text: `✅ *ORDER DISETUJUI*\n\n`
                    + `Order ID: ${orderId}\n`
                    + `Pembeli: ${buyerNumber}\n`
                    + `Produk: ${order.productName}\n`
                    + `Total: Rp ${order.total.toLocaleString('id-ID')}\n\n`
                    + `📌 Sekarang Anda bisa mengirim produk ke pembeli.`
            });
            
            // Kirim notifikasi ke buyer
            await sock.sendMessage(buyerJid, {
                text: `✅ *ORDER ANDA DISETUJUI!*\n\n`
                    + `Order ID: ${orderId}\n`
                    + `Produk: ${order.productName}\n`
                    + `Jumlah: ${order.quantity}\n`
                    + `Total: Rp ${order.total.toLocaleString('id-ID')}\n\n`
                    + `📌 *SELANJUTNYA:*\n`
                    + `1. Lakukan pembayaran via QRIS/Transfer\n`
                    + `2. Kirim bukti ke owner\n`
                    + `3. Produk akan dikirim via chat\n\n`
                    + `Terima kasih telah berbelanja! 🛍️`
            });
            
        } else if (action === 'reject') {
            // Update order status
            orders[orderIndex].status = 'rejected';
            orders[orderIndex].rejectedAt = new Date().toISOString();
            orders[orderIndex].rejectedBy = from.split('@')[0];
            
            // Kembalikan stock
            const products = await fs.readJson(path.join(__dirname, '../data/products.json'));
            const productIndex = products.findIndex(p => p.id === order.productId);
            if (productIndex !== -1) {
                products[productIndex].stock += order.quantity;
                await fs.writeJson(path.join(__dirname, '../data/products.json'), products, { spaces: 2 });
            }
            
            await fs.writeJson(path.join(__dirname, '../data/orders.json'), orders, { spaces: 2 });
            
            // Kirim konfirmasi ke owner
            await sock.sendMessage(from, {
                text: `❌ *ORDER DITOLAK*\n\n`
                    + `Order ID: ${orderId}\n`
                    + `Pembeli: ${buyerNumber}\n`
                    + `Produk: ${order.productName}\n\n`
                    + `📌 Stock telah dikembalikan ke sistem.`
            });
            
            // Kirim notifikasi ke buyer
            await sock.sendMessage(buyerJid, {
                text: `❌ *ORDER ANDA DITOLAK*\n\n`
                    + `Maaf, order Anda dengan ID ${orderId} untuk produk ${order.productName} telah ditolak.\n\n`
                    + `📌 *ALASAN MUNGKIN:*\n`
                    + `• Stok tidak tersedia\n`
                    + `• Pembayaran belum diterima\n`
                    + `• Atau alasan lainnya\n\n`
                    + `Silakan hubungi owner untuk informasi lebih lanjut.\n`
                    + `Terima kasih.`
            });
        }
        
        console.log(`📝 Order ${orderId} ${action === 'approve' ? 'approved' : 'rejected'} by ${from.split('@')[0]}`);
        
    } catch (error) {
        console.error('Error handling approval:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal memproses persetujuan.'
        });
    }
}

async function approveOrder(sock, from, orderId, settings) {
    try {
        const orders = await fs.readJson(path.join(__dirname, '../data/orders.json'));
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) {
            await sock.sendMessage(from, { text: '❌ Order tidak ditemukan.' });
            return;
        }
        
        const order = orders[orderIndex];
        const buyerJid = order.buyerJid || `${order.buyer}@s.whatsapp.net`;
        
        // Update order status
        orders[orderIndex].status = 'approved';
        orders[orderIndex].approvedAt = new Date().toISOString();
        orders[orderIndex].approvedBy = from.split('@')[0];
        
        await fs.writeJson(path.join(__dirname, '../data/orders.json'), orders, { spaces: 2 });
        
        // Kirim konfirmasi ke owner
        await sock.sendMessage(from, {
            text: `✅ *ORDER DISETUJUI*\n\n`
                + `Order ID: ${orderId}\n`
                + `Pembeli: ${order.buyer}\n`
                + `Produk: ${order.productName}\n`
                + `Total: Rp ${order.total.toLocaleString('id-ID')}`
        });
        
        // Kirim notifikasi ke buyer
        await sock.sendMessage(buyerJid, {
            text: `✅ *ORDER ANDA DISETUJUI!*\n\n`
                + `Order ID: ${orderId}\n`
                + `Produk: ${order.productName}\n`
                + `Jumlah: ${order.quantity}\n`
                + `Total: Rp ${order.total.toLocaleString('id-ID')}\n\n`
                + `📌 Silakan lakukan pembayaran dan kirim bukti ke owner.`
        });
        
    } catch (error) {
        console.error('Error approving order:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal menyetujui order.'
        });
    }
}

async function rejectOrder(sock, from, orderId, settings) {
    try {
        const orders = await fs.readJson(path.join(__dirname, '../data/orders.json'));
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) {
            await sock.sendMessage(from, { text: '❌ Order tidak ditemukan.' });
            return;
        }
        
        const order = orders[orderIndex];
        const buyerJid = order.buyerJid || `${order.buyer}@s.whatsapp.net`;
        
        // Update order status
        orders[orderIndex].status = 'rejected';
        orders[orderIndex].rejectedAt = new Date().toISOString();
        orders[orderIndex].rejectedBy = from.split('@')[0];
        
        // Kembalikan stock
        const products = await fs.readJson(path.join(__dirname, '../data/products.json'));
        const productIndex = products.findIndex(p => p.id === order.productId);
        if (productIndex !== -1) {
            products[productIndex].stock += order.quantity;
            await fs.writeJson(path.join(__dirname, '../data/products.json'), products, { spaces: 2 });
        }
        
        await fs.writeJson(path.join(__dirname, '../data/orders.json'), orders, { spaces: 2 });
        
        // Kirim konfirmasi ke owner
        await sock.sendMessage(from, {
            text: `❌ *ORDER DITOLAK*\n\n`
                + `Order ID: ${orderId}\n`
                + `Pembeli: ${order.buyer}\n`
                + `Produk: ${order.productName}\n\n`
                + `📌 Stock telah dikembalikan.`
        });
        
        // Kirim notifikasi ke buyer
        await sock.sendMessage(buyerJid, {
            text: `❌ *ORDER ANDA DITOLAK*\n\n`
                + `Maaf, order Anda dengan ID ${orderId} telah ditolak.\n\n`
                + `📌 *ALASAN:* Stok tidak tersedia atau alasan lainnya.\n\n`
                + `Silakan hubungi owner untuk info lebih lanjut.`
        });
        
    } catch (error) {
        console.error('Error rejecting order:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal menolak order.'
        });
    }
}

module.exports = {
    sendApprovalRequest,
    handleApprovalResponse,
    approveOrder,
    rejectOrder
};
