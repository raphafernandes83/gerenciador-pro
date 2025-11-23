/**
 * Script MELHORADO para converter console.log para logger
 * Versão 2.0 - Com detecção inteligente de imports multi-linha
 */

const fs = require('fs');

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Uso: node convert-console-to-logger.js <arquivo>');
    process.exit(1);
}

const filePath = args[0];

// Lê o arquivo
let content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// Adiciona import do logger se não existir
if (!content.includes("import { logger }") && !content.includes("from './src/utils/Logger.js'")) {
    // Encontra a última linha de import (considerando imports multi-linha)
    let lastCompletedImportIndex = -1;
    let inMultiLineImport = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detecta início de import
        if (line.startsWith('import ')) {
            inMultiLineImport = !line.includes(';');
            if (!inMultiLineImport) {
                lastCompletedImportIndex = i;
            }
        }
        // Detecta fim de import multi-linha
        else if (inMultiLineImport && line.includes(';')) {
            inMultiLineImport = false;
            lastCompletedImportIndex = i;
        }
    }

    if (lastCompletedImportIndex >= 0) {
        lines.splice(lastCompletedImportIndex + 1, 0, "import { logger } from './src/utils/Logger.js';");
        content = lines.join('\n');
        console.log(`✅ Import adicionado após linha ${lastCompletedImportIndex + 1}`);
    } else {
        console.log('⚠️  Não foi possível encontrar local seguro para import. Adicione manualmente:');
        console.log("   import { logger } from './src/utils/Logger.js';");
    }
}

// Conversões com contadores
let counts = {
    log: 0,
    debug: 0,
    info: 0,
    warn: 0,
    error: 0
};

content = content.replace(/console\.log\(/g, () => {
    counts.log++;
    return 'logger.debug(';
});

content = content.replace(/console\.debug\(/g, () => {
    counts.debug++;
    return 'logger.debug(';
});

content = content.replace(/console\.info\(/g, () => {
    counts.info++;
    return 'logger.info(';
});

content = content.replace(/console\.warn\(/g, () => {
    counts.warn++;
    return 'logger.warn(';
});

content = content.replace(/console\.error\(/g, () => {
    counts.error++;
    return 'logger.error(';
});

// Salva o arquivo
fs.writeFileSync(filePath, content, 'utf-8');

const total = counts.log + counts.debug + counts.info + counts.warn + counts.error;

console.log(`\n✅ Conversão concluída!`);
console.log(`   Arquivo: ${filePath}`);
console.log(`   Total convertido: ${total} ocorrências`);
console.log(`   - console.log → logger.debug: ${counts.log}`);
console.log(`   - console.debug → logger.debug: ${counts.debug}`);
console.log(`   - console.info → logger.info: ${counts.info}`);
console.log(`   - console.warn → logger.warn: ${counts.warn}`);
console.log(`   - console.error → logger.error: ${counts.error}`);
