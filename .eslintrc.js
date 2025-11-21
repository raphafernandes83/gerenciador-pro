module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
    },
    rules: {
        // Apenas regras essenciais para evitar conflitos
        'no-undef': 'error',
        'no-unused-vars': 'off', // Desabilitado para compatibilidade
        'no-console': 'off',
        'no-eval': 'error',
        'no-implied-eval': 'error',
    },
    globals: {
        // Globais do projeto
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        Chart: 'readonly',
        state: 'writable',
        config: 'writable',
        ui: 'writable',
        logic: 'writable',
        charts: 'writable',
        dom: 'writable',
        Features: 'readonly',
    },
    ignorePatterns: ['node_modules/', 'test-results/', 'playwright-report/', '*.min.js'],
};
