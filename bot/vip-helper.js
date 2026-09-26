const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Roles and permissions
const ROLE_DEFINITIONS = {
    '1549057153585651923': { name: 'Admin', tag: '🛡️ Admin', color: '#ef4444', canBypass: true, priority: 1 },
    '1548695694586544271': { name: 'Dev', tag: '💻 Dev', color: '#06b6d4', canBypass: true, priority: 2 },
    '1549727990542508083': { name: 'Bypass', tag: '⚡ Bypass', color: '#eab308', canBypass: true, priority: 3 },
    '1550502141699821619': { name: 'Bypass', tag: '⚡ Bypass', color: '#eab308', canBypass: true, priority: 3 },
    '1549056973566116020': { name: 'Verified', tag: '✅ Verified', color: '#22c55e', canBypass: false, priority: 4 }
};

const VIP_ROLE_ID = process.env.DISCORD_REQUIRED_ROLE_ID || '1549727990542508083';

function resolveUserRoles(roles = []) {
    let bestRole = { id: '', name: 'Member', tag: '👤 Member', color: '#94a3b8', canBypass: false, priority: 99 };
    let canBypass = false;

    for (const rId of roles) {
        const def = ROLE_DEFINITIONS[rId];
        if (def) {
            if (def.canBypass) canBypass = true;
            if (def.priority < bestRole.priority) {
                bestRole = { id: rId, ...def };
            }
        }
    }

    return { primaryRole: bestRole, canBypass, roles };
}

// Get a consistent secret key
function getSecretKey() {
    if (process.env.VIP_SECRET_KEY) return process.env.VIP_SECRET_KEY;
    if (process.env.DISCORD_TOKEN) return crypto.createHash('sha256').update(process.env.DISCORD_TOKEN + '_blacklist_vip_salt').digest('hex');
    return 'blacklist_vip_default_secret_salt_2026_x89';
}

/**
 * Generate a signed VIP Token for a user
 * @param {Object} data - { userId, username, avatar, roles, primaryRole, canBypass }
 * @returns {string} Signed token
 */
function generateVipToken(data) {
    // Keep avatar short (omit CDN domain if present)
    let avatarStr = String(data.avatar || '');
    if (avatarStr.includes('/avatars/')) {
        avatarStr = avatarStr.split('/avatars/')[1];
    }

    const payload = {
        userId: String(data.userId || 'unknown'),
        username: String(data.username || 'Discord User').slice(0, 32),
        avatar: avatarStr.slice(0, 60),
        // Filter to only known VIP/Staff roles instead of all server roles
        roles: (Array.isArray(data.roles) ? data.roles : []).filter(id => ROLE_DEFINITIONS[id]),
        primaryRole: {
            id: data.primaryRole?.id || '',
            tag: data.primaryRole?.tag || data.primaryRole?.name || '👤 Member',
            canBypass: Boolean(data.canBypass)
        },
        canBypass: Boolean(data.canBypass),
        exp: 0, // 0 = Lifetime
        createdAt: Date.now()
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
 * @param {string} token 
 * @returns {Object} { valid: boolean, payload?: Object, error?: string }
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

        if (payload.exp && Number(payload.exp) > 0 && Date.now() > Number(payload.exp)) {
            return { valid: false, error: 'VIP token has expired' };
        }

        return { valid: true, payload };
    } catch (err) {
        return { valid: false, error: 'Failed to parse payload: ' + err.message };
    }
}

module.exports = {
    VIP_ROLE_ID,
    ROLE_DEFINITIONS,
    resolveUserRoles,
    generateVipToken,
    verifyVipToken
};
