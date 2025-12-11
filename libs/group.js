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
        await sock.sendMessage(groupId, {
            text: '❌ Gagal mengatur anti-link.'
        });
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
        } else if (type === 'video') {
            groups[groupId].welcome = {
                enabled: true,
                type: 'video',
                content: content || ''
            };
        } else if (type === 'disable') {
            groups[groupId].welcome.enabled = false;
        }
        
        await fs.writeJson(path.join(__dirname, '../data/groups.json'), groups, { spaces: 2 });
        
        await sock.sendMessage(groupId, {
            text: `✅ Welcome message telah ${type === 'disable' ? 'dinonaktifkan' : 'diatur (' + type + ')'}.`
        });
        
    } catch (error) {
        console.error('Error setting welcome:', error);
        await sock.sendMessage(groupId, {
            text: '❌ Gagal mengatur welcome message.'
        });
    }
}

async function handleParticipantsUpdate(sock, update) {
    try {
        const { id, participants, action } = update;
        
        if (action === 'add') {
            const groups = await fs.readJson(path.join(__dirname, '../data/groups.json'));
            const groupData = groups[id] || {};
            
            if (groupData.welcome?.enabled) {
                for (const participant of participants) {
                    if (groupData.welcome.type === 'text') {
                        await sock.sendMessage(id, {
                            text: `👋 @${participant.split('@')[0]} ${groupData.welcome.content || 'Selamat datang di grup!'}`,
                            mentions: [participant]
                        });
                    }
                    // Untuk video, butuh implementasi lebih lanjut
                }
            }
        }
        
    } catch (error) {
        console.error('Error in participants update:', error);
    }
}

module.exports = {
    setAntiLink,
    setWelcome,
    handleParticipantsUpdate
};
