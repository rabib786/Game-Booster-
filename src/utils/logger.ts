import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

// Determine if we are in a production environment
const isProd = import.meta.env.PROD;

// Generate a session ID when the module loads
const SESSION_ID = uuidv4();

// Custom browser transmit function to send logs back to the Python backend
const sendLogToBackend = (level: string, logEvent: any) => {
    if (window.eel && window.eel.ingest_client_log) {
        // Only send WARN and above to backend to save bandwidth, 
        // unless explicitly requested or in a critical path.
        const severityThreshold = isProd ? 40 : 30; // 40=WARN, 30=INFO in pino
        
        // pino logEvent structure: { level, time, msg, ...bindings }
        if (logEvent.level >= severityThreshold) {
            // Format standard JSON for backend
            const payload = {
                ...logEvent,
                level: level,
                timestamp: new Date(logEvent.time).toISOString(),
                session_id: SESSION_ID,
                user_agent: navigator.userAgent
            };
            
            // Fire and forget
            window.eel.ingest_client_log(payload)().catch(() => {
                // Failsafe: if the backend is down, we don't want to crash the frontend logger
                console.warn("Failed to transmit log to backend.");
            });
        }
    }
};

// Configure the Pino logger for browser usage
export const logger = pino({
    level: isProd ? 'info' : 'debug',
    browser: {
        asObject: true,
        transmit: {
            level: 'info',
            send: sendLogToBackend
        }
    }
});

// Helper to generate a new correlation ID for a transaction
export const generateCorrelationId = () => uuidv4();
