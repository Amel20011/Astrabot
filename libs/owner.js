const CONFIG = require('../config');

async function showOwnerInfo(sock, from, settings) {
    const ownerNumber = settings.whatsappNumber || CONFIG.ownerNumber;
    const formattedNumber = ownerNumber.replace(/\D/g, '');
    
    const contactText = `👤 *INFORMASI OWNER*\n\n`
        + `🏪 Toko: ${settings.storeName}\n`
        + `👤 Nama: ${settings.ownerName}\n`
        + `📞 WhatsApp: ${ownerNumber}\n\n`
        + `📌 *CARA HUBUNGI:*\n`
        + `1. Klik link di bawah untuk chat langsung\n`
        + `2. Atau save nomor: ${ownerNumber}\n`
        + `3. Langsung chat untuk konfirmasi order\n\n`
        + `⚠️ *PERHATIAN:*\n`
        + `• Chat untuk konfirmasi pembayaran\n`
        + `• Jangan lupa kirim bukti transfer\n`
        + `• Response dalam 5-10 menit`;
    
    try {
        await sock.sendMessage(from, {
            text: contactText,
            footer: 'Hubungi owner untuk bantuan',
            buttons: [
                { 
                    buttonId: `https://wa.me/${formattedNumber}`, 
                    buttonText: { displayText: '📞 CHAT OWNER' }, 
                    type: 2 
                },
                { 
                    buttonId: 'back_menu', 
                    buttonText: { displayText: '🏠 MENU UTAMA' }, 
                    type: 1 
                },
                { 
                    buttonId: 'menu_store', 
                    buttonText: { displayText: '🛍️ LIHAT PRODUK' }, 
                    type: 1 
                }
            ]
        });
    } catch (error) {
        console.error('Error sending owner contact:', error);
        
        await sock.sendMessage(from, {
            text: contactText + `\n\n🔗 Link chat: https://wa.me/${formattedNumber}`
        });
    }
}

module.exports = { showOwnerInfo };
