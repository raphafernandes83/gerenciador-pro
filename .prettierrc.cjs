module.exports = {
    // Configuração compatível com o projeto existente
    semi: true,
    trailingComma: 'es5',
    singleQuote: true,
    printWidth: 100,
    tabWidth: 4,
    useTabs: false,

    // Formatação específica para diferentes tipos de arquivo
    overrides: [
        {
            files: '*.json',
            options: {
                tabWidth: 2,
            },
        },
        {
            files: '*.yml',
            options: {
                tabWidth: 2,
            },
        },
        {
            files: '*.md',
            options: {
                printWidth: 80,
                proseWrap: 'always',
            },
        },
    ],
};
