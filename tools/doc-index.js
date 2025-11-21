/*
 Gera um índice simples de funções e referências cruzadas.
 Saídas:
  - docs/manual-funcoes/index.json
  - docs/manual-funcoes/index.md
 Uso: node tools/doc-index.js
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const exts = new Set(['.js', '.ts', '.jsx', '.tsx']);
const ignoreDirs = new Set([
    'node_modules',
    '.git',
    'backup zip',
    'universal_webapp_stack_com_guia',
]);

function walk(dir, files = []) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const it of items) {
        if (ignoreDirs.has(it.name)) continue;
        const full = path.join(dir, it.name);
        if (it.isDirectory()) walk(full, files);
        else files.push(full);
    }
    return files;
}

function extract(file) {
    const content = fs.readFileSync(file, 'utf-8');
    const defs = [];
    const calls = [];
    // Definições simples (heurística): function nome( / const nome = ( / class Nome
    const defRegex =
        /(?:function\s+([A-Za-z0-9_]+)\s*\(|const\s+([A-Za-z0-9_]+)\s*=\s*\(|class\s+([A-Za-z0-9_]+)\s*\{)/g;
    let m;
    while ((m = defRegex.exec(content))) {
        const name = m[1] || m[2] || m[3];
        if (name) defs.push(name);
    }
    // Chamadas simples: algo.algo(
    const callRegex = /([A-Za-z0-9_\.]+)\s*\(/g;
    while ((m = callRegex.exec(content))) {
        calls.push(m[1]);
    }
    return { defs, calls };
}

function main() {
    const all = walk(ROOT).filter((f) => exts.has(path.extname(f)));
    const index = {};
    const usage = {};
    for (const f of all) {
        try {
            const rel = path.relative(ROOT, f).replace(/\\/g, '/');
            const { defs, calls } = extract(f);
            defs.forEach((d) => {
                if (!index[d]) index[d] = [];
                index[d].push(rel);
            });
            calls.forEach((c) => {
                if (!usage[c]) usage[c] = new Set();
                usage[c].add(rel);
            });
        } catch (e) {
            /* ignore */
        }
    }
    const usagePlain = Object.fromEntries(
        Object.entries(usage).map(([k, v]) => [k, Array.from(v)])
    );
    const outDir = path.join(ROOT, 'docs/manual-funcoes');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
        path.join(outDir, 'index.json'),
        JSON.stringify({ index, usage: usagePlain }, null, 2)
    );
    const lines = ['# Índice de Funções (gerado)', ''];
    lines.push('## Definições');
    Object.keys(index)
        .sort()
        .forEach((name) => {
            lines.push(`- ${name}: ${index[name].join(', ')}`);
        });
    lines.push('', '## Usos (heurístico)');
    Object.keys(usagePlain)
        .sort()
        .slice(0, 500)
        .forEach((name) => {
            lines.push(`- ${name}: ${usagePlain[name].join(', ')}`);
        });
    fs.writeFileSync(path.join(outDir, 'index.md'), lines.join('\n'));
    console.log('✅ Índice gerado em docs/manual-funcoes/index.{json,md}');
}

if (require.main === module) main();
