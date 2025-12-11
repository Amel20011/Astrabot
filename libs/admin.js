const fs = require('fs-extra');
const path = require('path');
const utils = require('./utils');

async function setPrefix(sock, from, newPrefix, settings) {
    try {
        if (!newPrefix || newPrefix.length !== 1) {
            await sock.sendMessage(from, {
                text: '❌ Prefix harus 1 karakter.\nContoh: .setprefix !'
            });
            return;
        }
        
        settings.prefix = newPrefix;
        await fs.writeJson(path.join(__dirname, '../data/settings.json'), settings, { spaces: 2 });
        
        await sock.sendMessage(from, {
            text: `✅ Prefix berhasil diubah menjadi: \`${newPrefix}\`\n\nContoh: ${newPrefix}menu`
        });
        
    } catch (error) {
        console.error('Error setting prefix:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal mengubah prefix.'
        });
    }
}

async function addAdmin(sock, from, phone, settings) {
    try {
        const formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone || formattedPhone.length < 10) {
            await sock.sendMessage(from, {
                text: '❌ Nomor tidak valid.\nContoh: .addadmin 6281234567890'
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
        
    } catch (error) {
        console.error('Error adding admin:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal menambahkan admin.'
        });
    }
}

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
        const processingOrders = orders.filter(o => o.status === 'processing');
        const completedOrders = orders.filter(o => o.status === 'completed');
        
        let ordersText = `📋 *DAFTAR ORDER (${orders.length})*\n\n`;
        ordersText += `⏳ Pending: ${pendingOrders.length}\n`;
        ordersText += `🔄 Processing: ${processingOrders.length}\n`;
        ordersText += `✅ Completed: ${completedOrders.length}\n\n`;
        
        // Tampilkan 5 order terbaru
        const recentOrders = orders.slice(-5).reverse();
        
        recentOrders.forEach((order, index) => {
            ordersText += `[${index + 1}] ${order.id}\n`;
            ordersText += `   👤 ${order.buyer}\n`;
            ordersText += `   📦 ${order.productName}\n`;
            ordersText += `   💰 Rp ${order.total.toLocaleString('id-ID')}\n`;
            ordersText += `   📊 ${order.status.toUpperCase()}\n`;
            ordersText += `   ───────────────\n`;
        });
        
        await sock.sendMessage(from, {
            text: ordersText,
            footer: 'Gunakan WhatsApp Web untuk detail lebih lanjut'
        });
        
    } catch (error) {
        console.error('Error showing orders:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal memuat daftar order.'
        });
    }
}

async function broadcast(sock, from, message, settings) {
    try {
        // Ini contoh sederhana
        await sock.sendMessage(from, {
            text: `📢 *BROADCAST MESSAGE*\n\n${message}\n\n✅ Pesan siap dikirim.\n\n⚠️ Fitur broadcast dalam pengembangan.`
        });
        
    } catch (error) {
        console.error('Error broadcasting:', error);
        await sock.sendMessage(from, {
            text: '❌ Gagal membuat broadcast.'
        });
    }
}

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
        settingsText += `• Admins: ${admins.length}\n\n`;
        
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
    showOrders,
    broadcast,
    showSettings
};
