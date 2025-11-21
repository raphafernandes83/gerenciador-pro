const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Pasta raiz de backups fora do projeto (OneDrive/Documentos)
const BACKUP_ROOT = path.join(
    process.env.USERPROFILE || process.env.HOME,
    'OneDrive',
    'Documentos',
    'backup zip'
);

const BACKUP_FOLDER_NAME = 'backup zip'; // usado para filtros
const LOG_FILE = path.join(BACKUP_ROOT, 'backup_log.txt');

function writeLog(msg) {
    ensureDir(BACKUP_ROOT);
    try {
        fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (err) {
        console.error('Falha ao escrever log:', err.message);
    }
}

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Pasta criada: ${dirPath}`);
    }
}

// Mantém apenas os N backups mais recentes dentro de um diretório específico
function keepLastBackups(dir, maxKeep = 5) {
    try {
        const files = fs
            .readdirSync(dir)
            .filter((f) => f.endsWith('.zip'))
            .map((f) => ({
                name: f,
                mtime: fs.statSync(path.join(dir, f)).mtimeMs,
            }))
            .sort((a, b) => b.mtime - a.mtime); // mais recente primeiro

        if (files.length > maxKeep) {
            const toDelete = files.slice(maxKeep);
            toDelete.forEach(({ name }) => {
                const fullPath = path.join(dir, name);
                try {
                    fs.unlinkSync(fullPath);
                    console.log(`🗑️  Backup antigo removido: ${name}`);
                } catch (err) {
                    console.error(`Falha ao remover ${name}:`, err.message);
                }
            });
        }
    } catch (err) {
        // Se a pasta não existir ainda ou outro erro, apenas loga
        console.error('Erro ao limpar backups antigos:', err.message);
    }
}

// Mantém apenas os N diretórios de datas mais recentes dentro da raiz de backup
function keepLastDays(rootDir, maxDays = 7) {
    try {
        const dirs = fs
            .readdirSync(rootDir, { withFileTypes: true })
            .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name))
            .map((d) => ({
                name: d.name,
                mtime: fs.statSync(path.join(rootDir, d.name)).mtimeMs,
            }))
            .sort((a, b) => b.mtime - a.mtime); // mais recente primeiro

        if (dirs.length > maxDays) {
            const toDelete = dirs.slice(maxDays);
            toDelete.forEach(({ name }) => {
                const fullPath = path.join(rootDir, name);
                try {
                    fs.rmSync(fullPath, { recursive: true, force: true });
                    console.log(`🗑️  Pasta de backup antiga removida: ${name}`);
                } catch (err) {
                    console.error(`Falha ao remover pasta ${name}:`, err.message);
                }
            });
        }
    } catch (err) {
        // se ainda não houver backups
    }
}

/**
 * Remove arquivos e pastas cujo nome contenha a palavra "backup" (case-insensitive),
 * EXCETO o próprio script (backup.js) e possíveis .zip finais já criados.
 */
function removeBackupsRecursively(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Não descer nem deletar dentro da pasta de backups raiz
        if (fullPath.startsWith(path.resolve(BACKUP_ROOT))) {
            continue;
        }

        // Deve ser excluído?
        const isBackupName = /backup/i.test(entry.name);
        const isSelf = ['backup.js', 'executar_backup.bat'].includes(entry.name);
        const isCurrentZip = /Gerenciador PRO\.zip$/i.test(entry.name);

        if (isBackupName && !isSelf && !isCurrentZip) {
            try {
                if (entry.isDirectory()) {
                    fs.rmSync(fullPath, { recursive: true, force: true });
                    console.log(`Pasta removida: ${fullPath}`);
                } else {
                    fs.unlinkSync(fullPath);
                    console.log(`Arquivo removido: ${fullPath}`);
                }
            } catch (err) {
                console.error(`Falha ao remover ${fullPath}:`, err.message);
            }
        } else if (entry.isDirectory()) {
            // Desce em subdiretórios que não serão excluídos diretamente
            removeBackupsRecursively(fullPath);
        }
    }
}

function criarBackupZip() {
    // Assegura pasta raiz de destino
    ensureDir(BACKUP_ROOT);

    // Gerar strings de data e hora
    const now = new Date();
    // Formato DD-MM-AAAA
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}-${month}-${year}`;
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '-'); // HH-mm

    // Diretório do dia
    const dayDir = path.join(BACKUP_ROOT, dateStr);
    ensureDir(dayDir);

    // Comentário opcional via argumento ou prompt pré-carregado
    let comment = process.argv[3];
    if (!comment && process.stdin.isTTY) {
        try {
            const readlineSync = require('readline-sync');
            comment = readlineSync.question(
                'Comentário opcional para o nome do backup (enter para ignorar): '
            );
        } catch (_) {
            console.log(
                "ℹ️  Para inserir comentário interativo instale 'readline-sync' ou passe como argumento. Prosseguindo sem comentário..."
            );
        }
    }
    comment = (comment || '')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^\w\-]/g, '');
    const commentSuffix = comment ? `_${comment}` : '';

    const zipName = `${timeStr}${commentSuffix}.zip`;

    const fullZipPath = path.join(dayDir, zipName);

    // Compress-Archive incluindo todos itens da pasta atual
    const psCommand = `Compress-Archive -Path * -DestinationPath '${fullZipPath}' -Force`;

    try {
        execSync(`powershell -NoProfile -Command \"${psCommand}\"`, {
            stdio: 'inherit',
        });
        console.log(`📦 Backup criado: ${fullZipPath}`);
        writeLog(`BACKUP OK -> ${fullZipPath}`);

        // Limpeza: manter até 5 backups no dia e 7 dias ao todo
        keepLastBackups(dayDir, 5);
        keepLastDays(BACKUP_ROOT, 7);
    } catch (err) {
        console.error('Erro ao criar o ZIP:', err.message);
        writeLog(`BACKUP FAIL -> ${err.message}`);
    }
}

// ================= RESTORE FLOW ======================
async function restoreFlow() {
    ensureDir(BACKUP_ROOT);

    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    // Listar zips disponíveis
    const zipFiles = [];
    fs.readdirSync(BACKUP_ROOT, { withFileTypes: true }).forEach((d) => {
        if (d.isDirectory()) {
            const dayDir = path.join(BACKUP_ROOT, d.name);
            fs.readdirSync(dayDir)
                .filter((f) => f.endsWith('.zip'))
                .forEach((f) => zipFiles.push(path.join(dayDir, f)));
        }
    });

    if (zipFiles.length === 0) {
        console.log('❌ Nenhum backup encontrado em ' + BACKUP_ROOT);
        rl.close();
        return;
    }

    // Ordenar por data (nome já contém yyyy-mm-dd/HH-mm)
    zipFiles.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

    console.log('Backups disponíveis:');
    zipFiles.forEach((f, i) => console.log(`${i + 1}) ${f}`));

    const question = (q) => new Promise((res) => rl.question(q, res));

    const choice = await question('Escolha o número do backup a restaurar (default 1): ');
    const index = Math.max(1, parseInt(choice) || 1) - 1;
    const zipPath = zipFiles[index] || zipFiles[0];

    let destPath = await question('Digite o caminho completo onde deseja restaurar: ');
    destPath = destPath.trim();
    if (!destPath) {
        console.log('❌ Caminho de destino não informado. Abortando.');
        rl.close();
        return;
    }

    // validar destino
    if (!fs.existsSync(destPath)) {
        try {
            fs.mkdirSync(destPath, { recursive: true });
        } catch (err) {
            console.error('Não foi possível criar o diretório destino:', err.message);
            rl.close();
            return;
        }
    }

    // Impedir restauração dentro da pasta de backups
    if (path.resolve(destPath).startsWith(path.resolve(BACKUP_ROOT))) {
        console.log('❌ Destino não pode ser dentro da pasta de backups. Abortando.');
        rl.close();
        return;
    }

    // Expand-Archive via PowerShell
    try {
        const psCmd = `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${destPath}' -Force`;
        execSync(`powershell -NoProfile -Command "${psCmd}"`, { stdio: 'inherit' });
        console.log(`✅ Backup restaurado em: ${destPath}`);
        writeLog(`RESTORE OK -> ${zipPath} => ${destPath}`);
    } catch (err) {
        console.error('Erro durante restauração:', err.message);
        writeLog(`RESTORE FAIL -> ${err.message}`);
    }

    rl.close();
}

// ============== CLI HANDLER ==========================
const arg = process.argv[2];
if (arg && arg.toLowerCase().startsWith('rest')) {
    restoreFlow();
} else {
    criarBackupZip();
    console.log('🔔 Backup armazenado em:', BACKUP_ROOT);
}

// Encerrar script quando restoreFlow terminar (usa async)

// Processo principal apenas se não estiver em modo restore
if (!arg || !arg.toLowerCase().startsWith('rest')) {
    (function main() {
        console.log('🧹 Removendo arquivos/pastas de backup...');
        removeBackupsRecursively(process.cwd());
        console.log('📦 Criando backup ZIP limpo...');
        // Backup já chamado acima; nada a fazer
        console.log('✅ Processo concluído.');
    })();
}
