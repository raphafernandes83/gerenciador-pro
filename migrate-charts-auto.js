/**
 * 🤖 SCRIPT AUTOMÁTICO: Migração charts.js
 * Substitui classList por domHelper de forma segura
 */

const fs = require('fs');
const path = require('path');

const FILE_PATH = './charts.js';

console.log('🚀 Iniciando migração automática do charts.js...\n');

// 1. Ler arquivo original
let content = fs.readFileSync(FILE_PATH, 'utf8');
const originalContent = content; // Backup em memória

console.log('✅ Arquivo lido:', FILE_PATH);
console.log('📊 Tamanho:', content.length, 'caracteres\n');

// 2. Adicionar domHelper no início (após imports)
const domHelperCode = `
// 🆕 CHECKPOINT 2.2c: Helper para DOMManager
const domHelper = {
    add(el, ...c) { if(window.domManager) return window.domManager.addClass(el,...c); if(typeof el==='string')el=document.querySelector(el); el?.classList.add(...c); return!!el; },
    remove(el, ...c) { if(window.domManager) return window.domManager.removeClass(el,...c); if(typeof el==='string')el=document.querySelector(el); el?.classList.remove(...c); return!!el; }
};

`;

// Encontrar onde inserir (antes de "export const charts")
const exportChartsIndex = content.indexOf('export const charts = {');
if (exportChartsIndex === -1) {
    console.error('❌ Não encontrei "export const charts"');
    process.exit(1);
}

// Inserir domHelper antes do export
content = content.slice(0, exportChartsIndex) + domHelperCode + content.slice(exportChartsIndex);
console.log('✅ domHelper adicionado\n');

// 3. Lista de substituições (TODAS as 22 ocorrências)
const replacements = [
    // Linha 334-335
    {
        find: "badge.classList.remove('hidden');",
        replace: "domHelper.remove(badge, 'hidden'); // 🆕"
    },
    {
        find: "badge.classList.add('show');",
        replace: "domHelper.add(badge, 'show'); // 🆕"
    },

    // Linha 832-833
    {
        find: "el.classList.remove('excellent', 'good', 'warning', 'neutral');",
        replace: "domHelper.remove(el, 'excellent', 'good', 'warning', 'neutral'); // 🆕"
    },
    {
        find: "el.classList.add(level);",
        replace: "domHelper.add(el, level); // 🆕"
    },

    // Linha 1018-1019
    {
        find: "metaAchievedAmountEl.classList.remove('text-positive', 'text-negative');",
        replace: "domHelper.remove(metaAchievedAmountEl, 'text-positive', 'text-negative'); // 🆕"
    },
    {
        find: "if (achieved > 0) metaAchievedAmountEl.classList.add('text-positive');",
        replace: "if (achieved > 0) domHelper.add(metaAchievedAmountEl, 'text-positive'); // 🆕"
    },

    // Linha 1037-1039
    {
        find: "lossSessionResultEl.classList.remove('text-positive', 'text-negative');",
        replace: "domHelper.remove(lossSessionResultEl, 'text-positive', 'text-negative'); // 🆕"
    },
    {
        find: "if ((g.lucroAcumulado || 0) > 0) lossSessionResultEl.classList.add('text-positive');",
        replace: "if ((g.lucroAcumulado || 0) > 0) domHelper.add(lossSessionResultEl, 'text-positive'); // 🆕"
    },
    {
        find: "if ((g.lucroAcumulado || 0) < 0) lossSessionResultEl.classList.add('text-negative');",
        replace: "if ((g.lucroAcumulado || 0) < 0) domHelper.add(lossSessionResultEl, 'text-negative'); // 🆕"
    },

    // Linha 1046-1047
    {
        find: "statusAchievedEl.classList.remove('text-positive', 'text-negative');",
        replace: "domHelper.remove(statusAchievedEl, 'text-positive', 'text-negative'); // 🆕"
    },
    {
        find: "if (achieved > 0) statusAchievedEl.classList.add('text-positive');",
        replace: "if (achieved > 0) domHelper.add(statusAchievedEl, 'text-positive'); // 🆕"
    },

    // Linha 1062-1063
    {
        find: "statusRiskUsedEl.classList.remove('text-positive', 'text-negative');",
        replace: "domHelper.remove(statusRiskUsedEl, 'text-positive', 'text-negative'); // 🆕"
    },
    {
        find: "if (riscoUsado > 0) statusRiskUsedEl.classList.add('text-negative');",
        replace: "if (riscoUsado > 0) domHelper.add(statusRiskUsedEl, 'text-negative'); // 🆕"
    },

    // Linha 1108-1110
    {
        find: "dom.lossSessionResult.classList.remove('positive', 'negative');",
        replace: "domHelper.remove(dom.lossSessionResult, 'positive', 'negative'); // 🆕"
    },
    {
        find: "if (g.lucroAcumulado > 0) dom.lossSessionResult.classList.add('positive');",
        replace: "if (g.lucroAcumulado > 0) domHelper.add(dom.lossSessionResult, 'positive'); // 🆕"
    },
    {
        find: "if (g.lucroAcumulado < 0) dom.lossSessionResult.classList.add('negative');",
        replace: "if (g.lucroAcumulado < 0) domHelper.add(dom.lossSessionResult, 'negative'); // 🆕"
    },

    // Linha 1115 + 1119
    {
        find: "dom.winRemainingAmount.classList.remove('positive', 'negative');",
        replace: "domHelper.remove(dom.winRemainingAmount, 'positive', 'negative'); // 🆕"
    },
    {
        find: "dom.winRemainingAmount.classList.add('positive');",
        replace: "domHelper.add(dom.winRemainingAmount, 'positive'); // 🆕"
    },

    // Linha 1132-1133
    {
        find: "metaDisp.classList.remove('positive', 'negative');",
        replace: "domHelper.remove(metaDisp, 'positive', 'negative'); // 🆕"
    },
    {
        find: "if (metaPercent > 0) metaDisp.classList.add('positive');",
        replace: "if (metaPercent > 0) domHelper.add(metaDisp, 'positive'); // 🆕"
    },

    // Linha 1145-1146
    {
        find: "riscoDisp.classList.remove('positive', 'negative');",
        replace: "domHelper.remove(riscoDisp, 'positive', 'negative'); // 🆕"
    },
    {
        find: "if (riscoPercent > 0) riscoDisp.classList.add('negative');",
        replace: "if (riscoPercent > 0) domHelper.add(riscoDisp, 'negative'); // 🆕"
    }
];

console.log('🔄 Aplicando', replacements.length, 'substituições...\n');

// 4. Aplicar substituições uma por uma
let successCount = 0;
let failCount = 0;

for (const replacement of replacements) {
    if (content.includes(replacement.find)) {
        content = content.replace(replacement.find, replacement.replace);
        successCount++;
        console.log(`✅ [${successCount}/${replacements.length}]`, replacement.find.slice(0, 50) + '...');
    } else {
        failCount++;
        console.log(`❌ Não encontrado:`, replacement.find.slice(0, 50) + '...');
    }
}

console.log('\n📊 RESULTADO:');
console.log(`✅ Sucesso: ${successCount}/${replacements.length}`);
console.log(`❌ Falhas: ${failCount}/${replacements.length}`);

// 5. Salvar arquivo modificado
if (successCount > 0) {
    fs.writeFileSync(FILE_PATH, content, 'utf8');
    console.log('\n✅ Arquivo salvo:', FILE_PATH);

    // 6. Estatísticas
    const diff = content.length - originalContent.length;
    console.log('📈 Diferença de tamanho:', diff, 'caracteres');
    console.log('📝 Linhas aproximadas modificadas:', successCount);

    console.log('\n✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('🔍 Próximo passo: Verifique o arquivo e faça commit');
} else {
    console.log('\n❌ NENHUMA SUBSTITUIÇÃO FOI FEITA');
    console.log('⚠️ Arquivo não foi modificado');
    process.exit(1);
}
