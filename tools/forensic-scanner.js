#!/usr/bin/env node
/*
 * Forensic Function Scanner (3 ciclos)
 * - Varredura estática recursiva de *.js,*.ts,*.jsx,*.tsx
 * - Classificação: duplicadas, órfãs, inválidas, shadowed, etc.
 * - Saída: RELATORIO_FUNCOES_FORTE.md e RELATORIO_FUNCOES_FORTE.json
 *
 * Regras: Não altera código de origem; apenas lê e gera relatórios.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const OUT_BASENAME =
    process.argv.find((a) => a.startsWith('--out='))?.split('=')[1] || 'RELATORIO_FUNCOES_FORTE';
const OUT_JSON = path.join(ROOT, `${OUT_BASENAME}.json`);
const OUT_MD = path.join(ROOT, `${OUT_BASENAME}.md`);

const EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx']);
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.cache']);

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walk(full));
        } else {
            if (EXTENSIONS.has(path.extname(entry.name))) files.push(full);
        }
    }
    return files.sort();
}

function hash(content) {
    return crypto.createHash('sha1').update(content).digest('hex');
}

function stripComments(code) {
    return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/([^:])\/\/.*$/gm, '$1');
}

function normalizeSignature(name, paramsText) {
    const params = paramsText
        .split(',')
        .map((p) =>
            p
                .trim()
                .replace(/:[^,)=]+/g, '')
                .replace(/\?.*$/, '')
        )
        .filter(Boolean);
    return { name, arity: params.length, params };
}

function extractFunctions(filePath, code) {
    const results = [];
    const lines = code.split(/\r?\n/);
    const pushFn = (name, startIdx, body, signature, kind) => {
        const startLine = (code.slice(0, startIdx).match(/\n/g) || []).length + 1;
        const endLine = startLine + (body.match(/\n/g) || []).length;
        results.push({
            name,
            file: path.relative(ROOT, filePath),
            startLine,
            endLine,
            length: endLine - startLine + 1,
            signature,
            kind,
            bodyHash: hash(body),
        });
    };

    const noComments = stripComments(code);

    // function declarations
    const fnDecl = /function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{([\s\S]*?)\n\}/g;
    let m;
    while ((m = fnDecl.exec(noComments))) {
        pushFn(m[1], m.index, m[0], normalizeSignature(m[1], m[2]), 'function');
    }

    // const foo = function(...) { ... }
    const fnExpr =
        /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*function\s*\(([^)]*)\)\s*\{([\s\S]*?)\n\}/g;
    while ((m = fnExpr.exec(noComments))) {
        pushFn(m[1], m.index, m[0], normalizeSignature(m[1], m[2]), 'function_expr');
    }

    // const foo = (...) => { ... }  or => expression
    const arrow =
        /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\(([^)]*)\)\s*=>\s*\{([\s\S]*?)\n\}/g;
    while ((m = arrow.exec(noComments))) {
        pushFn(m[1], m.index, m[0], normalizeSignature(m[1], m[2]), 'arrow');
    }
    const arrowSingle =
        /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\(([^)]*)\)\s*=>\s*([^;\n]+)/g;
    while ((m = arrowSingle.exec(noComments))) {
        pushFn(m[1], m.index, m[0], normalizeSignature(m[1], m[2]), 'arrow_expr');
    }

    // class methods
    const classRe = /class\s+([A-Za-z_$][\w$]*)\s*[^{]*\{([\s\S]*?)\n\}/g;
    let cls;
    while ((cls = classRe.exec(noComments))) {
        const classBody = cls[2];
        const methodRe = /(?!constructor\b)([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{([\s\S]*?)\n\}/g;
        let mm;
        while ((mm = methodRe.exec(classBody))) {
            const fullName = `${cls[1]}.${mm[1]}`;
            const idx = noComments.indexOf(mm[0], cls.index);
            pushFn(fullName, idx, mm[0], normalizeSignature(fullName, mm[2]), 'method');
        }
    }

    return results;
}

function findUsages(files, indexByFile) {
    const usage = new Map();
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, (r) => `\\${r}`);
    for (const [file, content] of indexByFile) {
        for (const [name, items] of globalIndexByName.entries()) {
            const safeName = escapeRegExp(name);
            const re = new RegExp(`(?<![A-Za-z0-9_$])${safeName}(?=\\s*\\()`, 'g');
            let count = 0;
            while (re.exec(content)) count++;
            if (count > 0) usage.set(name, (usage.get(name) || 0) + count);
        }
    }
    return usage;
}

// 1) Coleta
const files = walk(ROOT);
const indexByFile = new Map();
for (const f of files) {
    try {
        indexByFile.set(f, fs.readFileSync(f, 'utf8'));
    } catch {}
}

const allFunctions = [];
for (const [file, code] of indexByFile) {
    try {
        allFunctions.push(...extractFunctions(file, code));
    } catch {}
}

// Índices
const globalIndexByName = new Map();
for (const fn of allFunctions) {
    const key = fn.name;
    if (!globalIndexByName.has(key)) globalIndexByName.set(key, []);
    globalIndexByName.get(key).push(fn);
}

// Ciclo 1 – Identificação
const dupByName = [];
for (const [name, defs] of globalIndexByName) {
    if (defs.length > 1) {
        const bodyHashes = new Set(defs.map((d) => d.bodyHash));
        dupByName.push({ name, count: defs.length, identical: bodyHashes.size === 1, defs });
    }
}

const usageCounts = findUsages(files, indexByFile);
const orphans = allFunctions.filter((fn) => (usageCounts.get(fn.name) || 0) === 0);

// Tentativa simples de inválidas
const invalids = [];
for (const fn of allFunctions) {
    // sem retorno (heurística) para funções que parecem calcular algo: comece com get/calc/compute
    const looksPure = /\b(get|calc|compute|format|map|reduce|filter)/i.test(fn.name);
    if (
        looksPure &&
        !/\breturn\b/.test(stripComments(indexByFile.get(path.join(ROOT, fn.file)).slice(0)))
    ) {
        invalids.push({ reason: 'Possível retorno ausente', fn });
    }
}

// Ciclo 2 – Análise
const overloaded = [];
for (const [name, defs] of globalIndexByName) {
    const arities = new Set(defs.map((d) => d.signature.arity));
    if (defs.length > 1 && arities.size > 1) {
        overloaded.push({ name, defs, message: 'Assinaturas com aridades diferentes' });
    }
}

const paramInconsistencies = [];
for (const [name, defs] of globalIndexByName) {
    if (defs.length > 1) {
        const paramSets = new Set(defs.map((d) => d.signature.params.join(',')));
        if (paramSets.size > 1) paramInconsistencies.push({ name, defs });
    }
}

// Ciclo 3 – Detecção Avançada
const shadowed = [];
for (const [name, defs] of globalIndexByName) {
    const filesSet = new Set(defs.map((d) => d.file));
    if (filesSet.size > 1) shadowed.push({ name, files: [...filesSet], defs });
}

const obsolete = orphans.filter((o) =>
    /deprecated|obsolete|legacy/i.test(indexByFile.get(path.join(ROOT, o.file)) || '')
);

const sideEffects = allFunctions.filter((fn) => {
    const code = indexByFile.get(path.join(ROOT, fn.file)) || '';
    const snippet = code
        .split(/\r?\n/)
        .slice(fn.startLine - 1, fn.endLine)
        .join('\n');
    return /(window\.|document\.|localStorage\.|sessionStorage\.|fetch\(|XMLHttpRequest|setTimeout\(|setInterval\(|postMessage\()/i.test(
        snippet
    );
});

const recursion = [];
for (const fn of allFunctions) {
    const code = indexByFile.get(path.join(ROOT, fn.file)) || '';
    const snippet = code
        .split(/\r?\n/)
        .slice(fn.startLine - 1, fn.endLine)
        .join('\n');
    if (new RegExp(`[^A-Za-z0-9_$]${fn.name}\\s*\\(`).test(snippet)) {
        recursion.push({
            fn,
            message: 'Chamada recursiva detectada (verificar condição de parada)',
        });
    }
}

// Montagem do relatório
const suspects = [];
const pushSuspect = (type, payload) => suspects.push({ type, ...payload });

dupByName.forEach((d) => pushSuspect('duplicada', d));
orphans.forEach((fn) => pushSuspect('orfã', { fn }));
invalids.forEach((v) => pushSuspect('inválida', v));
overloaded.forEach((v) => pushSuspect('sobrecarga_inconsistente', v));
paramInconsistencies.forEach((v) => pushSuspect('parâmetros_inconsistentes', v));
shadowed.forEach((v) => pushSuspect('shadowed', v));
obsolete.forEach((v) => pushSuspect('obsoleta', { fn: v }));
sideEffects.forEach((fn) => pushSuspect('efeito_colateral', { fn }));
recursion.forEach((v) => pushSuspect('recursão_potencial', v));

const usageByName = Object.fromEntries([...usageCounts.entries()]);

const summary = {
    generatedAt: new Date().toISOString(),
    root: ROOT,
    filesScanned: files.length,
    functionsFound: allFunctions.length,
    counts: {
        duplicadas: dupByName.length,
        orfas: orphans.length,
        invalidas: invalids.length,
        sobrecargaInconsistente: overloaded.length,
        paramsInconsistentes: paramInconsistencies.length,
        shadowed: shadowed.length,
        obsoletas: obsolete.length,
        efeitosColaterais: sideEffects.length,
        recursao: recursion.length,
    },
};

const jsonOutput = {
    summary,
    usageByName,
    suspects,
};

fs.writeFileSync(OUT_JSON, JSON.stringify(jsonOutput, null, 2));

// Markdown
const mdLines = [];
mdLines.push(`# Relatório Forense de Funções`);
mdLines.push(`Gerado em: ${summary.generatedAt}`);
mdLines.push('');
mdLines.push(`Arquivos: ${summary.filesScanned} | Funções: ${summary.functionsFound}`);
mdLines.push(`Contagens: ${JSON.stringify(summary.counts)}`);
mdLines.push('');

for (const s of suspects) {
    let fn = s.fn || (s.defs && s.defs[0]) || (s.def && s.def) || null;
    const name = fn?.name || s.name || 'desconhecido';
    const file = fn?.file || (s.defs && s.defs[0]?.file) || 'n/d';
    const start = fn?.startLine || 'n/d';
    const end = fn?.endLine || 'n/d';
    mdLines.push('---');
    mdLines.push(`- Nome: ${name}`);
    mdLines.push(`- Arquivo: ${file}`);
    mdLines.push(`- Linha: ${start} - ${end}`);
    mdLines.push(`- Tipo de problema: ${s.type}`);
}

fs.writeFileSync(OUT_MD, mdLines.join('\n'));

console.log(`✅ Relatórios gerados:\n- ${OUT_JSON}\n- ${OUT_MD}`);
