const CONFIG = require('../config');

async function showMainMenu(sock, from, settings) {
    const prefix = settings.prefix || CONFIG.prefix;
    
    const menuText = `🎪 *TOKO DIGITAL LIVIAA* 🎪

Selamat datang di toko digital Liviaa!
Kami menyediakan berbagai akun premium dengan harga terjangkau.

📊 *Status:* ${settings.isOpen ? '🟢 BUKA 24 JAM' : '🔴 TUTUP'}
⏰ *Layanan:* 24 Jam Nonstop
👤 *Owner:* ${settings.ownerName}
🔧 *Prefix:* ${prefix}

Pilih menu di bawah ini:`;
    
    try {
        // Coba pakai LIST MESSAGE (3 garis) dulu
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
                                { title: "📦 Lihat Produk", rowId: "menu_store", description: "Lihat semua produk yang dijual" },
                                { title: "🛒 Keranjang Saya", rowId: "menu_cart", description: "Lihat keranjang belanja" },
                                { title: "💰 Checkout", rowId: `${prefix}checkout`, description: "Lakukan pembayaran" }
                            ]
                        },
                        {
                            title: "💳 PEMBAYARAN",
                            rows: [
                                { title: "📱 Bayar QRIS", rowId: "menu_payment", description: "Pembayaran via QRIS" },
                                { title: "🏦 Info Transfer", rowId: `${prefix}payment`, description: "Info transfer bank" },
                                { title: "❤️ Donasi", rowId: "menu_donate", description: "Support pengembangan" }
                            ]
                        },
                        {
                            title: "👤 BANTUAN",
                            rows: [
                                { title: "📞 Hubungi Owner", rowId: "menu_owner", description: "Chat langsung dengan owner" },
                                { title: "🏪 Status Toko", rowId: "menu_status", description: "Cek status toko" },
                                { title: "ℹ️ Info Bot", rowId: `${prefix}info`, description: "Informasi tentang bot" }
                            ]
                        }
                    ]
                });
                return;
            } catch (error) {
                console.log('⚠️ List not supported, using buttons');
            }
        }
        
        // Fallback ke BUTTONS
        await sock.sendMessage(from, {
            text: menuText,
            footer: 'Pilih menu yang tersedia',
            buttons: [
                { buttonId: 'menu_store', buttonText: { displayText: '🛍️ PRODUK' }, type: 1 },
                { buttonId: 'menu_owner', buttonText: { displayText: '👤 OWNER' }, type: 1 },
                { buttonId: 'menu_payment', buttonText: { displayText: '💳 BAYAR' }, type: 1 },
                { buttonId: 'menu_donate', buttonText: { displayText: '❤️ DONASI' }, type: 1 },
                { buttonId: 'menu_cart', buttonText: { displayText: '🛒 KERANJANG' }, type: 1 },
                { buttonId: 'menu_status', buttonText: { displayText: '🏪 STATUS' }, type: 1 }
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
        
        await sock.sendMessage(from, { text: fallbackText });
    }
}

module.exports = { showMainMenu };
