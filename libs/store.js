const fs = require('fs-extra');
const path = require('path');
const utils = require('./utils');
const approval = require('./approval');

async function showProductsList(sock, from, settings) {
    try {
        const prefix = settings.prefix || '!';
        const products = await fs.readJson(path.join(__dirname, '../data/products.json'));
        
        if (products.length === 0) {
            await utils.sendMessage(sock, from, {
                text: '📭 *BELUM ADA PRODUK*\n\nMaaf, belum ada produk yang tersedia saat ini.'
            });
            return;
        }
        
        // Format list produk
        let productList = `🛍️ *LIST PRODUK TOKO DIGITAL*\n\n`;
        
        products.forEach((product, index) => {
            const stockStatus = product.stock > 0 ? `✅ (${product.stock})` : '❌ HABIS';
            productList += `[${product.id}]. ${product.name} ${stockStatus}\n`;
            productList += `   💰 Rp ${product.price.toLocaleString('id-ID')}\n`;
            productList += `   📝 ${product.description}\n`;
            if (index < products.length - 1) {
                productList += `   ─────────────────\n`;
            }
        });
        
        productList += `\n📌 *CARA ORDER:*\n`;
        productList += `1. Pilih nomor produk (1-${products.length})\n`;
        productList += `2. Ketik: ${prefix}beli [nomor]\n`;
        productList += `3. Contoh: ${prefix}beli 1\n\n`;
        productList += `⚠️ *CATATAN:*\n`;
        productList += `• Stok real-time\n`;
        productList += `• Produk digital instant\n`;
        productList += `• Support 24 jam`;
        
        try {
            // Coba gunakan list message
            const sections = [{
                title: `🛍️ PRODUK (${products.length} items)`,
                rows: products.map(product => ({
                    title: `${product.name} - Rp ${product.price.toLocaleString('id-ID')}`,
                    rowId: `${prefix}beli ${product.id} 1`,
                    description: product.stock > 0 ? `Stok: ${product.stock}` : 'HABIS'
                }))
            }];
            
            sections.push({
                title: "📋 NAVIGASI",
                rows: [
                    { title: "🔙 Kembali ke Menu", rowId: `${prefix}menu`, description: "Kembali ke menu utama" },
                    { title: "🛒 Lihat Keranjang", rowId: `${prefix}keranjang`, description: "Lihat keranjang belanja" }
                ]
            });
            
            await sock.sendMessage(from, {
                text: `Pilih produk yang ingin dibeli:`,
                footer: `Total ${products.length} produk tersedia`,
                title: "🛍️ DAFTAR PRODUK",
                buttonText: "📋 PILIH PRODUK",
                sections: sections
            });
            
        } catch (error) {
            console.log('⚠️ List not supported, using buttons');
            
            // Fallback ke buttons (maks 3 button per baris)
            const buttons = [];
            products.slice(0, 9).forEach((product, index) => {
                if (index < 3) {
                    buttons.push({
                        buttonId: `beli_${product.id}`,
                        buttonText: { displayText: `🛒 ${index + 1}` },
                        type: 1
                    });
                }
            });
            
            // Tambahkan navigasi
            if (buttons.length < 3) {
                buttons.push(
                    { buttonId: 'back_menu', buttonText: { displayText: '🔙 KEMBALI' }, type: 1 },
                    { buttonId: 'cart_view', buttonText: { displayText: '🛒 KERANJANG' }, type: 1 }
                );
            }
            
            await sock.sendMessage(from, {
                text: productList,
                footer: 'Pilih nomor produk atau ketik !beli [nomor]',
                buttons: buttons
            });
        }
        
    } catch (error) {
        console.error('Error showing products:', error);
        await utils.sendMessage(sock, from, {
            text: '❌ Gagal memuat daftar produk. Silakan coba lagi.'
        });
    }
}

async function showProductPayment(sock, from, productId, settings) {
    try {
        const prefix = settings.prefix || '!';
        const products = await fs.readJson(path.join(__dirname, '../data/products.json'));
        const product = products.find(p => p.id == productId);
        
        if (!product) {
            await utils.sendMessage(sock, from, {
                text: '❌ Produk tidak ditemukan.'
            });
            return;
        }
        
        if (product.stock <= 0) {
            await utils.sendMessage(sock, from, {
                text: `❌ Maaf, stok ${product.name} habis.`
            });
            return;
        }
        
        const paymentText = `💰 *PEMBAYARAN ${product.name}*\n\n`
            + `📦 Produk: ${product.name}\n`
            + `📝 Deskripsi: ${product.description}\n`
            + `💳 Harga: Rp ${product.price.toLocaleString('id-ID')}\n`
            + `📊 Stok: ${product.stock}\n\n`
            + `📌 *CARA BAYAR:*\n`
            + `1. Transfer via QRIS/Transfer\n`
            + `2. Setelah bayar, kirim bukti\n`
            + `3. Produk akan dikirim via chat\n\n`
            + `⚠️ *PERHATIAN:*\n`
            + `• Harap screenshot bukti transfer\n`
            + `• Chat owner untuk konfirmasi\n`
            + `• Support 24 jam`;
        
        await sock.sendMessage(from, {
            text: paymentText,
            footer: 'Lanjutkan pembayaran',
            buttons: [
                { buttonId: 'payment_qris', buttonText: { displayText: '📱 BAYAR QRIS' }, type: 1 },
                { buttonId: 'contact_owner', buttonText: { displayText: '👤 KONFIRMASI' }, type: 1 },
                { buttonId: 'back_menu', buttonText: { displayText: '🔙 KEMBALI' }, type: 1 }
            ]
        });
        
    } catch (error) {
        console.error('Error showing payment:', error);
        await utils.sendMessage(sock, from, {
            text: '❌ Gagal memuat info pembayaran.'
        });
    }
}

async function processOrder(sock, from, productId, quantity = 1, settings) {
    try {
        const prefix = settings.prefix || '!';
        const products = await fs.readJson(path.join(__dirname, '../data/products.json'));
        const product = products.find(p => p.id == productId);
        
        if (!product) {
            await utils.sendMessage(sock, from, {
                text: '❌ Produk tidak ditemukan.'
            });
            return;
        }
        
        if (product.stock < quantity) {
            await utils.sendMessage(sock, from, {
                text: `❌ Stok tidak mencukupi. Stok tersedia: ${product.stock}`
            });
            return;
        }
        
        // Simpan order
        const orders = await fs.readJson(path.join(__dirname, '../data/orders.json'));
        const orderId = 'ORD' + Date.now();
        const buyerNumber = from.split('@')[0];
        
        const newOrder = {
            id: orderId,
            buyer: buyerNumber,
            buyerJid: from,
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            price: product.price,
            total: product.price * quantity,
            status: 'pending',
            createdAt: new Date().toISOString(),
            paymentMethod: 'pending'
        };
        
        orders.push(newOrder);
        await fs.writeJson(path.join(__dirname, '../data/orders.json'), orders, { spaces: 2 });
        
        // Update stock
        product.stock -= quantity;
        await fs.writeJson(path.join(__dirname, '../data/products.json'), products, { spaces: 2 });
        
        // Kirim konfirmasi ke buyer
        await sock.sendMessage(from, {
            text: `✅ *ORDER DITERIMA!*\n\n`
                + `📋 Order ID: ${orderId}\n`
                + `📦 Produk: ${product.name}\n`
                + `📊 Jumlah: ${quantity}\n`
                + `💰 Total: Rp ${(product.price * quantity).toLocaleString('id-ID')}\n\n`
                + `📌 *LANGKAH SELANJUTNYA:*\n`
                + `1. Bayar via QRIS/Transfer\n`
                + `2. Kirim bukti ke owner\n`
                + `3. Tunggu konfirmasi\n\n`
                + `Owner akan menghubungi Anda untuk pengiriman produk.`
        });
        
        // Kirim permintaan persetujuan ke owner
        await approval.sendApprovalRequest(sock, from, orderId, newOrder, settings);
        
    } catch (error) {
        console.error('Error processing order:', error);
        await utils.sendMessage(sock, from, {
            text: '❌ Gagal memproses order. Silakan coba lagi.'
        });
    }
}

async function showCart(sock, from, settings) {
    try {
        const prefix = settings.prefix || '!';
        const orders = await fs.readJson(path.join(__dirname, '../data/orders.json'));
        const buyerNumber = from.split('@')[0];
        const userOrders = orders.filter(order => order.buyer === buyerNumber && order.status === 'pending');
        
        if (userOrders.length === 0) {
            await utils.sendMessage(sock, from, {
                text: '🛒 *KERANJANG KOSONG*\n\nBelum ada order yang aktif. Silakan pilih produk dari menu.'
            });
            return;
        }
        
        let cartText = '🛒 *ORDER ANDA*\n\n';
        let totalAll = 0;
        
        userOrders.forEach(order => {
            cartText += `📦 *${order.productName}*\n`;
            cartText += `   Jumlah: ${order.quantity}\n`;
            cartText += `   Total: Rp ${order.total.toLocaleString('id-ID')}\n`;
            cartText += `   Status: ${order.status.toUpperCase()}\n`;
            cartText += `   ─────────────────\n`;
            totalAll += order.total;
        });
        
        cartText += `\n💰 *TOTAL SEMUA: Rp ${totalAll.toLocaleString('id-ID')}*\n\n`;
        cartText += `📌 *CATATAN:*\n`;
        cartText += `• Bayar via QRIS/Transfer\n`;
        cartText += `• Kirim bukti ke owner\n`;
        cartText += `• Produk dikirim via chat`;
        
        await sock.sendMessage(from, {
            text: cartText,
            footer: 'Lakukan pembayaran untuk melanjutkan',
            buttons: [
                { buttonId: 'payment_qris', buttonText: { displayText: '💳 BAYAR SEKARANG' }, type: 1 },
                { buttonId: 'contact_owner', buttonText: { displayText: '👤 CHAT OWNER' }, type: 1 },
                { buttonId: 'back_menu', buttonText: { displayText: '🔙 MENU UTAMA' }, type: 1 }
            ]
        });
        
    } catch (error) {
        console.error('Error showing cart:', error);
        await utils.sendMessage(sock, from, {
            text: '❌ Gagal memuat keranjang.'
        });
    }
}

async function showStoreStatus(sock, from, settings) {
    const products = await fs.readJson(path.join(__dirname, '../data/products.json'));
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    
    await sock.sendMessage(from, {
        text: `🏪 *STATUS TOKO DIGITAL*\n\n`
            + `📝 Nama: ${settings.storeName}\n`
            + `📊 Status: ${settings.isOpen ? '🟢 BUKA 24 JAM' : '🔴 TUTUP'}\n`
            + `⏰ Layanan: 24 Jam Nonstop\n`
            + `👤 Owner: ${settings.ownerName}\n`
            + `📞 WA: ${settings.whatsappNumber}\n\n`
            + `📦 *STATISTIK:*\n`
            + `• Total Produk: ${totalProducts}\n`
            + `• Total Stok: ${totalStock}\n\n`
            + `📌 *INFO PENTING:*\n`
            + `• Produk digital instant\n`
            + `• Support 24 jam\n`
            + `• Garansi replace jika bermasalah\n`
            + `• Pembayaran via QRIS/Transfer`
    });
}

module.exports = {
    showProductsList,
    showProductPayment,
    processOrder,
    showCart,
    showStoreStatus
};
