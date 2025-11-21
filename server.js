const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Remove query string e parse da URL
    let filePath = req.url.split('?')[0];

    // Root vai para index.html
    if (filePath === '/') {
        filePath = '/index.html';
    }

    // Caminho completo do arquivo
    const fullPath = path.join(__dirname, filePath);

    // Extensão do arquivo
    const ext = path.extname(filePath);

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

    // Verifica se arquivo existe
    fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Arquivo não encontrado</h1>');
            return;
        }

        // Lê e serve o arquivo
        fs.readFile(fullPath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 - Erro interno do servidor</h1>');
                return;
            }

            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache',
            });
            res.end(data);
        });
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
