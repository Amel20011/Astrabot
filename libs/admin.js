const fs = require('fs-extra');
const path = require('path');
const utils = require('./utils');

// Set prefix
async function setPrefix(sock, from, newPrefix, settings) {
    try {
        settings.prefix = newPrefix;
        await fs.writeJson(path.join(__dirname, '../data/settings.json'), settings, { spaces: 2 });
        
        await sock.sendMessage(from, {
            text: `✅ Prefix berhasil diubah menjadi: \`${newPrefix}\`\n\nContoh: ${newPrefix}menu`
        });
        
        await utils.logActivity('SET_PREFIX', { admin: from, newPrefix });
        
    } catch (error) {
        console.error('Error setting prefix:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal mengubah prefix.'
        });
    }
}

// Add admin
async function addAdmin(sock, from, phone, settings) {
    try {
        const formattedPhone = utils.formatPhoneNumber(phone);
        if (!utils.validatePhoneNumber(formattedPhone)) {
            await sock.sendMessage(from, {
                text: '❌ Nomor tidak valid. Format: 6281234567890'
            });
            return;
        }
        
        const admins = await fs.readJson(path.join(__dirname, '../data/admins.json'));
        
        if (admins.includes(formattedPhone)) {
            await sock.sendMessage(from, {
                text: '❌ Nomor sudah menjadi admin.'
            });
            return;
        }
        
        admins.push(formattedPhone);
        await fs.writeJson(path.join(__dirname, '../data/admins.json'), admins, { spaces: 2 });
        
        await sock.sendMessage(from, {
            text: `✅ Admin berhasil ditambahkan:\n\`${formattedPhone}\``
        });
        
        await utils.logActivity('ADD_ADMIN', { admin: from, added: formattedPhone });
        
    } catch (error) {
        console.error('Error adding admin:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal menambahkan admin.'
        });
    }
}

// Remove admin
async function removeAdmin(sock, from, phone, settings) {
    try {
        const formattedPhone = utils.formatPhoneNumber(phone);
        const admins = await fs.readJson(path.join(__dirname, '../data/admins.json'));
        
        const index = admins.indexOf(formattedPhone);
        if (index === -1) {
            await sock.sendMessage(from, {
                text: '❌ Nomor tidak ditemukan di daftar admin.'
            });
            return;
        }
        
        admins.splice(index, 1);
        await fs.writeJson(path.join(__dirname, '../data/admins.json'), admins, { spaces: 2 });
        
        await sock.sendMessage(from, {
            text: `✅ Admin berhasil dihapus:\n\`${formattedPhone}\``
        });
        
        await utils.logActivity('REMOVE_ADMIN', { admin: from, removed: formattedPhone });
        
    } catch (error) {
        console.error('Error removing admin:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal menghapus admin.'
        });
    }
}

// List admins
async function listAdmins(sock, from, settings) {
    try {
        const admins = await fs.readJson(path.join(__dirname, '../data/admins.json'));
        const ownerNumber = settings.ownerNumber || '6281234567890';
        
        let list = '👥 *DAFTAR ADMIN*\n\n';
        list += `👑 Owner: ${ownerNumber}\n\n`;
        
        if (admins.length === 0) {
            list += '📭 Belum ada admin tambahan.';
        } else {
            admins.forEach((admin, index) => {
                list += `${index + 1}. ${admin}\n`;
            });
            list += `\nTotal: ${admins.length} admin`;
        }
        
        await sock.sendMessage(from, {
            text: list,
            footer: 'Admin memiliki akses penuh ke bot'
        });
        
    } catch (error) {
        console.error('Error listing admins:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal memuat daftar admin.'
        });
    }
}

// Add product
async function addProduct(sock, from, args, settings) {
    try {
        if (args.length < 3) {
            await sock.sendMessage(from, {
                text: '❌ Format: !addproduct [nama] [harga] [stok] [kategori]\n\nContoh: !addproduct "Spotify Premium" 25000 10 Musik'
            });
            return;
        }
        
        const products = await fs.readJson(path.join(__dirname, '../data/products.json'));
        
        // Parse arguments
        let name = '';
        let price = 0;
        let stock = 0;
        let category = 'Digital';
        
        // Handle quoted names
        if (args[0].startsWith('"')) {
            let nameParts = [];
            let i = 0;
            while (i < args.length && !args[i].endsWith('"')) {
                nameParts.push(args[i]);
                i++;
            }
            if (i < args.length) {
                nameParts.push(args[i]);
                name = nameParts.join(' ').replace(/"/g, '');
                args = args.slice(i + 1);
            }
        }
        
        if (!name) name = args[0];
        price = parseInt(args[1]) || 0;
        stock = parseInt(args[2]) || 0;
        category = args[3] || 'Digital';
        
        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            name: name,
            description: `Produk ${name} premium`,
            price: price,
            stock: stock,
            category: category,
            type: "digital",
            createdAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        await fs.writeJson(path.join(__dirname, '../data/products.json'), products, { spaces: 2 });
        
        await sock.sendMessage(from, {
            text: `✅ Produk berhasil ditambahkan!\n\n` +
                  `📦 Nama: ${name}\n` +
                  `💰 Harga: Rp ${price.toLocaleString('id-ID')}\n` +
                  `📊 Stok: ${stock}\n` +
                  `🏷️ Kategori: ${category}\n` +
                  `🆔 ID: ${newProduct.id}`
        });
        
        await utils.logActivity('ADD_PRODUCT', { admin: from, product: name });
        
    } catch (error) {
        console.error('Error adding product:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal menambahkan produk.'
        });
    }
}

// Edit product
async function editProduct(sock, from, args, settings) {
    try {
        if (args.length < 2) {
            await sock.sendMessage(from, {
                text: '❌ Format: !editproduct [id] [field] [value]\n\nField: name, price, stock, category\nContoh: !editproduct 1 price 30000'
            });
            return;
        }
        
        const productId = parseInt(args[0]);
        const field = args[1];
        const value = args.slice(2).join(' ');
        
        const products = await fs.readJson(path.join(__dirname, '../data/products.json'));
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex === -1) {
            await sock.sendMessage(from, {
                text: `❌ Produk dengan ID ${productId} tidak ditemukan.`
            });
            return;
        }
        
        const product = products[productIndex];
        
        switch (field.toLowerCase()) {
            case 'name':
                product.name = value;
                break;
            case 'price':
                product.price = parseInt(value) || product.price;
                break;
            case 'stock':
                product.stock = parseInt(value) || product.stock;
                break;
            case 'category':
                product.category = value;
                break;
            case 'description':
                product.description = value;
                break;
            default:
                await sock.sendMessage(from, {
                    text: '❌ Field tidak valid. Pilih: name, price, stock, category, description'
                });
                return;
        }
        
        await fs.writeJson(path.join(__dirname, '../data/products.json'), products, { spaces: 2 });
        
        await sock.sendMessage(from, {
            text: `✅ Produk berhasil diupdate!\n\n` +
                  `📦 ${product.name}\n` +
                  `💰 Harga: Rp ${product.price.toLocaleString('id-ID')}\n` +
                  `📊 Stok: ${product.stock}\n` +
                  `🏷️ Kategori: ${product.category}`
        });
        
        await utils.logActivity('EDIT_PRODUCT', { admin: from, productId, field, value });
        
    } catch (error) {
        console.error('Error editing product:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal mengedit produk.'
        });
    }
}

// Delete product
async function deleteProduct(sock, from, productId, settings) {
    try {
        const products = await fs.readJson(path.join(__dirname, '../data/products.json'));
        const productIndex = products.findIndex(p => p.id == productId);
        
        if (productIndex === -1) {
            await sock.sendMessage(from, {
                text: `❌ Produk dengan ID ${productId} tidak ditemukan.`
            });
            return;
        }
        
        const deletedProduct = products[productIndex];
        products.splice(productIndex, 1);
        
        await fs.writeJson(path.join(__dirname, '../data/products.json'), products, { spaces: 2 });
        
        await sock.sendMessage(from, {
            text: `✅ Produk berhasil dihapus!\n\n` +
                  `📦 ${deletedProduct.name}\n` +
                  `🆔 ID: ${deletedProduct.id}\n\n` +
                  `Total produk sekarang: ${products.length}`
        });
        
        await utils.logActivity('DELETE_PRODUCT', { admin: from, product: deletedProduct.name });
        
    } catch (error) {
        console.error('Error deleting product:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal menghapus produk.'
        });
    }
}

// Show orders
async function showOrders(sock, from, settings) {
    try {
        const orders = await fs.readJson(path.join(__dirname, '../data/orders.json'));
        
        if (orders.length === 0) {
            await sock.sendMessage(from, {
                text: '📭 Belum ada order yang tercatat.'
            });
            return;
        }
        
        const pendingOrders = orders.filter(o => o.status === 'pending');
        const approvedOrders = orders.filter(o => o.status === 'approved');
        const rejectedOrders = orders.filter(o => o.status === 'rejected');
        
        let ordersText = `📋 *DAFTAR ORDER (${orders.length})*\n\n`;
        ordersText += `⏳ Pending: ${pendingOrders.length}\n`;
        ordersText += `✅ Approved: ${approvedOrders.length}\n`;
        ordersText += `❌ Rejected: ${rejectedOrders.length}\n\n`;
        
        // Show recent orders
        const recentOrders = orders.slice(-10).reverse();
        
        recentOrders.forEach((order, index) => {
            ordersText += `[${index + 1}] ${order.id}\n`;
            ordersText += `   👤 ${order.buyer}\n`;
            ordersText += `   📦 ${order.productName}\n`;
            ordersText += `   💰 Rp ${order.total.toLocaleString('id-ID')}\n`;
            ordersText += `   📊 ${order.status.toUpperCase()}\n`;
            ordersText += `   ─────────────────\n`;
        });
        
        await sock.sendMessage(from, {
            text: ordersText,
            footer: 'Gunakan !approve [id] atau !reject [id]'
        });
        
    } catch (error) {
        console.error('Error showing orders:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal memuat daftar order.'
        });
    }
}

// Broadcast message
async function broadcastMessage(sock, from, message, settings) {
    try {
        await sock.sendMessage(from, {
            text: `📢 *BROADCAST MESSAGE*\n\n` +
                  `${message}\n\n` +
                  `✅ Pesan siap dikirim.\n\n` +
                  `⚠️ Fitur broadcast dalam pengembangan.`
        });
        
        await utils.logActivity('BROADCAST', { admin: from, message: message.substring(0, 100) });
        
    } catch (error) {
        console.error('Error broadcasting:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal membuat broadcast.'
        });
    }
}

// Show settings
async function showSettings(sock, from, settings) {
    try {
        const products = await fs.readJson(path.join(__dirname, '../data/products.json'));
        const orders = await fs.readJson(path.join(__dirname, '../data/orders.json'));
        const admins = await fs.readJson(path.join(__dirname, '../data/admins.json'));
        
        let settingsText = `⚙️ *PENGATURAN BOT*\n\n`;
        settingsText += `🏪 Nama Toko: ${settings.storeName}\n`;
        settingsText += `👤 Owner: ${settings.ownerName}\n`;
        settingsText += `📞 WA Owner: ${settings.whatsappNumber}\n`;
        settingsText += `🔧 Prefix: ${settings.prefix}\n`;
        settingsText += `📊 Status: ${settings.isOpen ? '🟢 BUKA' : '🔴 TUTUP'}\n\n`;
        
        settingsText += `📦 *STATISTIK:*\n`;
        settingsText += `• Produk: ${products.length}\n`;
        settingsText += `• Orders: ${orders.length}\n`;
        settingsText += `• Admins: ${admins.length + 1}\n\n`;
        
        settingsText += `⚡ *FITUR:*\n`;
        settingsText += `• Anti-link: ${settings.features?.antiLink ? '🟢' : '🔴'}\n`;
        settingsText += `• Welcome: ${settings.features?.welcomeMessage ? '🟢' : '🔴'}\n`;
        settingsText += `• Buttons: ${settings.features?.useButtons ? '🟢' : '🔴'}\n`;
        settingsText += `• Lists: ${settings.features?.useLists ? '🟢' : '🔴'}\n`;
        
        await sock.sendMessage(from, {
            text: settingsText,
            footer: 'Edit file settings.json untuk perubahan'
        });
        
    } catch (error) {
        console.error('Error showing settings:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal memuat pengaturan.'
        });
    }
}

module.exports = {
    setPrefix,
    addAdmin,
    removeAdmin,
    listAdmins,
    addProduct,
    editProduct,
    deleteProduct,
    showOrders,
    broadcastMessage,
    showSettings
};
