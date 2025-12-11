const CONFIG = require('../config');
const utils = require('./utils');

async function showMainMenu(sock, from, settings) {
    const prefix = settings.prefix || CONFIG.prefix;
    
    const menuText = `🎪 *TOKO DIGITAL PREMIUM* 🎪

Selamat datang di toko digital kami!
Kami menyediakan berbagai akun premium dengan harga terjangkau.

📊 *Status Toko:* ${settings.isOpen ? '🟢 BUKA 24 JAM' : '🔴 TUTUP'}
⏰ *Layanan:* 24 Jam Nonstop
👤 *Support:* ${settings.ownerName}

Pilih menu di bawah ini:`;
    
    try {
        // Coba gunakan LIST MESSAGE (3 garis) terlebih dahulu
        if (settings.features?.useLists !== false) {
            try {
                await sock.sendMessage(from, {
                    text: menuText,
                    footer: 'Pilih menu yang tersedia',
                    title: '🎪 MENU UTAMA',
                    buttonText: '📋 BUKA MENU',
                    sections: [
                        {
                            title: "🛍️ BELANJA",
                            rows: [
                                { title: "📦 Lihat Produk", rowId: `${prefix}store`, description: "Lihat semua produk yang dijual" },
                                { title: "🛒 Keranjang Saya", rowId: `${prefix}keranjang`, description: "Lihat keranjang belanja" },
                                { title: "💰 Checkout", rowId: `${prefix}checkout`, description: "Lakukan pembayaran" }
                            ]
                        },
                        {
                            title: "💳 PEMBAYARAN",
                            rows: [
                                { title: "📱 Bayar QRIS", rowId: `${prefix}qris`, description: "Pembayaran via QRIS" },
                                { title: "🏦 Info Transfer", rowId: `${prefix}payment`, description: "Info transfer bank" },
                                { title: "❤️ Donasi", rowId: `${prefix}donasi`, description: "Support pengembangan" }
                            ]
                        },
                        {
                            title: "👤 BANTUAN",
                            rows: [
                                { title: "📞 Hubungi Owner", rowId: `${prefix}owner`, description: "Chat langsung dengan owner" },
                                { title: "🏪 Status Toko", rowId: `${prefix}status`, description: "Cek status toko" },
                                { title: "ℹ️ Info Bot", rowId: `${prefix}info`, description: "Informasi tentang bot" }
                            ]
                        }
                    ]
                });
                return;
            } catch (error) {
                console.log('⚠️ List message not supported, using buttons instead');
            }
        }
        
        // Fallback ke BUTTONS jika list tidak support
        await sock.sendMessage(from, {
            text: menuText,
            footer: 'Pilih menu yang tersedia',
            buttons: [
                { buttonId: 'store_products', buttonText: { displayText: '🛍️ LIHAT PRODUK' }, type: 1 },
                { buttonId: 'contact_owner', buttonText: { displayText: '👤 HUBUNGI OWNER' }, type: 1 },
                { buttonId: 'cart_view', buttonText: { displayText: '🛒 KERANJANG' }, type: 1 }
            ],
            headerType: 1
        });
        
    } catch (error) {
        console.error('Error showing menu:', error);
        
        // Fallback ke text biasa
        const fallbackText = menuText + `\n\n📌 *PERINTAH:*\n`
            + `• ${prefix}store - Lihat produk\n`
            + `• ${prefix}beli [no] - Beli produk\n`
            + `• ${prefix}keranjang - Keranjang\n`
            + `• ${prefix}owner - Hubungi owner\n`
            + `• ${prefix}donasi - Donasi\n`
            + `• ${prefix}status - Status toko\n`
            + `• ${prefix}info - Info bot`;
        
        await utils.sendMessage(sock, from, { text: fallbackText });
    }
}

// Menu khusus admin
async function showAdminMenu(sock, from, settings) {
    const prefix = settings.prefix || CONFIG.prefix;
    
    const adminText = `⚙️ *MENU ADMIN TOKO*\n\n`
        + `Halo Admin! Berikut perintah yang tersedia:`;
    
    try {
        await sock.sendMessage(from, {
            text: adminText,
            footer: 'Pilih perintah admin',
            title: '⚙️ ADMIN MENU',
            buttonText: '📋 BUKA MENU ADMIN',
            sections: [
                {
                    title: "👥 ADMIN MANAGEMENT",
                    rows: [
                        { title: "➕ Tambah Admin", rowId: `${prefix}addadmin`, description: "Tambahkan admin baru" },
                        { title: "📋 List Admin", rowId: `${prefix}listadmin`, description: "Lihat daftar admin" },
                        { title: "🔧 Set Prefix", rowId: `${prefix}setprefix`, description: "Ubah prefix bot" }
                    ]
                },
                {
                    title: "🏪 TOKO MANAGEMENT",
                    rows: [
                        { title: "📦 Kelola Produk", rowId: `${prefix}addproduct`, description: "Tambah/edit produk" },
                        { title: "📋 Lihat Orders", rowId: `${prefix}orders`, description: "Lihat semua order" },
                        { title: "⚙️ Settings", rowId: `${prefix}settings`, description: "Pengaturan bot" }
                    ]
                },
                {
                    title: "📢 BROADCAST",
                    rows: [
                        { title: "📢 Broadcast Message", rowId: `${prefix}broadcast`, description: "Kirim pesan ke semua user" }
                    ]
                }
            ]
        });
    } catch (error) {
        // Fallback ke text
        const fallbackText = adminText + `\n\n📋 *ADMIN COMMANDS:*\n`
            + `• ${prefix}addadmin [nomor]\n`
            + `• ${prefix}listadmin\n`
            + `• ${prefix}setprefix [karakter]\n`
            + `• ${prefix}addproduct [nama] [harga] [stok]\n`
            + `• ${prefix}orders\n`
            + `• ${prefix}settings\n`
            + `• ${prefix}broadcast [pesan]\n`
            + `• ${prefix}antilink enable/disable (di grup)\n`
            + `• ${prefix}setwelcome [teks] (di grup)`;
        
        await utils.sendMessage(sock, from, { text: fallbackText });
    }
}

module.exports = { showMainMenu, showAdminMenu };
