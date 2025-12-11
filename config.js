module.exports = {
    // Folder untuk menyimpan session
    authFolder: './auth',
    
    // Info browser untuk WhatsApp Web
    browser: ['Bot Toko Online', 'Chrome', '1.0.0'],
    
    // Logger setting
    logger: {
        level: 'silent' // bisa diubah ke 'debug' untuk troubleshooting
    },
    
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
    dataPath: './data'
};
