/**
 * Guard Encoding - Verificar que não há caracteres corrompidos
 * 
 * COMPORTAMENTO ESTRITO:
 * - PASS (exit 0): Sem problemas OU apenas em arquivos da LEGACY_ALLOWLIST
 * - FAIL (exit 1): Novos problemas em arquivos não permitidos
 * 
 * Executar: npm run guard:encoding
 * 
 * @version TAREFA 17C - 28/12/2025
 */

const fs = require('fs');
const path = require('path');

console.log('🔤 Guard Encoding: Verificando arquivos...\n');

/**
 * Allowlist de arquivos legados com problemas de encoding conhecidos
 * Estes arquivos têm mojibake histórico que não pode ser facilmente corrigido
 * sem causar outros problemas de encoding.
 */
const LEGACY_ALLOWLIST = [
    'ui.js',           // Comentários e strings com mojibake legado (200+ linhas)
    'src/ui/templates/ParametersCardController.js', // Comentários com acentos corrompidos (14 linhas)
];

// Arquivos para verificar
const filesToCheck = [
    'index.html',
    'main.js',
    'ui.js',
    'events.js',
    'sidebar.js',
    'charts.js',
    'logic.js',
    'dom.js',
    'style.css',
    'sidebar.css'
];

// Padrões de encoding corrompido
const patterns = [
    { regex: /\uFFFD/g, name: 'U+FFFD (�)', critical: true },
    { regex: /Ã¡/g, name: 'Mojibake: Ã¡ (á)', critical: false },
    { regex: /Ã©/g, name: 'Mojibake: Ã© (é)', critical: false },
    { regex: /Ã§/g, name: 'Mojibake: Ã§ (ç)', critical: false },
    { regex: /Ã£/g, name: 'Mojibake: Ã£ (ã)', critical: false },
    { regex: /Ã³/g, name: 'Mojibake: Ã³ (ó)', critical: false },
    { regex: /Ãº/g, name: 'Mojibake: Ãº (ú)', critical: false },
    { regex: /Ã­/g, name: 'Mojibake: Ã­ (í)', critical: false },
    { regex: /Ã‚/g, name: 'Mojibake: Ã‚ (Â)', critical: false },
];

const legacyViolations = [];
const newViolations = [];
const rootDir = path.join(__dirname, '..');

/**
 * Verifica se um arquivo está na allowlist
 */
function isInAllowlist(filePath) {
    const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
    return LEGACY_ALLOWLIST.some(allowed =>
        relativePath === allowed || relativePath.endsWith(allowed)
    );
}

/**
 * Verifica um arquivo
 */
function checkFile(filePath, relativeName) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const isLegacy = isInAllowlist(filePath);

    patterns.forEach(({ regex, name, critical }) => {
        const matches = content.match(regex);
        if (matches) {
            const violation = {
                file: relativeName,
                type: name,
                count: matches.length,
                critical: critical,
            };

            if (isLegacy && !critical) {
                legacyViolations.push(violation);
            } else {
                newViolations.push(violation);
            }
        }
    });
}

// Verificar arquivos principais
filesToCheck.forEach(file => {
    const filePath = path.join(rootDir, file);
    checkFile(filePath, file);
});

// Verificar src/
const srcDir = path.join(rootDir, 'src');
if (fs.existsSync(srcDir)) {
    try {
        const walkDir = (dir) => {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    walkDir(fullPath);
                } else if (file.endsWith('.js') || file.endsWith('.ts')) {
                    const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
                    checkFile(fullPath, relativePath);
                }
            });
        };
        walkDir(srcDir);
    } catch (e) {
        console.log(`  ⚠️ Erro ao verificar src/: ${e.message}`);
    }
}

// Resultado
const totalNew = newViolations.length;
const totalLegacy = legacyViolations.length;

if (totalNew === 0 && totalLegacy === 0) {
    console.log('✅ Guard Encoding PASSOU: Nenhum problema de encoding!\n');
    process.exit(0);
} else if (totalNew === 0) {
    // Apenas problemas em arquivos legados (allowlist)
    console.log('✅ Guard Encoding PASSOU: Apenas problemas legados conhecidos.\n');
    console.log(`   📋 ${totalLegacy} ocorrência(s) em ${new Set(legacyViolations.map(v => v.file)).size} arquivo(s) da allowlist:\n`);

    const byFile = {};
    legacyViolations.forEach(v => {
        if (!byFile[v.file]) byFile[v.file] = [];
        byFile[v.file].push(`${v.type} (${v.count}x)`);
    });

    Object.entries(byFile).forEach(([file, issues]) => {
        console.log(`      📄 ${file}: ${issues.length} tipo(s)`);
    });

    console.log('\n   (Arquivos na LEGACY_ALLOWLIST - não bloqueiam CI)\n');
    process.exit(0);
} else {
    // Problemas NOVOS encontrados - FALHA!
    console.log('❌ Guard Encoding FALHOU: Novos problemas de encoding!\n');

    const byFile = {};
    newViolations.forEach(v => {
        if (!byFile[v.file]) byFile[v.file] = [];
        byFile[v.file].push(`${v.type} (${v.count}x)`);
    });

    Object.entries(byFile).forEach(([file, issues]) => {
        console.log(`  ❌ ${file}:`);
        issues.forEach(i => console.log(`      - ${i}`));
    });

    console.log('\n   Para corrigir: Use UTF-8 sem BOM e verifique a origem dos caracteres.');
    console.log('   Se o arquivo é legado, adicione-o à LEGACY_ALLOWLIST em guard-encoding.cjs\n');
    process.exit(1);
}
