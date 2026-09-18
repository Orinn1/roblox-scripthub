const crypto = require('crypto');

const VIP_ROLE_ID = process.env.DISCORD_REQUIRED_ROLE_ID || '1549727990542508083';

function getSecretKey() {
    if (process.env.VIP_SECRET_KEY) return process.env.VIP_SECRET_KEY;
    if (process.env.DISCORD_TOKEN) return crypto.createHash('sha256').update(process.env.DISCORD_TOKEN + '_blacklist_vip_salt').digest('hex');
    return 'blacklist_vip_default_secret_salt_2026_x89';
}

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

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        let token = '';
        if (req.method === 'GET') {
            token = req.query?.token || '';
        } else if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
            token = body?.token || req.query?.token || '';
        }

        if (!token) {
            return res.status(400).json({ valid: false, error: 'Missing token parameter' });
        }

        const result = verifyVipToken(token);
        if (!result.valid) {
            return res.status(401).json({ valid: false, error: result.error || 'Token is invalid or expired' });
        }

        return res.status(200).json({
            valid: true,
            user: {
                userId: result.payload.userId,
                username: result.payload.username
            },
            roleId: result.payload.roleId || VIP_ROLE_ID,
            expiresAt: result.payload.exp,
            createdAt: result.payload.createdAt
        });
    } catch (err) {
        return res.status(500).json({ valid: false, error: err.message });
    }
};
