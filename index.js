/**
 * Root Entry Point for Hosting Containers (Pterodactyl / Cloud Hosts)
 * Automatically forwards execution to the Discord Bot
 */

// If RUN_ALL_BOTS is enabled in environment, run all bots
if (process.env.RUN_ALL_BOTS === 'true') {
    require('./run-all-bots.js');
} else {
    // Default: Run main Roblox Discord Bot
    require('./bot/index.js');
}

