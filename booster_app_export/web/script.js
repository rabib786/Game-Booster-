const logsContainer = document.getElementById('logs');

function logMessage(msg, isError = false) {
    const p = document.createElement('p');
    p.textContent = `> ${msg}`;
    if (isError) p.className = 'log-error';
    
    logsContainer.appendChild(p);
    // Auto-scroll to bottom
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

async function boostGame() {
    const btn = document.getElementById('btn-boost');
    
    logMessage("Initiating Game Boost sequence...");
    btn.disabled = true;
    btn.textContent = "BOOSTING...";

    try {
        // Call Python function
        const result = await eel.boost_game()();
        
        if (result.status === "success") {
            logMessage(result.message);
            if (result.details) logMessage(result.details);
        } else {
            logMessage(result.message, true);
        }
    } catch (error) {
        logMessage("Error connecting to backend.", true);
    }

    btn.disabled = false;
    btn.textContent = "BOOST GAME";
}

async function cleanSystem() {
    const btn = document.getElementById('btn-clean');
    
    logMessage("Initiating System Clean sequence...");
    btn.disabled = true;
    btn.textContent = "CLEANING...";

    try {
        // Call Python function
        const result = await eel.clean_system()();
        
        if (result.status === "success") {
            logMessage(result.message);
        } else {
            logMessage(result.message, true);
        }
    } catch (error) {
        logMessage("Error connecting to backend.", true);
    }

    btn.disabled = false;
    btn.textContent = "CLEAN SYSTEM";
}

async function optimizeStartup() {
    const btn = document.getElementById('btn-startup');
    
    logMessage("Initiating Startup Optimization sequence...");
    btn.disabled = true;
    btn.textContent = "OPTIMIZING...";

    try {
        // Call Python function
        const result = await eel.optimize_startup()();
        
        if (result.status === "success") {
            logMessage(result.message);
            if (result.details) logMessage(result.details);
        } else {
            logMessage(result.message, true);
        }
    } catch (error) {
        logMessage("Error connecting to backend.", true);
    }

    btn.disabled = false;
    btn.textContent = "OPTIMIZE STARTUP";
}
