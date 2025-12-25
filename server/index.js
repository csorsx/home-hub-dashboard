import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env file for local development
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration from environment
const PORT = process.env.PORT || 3001;
const REMOOTIO_IP = process.env.REMOOTIO_IP || '192.168.1.104';
const REMOOTIO_PORT = process.env.REMOOTIO_PORT || 887;

const app = express();
const server = createServer(app);

// Simple logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
    next();
});

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, '../dist')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', remootioIp: REMOOTIO_IP });
});

// Remootio operate endpoint
app.get('/api/remootio/operate', async (req, res) => {
    const url = `http://${REMOOTIO_IP}:${REMOOTIO_PORT}/operate`;
    console.log(`Forwarding operate request to: ${url}`);
    try {
        const response = await fetch(url);
        const data = await response.text();
        console.log(`Remootio response: ${data}`);
        res.json({ status: 'ok', response: data });
    } catch (err) {
        console.error('Failed to trigger Remootio:', err);
        res.status(500).json({ error: 'Failed to trigger Remootio gate' });
    }
});

// SPA fallback - Use middleware instead of app.get('*') to avoid path-to-regexp issues
app.use((req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    } else {
        res.status(404).json({ error: 'API endpoint not found' });
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Pushing gate via: http://${REMOOTIO_IP}:${REMOOTIO_PORT}/operate`);
});
