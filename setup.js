const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.cyan('🤖 SETUP BOT TOKO LIVIAA\n'));

// Create folders
const folders = ['data', 'libs', 'assets', 'auth_info'];
folders.forEach(folder => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
        console.log(chalk.green(`✓ Folder ${folder} dibuat`));
    }
});

console.log(chalk.green('\n✅ Setup selesai!'));
console.log(chalk.cyan('\n📋 Langkah selanjutnya:'));
console.log('1. npm install --force');
console.log('2. npm start');
console.log('3. Scan QR code');
console.log('4. Kirim .menu untuk mulai\n');
