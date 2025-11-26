import { createServer } from 'http';
import { readFile, access, constants } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.ico': 'image/x-icon',
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

        // Lê o arquivo (async/await)
        const data = await readFile(fullPath);

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache',
        });
        res.end(data);

    } catch (err) {
        console.error('Server error:', err);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 - Erro interno do servidor</h1>');
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor modernizado rodando em http://localhost:${PORT}`);
});
