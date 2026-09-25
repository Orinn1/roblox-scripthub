/**
 * Cloudflare Worker for BlacklistScript Hub
 * Serves static assets from ./public and proxies /api/* calls (including Discord OAuth Login)
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 1. Discord OAuth Login: Redirect to OAuth handler with return_to set to this Workers domain
        if (url.pathname === '/api/discord-auth') {
            const action = url.searchParams.get('action') || '';
            const code = url.searchParams.get('code') || '';

            if (action === 'login' || (!code && !action)) {
                const returnTo = `${url.origin}/`;
                const redirectTarget = `https://blacklistscripty.vercel.app/api/discord-auth?action=login&return_to=${encodeURIComponent(returnTo)}`;
                return Response.redirect(redirectTarget, 302);
            }
        }

        // 2. Proxy all /api/* requests to backend server (e.g. /api/verify-vip, /api/roblox-game, /api/shrinkearn, /api/check-session)
        if (url.pathname.startsWith('/api/')) {
            const backendUrl = new URL(url.pathname + url.search, 'https://blacklistscripty.vercel.app');
            const headers = new Headers(request.headers);
            headers.set('x-forwarded-host', url.host);
            headers.set('x-forwarded-proto', url.protocol.replace(':', ''));

            const proxyReq = new Request(backendUrl, {
                method: request.method,
                headers: headers,
                body: (request.method !== 'GET' && request.method !== 'HEAD') ? request.body : null,
                redirect: 'follow'
            });

            try {
                const resp = await fetch(proxyReq);
                const respHeaders = new Headers(resp.headers);
                respHeaders.set('Access-Control-Allow-Origin', '*');
                return new Response(resp.body, {
                    status: resp.status,
                    statusText: resp.statusText,
                    headers: respHeaders
                });
            } catch (err) {
                return new Response(JSON.stringify({ error: 'Backend proxy error', message: err.message }), {
                    status: 502,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // 3. Clean URL rewrites
        if (url.pathname === '/favicon.ico') {
            return env.ASSETS.fetch(new Request(`${url.origin}/Logo.ico`, request));
        }

        // 4. Default: Serve static assets from public/
        return env.ASSETS.fetch(request);
    }
};
