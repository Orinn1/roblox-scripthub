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
        return { valid: false, error: 'Token missing' };
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
        return { valid: false, error: 'Invalid token format' };
    }

    const [payloadBase64, providedSig] = parts;

    try {
        const expectedSig = crypto
            .createHmac('sha256', getSecretKey())
            .update(payloadBase64)
            .digest('base64url');

        // Constant-time comparison
        const expectedBuf = Buffer.from(expectedSig);
        const providedBuf = Buffer.from(providedSig);

        if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
            return { valid: false, error: 'Signature mismatch' };
        }

        const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
        const payload = JSON.parse(payloadJson);

        if (payload.exp && Date.now() > payload.exp) {
            return { valid: false, error: 'Token expired', payload };
        }

        return { valid: true, payload };
    } catch (e) {
        return { valid: false, error: 'Failed to decode token' };
    }
}

module.exports = {
    VIP_ROLE_ID,
    generateVipToken,
    verifyVipToken
};
