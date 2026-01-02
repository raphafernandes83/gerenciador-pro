/**
 * =============================================================================
 * GUARD: THEME CONTRACT
 * =============================================================================
 * 
 * Valida que todos os temas suportados definem os tokens mínimos obrigatórios.
 * 
 * @version TAREFA 26H - 28/12/2025
 * 
 * Uso: node scripts/guard-theme-contract.cjs
 * Exit 0 = PASS, Exit 1 = FAIL
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

/**
 * Lista única de temas suportados
 * Se adicionar novo tema, registre aqui primeiro.
 */
const SUPPORTED_THEMES = [
    'moderno',
    'claro',
    'matrix',
    'daltonismo',
    'unified-pro'
];

/**
 * Tokens mínimos obrigatórios por categoria.
 * Temas padrão usam variáveis CSS globais (:root).
 * Tema unified-pro usa tokens próprios (--up-*).
 */
const STANDARD_TOKENS = [
    // Tokens validados indiretamente via existência do tema
    // Os temas padrão herdam de :root, então checamos apenas o bloco
];

const UNIFIED_PRO_REQUIRED_TOKENS = [
    '--up-bg-base',
    '--up-bg-panel',
    '--up-border',
    '--up-text-primary',
    '--up-text-muted'
];

// Arquivos CSS a serem verificados
const CSS_FILES = [
    'style.css',
    'css/theme-unified-pro.css'
];

// =============================================================================
// FUNCTIONS
// =============================================================================

/**
 * Lê um arquivo CSS e retorna seu conteúdo
 */
function readCSSFile(filePath) {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
        return null;
    }
    return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Verifica se um tema existe em algum arquivo CSS
 * Procura por: body[data-theme="TEMA"]
 */
function themeExistsInCSS(themeId, cssContents) {
    const patterns = [
        new RegExp(`body\\[data-theme=["']${themeId}["']\\]`, 'g'),
        new RegExp(`\\[data-theme=["']${themeId}["']\\]`, 'g')
    ];

    for (const content of cssContents) {
        if (!content) continue;
        for (const pattern of patterns) {
            if (pattern.test(content)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Verifica se os tokens obrigatórios estão definidos para unified-pro
 */
function validateUnifiedProTokens(cssContent) {
    const missing = [];

    for (const token of UNIFIED_PRO_REQUIRED_TOKENS) {
        // Procura pela definição do token: --token: value;
        const pattern = new RegExp(`${token}\\s*:\\s*[^;]+;`, 'g');
        if (!pattern.test(cssContent)) {
            missing.push(token);
        }
    }

    return missing;
}

/**
 * Verifica se tema existe no seletor de temas do index.html
 */
function themeExistsInSelector(themeId, indexContent) {
    const pattern = new RegExp(`data-theme=["']${themeId}["']`, 'g');
    return pattern.test(indexContent);
}

// =============================================================================
// MAIN
// =============================================================================

console.log('🎨 Guard Theme Contract: Validando temas...\n');

let hasErrors = false;
const errors = [];

// Carregar conteúdos CSS
const cssContents = CSS_FILES.map(readCSSFile).filter(Boolean);

if (cssContents.length === 0) {
    console.error('❌ Nenhum arquivo CSS encontrado para validação!');
    process.exit(1);
}

// Carregar index.html para validar seletor
const indexPath = path.join(process.cwd(), 'index.html');
const indexContent = fs.existsSync(indexPath)
    ? fs.readFileSync(indexPath, 'utf-8')
    : '';

// Validar cada tema
for (const themeId of SUPPORTED_THEMES) {
    console.log(`   Verificando tema: ${themeId}...`);

    // 1. Verificar se tema existe em algum CSS
    const existsInCSS = themeExistsInCSS(themeId, cssContents);

    if (!existsInCSS) {
        // Temas padrão (moderno, claro, matrix, daltonismo) herdam de :root
        // Só precisam existir no seletor de temas
        if (themeId !== 'unified-pro') {
            // Verificar se existe no seletor de temas do index.html
            if (!themeExistsInSelector(themeId, indexContent)) {
                errors.push({
                    theme: themeId,
                    error: 'Tema não encontrado no seletor de temas (index.html)',
                    file: 'index.html'
                });
                hasErrors = true;
            }
        } else {
            errors.push({
                theme: themeId,
                error: 'Bloco CSS body[data-theme="unified-pro"] não encontrado',
                file: 'css/theme-unified-pro.css'
            });
            hasErrors = true;
        }
    }

    // 2. Validar tokens obrigatórios do unified-pro
    if (themeId === 'unified-pro') {
        const unifiedProCSS = readCSSFile('css/theme-unified-pro.css');
        if (unifiedProCSS) {
            const missingTokens = validateUnifiedProTokens(unifiedProCSS);
            if (missingTokens.length > 0) {
                for (const token of missingTokens) {
                    errors.push({
                        theme: themeId,
                        error: `Token obrigatório faltando: ${token}`,
                        file: 'css/theme-unified-pro.css'
                    });
                }
                hasErrors = true;
            }
        }
    }
}

// =============================================================================
// RESULTADO
// =============================================================================

console.log('');

if (hasErrors) {
    console.error('❌ Guard Theme Contract FALHOU!\n');
    console.error('   Violações encontradas:\n');

    for (const err of errors) {
        console.error(`   ❌ Tema: ${err.theme}`);
        console.error(`      Erro: ${err.error}`);
        console.error(`      Arquivo: ${err.file}\n`);
    }

    console.error('   💡 Corrija os problemas acima e execute novamente.\n');
    process.exit(1);
} else {
    console.log('✅ Guard Theme Contract PASSOU!\n');
    console.log(`   📋 ${SUPPORTED_THEMES.length} tema(s) validado(s):`);
    for (const themeId of SUPPORTED_THEMES) {
        console.log(`      ✓ ${themeId}`);
    }
    console.log('');
    process.exit(0);
}
