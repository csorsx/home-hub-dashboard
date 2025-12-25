import { useState, useCallback } from 'react';

interface RemootioState {
    status: 'idle' | 'triggering' | 'error' | 'success';
    message: string;
}

export const useRemootio = () => {
    const [state, setState] = useState<RemootioState>({
        status: 'idle',
        message: 'Ready',
    });

    const triggerGate = useCallback(async () => {
        try {
            setState({ status: 'triggering', message: 'Triggering...' });
            console.log("Triggering Remootio gate...");
            const response = await fetch('/api/remootio/operate');
            const data = await response.json();
            console.log("Remootio trigger response:", data);

            if (data.status === 'ok') {
                setState({ status: 'success', message: 'Gate Triggered' });
                // Reset status after a few seconds
                setTimeout(() => {
                    setState({ status: 'idle', message: 'Ready' });
                }, 3000);
            } else {
                throw new Error(data.error || 'Failed to trigger gate');
            }
        } catch (err) {
            console.error("Failed to trigger Remootio:", err);
            setState({ status: 'error', message: 'Trigger Failed' });
            setTimeout(() => {
                setState({ status: 'idle', message: 'Ready' });
            }, 3000);
        }
    }, []);

    return {
        ...state,
        triggerGate
    };
};
