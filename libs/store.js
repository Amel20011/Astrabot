const fs = require('fs-extra');
const path = require('path');

async function showProducts(sock, from, settings, page = 1) {
    try {
        const prefix = settings.prefix || '.';
        const products = await fs.readJson(path.join(__dirname, '../data/products.json'));
        
        if (products.length === 0) {
            await sock.sendMessage(from, {
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
            if (product.description) {
                productList += `   📝 ${product.description.substring(0, 50)}...\n`;
            }
            productList += `   ───────────────\n`;
        });
        
        productList += `\n📌 *CARA ORDER:*\n`;
        productList += `Ketik: ${prefix}beli [nomor]\n`;
        productList += `Contoh: ${prefix}beli 1\n\n`;
        productList += `⚠️ *CATATAN:*\n`;
        productList += `• Produk digital instant\n`;
        productList += `• Support 24 jam\n`;
        productList += `• Garansi replace`;
        
        // Buat buttons
        const buttons = [];
        
        // Product buttons (maks 3)
        pageProducts.slice(0, 3).forEach((product, index) => {
            const globalIndex = startIndex + index + 1;
            buttons.push({
                buttonId: `buy_${product.id}`,
                buttonText: { displayText: `🛒 ${globalIndex}` },
                type: 1
            });
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
            buttonId: 'back_menu',
            buttonText: { displayText: '🏠 MENU' },
            type: 1
        });
        
        if (page < totalPages) {
            navButtons.push({
                buttonId: `page_${page+1}`,
                buttonText: { displayText: 'SELANJUT ➡️' },
                type: 1
            });
        }
        
        // Tambah button keranjang
        buttons.push({
            buttonId: 'menu_cart',
            buttonText: { displayText: '🛒 KERANJANG' },
            type: 1
        });
        
        // Gabungkan semua buttons
        const allButtons = [...buttons, ...navButtons];
        
        await sock.sendMessage(from, {
            text: productList,
            footer: `Total ${products.length} produk | Halaman ${page}/${totalPages}`,
            buttons: allButtons.slice(0, 6) // Maks 6 button
        });
        
    } catch (error) {
        console.error('Error showing products:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal memuat produk. Silakan coba lagi.'
        });
    }
}

async function buyProduct(sock, from, productId, quantity = 1, settings) {
    try {
        const prefix = settings.prefix || '.';
        const products = await fs.readJson(path.join(__dirname, '../data/products.json'));
        const product = products.find(p => p.id == productId);
        
        if (!product) {
            await sock.sendMessage(from, {
                text: '❌ Produk tidak ditemukan.'
            });
            return;
        }
        
        if (product.stock < quantity) {
            await sock.sendMessage(from, {
                text: `❌ Stok tidak mencukupi. Stok tersedia: ${product.stock}`
            });
            return;
        }
        
        // Simpan ke keranjang
        const carts = await fs.readJson(path.join(__dirname, '../data/carts.json'));
        const userId = from.split('@')[0];
        
        if (!carts[userId]) {
            carts[userId] = [];
        }
        
        // Cek apakah sudah ada di keranjang
        const existingIndex = carts[userId].findIndex(item => item.productId == product.id);
        if (existingIndex !== -1) {
            carts[userId][existingIndex].quantity += parseInt(quantity);
        } else {
            carts[userId].push({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: parseInt(quantity),
                addedAt: new Date().toISOString()
            });
        }
        
        await fs.writeJson(path.join(__dirname, '../data/carts.json'), carts, { spaces: 2 });
        
        // Update stock
        product.stock -= quantity;
        await fs.writeJson(path.join(__dirname, '../data/products.json'), products, { spaces: 2 });
        
        // Simpan order
        const orders = await fs.readJson(path.join(__dirname, '../data/orders.json'));
        const orderId = 'ORD' + Date.now();
        
        orders.push({
            id: orderId,
            buyer: userId,
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            price: product.price,
            total: product.price * quantity,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        
        await fs.writeJson(path.join(__dirname, '../data/orders.json'), orders, { spaces: 2 });
        
        await sock.sendMessage(from, {
            text: `✅ *PRODUK DITAMBAHKAN KE KERANJANG!*\n\n` +
                  `📦 ${product.name}\n` +
                  `💰 Harga: Rp ${product.price.toLocaleString('id-ID')}\n` +
                  `📊 Jumlah: ${quantity}\n` +
                  `💵 Total: Rp ${(product.price * quantity).toLocaleString('id-ID')}\n\n` +
                  `📌 Order ID: ${orderId}\n\n` +
                  `Ketik *${prefix}keranjang* untuk melihat keranjang\n` +
                  `Ketik *${prefix}checkout* untuk membayar`
        });
        
        // Notify owner
        const ownerJid = settings.whatsappNumber + '@s.whatsapp.net';
        await sock.sendMessage(ownerJid, {
            text: `📦 *ORDER BARU!*\n\n` +
                  `🆔 ID: ${orderId}\n` +
                  `👤 Pembeli: ${userId}\n` +
                  `📦 Produk: ${product.name}\n` +
                  `📊 Jumlah: ${quantity}\n` +
                  `💰 Total: Rp ${(product.price * quantity).toLocaleString('id-ID')}`
        });
        
    } catch (error) {
        console.error('Error buying product:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal memproses pembelian.'
        });
    }
}

async function showCart(sock, from, settings) {
    try {
        const prefix = settings.prefix || '.';
        const carts = await fs.readJson(path.join(__dirname, '../data/carts.json'));
        const userId = from.split('@')[0];
        const userCart = carts[userId] || [];
        
        if (userCart.length === 0) {
            await sock.sendMessage(from, {
                text: '🛒 *KERANJANG KOSONG*\n\nBelum ada produk di keranjang.\nKetik .store untuk melihat produk.'
            });
            return;
        }
        
        let cartText = '🛒 *KERANJANG BELANJA*\n\n';
        let totalAll = 0;
        
        userCart.forEach((item, index) => {
            const subtotal = item.price * item.quantity;
            totalAll += subtotal;
            
            cartText += `📦 *${item.name}*\n`;
            cartText += `   💰 Harga: Rp ${item.price.toLocaleString('id-ID')}\n`;
            cartText += `   📊 Jumlah: ${item.quantity}\n`;
            cartText += `   💵 Subtotal: Rp ${subtotal.toLocaleString('id-ID')}\n`;
            cartText += `   ───────────────\n`;
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
        await sock.sendMessage(from, {
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
        
        await sock.sendMessage(from, {
            text: `🏪 *STATUS TOKO LIVIAA*\n\n` +
                  `📝 Nama: ${settings.storeName}\n` +
                  `📊 Status: ${settings.isOpen ? '🟢 BUKA 24 JAM' : '🔴 TUTUP'}\n` +
                  `⏰ Layanan: 24 Jam Nonstop\n` +
                  `👤 Owner: ${settings.ownerName}\n` +
                  `📞 WA: ${settings.whatsappNumber}\n\n` +
                  `📦 *STATISTIK:*\n` +
                  `• Total Produk: ${totalProducts}\n` +
                  `• Produk Tersedia: ${availableProducts}\n` +
                  `• Total Order: ${totalOrders}\n\n` +
                  `📌 *INFO PENTING:*\n` +
                  `• Produk digital instant\n` +
                  `• Support 24 jam\n` +
                  `• Garansi replace jika bermasalah\n` +
                  `• Pembayaran via QRIS/Transfer`
        });
        
    } catch (error) {
        console.error('Error showing status:', error);
        await sock.sendMessage(from, {
            text: `🏪 *STATUS TOKO*\n\n` +
                  `📝 Nama: ${settings.storeName}\n` +
                  `📊 Status: ${settings.isOpen ? '🟢 BUKA' : '🔴 TUTUP'}\n` +
                  `👤 Owner: ${settings.ownerName}\n` +
                  `📞 WA: ${settings.whatsappNumber}`
        });
    }
}

module.exports = {
    showProducts,
    buyProduct,
    showCart,
    showStoreStatus
};
