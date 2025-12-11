const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log(chalk.cyan('╔══════════════════════════════════════╗'));
console.log(chalk.cyan('║     🤖 SETUP BOT TOKO DIGITAL        ║'));
console.log(chalk.cyan('╚══════════════════════════════════════╝'));

async function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(chalk.yellow(`\n${question}: `), (answer) => {
            resolve(answer.trim());
        });
    });
}

async function setupBot() {
    console.log(chalk.blue('\n📋 Informasi yang dibutuhkan:'));
    
    const ownerNumber = await askQuestion('Nomor WhatsApp Owner (628xxxxxxxxxx)');
    const storeName = await askQuestion('Nama Toko');
    const ownerName = await askQuestion('Nama Pemilik');
    
    // Buat folder
    const folders = ['data', 'assets', 'auth_info', 'temp', 'assets/videos'];
    folders.forEach(folder => {
        if (!fs.existsSync(path.join(__dirname, folder))) {
            fs.mkdirSync(path.join(__dirname, folder), { recursive: true });
            console.log(chalk.green(`✅ Folder ${folder} dibuat`));
        }
    });
    
    // Update config
    const configPath = path.join(__dirname, 'config.js');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    configContent = configContent.replace(/ownerNumber: '6281234567890'/, `ownerNumber: '${ownerNumber}'`);
    configContent = configContent.replace(/storeName: 'Toko Digital Pro'/, `storeName: '${storeName}'`);
    
    fs.writeFileSync(configPath, configContent);
    console.log(chalk.green('✅ Config.js updated'));
    
    // Update settings
    const settingsPath = path.join(__dirname, 'data/settings.json');
    let settings = {
        storeName: storeName,
        ownerName: ownerName,
        whatsappNumber: ownerNumber,
        isOpen: true,
        openingHours: "24 Jam",
        address: "Online Store",
        prefix: "!",
        features: {
            antiLink: true,
            welcomeMessage: true,
            autoReply: true,
            useButtons: true,
            useLists: true
        },
        welcome: {
            private: "👋 Halo! Selamat datang di toko kami. Ketik !menu untuk melihat menu.",
            group: "👋 Selamat datang di grup! Bot toko online siap melayani."
        }
    };
    
    fs.writeJsonSync(settingsPath, settings, { spaces: 2 });
    console.log(chalk.green('✅ Settings.json created'));
    
    // Update admins
    const adminsPath = path.join(__dirname, 'data/admins.json');
    fs.writeJsonSync(adminsPath, [ownerNumber], { spaces: 2 });
    console.log(chalk.green('✅ Admins.json created'));
    
    console.log(chalk.cyan('\n🎉 SETUP SELESAI!'));
    console.log(chalk.cyan('\n📋 Langkah selanjutnya:'));
    console.log(chalk.white('1. Install dependencies: npm install'));
    console.log(chalk.white('2. Jalankan bot: npm start'));
    console.log(chalk.white('3. Gunakan PAIRING CODE untuk login'));
    console.log(chalk.white('4. Taruh QRIS di folder assets/qris.png'));
    console.log(chalk.white('5. Taruh video welcome di assets/videos/'));
    
    rl.close();
    process.exit(0);
}

setupBot().catch(error => {
    console.error(chalk.red('❌ Setup error:'), error);
    rl.close();
    process.exit(1);
});
