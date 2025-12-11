const pino = require('pino');

module.exports = {
    // Folder untuk menyimpan session
    authFolder: './auth',
    
    // Info browser untuk WhatsApp Web
    browser: ['Bot Toko Online', 'Chrome', '1.0.0'],
    
    // Logger setting - FIXED dengan pino
    logger: pino({ level: 'silent' }),
    
    // Prefix command
    prefix: '!',
    
    // Nomor owner/admin
    ownerNumber: '6281234567890',
    
    // Config untuk pembayaran
    payment: {
        qrisPath: './assets/qris.png',
        bankName: 'Bank Contoh',
        bankAccount: '1234567890',
        accountName: 'Nama Toko'
    },
    
    // Database path
    dataPath: './data',
    
    // Store name
    storeName: 'Toko Online',
    
    // Default settings
    isOpen: true,
    openingHours: '09:00 - 21:00'
};
