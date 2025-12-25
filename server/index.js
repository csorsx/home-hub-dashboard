import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env file for local development
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration from environment
const PORT = process.env.PORT || 3001;
const REMOOTIO_IP = process.env.REMOOTIO_IP || '192.168.1.204';
const REMOOTIO_PORT = process.env.REMOOTIO_PORT || 8080;

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

// Config endpoint for frontend to get keys at runtime
app.get('/api/config', (req, res) => {
    res.json({
        REMOOTIO_API_SECRET_KEY: process.env.VITE_REMOOTIO_API_SECRET_KEY || process.env.REMOOTIO_API_SECRET_KEY,
        REMOOTIO_API_AUTH_KEY: process.env.VITE_REMOOTIO_API_AUTH_KEY || process.env.REMOOTIO_API_AUTH_KEY,
    });
});

// SPA fallback - Use middleware instead of app.get('*') to avoid path-to-regexp issues
app.use((req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    } else {
        res.status(404).json({ error: 'API endpoint not found' });
    }
});

// WebSocket server for frontend clients
const wss = new WebSocketServer({ server, path: '/api/remootio' });

wss.on('connection', (clientWs) => {
    console.log('Frontend client connected');

    // Connect to the actual Remootio device
    const remootioUrl = `ws://${REMOOTIO_IP}:${REMOOTIO_PORT}`;
    console.log('Connecting to Remootio:', remootioUrl);

    let remootioWs = null;

    try {
        remootioWs = new WebSocket(remootioUrl);
    } catch (err) {
        console.error('Failed to create Remootio connection:', err);
        clientWs.send(JSON.stringify({ type: 'PROXY_ERROR', message: 'Failed to connect to Remootio' }));
        clientWs.close();
        return;
    }

    remootioWs.on('open', () => {
        console.log('Connected to Remootio device');
        clientWs.send(JSON.stringify({ type: 'PROXY_CONNECTED' }));
    });

    remootioWs.on('message', (data) => {
        // Relay message from Remootio to frontend
        if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(data.toString());
        }
    });

    remootioWs.on('error', (err) => {
        console.error('Remootio WebSocket error:', err.message);
        if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'PROXY_ERROR', message: err.message }));
        }
    });

    remootioWs.on('close', () => {
        console.log('Remootio connection closed');
        if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
        }
    });

    // Relay messages from frontend to Remootio
    clientWs.on('message', (data) => {
        if (remootioWs && remootioWs.readyState === WebSocket.OPEN) {
            remootioWs.send(data.toString());
        }
    });

    clientWs.on('close', () => {
        console.log('Frontend client disconnected');
        if (remootioWs) {
            remootioWs.close();
        }
    });

    clientWs.on('error', (err) => {
        console.error('Client WebSocket error:', err.message);
        if (remootioWs) {
            remootioWs.close();
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Proxying /api/remootio to ws://${REMOOTIO_IP}:${REMOOTIO_PORT}`);
});
