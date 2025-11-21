import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: 'tests/e2e',
    workers: 1,
    timeout: 60000,
    use: {
        headless: true,
    },
    webServer: {
        command: 'node server.js',
        port: 3000,
        reuseExistingServer: true,
        timeout: 60000,
    },
});
