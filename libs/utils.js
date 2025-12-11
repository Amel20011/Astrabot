// Format phone number
function formatPhoneNumber(phone) {
    return phone.replace(/\D/g, '');
}

// Validate phone number
function validatePhoneNumber(phone) {
    const clean = phone.replace(/\D/g, '');
    return clean.length >= 10 && clean.length <= 15;
}

// Send message
async function sendMessage(sock, to, content) {
    try {
        return await sock.sendMessage(to, content);
    } catch (error) {
        console.error('Error sending message:', error);
        return null;
    }
}

module.exports = {
    formatPhoneNumber,
    validatePhoneNumber,
    sendMessage
};
