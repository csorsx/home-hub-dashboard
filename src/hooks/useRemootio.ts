import { useState, useEffect, useCallback, useRef } from 'react';
// @ts-ignore
import { remootioApiDecryptEncrypedFrame, remootioApiConstructEncrypedFrame } from '@/lib/vendor/remootio/apicrypto';

interface RemootioState {
    isConnected: boolean;
    isAuthenticated: boolean;
    gateStatus: 'open' | 'closed' | 'unknown';
    connectionStatus: string;
}

// Build-time credentials (for encryption/decryption on frontend)
const API_SECRET_KEY = import.meta.env.VITE_REMOOTIO_API_SECRET_KEY;
const API_AUTH_KEY = import.meta.env.VITE_REMOOTIO_API_AUTH_KEY;

export const useRemootio = () => {
    const [state, setState] = useState<RemootioState>({
        isConnected: false,
        isAuthenticated: false,
        gateStatus: 'unknown',
        connectionStatus: 'Initializing...',
    });

    const websocketRef = useRef<WebSocket | null>(null);
    const sessionKeyRef = useRef<string | undefined>(undefined);
    const lastActionIdRef = useRef<number | undefined>(undefined);
    const pingIntervalRef = useRef<any>(null);

    // Helper to send JSON frames
    const sendFrame = (ws: WebSocket, frame: any) => {
        if (ws.readyState === WebSocket.OPEN) {
            console.log("Sending Frame:", frame.type);
            ws.send(JSON.stringify(frame));
        }
    };

    useEffect(() => {
        if (!API_SECRET_KEY || !API_AUTH_KEY) {
            setState(prev => ({ ...prev, connectionStatus: 'Missing Credentials' }));
            return;
        }

        // Connect to backend proxy instead of direct to Remootio
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/remootio`;

        console.log("Connecting via proxy:", wsUrl);
        setState(prev => ({ ...prev, connectionStatus: `Proxy: ${wsUrl}` }));

        const ws = new WebSocket(wsUrl);
        websocketRef.current = ws;

        ws.onopen = () => {
            console.log("WebSocket connected to proxy");
            setState(prev => ({ ...prev, connectionStatus: 'Proxy Connected' }));
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                // Handle proxy-specific messages
                if (msg.type === 'PROXY_CONNECTED') {
                    console.log("Proxy connected to Remootio");
                    setState(prev => ({ ...prev, isConnected: true, connectionStatus: 'Connected to Remootio' }));

                    // Start authentication
                    sendFrame(ws, { type: 'AUTH' });

                    // Start pings
                    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
                    pingIntervalRef.current = setInterval(() => {
                        sendFrame(ws, { type: 'PING' });
                    }, 60000);
                    return;
                }

                if (msg.type === 'PROXY_ERROR') {
                    console.error("Proxy error:", msg.message);
                    setState(prev => ({ ...prev, connectionStatus: `Proxy Error: ${msg.message}` }));
                    return;
                }

                // Handle Remootio messages
                if (msg.type === 'ENCRYPTED') {
                    const decrypted = remootioApiDecryptEncrypedFrame(
                        msg,
                        API_SECRET_KEY,
                        API_AUTH_KEY,
                        sessionKeyRef.current
                    );

                    if (decrypted) {
                        // Handle Challenge
                        if (decrypted.challenge && decrypted.challenge.sessionKey && decrypted.challenge.initialActionId !== undefined) {
                            console.log("Auth Challenge Received");
                            sessionKeyRef.current = decrypted.challenge.sessionKey;
                            lastActionIdRef.current = decrypted.challenge.initialActionId;

                            setState(prev => ({ ...prev, connectionStatus: 'Auth Challenge...' }));

                            // Send Query to finish Auth
                            if (lastActionIdRef.current !== undefined) {
                                const qAction = {
                                    action: {
                                        type: 'QUERY',
                                        id: (lastActionIdRef.current + 1) % 0x7fffffff
                                    }
                                };
                                const encFrame = remootioApiConstructEncrypedFrame(
                                    JSON.stringify(qAction),
                                    API_SECRET_KEY,
                                    API_AUTH_KEY,
                                    sessionKeyRef.current
                                );
                                ws.send(JSON.stringify(encFrame));
                            }
                        }

                        // Update ActionID
                        if (decrypted.response && decrypted.response.id !== undefined) {
                            lastActionIdRef.current = decrypted.response.id;

                            // Check for State Info (Sensor)
                            if (decrypted.response.sensorStatus) {
                                const isOpen = decrypted.response.sensorStatus === 'open';
                                setState(prev => ({
                                    ...prev,
                                    isAuthenticated: true,
                                    gateStatus: isOpen ? 'open' : 'closed',
                                    connectionStatus: 'Ready'
                                }));
                            } else if (decrypted.response.type === 'QUERY') {
                                setState(prev => ({ ...prev, isAuthenticated: true, connectionStatus: 'Authenticated' }));
                            }
                        }
                    }
                } else {
                    console.log("Unencrypted Frame:", msg);
                }

            } catch (e) {
                console.error("Parse Error", e);
            }
        };

        ws.onerror = (e: any) => {
            console.error("WebSocket error:", e);
            setState(prev => ({ ...prev, connectionStatus: 'Connection Error' }));
        };

        ws.onclose = () => {
            console.log("WS Closed");
            setState(prev => ({ ...prev, isConnected: false, connectionStatus: 'Disconnected' }));
            if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        };

        return () => {
            if (websocketRef.current) websocketRef.current.close();
            if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        };
    }, []);

    const triggerGate = useCallback(() => {
        const ws = websocketRef.current;
        if (ws && ws.readyState === WebSocket.OPEN && lastActionIdRef.current !== undefined && sessionKeyRef.current) {
            const actionId = (lastActionIdRef.current + 1) % 0x7fffffff;
            const payload = {
                action: {
                    type: 'TRIGGER',
                    id: actionId
                }
            };
            const encrypted = remootioApiConstructEncrypedFrame(
                JSON.stringify(payload),
                API_SECRET_KEY,
                API_AUTH_KEY,
                sessionKeyRef.current
            );
            ws.send(JSON.stringify(encrypted));
        } else {
            console.warn("Trigger failed: Not ready");
        }
    }, []);

    return {
        ...state,
        triggerGate
    };
};
