import { createServer } from 'http';
import { readFile, access, constants, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// FORÇA LIMPEZA DE CACHE DO REQUIRE
delete require.cache[require.resolve('./index.html')];

const server = createServer(async (req, res) => {
    try {
        // Remove query string e parse da URL
        let filePath = req.url.split('?')[0];

        // Root vai para index.html
        if (filePath === '/') {
            filePath = '/index.html';
        }

        // Caminho completo do arquivo
        const fullPath = join(__dirname, filePath);

        // Extensão do arquivo
        const ext = extname(filePath);

        // MIME types
        const mimeTypes = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.ico': 'image/x-icon',
            '.webp': 'image/webp'
        };

        const contentType = mimeTypes[ext] || 'text/plain';

        // Verifica se arquivo existe (async/await)
        try {
            await access(fullPath, constants.F_OK);
        } catch {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Arquivo não encontrado</h1>');
            return;
        }

        // FORÇA LEITURA FRESH DO ARQUIVO (sem cache do filesystem)
        const fileStats = await stat(fullPath);
        console.log(`📄 Lendo arquivo: ${filePath} (${fileStats.size} bytes)`);

        const data = await readFile(fullPath, { encoding: null });

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '-1',
            'Last-Modified': fileStats.mtime.toUTCString(),
            'ETag': `"${fileStats.size}-${fileStats.mtime.getTime()}"`
        });
        res.end(data);

    } catch (err) {
        console.error('❌ Server error:', err);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 - Erro interno do servidor</h1>');
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`⚡ Cache completamente desabilitado - arquivos lidos fresh a cada request`);
});
