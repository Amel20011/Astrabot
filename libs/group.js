const fs = require('fs-extra');
const path = require('path');

async function setAntiLink(sock, groupId, enable) {
    try {
        const groups = await fs.readJson(path.join(__dirname, '../data/groups.json'));
        
        if (!groups[groupId]) {
            groups[groupId] = {};
        }
        
        groups[groupId].antilink = enable;
        await fs.writeJson(path.join(__dirname, '../data/groups.json'), groups, { spaces: 2 });
        
        await sock.sendMessage(groupId, {
            text: `✅ Anti-link telah ${enable ? 'diaktifkan' : 'dinonaktifkan'} di grup ini.`
        });
        
    } catch (error) {
        console.error('Error setting anti-link:', error);
    }
}

async function setWelcome(sock, groupId, type, content, settings) {
    try {
        const groups = await fs.readJson(path.join(__dirname, '../data/groups.json'));
        
        if (!groups[groupId]) {
            groups[groupId] = {};
        }
        
        if (!groups[groupId].welcome) {
            groups[groupId].welcome = {};
        }
        
        if (type === 'text') {
            groups[groupId].welcome = {
                enabled: true,
                type: 'text',
                content: content || '👋 Selamat datang di grup!'
            };
        } else if (type === 'disable') {
            groups[groupId].welcome.enabled = false;
        }
        
        await fs.writeJson(path.join(__dirname, '../data/groups.json'), groups, { spaces: 2 });
        
        await sock.sendMessage(groupId, {
            text: `✅ Welcome message telah ${type === 'disable' ? 'dinonaktifkan' : 'diatur'}.`
        });
        
    } catch (error) {
        console.error('Error setting welcome:', error);
    }
}

module.exports = {
    setAntiLink,
    setWelcome
};
