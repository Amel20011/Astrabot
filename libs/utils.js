const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment');

// Format phone number
function formatPhoneNumber(phone) {
    const clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
        return '62' + clean.substring(1);
    }
    if (clean.startsWith('62')) {
        return clean;
    }
    if (clean.startsWith('8')) {
        return '62' + clean;
    }
    return '62' + clean;
}

// Validate phone number
function validatePhoneNumber(phone) {
    const clean = phone.replace(/\D/g, '');
    return clean.length >= 10 && clean.length <= 15;
}

// Send message dengan fallback
async function sendMessage(sock, to, content) {
    try {
        return await sock.sendMessage(to, content);
    } catch (error) {
        console.error('Error sending message:', error);
        
        // Fallback ke text saja
        if (content.text) {
            try {
                return await sock.sendMessage(to, { text: content.text });
            } catch (fallbackError) {
                console.error('Fallback juga error:', fallbackError);
            }
        }
        
        return null;
    }
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(price);
}

// Generate unique ID
function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return prefix + timestamp + random;
}

// Delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Log activity
async function logActivity(type, data) {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type,
            data,
            time: moment().format('YYYY-MM-DD HH:mm:ss')
        };
        
        const logPath = path.join(__dirname, '../data/activity.log');
        let logs = [];
        
        try {
            logs = await fs.readJson(logPath);
        } catch (e) {
            logs = [];
        }
        
        logs.push(logEntry);
        
        // Keep only last 1000 logs
        if (logs.length > 1000) {
            logs = logs.slice(-1000);
        }
        
        await fs.writeJson(logPath, logs, { spaces: 2 });
        
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

// Clean old files
async function cleanTempFiles(maxAgeHours = 24) {
    try {
        const tempPath = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempPath)) return;
        
        const files = await fs.readdir(tempPath);
        const now = Date.now();
        const maxAge = maxAgeHours * 60 * 60 * 1000;
        
        for (const file of files) {
            const filePath = path.join(tempPath, file);
            const stats = await fs.stat(filePath);
            
            if (now - stats.mtimeMs > maxAge) {
                await fs.remove(filePath);
                console.log(chalk.yellow(`🗑️  Cleaned old file: ${file}`));
            }
        }
    } catch (error) {
        console.error('Error cleaning temp files:', error);
    }
}

// Check if path exists and is accessible
async function checkPath(pathToCheck) {
    try {
        await fs.access(pathToCheck);
        return true;
    } catch (error) {
        return false;
    }
}

// Create directory if not exists
async function ensureDir(dirPath) {
    try {
        await fs.ensureDir(dirPath);
        return true;
    } catch (error) {
        console.error(`Error creating directory ${dirPath}:`, error);
        return false;
    }
}

// Get file size in readable format
function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        const bytes = stats.size;
        
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    } catch (error) {
        return 'Unknown';
    }
}

// Validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Extract text from message
function extractTextFromMessage(msg) {
    const messageType = Object.keys(msg.message)[0];
    
    switch (messageType) {
        case 'conversation':
            return msg.message.conversation;
        case 'extendedTextMessage':
            return msg.message.extendedTextMessage.text;
        case 'imageMessage':
            return msg.message.imageMessage.caption || '';
        case 'videoMessage':
            return msg.message.videoMessage.caption || '';
        case 'documentMessage':
            return msg.message.documentMessage.caption || '';
        default:
            return '';
    }
}

// Truncate text
function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

module.exports = {
    formatPhoneNumber,
    validatePhoneNumber,
    sendMessage,
    formatPrice,
    generateId,
    delay,
    logActivity,
    cleanTempFiles,
    checkPath,
    ensureDir,
    getFileSize,
    isValidUrl,
    extractTextFromMessage,
    truncateText
};
