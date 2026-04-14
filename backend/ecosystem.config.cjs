/**
 * PM2 Ecosystem Config — AptHive Backend
 *
 * Run in development:  pm2 start ecosystem.config.cjs --env development
 * Run in production:   pm2 start ecosystem.config.cjs --env production
 * View logs:           pm2 logs apthive-api
 * Monitor:             pm2 monit
 * Stop all:            pm2 stop all
 * Restart:             pm2 restart apthive-api
 */

module.exports = {
  apps: [
    {
      name: "apthive-api",

      // Entry point of the app
      script: "./src/server.js",

      // "cluster" mode = PM2 forks this file into multiple OS processes.
      // Each process gets its own V8 engine and event loop.
      // The OS load-balances incoming TCP connections across them.
      exec_mode: "cluster",

      // "max" = one process per CPU core.
      // On a 2-core server: 2 processes.
      // On a 4-core server: 4 processes.
      // You can also set a fixed number like instances: 2
      instances: "max",

      // Automatically restart the process if it runs out of memory.
      // Prevents slow memory leaks from taking the whole server down.
      max_memory_restart: "500M",

      // Watch for file changes in development only.
      // NEVER enable in production — every save would restart all processes.
      watch: false,

      // Environment variables injected in development
      env_development: {
        NODE_ENV: "development",
        PORT: 5000,
      },

      // Environment variables injected in production
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },

      // How PM2 handles crashes:
      // Wait 3 seconds before restarting a crashed process.
      // This prevents a crash loop from hammering your DB with reconnects.
      restart_delay: 3000,

      // After 10 consecutive restarts in a short window,
      // stop trying — something is fundamentally broken.
      max_restarts: 10,
    },
  ],
};
