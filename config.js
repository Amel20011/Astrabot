const pino = require('pino');

module.exports = {
    // Folder untuk session
    authFolder: './auth_info',
    
    // Info browser
    browser: ['Toko Liviaa', 'Chrome', '5.0.0'],
    
    // Logger
    logger: pino({ level: 'silent' }),
    
    // Prefix default (titik)
    prefix: '.',
    
    // Nomor owner (Liviaa)
    ownerNumber: '13658700681',
    ownerName: 'Liviaa',
    
    // Payment config
    payment: {
        qrisPath: './assets/qris.png',
        bankName: 'Bank Liviaa',
        bankAccount: '1234567890',
        accountName: 'LIVIAA STORE'
    },
    
    // Paths
    dataPath: './data',
    assetsPath: './assets',
    
    // Store info
    storeName: 'Toko Digital Liviaa',
    
    // Settings
    isOpen: true,
    openingHours: '24 Jam',
    
    // Features
    features: {
        antiLink: true,
        welcomeMessage: true,
        autoReply: true,
        useButtons: true,
        useLists: true,
        approvalSystem: true
    },
    
    // Welcome messages
    welcome: {
        private: '👋 Halo! Selamat datang di toko digital Liviaa. Ketik .menu untuk melihat menu.',
        group: '👋 Selamat datang di grup! Bot toko digital Liviaa siap melayani.',
        groupVideo: null
    },
    
    // Group settings
    group: {
        antiLink: true,
        maxWarnings: 3,
        welcomeVideo: null
    },
    
    // Store settings
    store: {
        itemsPerPage: 10,
        currency: 'IDR',
        currencySymbol: 'Rp'
    },
    
    // Bot behavior
    behavior: {
        autoReadMessages: true,
        rejectCalls: true,
        syncFullHistory: false
    }
};
