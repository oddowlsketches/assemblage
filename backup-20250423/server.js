const http = require('http');
const fs = require('fs');
const path = require('path');

// Try different ports if the default one is in use
const PORTS = [8000, 8001, 8002, 8003, 8004];
let currentPortIndex = 0;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

function createServer(port) {
    const server = http.createServer((req, res) => {
        console.log(`Request: ${req.method} ${req.url}`);
        
        // Handle root path
        let filePath = req.url === '/' ? './narrative-test.html' : '.' + req.url;
        
        // Get the file extension
        const extname = path.extname(filePath);
        let contentType = MIME_TYPES[extname] || 'application/octet-stream';
        
        // Read the file
        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    // File not found
                    console.error(`File not found: ${filePath}`);
                    res.writeHead(404);
                    res.end('404 Not Found');
                } else {
                    // Server error
                    console.error(`Server error: ${error.code}`);
                    res.writeHead(500);
                    res.end(`Server Error: ${error.code}`);
                }
            } else {
                // Success
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    });
    
    // Handle server errors
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.log(`Port ${port} is already in use, trying next port...`);
            currentPortIndex++;
            
            if (currentPortIndex < PORTS.length) {
                createServer(PORTS[currentPortIndex]);
            } else {
                console.error('All ports are in use. Please free up a port or modify the PORTS array.');
            }
        } else {
            console.error(`Server error: ${error.code}`);
        }
    });
    
    // Start the server
    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}/`);
        console.log(`Press Ctrl+C to stop the server`);
    });
    
    return server;
}

// Start the server with the first port
createServer(PORTS[currentPortIndex]); 