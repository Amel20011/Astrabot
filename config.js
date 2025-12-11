const pino = require('pino');

module.exports = {
    // Session folder
    authFolder: './auth_info',
    
    // Browser info
    browser: ['Toko Digital Bot', 'Chrome', '3.0.0'],
    
    // Logger
    logger: pino({ level: 'silent' }),
    
    // Default prefix
    prefix: '!',
    
    // Owner number (ganti dengan nomor Anda)
    ownerNumber: '6281234567890',
    
    // Payment config
    payment: {
        qrisPath: './assets/qris.png',
        bankName: 'BCA',
        bankAccount: '1234567890',
        accountName: 'TOKO DIGITAL'
    },
    
    // Paths
    dataPath: './data',
    assetsPath: './assets',
    
    // Store info
    storeName: 'Toko Digital Pro',
    
    // Default settings
    isOpen: true,
    openingHours: '24 Jam',
    
    // Features
    features: {
        antiLink: true,
        welcomeMessage: true,
        autoReply: true,
        useButtons: true,
        useLists: true,
        approvalSystem: true,
        broadcastSystem: true
    },
    
    // Welcome messages
    welcome: {
        private: '👋 Halo! Selamat datang di toko digital kami. Ketik !menu untuk melihat menu.',
        group: '👋 Selamat datang di grup! Bot toko digital siap melayani.',
        groupVideo: null // URL video untuk welcome grup
    },
    
    // Auto reply settings
    autoReply: {
        greeting: true,
        thankyou: true,
        question: true
    },
    
    // Group settings
    group: {
        antiLink: true,
        maxWarnings: 3,
        welcomeVideo: null
    },
    
    // Admin settings
    admin: {
        maxAdmins: 5,
        allowedCommands: ['broadcast', 'addadmin', 'setprefix', 'antilink', 'setwelcome']
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
        autoTyping: false,
        autoRecording: false,
        rejectCalls: true
    }
};
