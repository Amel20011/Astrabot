const fs = require('fs-extra');
const path = require('path');
const utils = require('./utils');

async function showProductsList(sock, from, settings, page = 1) {
    try {
        const prefix = settings.prefix || '.';
        const products = await fs.readJson(path.join(__dirname, '../data/products.json'));
        
        if (products.length === 0) {
            await utils.sendMessage(sock, from, {
                text: '📭 *BELUM ADA PRODUK*\n\nMaaf, belum ada produk yang tersedia.'
            });
            return;
        }
        
        // Pagination
        const itemsPerPage = 5;
        const totalPages = Math.ceil(products.length / itemsPerPage);
        page = Math.max(1, Math.min(page, totalPages));
        
        const startIndex = (page - 1) * itemsPerPage;
        const pageProducts = products.slice(startIndex, startIndex + itemsPerPage);
        
        // Buat list produk
        let productList = `🛍️ *PRODUK TOKO LIVIAA*\n`;
        productList += `Halaman ${page}/${totalPages}\n\n`;
        
        pageProducts.forEach((product, index) => {
            const globalIndex = startIndex + index + 1;
            const stockStatus = product.stock > 0 ? `✅ (${product.stock})` : '❌ HABIS';
            productList += `[${globalIndex}]. ${product.name} ${stockStatus}\n`;
            productList += `   💰 Rp ${product.price.toLocaleString('id-ID')}\n`;
            productList += `   📝 ${product.description.substring(0, 50)}...\n`;
            productList += `   ───────────────\n`;
        });
        
        productList += `\n📌 *CARA ORDER:*\n`;
        productList += `Ketik: ${prefix}beli [nomor]\n`;
        productList += `Contoh: ${prefix}beli 1\n\n`;
        productList += `⚠️ *CATATAN:*\n`;
        productList += `• Produk digital instant\n`;
        productList += `• Support 24 jam\n`;
        productList += `• Garansi replace`;
        
        try {
            // Buat buttons untuk produk
            const buttons = [];
            
            // Buttons untuk produk di halaman ini
            pageProducts.forEach((product, index) => {
                const globalIndex = startIndex + index + 1;
                if (buttons.length < 3) {
                    buttons.push({
                        buttonId: `buy_${product.id}`,
                        buttonText: { displayText: `🛒 ${globalIndex}` },
                        type: 1
                    });
                }
            });
            
            // Navigation buttons
            const navButtons = [];
            if (page > 1) {
                navButtons.push({
                    buttonId: `page_${page-1}`,
                    buttonText: { displayText: '⬅️ SEBELUM' },
                    type: 1
                });
            }
            
            navButtons.push({
                buttonId: 'menu_store',
                buttonText: { displayText: '🔄 REFRESH' },
                type: 1
            });
            
            if (page < totalPages) {
                navButtons.push({
                    buttonId: `page_${page+1}`,
                    buttonText: { displayText: 'SELANJUT ➡️' },
                    type: 1
                });
            }
            
            // Tambah navigasi di baris kedua
            buttons.push(...navButtons);
            
            await sock.sendMessage(from, {
                text: productList,
                footer: `Total ${products.length} produk | Halaman ${page}/${totalPages}`,
                buttons: buttons.slice(0, 6) // Maks 6 button
            });
            
        } catch (error) {
            console.error('Error with buttons:', error);
            
            // Kirim teks biasa tanpa button
            let navText = '\n\n📋 *NAVIGASI:*\n';
            if (page > 1) navText += `${prefix}store ${page-1} - Sebelumnya\n`;
            if (page < totalPages) navText += `${prefix}store ${page+1} - Selanjutnya\n`;
            navText += `${prefix}menu - Menu utama`;
            
            await utils.sendMessage(sock, from, {
                text: productList + navText
            });
        }
        
    } catch (error) {
        console.error('Error showing products:', error);
        await utils.sendMessage(sock, from, {
            text: '❌ Gagal memuat produk. Silakan coba lagi.'
        });
    }
}

async function processOrder(sock, from, productId, quantity = 1, settings) {
    try {
        const prefix = settings.prefix || '.';
        const products = await fs.readJson(path.join(__dirname, '../data/products.json'));
        const product = products.find(p => p.id == productId || p.id == parseInt(productId));
        
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
        
        // Kirim notifikasi ke owner
        const ownerJid = settings.whatsappNumber + '@s.whatsapp.net';
        await sock.sendMessage(ownerJid, {
            text: `📦 *ORDER BARU!*\n\n`
                + `🆔 ID: ${orderId}\n`
                + `👤 Pembeli: ${buyerNumber}\n`
                + `📦 Produk: ${product.name}\n`
                + `📊 Jumlah: ${quantity}\n`
                + `💰 Total: Rp ${(product.price * quantity).toLocaleString('id-ID')}\n\n`
                + `⏰ Waktu: ${new Date().toLocaleString('id-ID')}`
        });
        
    } catch (error) {
        console.error('Error processing order:', error);
        await utils.sendMessage(sock, from, {
            text: '❌ Gagal memproses order. Silakan coba lagi.'
        });
    }
}

async function showCart(sock, from, settings) {
    try {
        const prefix = settings.prefix || '.';
        const orders = await fs.readJson(path.join(__dirname, '../data/orders.json'));
        const buyerNumber = from.split('@')[0];
        const userOrders = orders.filter(order => 
            order.buyer === buyerNumber && 
            (order.status === 'pending' || order.status === 'processing')
        );
        
        if (userOrders.length === 0) {
            await utils.sendMessage(sock, from, {
                text: '🛒 *KERANJANG KOSONG*\n\nBelum ada order aktif. Silakan pilih produk!'
            });
            return;
        }
        
        let cartText = '🛒 *ORDER ANDA*\n\n';
        let totalAll = 0;
        
        userOrders.forEach((order, index) => {
            cartText += `📦 *${order.productName}*\n`;
            cartText += `   Jumlah: ${order.quantity}\n`;
            cartText += `   Total: Rp ${order.total.toLocaleString('id-ID')}\n`;
            cartText += `   Status: ${order.status.toUpperCase()}\n`;
            cartText += `   ───────────────\n`;
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
                { buttonId: 'menu_payment', buttonText: { displayText: '💳 BAYAR SEKARANG' }, type: 1 },
                { buttonId: 'menu_owner', buttonText: { displayText: '👤 CHAT OWNER' }, type: 1 },
                { buttonId: 'menu_store', buttonText: { displayText: '🛍️ TAMBAH PRODUK' }, type: 1 }
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
    try {
        const products = await fs.readJson(path.join(__dirname, '../data/products.json'));
        const orders = await fs.readJson(path.join(__dirname, '../data/orders.json'));
        
        const totalProducts = products.length;
        const availableProducts = products.filter(p => p.stock > 0).length;
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        
        await sock.sendMessage(from, {
            text: `🏪 *STATUS TOKO LIVIAA*\n\n`
                + `📝 Nama: ${settings.storeName}\n`
                + `📊 Status: ${settings.isOpen ? '🟢 BUKA 24 JAM' : '🔴 TUTUP'}\n`
                + `⏰ Layanan: 24 Jam Nonstop\n`
                + `👤 Owner: ${settings.ownerName}\n`
                + `📞 WA: ${settings.whatsappNumber}\n\n`
                + `📦 *STATISTIK:*\n`
                + `• Total Produk: ${totalProducts}\n`
                + `• Produk Tersedia: ${availableProducts}\n`
                + `• Total Order: ${totalOrders}\n`
                + `• Order Pending: ${pendingOrders}\n\n`
                + `📌 *INFO PENTING:*\n`
                + `• Produk digital instant\n`
                + `• Support 24 jam\n`
                + `• Garansi replace jika bermasalah\n`
                + `• Pembayaran via QRIS/Transfer`
        });
        
    } catch (error) {
        console.error('Error showing status:', error);
        await sock.sendMessage(from, {
            text: `🏪 *STATUS TOKO*\n\n`
                + `📝 Nama: ${settings.storeName}\n`
                + `📊 Status: ${settings.isOpen ? '🟢 BUKA' : '🔴 TUTUP'}\n`
                + `👤 Owner: ${settings.ownerName}\n`
                + `📞 WA: ${settings.whatsappNumber}`
        });
    }
}

module.exports = {
    showProductsList,
    processOrder,
    showCart,
    showStoreStatus
};
