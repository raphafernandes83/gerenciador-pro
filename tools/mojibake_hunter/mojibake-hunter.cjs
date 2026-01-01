/**
 * 🔍 Mojibake Hunter - Scanner de caracteres corrompidos
 * 
 * Detecta padrões de encoding corrompido (mojibake) em arquivos do projeto.
 * Gera relatórios em CSV e Markdown.
 * 
 * Uso: node tools/mojibake_hunter/mojibake-hunter.cjs --mode=scan
 * 
 * @module MojibakeHunter
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const CONFIG = {
    // Pastas a ignorar (glob patterns)
    EXCLUDE_DIRS: [
        'backup_',      // backup_* (qualquer pasta começando com backup_)
        'temp_',        // temp_* (qualquer pasta começando com temp_)
        'reports',      // reports/
        'node_modules', // node_modules/
        'dist',         // dist/
        'build',        // build/
        '.git',         // .git/
        '.gemini',      // .gemini/ (IDE artifacts)
        // 🔧 TAREFA 42: Exclusões adicionais para baseline runtime-only
        'arquivos moji',    // pasta de análise mojibake (não runtime)
        'tools',            // ferramentas de desenvolvimento
        'scripts',          // scripts de build/guard
        'tests',            // testes
        'docs',             // documentação
        'playwright-report', // relatórios playwright
        'test-results',     // resultados de teste
        '.agent',           // configurações de agente
    ],

    // 🔧 TAREFA 42: Extensões runtime-only (removido .md e .json)
    INCLUDE_EXTENSIONS: ['.js', '.cjs', '.mjs', '.ts', '.css', '.html'],

    // Diretório de relatórios
    REPORTS_DIR: 'reports/mojibake',

    // Limite de arquivos no Top
    TOP_FILES_LIMIT: 20,
};

// ============================================================================
// PADRÕES DE MOJIBAKE (Precisos, evitando falsos positivos)
// ============================================================================

const MOJIBAKE_PATTERNS = [
    {
        name: 'REPLACEMENT_CHAR',
        description: 'Replacement character (U+FFFD)',
        regex: /\uFFFD/g,
        severity: 'high',
    },
    {
        name: 'EMOJI_MOJIBAKE',
        description: 'Emoji corrompido (ðŸ...)',
        // Padrão mais específico: ð seguido de caracteres típicos de mojibake de emoji
        regex: /ð[\x9F\x80-\xBF][\x80-\xBF]?[\x80-\xBF]?/g,
        severity: 'high',
    },
    {
        name: 'QUOTE_MOJIBAKE',
        description: 'Aspas/caracteres especiais corrompidos (â€, â€™, â€œ)',
        regex: /â€[™œ"¦¢˜]/g,
        severity: 'medium',
    },
    {
        name: 'ORDINAL_MOJIBAKE',
        description: 'Ordinais corrompidos (Âª, Âº)',
        regex: /Â[ªº]/g,
        severity: 'medium',
    },
    {
        name: 'DOUBLE_ENCODED_LATIN',
        description: 'UTF-8 double-encoded (Ã£, Ã©, Ã§, Ãµ, Ã¡, Ã³, Ã­, Ãº, Ã‰, Ãƒ)',
        // Padrão específico para sequências Ã + caractere
        regex: /Ã[£©§µ¡³­ºŠƒ‰¢]/g,
        severity: 'medium',
    },
    {
        name: 'DOUBLE_ENCODED_EXTENDED',
        description: 'Double-encoded estendido (Â°, Â³, Â², Â·)',
        regex: /Â[°³²·]/g,
        severity: 'low',
    },
    {
        name: 'CORRUPTED_ELLIPSIS',
        description: 'Reticências corrompidas (â€¦)',
        regex: /â€¦/g,
        severity: 'low',
    },
    {
        name: 'CORRUPTED_DASH',
        description: 'Travessão corrompido (â€")',
        regex: /â€"/g,
        severity: 'low',
    },
];

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Verifica se um caminho deve ser excluído
 */
function shouldExclude(filePath) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const parts = normalizedPath.split('/');

    for (const part of parts) {
        for (const exclude of CONFIG.EXCLUDE_DIRS) {
            // Verifica se a parte começa com o padrão de exclusão
            if (part.startsWith(exclude) || part === exclude) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Verifica se a extensão é permitida
 */
function isAllowedExtension(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return CONFIG.INCLUDE_EXTENSIONS.includes(ext);
}

/**
 * Percorre recursivamente o diretório
 */
function walkDirectory(dir, fileList = []) {
    try {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);

            // Verificar exclusão antes de continuar
            if (shouldExclude(filePath)) {
                continue;
            }

            try {
                const stat = fs.statSync(filePath);

                if (stat.isDirectory()) {
                    walkDirectory(filePath, fileList);
                } else if (stat.isFile() && isAllowedExtension(filePath)) {
                    fileList.push(filePath);
                }
            } catch (err) {
                // Ignora erros de acesso a arquivos individuais
                console.warn(`⚠️ Não foi possível acessar: ${filePath}`);
            }
        }
    } catch (err) {
        console.warn(`⚠️ Não foi possível ler diretório: ${dir}`);
    }

    return fileList;
}

/**
 * Escaneia um arquivo por padrões de mojibake
 */
function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const results = [];

        for (const pattern of MOJIBAKE_PATTERNS) {
            const matches = content.match(pattern.regex);
            if (matches && matches.length > 0) {
                results.push({
                    pattern: pattern.name,
                    description: pattern.description,
                    severity: pattern.severity,
                    count: matches.length,
                    samples: [...new Set(matches)].slice(0, 5), // Até 5 amostras únicas
                });
            }
        }

        return results;
    } catch (err) {
        console.warn(`⚠️ Erro ao ler arquivo: ${filePath}`);
        return [];
    }
}

// ============================================================================
// GERAÇÃO DE RELATÓRIOS
// ============================================================================

/**
 * Gera timestamp para nome do arquivo
 */
function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const sec = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}-${hour}${min}${sec}`;
}

/**
 * Gera relatório Markdown
 */
function generateMarkdownReport(scanResults, timestamp) {
    const lines = [];

    lines.push('# 🔍 Mojibake Hunter - Relatório de Scan');
    lines.push('');
    lines.push(`**Data**: ${new Date().toLocaleString('pt-BR')}`);
    lines.push(`**Arquivos escaneados**: ${scanResults.totalFiles}`);
    lines.push(`**Arquivos com problemas**: ${scanResults.filesWithIssues}`);
    lines.push(`**Total de ocorrências**: ${scanResults.totalOccurrences}`);
    lines.push('');

    // Resumo por padrão
    lines.push('## 📊 Resumo por Padrão');
    lines.push('');
    lines.push('| Padrão | Descrição | Ocorrências | Severidade |');
    lines.push('|--------|-----------|-------------|------------|');

    for (const [patternName, data] of Object.entries(scanResults.patternSummary)) {
        lines.push(`| ${patternName} | ${data.description} | ${data.count} | ${data.severity} |`);
    }
    lines.push('');

    // Top arquivos
    lines.push(`## 📁 Top ${CONFIG.TOP_FILES_LIMIT} Arquivos com Mais Problemas`);
    lines.push('');
    lines.push('| # | Arquivo | Ocorrências | Padrões |');
    lines.push('|---|---------|-------------|---------|');

    const topFiles = scanResults.fileResults
        .sort((a, b) => b.totalCount - a.totalCount)
        .slice(0, CONFIG.TOP_FILES_LIMIT);

    topFiles.forEach((file, index) => {
        const patterns = file.patterns.map(p => p.pattern).join(', ');
        const relativePath = path.relative(process.cwd(), file.filePath).replace(/\\/g, '/');
        lines.push(`| ${index + 1} | \`${relativePath}\` | ${file.totalCount} | ${patterns} |`);
    });
    lines.push('');

    // Detalhes
    lines.push('## 📋 Detalhes por Arquivo');
    lines.push('');

    for (const file of topFiles.slice(0, 10)) {
        const relativePath = path.relative(process.cwd(), file.filePath).replace(/\\/g, '/');
        lines.push(`### \`${relativePath}\``);
        lines.push('');
        for (const pattern of file.patterns) {
            lines.push(`- **${pattern.pattern}** (${pattern.severity}): ${pattern.count} ocorrências`);
            if (pattern.samples.length > 0) {
                lines.push(`  - Amostras: \`${pattern.samples.join('`, `')}\``);
            }
        }
        lines.push('');
    }

    // Exclusões
    lines.push('## ⛔ Pastas Excluídas do Scan');
    lines.push('');
    CONFIG.EXCLUDE_DIRS.forEach(dir => {
        lines.push(`- \`${dir}*\``);
    });
    lines.push('');

    return lines.join('\n');
}

/**
 * Gera relatório CSV
 */
function generateCSVReport(scanResults) {
    const lines = [];

    // Header
    lines.push('Arquivo,Padrão,Descrição,Severidade,Ocorrências,Amostras');

    for (const file of scanResults.fileResults) {
        const relativePath = path.relative(process.cwd(), file.filePath).replace(/\\/g, '/');
        for (const pattern of file.patterns) {
            const samples = pattern.samples.join('; ').replace(/"/g, '""');
            lines.push(`"${relativePath}","${pattern.pattern}","${pattern.description}","${pattern.severity}",${pattern.count},"${samples}"`);
        }
    }

    return lines.join('\n');
}

// ============================================================================
// EXECUÇÃO PRINCIPAL
// ============================================================================

function main() {
    console.log('🔍 Mojibake Hunter v1.0.0');
    console.log('='.repeat(50));
    console.log('');

    const startTime = Date.now();
    const projectRoot = process.cwd();

    console.log(`📂 Escaneando: ${projectRoot}`);
    console.log(`⛔ Excluindo: ${CONFIG.EXCLUDE_DIRS.join(', ')}`);
    console.log('');

    // Coletar arquivos
    console.log('📋 Coletando arquivos...');
    const files = walkDirectory(projectRoot);
    console.log(`   Encontrados: ${files.length} arquivos`);
    console.log('');

    // Escanear arquivos
    console.log('🔬 Escaneando por mojibake...');
    const fileResults = [];
    const patternSummary = {};
    let totalOccurrences = 0;

    for (const pattern of MOJIBAKE_PATTERNS) {
        patternSummary[pattern.name] = {
            description: pattern.description,
            severity: pattern.severity,
            count: 0,
        };
    }

    for (const filePath of files) {
        const results = scanFile(filePath);
        if (results.length > 0) {
            const totalCount = results.reduce((sum, r) => sum + r.count, 0);
            fileResults.push({
                filePath,
                patterns: results,
                totalCount,
            });

            for (const result of results) {
                patternSummary[result.pattern].count += result.count;
                totalOccurrences += result.count;
            }
        }
    }

    const scanResults = {
        totalFiles: files.length,
        filesWithIssues: fileResults.length,
        totalOccurrences,
        patternSummary,
        fileResults,
    };

    console.log(`   Arquivos com problemas: ${fileResults.length}`);
    console.log(`   Total de ocorrências: ${totalOccurrences}`);
    console.log('');

    // Gerar relatórios
    console.log('📝 Gerando relatórios...');
    const timestamp = getTimestamp();
    const reportsDir = path.join(projectRoot, CONFIG.REPORTS_DIR);

    // Criar diretório de relatórios se não existir
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Markdown
    // 🔧 TAREFA 42: Usado prefixo BASELINE para relatórios de baseline
    const mdPath = path.join(reportsDir, `BASELINE_${timestamp}.md`);
    fs.writeFileSync(mdPath, generateMarkdownReport(scanResults, timestamp), 'utf8');
    console.log(`   ✅ ${path.relative(projectRoot, mdPath)}`);

    // CSV
    const csvPath = path.join(reportsDir, `BASELINE_${timestamp}.csv`);
    fs.writeFileSync(csvPath, generateCSVReport(scanResults), 'utf8');
    console.log(`   ✅ ${path.relative(projectRoot, csvPath)}`);

    console.log('');

    // Resumo
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('='.repeat(50));
    console.log('📊 RESUMO');
    console.log('='.repeat(50));
    console.log(`   Tempo: ${elapsed}s`);
    console.log(`   Arquivos escaneados: ${files.length}`);
    console.log(`   Arquivos com problemas: ${fileResults.length}`);
    console.log(`   Total de ocorrências: ${totalOccurrences}`);
    console.log('');

    if (totalOccurrences > 0) {
        console.log('🏆 Top 5 padrões:');
        Object.entries(patternSummary)
            .filter(([, data]) => data.count > 0)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .forEach(([name, data]) => {
                console.log(`   ${name}: ${data.count}`);
            });
        console.log('');
    }

    console.log('✅ Scan concluído!');
    console.log(`📄 Relatórios em: ${CONFIG.REPORTS_DIR}/`);

    // Exit code baseado em ocorrências
    process.exit(totalOccurrences > 0 ? 1 : 0);
}

// Executar
main();
