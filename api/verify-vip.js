const { verifyVipToken } = require('../lib/vip-helper.js');

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    try {
        let token = '';
        if (req.method === 'GET') {
            token = req.query?.token || '';
        } else if (req.method === 'POST') {
            token = req.body?.token || req.query?.token || '';
        }

        if (!token) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ valid: false, error: 'Missing token parameter' }));
            return;
        }

        const result = verifyVipToken(token);
        if (!result.valid) {
            res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ valid: false, error: result.error || 'Token is invalid or expired' }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            valid: true,
            user: {
                userId: result.payload.userId,
                username: result.payload.username
            },
            roleId: result.payload.roleId,
            expiresAt: result.payload.exp,
            createdAt: result.payload.createdAt
        }));
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ valid: false, error: err.message }));
    }
};
