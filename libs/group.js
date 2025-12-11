const fs = require('fs-extra');
const path = require('path');
const utils = require('./utils');

// Load group data
async function getGroupData(groupId) {
    try {
        const groups = await fs.readJson(path.join(__dirname, '../data/groups.json'));
        if (!groups[groupId]) {
            groups[groupId] = {
                antilink: false,
                welcome: {
                    enabled: false,
                    text: '👋 Selamat datang di grup!',
                    video: null,
                    type: 'text'
                },
                rules: [],
                admins: [],
                warnings: {}
            };
            await saveGroupData(groupId, groups[groupId]);
        }
        return groups[groupId];
    } catch (error) {
        return {
            antilink: false,
            welcome: { enabled: false, text: '👋 Selamat datang di grup!', type: 'text' },
            rules: [],
            admins: [],
            warnings: {}
        };
    }
}

// Save group data
async function saveGroupData(groupId, data) {
    try {
        const groups = await fs.readJson(path.join(__dirname, '../data/groups.json'));
        groups[groupId] = data;
        await fs.writeJson(path.join(__dirname, '../data/groups.json'), groups, { spaces: 2 });
        return true;
    } catch (error) {
        console.error('Error saving group data:', error);
        return false;
    }
}

// Check if user is group admin
async function isGroupAdmin(sock, groupId, userId) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        const participant = metadata.participants.find(p => p.id === userId);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (error) {
        return false;
    }
}

// Check if bot is group admin
async function isBotAdmin(sock, groupId) {
    try {
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        return await isGroupAdmin(sock, groupId, botId);
    } catch (error) {
        return false;
    }
}

// Anti-link system
async function checkAntiLink(sock, msg) {
    try {
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || from;
        
        // Skip if bot is not admin
        if (!(await isBotAdmin(sock, from))) return false;
        
        const groupData = await getGroupData(from);
        if (!groupData.antilink) return false;
        
        // Skip if sender is admin
        if (await isGroupAdmin(sock, from, sender)) return false;
        
        const messageType = Object.keys(msg.message)[0];
        let text = '';
        
        // Extract text
        if (messageType === 'conversation') {
            text = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            text = msg.message.extendedTextMessage.text;
        }
        
        if (!text) return false;
        
        // Link detection patterns
        const urlPatterns = [
            /https?:\/\/[^\s]+/g,
            /www\.[^\s]+\.[^\s]+/g,
            /[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            /(chat\.whatsapp\.com|invite\.whatsapp\.com)/g,
            /(t\.me|telegram\.me|telegram\.dog)/g,
            /(instagram\.com|facebook\.com|twitter\.com|youtube\.com|tiktok\.com)/g
        ];
        
        let hasLink = false;
        for (const pattern of urlPatterns) {
            if (pattern.test(text)) {
                hasLink = true;
                break;
            }
        }
        
        if (hasLink) {
            // Delete message
            await sock.sendMessage(from, { delete: msg.key });
            
            // Add warning
            if (!groupData.warnings[sender]) {
                groupData.warnings[sender] = 0;
            }
            groupData.warnings[sender]++;
            
            await saveGroupData(from, groupData);
            
            // Send warning
            const warningMsg = `⚠️ @${sender.split('@')[0]} dilarang mengirim link di grup ini!\n`
                + `Peringatan: ${groupData.warnings[sender]}/3\n`
                + `Peringatan berikutnya akan dikenakan tindakan.`;
            
            await sock.sendMessage(from, {
                text: warningMsg,
                mentions: [sender]
            });
            
            // Kick if 3 warnings
            if (groupData.warnings[sender] >= 3) {
                try {
                    await sock.groupParticipantsUpdate(from, [sender], 'remove');
                    await sock.sendMessage(from, {
                        text: `🚫 @${sender.split('@')[0]} telah dikeluarkan karena melanggar peraturan.`,
                        mentions: [sender]
                    });
                    
                    // Reset warnings
                    delete groupData.warnings[sender];
                    await saveGroupData(from, groupData);
                } catch (kickError) {
                    console.error('Error kicking user:', kickError);
                }
            }
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error in anti-link:', error);
        return false;
    }
}

// Welcome system
async function sendWelcomeMessage(sock, groupId, userId) {
    try {
        const groupData = await getGroupData(groupId);
        if (!groupData.welcome.enabled) return;
        
        const welcomeConfig = groupData.welcome;
        
        if (welcomeConfig.type === 'text' && welcomeConfig.text) {
            await sock.sendMessage(groupId, {
                text: `👋 @${userId.split('@')[0]} ${welcomeConfig.text}\n\nSelamat datang di grup!`,
                mentions: [userId]
            });
        } 
        else if (welcomeConfig.type === 'video' && welcomeConfig.video) {
            try {
                // Kirim video dari URL
                await sock.sendMessage(groupId, {
                    video: { url: welcomeConfig.video },
                    caption: `👋 @${userId.split('@')[0]} Selamat datang di grup!\n\n${welcomeConfig.text || ''}`,
                    mentions: [userId]
                });
            } catch (videoError) {
                console.error('Error sending welcome video:', videoError);
                // Fallback ke text
                await sock.sendMessage(groupId, {
                    text: `👋 @${userId.split('@')[0]} Selamat datang di grup!\n\n${welcomeConfig.text || ''}`,
                    mentions: [userId]
                });
            }
        }
        
    } catch (error) {
        console.error('Error sending welcome:', error);
    }
}

// Handle group messages
async function handleGroupMessage(sock, msg) {
    try {
        // Anti-link check
        await checkAntiLink(sock, msg);
        
        // Other group features can be added here
        
    } catch (error) {
        console.error('Error in group message handler:', error);
    }
}

// Handle group participants update
async function handleParticipantsUpdate(sock, update) {
    try {
        const { id, participants, action } = update;
        
        if (action === 'add') {
            for (const participant of participants) {
                await sendWelcomeMessage(sock, id, participant);
            }
        }
        
    } catch (error) {
        console.error('Error in participants update:', error);
    }
}

// Set anti-link
async function setAntiLink(sock, groupId, enable) {
    try {
        const groupData = await getGroupData(groupId);
        groupData.antilink = enable;
        await saveGroupData(groupId, groupData);
        
        await sock.sendMessage(groupId, {
            text: `✅ Anti-link telah ${enable ? 'diaktifkan' : 'dinonaktifkan'} di grup ini.`
        });
        
    } catch (error) {
        console.error('Error setting anti-link:', error);
    }
}

// Set welcome message
async function setWelcomeMessage(sock, groupId, type, content, settings) {
    try {
        const groupData = await getGroupData(groupId);
        
        if (type === 'text') {
            groupData.welcome = {
                enabled: true,
                type: 'text',
                text: content || '👋 Selamat datang di grup!',
                video: null
            };
        } 
        else if (type === 'video') {
            groupData.welcome = {
                enabled: true,
                type: 'video',
                text: content || 'Selamat datang di grup!',
                video: content // URL video
            };
        } 
        else if (type === 'disable') {
            groupData.welcome.enabled = false;
        }
        
        await saveGroupData(groupId, groupData);
        
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

// Get group info
async function getGroupInfo(sock, groupId) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        return {
            id: metadata.id,
            subject: metadata.subject,
            creation: metadata.creation,
            owner: metadata.owner,
            desc: metadata.desc,
            participants: metadata.participants.length,
            isBotAdmin: await isBotAdmin(sock, groupId)
        };
    } catch (error) {
        return null;
    }
}

module.exports = {
    handleGroupMessage,
    handleParticipantsUpdate,
    setAntiLink,
    setWelcomeMessage,
    getGroupData,
    isGroupAdmin,
    isBotAdmin,
    getGroupInfo
};
