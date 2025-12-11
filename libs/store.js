const fs = require('fs-extra');
const path = require('path');
const CONFIG = require('../config');

// In-memory cart (bisa diganti dengan database)
const carts = new Map();

async function showProducts(sock, from) {
    try {
        const products = await fs.readJson(path.join(__dirname, '../data/products.json'));
        
        let productList = '🛍️ *DAFTAR PRODUK*\n\n';
        products.forEach(product => {
            productList += `*${product.id}. ${product.name}*\n`;
            productList += `📦 Stok: ${product.stock} | 💰 Rp ${product.price.toLocaleString('id-ID')}\n`;
            productList += `📝 ${product.description}\n`;
            productList += `🏷️ Kategori: ${product.category}\n`;
            productList += `➖➖➖➖➖➖➖➖➖➖\n`;
        });
        
        productList += `\n📌 *Cara Order:*\nKetik: ${CONFIG.prefix}beli [id] [jumlah]\nContoh: ${CONFIG.prefix}beli 1 2`;
        
        await sock.sendMessage(from, {
            text: productList,
            footer: 'Pilih produk yang ingin dibeli',
            buttons: [
                { buttonId: `${CONFIG.prefix}beli 1 1`, buttonText: { displayText: '🛒 Beli Produk 1' }, type: 1 },
                { buttonId: `${CONFIG.prefix}beli 2 1`, buttonText: { displayText: '🛒 Beli Produk 2' }, type: 1 },
                { buttonId: `${CONFIG.prefix}beli 3 1`, buttonText: { displayText: '🛒 Beli Produk 3' }, type: 1 }
            ]
        });
        
    } catch (error) {
        console.error('Error showing products:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal memuat daftar produk. Silakan coba lagi nanti.'
        });
    }
}

async function processOrder(sock, from, productId, quantity = 1) {
    try {
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
        
        // Get or create cart
        if (!carts.has(from)) {
            carts.set(from, []);
        }
        
        const cart = carts.get(from);
        const existingItem = cart.find(item => item.id == productId);
        
        if (existingItem) {
            existingItem.quantity += parseInt(quantity);
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: parseInt(quantity)
            });
        }
        
        const total = product.price * quantity;
        
        await sock.sendMessage(from, {
            text: `✅ *Produk berhasil ditambahkan ke keranjang!*\n\n📦 *${product.name}*\n💰 Harga: Rp ${product.price.toLocaleString('id-ID')}\n📊 Jumlah: ${quantity}\n💰 Subtotal: Rp ${total.toLocaleString('id-ID')}\n\nKetik *${CONFIG.prefix}keranjang* untuk melihat keranjang\nKetik *${CONFIG.prefix}checkout* untuk membayar`
        });
        
    } catch (error) {
        console.error('Error processing order:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal menambahkan produk ke keranjang.'
        });
    }
}

async function showCart(sock, from) {
    try {
        if (!carts.has(from) || carts.get(from).length === 0) {
            await sock.sendMessage(from, {
                text: '🛒 *Keranjang Kosong*\n\nBelum ada produk di keranjang. Ketik *!store* untuk melihat produk.'
            });
            return;
        }
        
        const cart = carts.get(from);
        let cartText = '🛒 *KERANJANG BELANJA*\n\n';
        let total = 0;
        
        cart.forEach((item, index) => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            
            cartText += `*${index + 1}. ${item.name}*\n`;
            cartText += `   Harga: Rp ${item.price.toLocaleString('id-ID')}\n`;
            cartText += `   Jumlah: ${item.quantity}\n`;
            cartText += `   Subtotal: Rp ${subtotal.toLocaleString('id-ID')}\n`;
            cartText += `➖➖➖➖➖➖➖➖➖➖\n`;
        });
        
        cartText += `\n💰 *TOTAL: Rp ${total.toLocaleString('id-ID')}*\n\n`;
        cartText += `Ketik *${CONFIG.prefix}checkout* untuk melanjutkan pembayaran`;
        
        await sock.sendMessage(from, {
            text: cartText,
            footer: 'Checkout untuk menyelesaikan pesanan',
            buttons: [
                { buttonId: `${CONFIG.prefix}checkout`, buttonText: { displayText: '💳 Checkout' }, type: 1 },
                { buttonId: `${CONFIG.prefix}store`, buttonText: { displayText: '🏪 Tambah Produk' }, type: 1 }
            ]
        });
        
    } catch (error) {
        console.error('Error showing cart:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal memuat keranjang.'
        });
    }
}

module.exports = { showProducts, processOrder, showCart };
