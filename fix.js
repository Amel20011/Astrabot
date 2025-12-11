const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

console.log(chalk.cyan('🔧 Memperbaiki bot...'));

try {
    // 1. Hapus auth_info untuk fresh start
    if (fs.existsSync('./auth_info')) {
        fs.removeSync('./auth_info');
        console.log(chalk.green('✅ auth_info dihapus'));
    }
    
    // 2. Buat folder yang diperlukan
    const folders = ['data', 'libs', 'assets', 'auth_info'];
    folders.forEach(folder => {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
            console.log(chalk.green(`✅ Folder ${folder} dibuat`));
        }
    });
    
    // 3. Cek file penting
    const requiredFiles = [
        'config.js',
        'handler.js',
        'index.js',
        'package.json',
        'setup.js'
    ];
    
    requiredFiles.forEach(file => {
        if (!fs.existsSync(file)) {
            console.log(chalk.red(`❌ File ${file} tidak ditemukan!`));
            process.exit(1);
        }
    });
    
    // 4. Cek libs folder
    const libsFiles = [
        'menu.js',
        'store.js',
        'owner.js',
        'payment.js',
        'admin.js',
        'group.js',
        'utils.js'
    ];
    
    libsFiles.forEach(file => {
        const filePath = path.join('libs', file);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, `// ${file}\nmodule.exports = {};\n`);
            console.log(chalk.yellow(`⚠️ File ${file} dibuat (kosong)`));
        }
    });
    
    // 5. Install dependencies
    console.log(chalk.blue('📦 Menginstall dependencies...'));
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log(chalk.green('✅ Dependencies diinstall'));
    } catch (error) {
        console.log(chalk.yellow('⚠️ Menggunakan --force install'));
        execSync('npm install --force', { stdio: 'inherit' });
    }
    
    console.log(chalk.green('\n🎉 PERBAIKAN SELESAI!'));
    console.log(chalk.cyan('\n📋 Langkah selanjutnya:'));
    console.log(chalk.white('1. Edit config.js jika perlu'));
    console.log(chalk.white('2. Taruh QRIS di assets/qris.png'));
    console.log(chalk.white('3. Jalankan bot: npm start'));
    console.log(chalk.white('4. Scan QR code dalam 1 menit'));
    console.log(chalk.white('5. Gunakan prefix: . (titik)'));
    
} catch (error) {
    console.error(chalk.red('❌ Error dalam fix:'), error);
    process.exit(1);
}
