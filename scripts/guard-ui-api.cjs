/**
 * =============================================================================
 * GUARD UI API - Validador de Contrato de Módulos UI
 * =============================================================================
 * 
 * Valida:
 * - Módulos UI existem
 * - Exports obrigatórios estão presentes
 * 
 * @version TAREFA 32 - 29/12/2025
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

const CONTRACT_PATH = path.join(__dirname, '..', 'src', 'ui', 'ui-contract.json');
const ROOT_DIR = path.join(__dirname, '..');

// =============================================================================
// FUNÇÕES
// =============================================================================

/**
 * Extrai exports de um arquivo JS
 */
function extractExports(content) {
    const exports = [];

    // export class ClassName
    const classExports = content.match(/export\s+class\s+(\w+)/g);
    if (classExports) {
        classExports.forEach(match => {
            const name = match.match(/export\s+class\s+(\w+)/)[1];
            exports.push(name);
        });
    }

    // export function functionName
    const funcExports = content.match(/export\s+function\s+(\w+)/g);
    if (funcExports) {
        funcExports.forEach(match => {
            const name = match.match(/export\s+function\s+(\w+)/)[1];
            exports.push(name);
        });
    }

    // export const varName
    const constExports = content.match(/export\s+const\s+(\w+)/g);
    if (constExports) {
        constExports.forEach(match => {
            const name = match.match(/export\s+const\s+(\w+)/)[1];
            exports.push(name);
        });
    }

    // export default ClassName
    const defaultExport = content.match(/export\s+default\s+(\w+)/);
    if (defaultExport) {
        exports.push(defaultExport[1]);
    }

    return [...new Set(exports)]; // Remover duplicatas
}

// =============================================================================
// MAIN
// =============================================================================

console.log('📦 Guard UI API: Validando contrato de módulos UI...\n');

// Ler contrato
if (!fs.existsSync(CONTRACT_PATH)) {
    console.error('❌ ui-contract.json não encontrado!');
    process.exit(1);
}

const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf-8'));
const modules = contract.modules;

let hasError = false;
const errors = [];
const validated = [];

for (const [moduleName, config] of Object.entries(modules)) {
    const filePath = path.join(ROOT_DIR, config.path);

    // 1. Verificar se arquivo existe
    if (!fs.existsSync(filePath)) {
        hasError = true;
        errors.push(`❌ ${moduleName}: arquivo não encontrado (${config.path})`);
        continue;
    }

    // 2. Ler e extrair exports
    const content = fs.readFileSync(filePath, 'utf-8');
    const actualExports = extractExports(content);

    // 3. Verificar exports obrigatórios
    const missingExports = [];
    for (const requiredExport of config.exports) {
        if (!actualExports.includes(requiredExport)) {
            missingExports.push(requiredExport);
        }
    }

    if (missingExports.length > 0) {
        hasError = true;
        errors.push(`❌ ${moduleName}: exports faltando: ${missingExports.join(', ')}`);
    } else {
        validated.push(moduleName);
    }
}

// =============================================================================
// RESULTADO
// =============================================================================

if (hasError) {
    console.log('');
    for (const error of errors) {
        console.log(`   ${error}`);
    }
    console.log('\n❌ Guard UI API FALHOU!\n');
    process.exit(1);
} else {
    console.log('   📋 Módulos validados:');
    validated.forEach(name => {
        console.log(`      ✓ ${name}`);
    });

    console.log('\n✅ Guard UI API PASSOU!\n');
    console.log(`   📦 ${validated.length} módulo(s) validado(s)`);
    console.log(`   ✓ Todos os arquivos existem`);
    console.log(`   ✓ Todos os exports obrigatórios presentes\n`);
    process.exit(0);
}
