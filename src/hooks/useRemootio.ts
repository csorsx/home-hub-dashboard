import { useState, useEffect, useCallback, useRef } from 'react';
// @ts-ignore
import { remootioApiDecryptEncrypedFrame, remootioApiConstructEncrypedFrame } from '@/lib/vendor/remootio/apicrypto';

interface RemootioState {
    isConnected: boolean;
    isAuthenticated: boolean;
    gateStatus: 'open' | 'closed' | 'unknown';
    connectionStatus: string;
}

const REMOOTIO_IP = import.meta.env.VITE_REMOOTIO_IP;
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

    const sendEncryptedFrame = (ws: WebSocket, unencryptedPayload: any) => {
        if (ws.readyState === WebSocket.OPEN && sessionKeyRef.current) {
            const encryptedFrame = remootioApiConstructEncrypedFrame(
                JSON.stringify(unencryptedPayload),
                API_SECRET_KEY,
                API_AUTH_KEY,
                sessionKeyRef.current
            );
            ws.send(JSON.stringify(encryptedFrame));
        } else {
            console.warn("Cannot send encrypted frame: Not connected or no session key");
        }
    };

    useEffect(() => {
        if (!REMOOTIO_IP || !API_SECRET_KEY || !API_AUTH_KEY) {
            setState(prev => ({ ...prev, connectionStatus: 'Missing Credentials' }));
            return;
        }

        // Direct Connection Logic (Matching Demo)
        // The demo uses raw IP input. We assume standard port 8080.
        const bareIP = REMOOTIO_IP.replace(/^(ws:\/\/|wss:\/\/|http:\/\/|https:\/\/)/, '').replace(/\/$/, '').replace(/:8080$/, '');
        const wsUrl = `ws://${bareIP}:8080`;

        console.log("Connecting directly to:", wsUrl);
        setState(prev => ({ ...prev, connectionStatus: `Conn: ${wsUrl}` }));

        const ws = new WebSocket(wsUrl);
        websocketRef.current = ws;

        ws.onopen = () => {
            console.log("WS Open");
            setState(prev => ({ ...prev, isConnected: true, connectionStatus: 'Connected' }));

            // Demo Logic: Wait for frames, but we should start Auth
            // The demo has a button "Send AUTH frame". We do it automatically.
            sendFrame(ws, { type: 'AUTH' });

            // Start Pips
            if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = setInterval(() => {
                sendFrame(ws, { type: 'PING' });
            }, 60000);
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                if (msg.type === 'ENCRYPTED') {
                    const decrypted = remootioApiDecryptEncrypedFrame(
                        msg,
                        API_SECRET_KEY,
                        API_AUTH_KEY,
                        sessionKeyRef.current
                    );

                    if (decrypted) {
                        // Logic from demo: Handle Challenge
                        if (decrypted.challenge && decrypted.challenge.sessionKey && decrypted.challenge.initialActionId !== undefined) {
                            console.log("Auth Challenge Received");
                            sessionKeyRef.current = decrypted.challenge.sessionKey;
                            lastActionIdRef.current = decrypted.challenge.initialActionId;

                            setState(prev => ({ ...prev, connectionStatus: 'Auth Challenge...' }));

                            // Send Query to finish Auth (as per demo confirm dialog)
                            if (lastActionIdRef.current !== undefined) {
                                const qAction = {
                                    action: {
                                        type: 'QUERY',
                                        id: (lastActionIdRef.current + 1) % 0x7fffffff
                                    }
                                };
                                // We don't have a helper for sending encrypted action yet easily accessible
                                // Re-implement locally
                                const encFrame = remootioApiConstructEncrypedFrame(
                                    JSON.stringify(qAction),
                                    API_SECRET_KEY,
                                    API_AUTH_KEY,
                                    sessionKeyRef.current
                                );
                                ws.send(JSON.stringify(encFrame));
                            }
                        }

                        // Logic from demo: Update ActionID
                        if (decrypted.response && decrypted.response.id !== undefined) {
                            lastActionIdRef.current = decrypted.response.id;

                            // Check for State Info (Sensor)
                            if (decrypted.response.sensorStatus) {
                                const isOpen = decrypted.response.sensorStatus === 'open';
                                setState(prev => ({
                                    ...prev,
                                    isAuthenticated: true, // If we got a response, we are good
                                    gateStatus: isOpen ? 'open' : 'closed',
                                    connectionStatus: 'Ready'
                                }));
                            } else if (decrypted.response.type === 'QUERY') {
                                // Query response means we are authenticated
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
            console.error("WS Error", e);
            setState(prev => ({ ...prev, connectionStatus: 'Error (Check Console)' }));
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
