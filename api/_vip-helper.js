const crypto = require('crypto');

// VIP Role ID to enforce
const VIP_ROLE_ID = process.env.DISCORD_REQUIRED_ROLE_ID || '1549727990542508083';

// Get a consistent secret key
function getSecretKey() {
    if (process.env.VIP_SECRET_KEY) return process.env.VIP_SECRET_KEY;
    if (process.env.DISCORD_TOKEN) return crypto.createHash('sha256').update(process.env.DISCORD_TOKEN + '_blacklist_vip_salt').digest('hex');
    return 'blacklist_vip_default_secret_salt_2026_x89';
}

/**
 * Generate a signed VIP Token for a user
 */
function generateVipToken(data) {
    const durationDays = data.durationDays || 30;
    const exp = Date.now() + (durationDays * 24 * 60 * 60 * 1000);

    const payload = {
        userId: String(data.userId || 'unknown'),
        username: String(data.username || 'VIP Member'),
        roleId: String(data.roleId || VIP_ROLE_ID),
        avatar: String(data.avatar || ''),
        exp: exp,
        createdAt: Date.now(),
        nonce: crypto.randomBytes(6).toString('hex')
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
        .createHmac('sha256', getSecretKey())
        .update(payloadBase64)
        .digest('base64url');

    return `${payloadBase64}.${signature}`;
}

/**
 * Verify a signed VIP Token
 */
function verifyVipToken(token) {
    if (!token || typeof token !== 'string') {
        return { valid: false, error: 'Token is missing or invalid format' };
    }

    const parts = token.trim().split('.');
    if (parts.length !== 2) {
        return { valid: false, error: 'Malformed token structure' };
    }

    const [payloadBase64, signature] = parts;

    // Verify HMAC signature
    const expectedSignature = crypto
        .createHmac('sha256', getSecretKey())
        .update(payloadBase64)
        .digest('base64url');

    if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid token signature' };
    }

    // Parse and verify expiration
    try {
        const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
        const payload = JSON.parse(payloadJson);

        if (!payload.exp || Date.now() > Number(payload.exp)) {
            return { valid: false, error: 'VIP token has expired' };
        }

        if (payload.roleId && payload.roleId !== VIP_ROLE_ID) {
            return { valid: false, error: 'Invalid role attached to token' };
        }

        return { valid: true, payload };
    } catch (err) {
        return { valid: false, error: 'Failed to parse payload: ' + err.message };
    }
}

module.exports = {
    VIP_ROLE_ID,
    generateVipToken,
    verifyVipToken
};
