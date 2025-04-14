const path = require("path");
const fs = require("fs");

function logError(command, error) {
    try {
        const logsDir = path.join(__dirname, "logs");
        if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

        const logFilePath = path.join(logsDir, `${new Date().getTime()}_${command}.txt`);
        const logMessage = `${new Date().toISOString()}\n\n${error.stack}`;

        fs.appendFileSync(logFilePath, logMessage, "utf8");
    } catch (error) {
        console.log(error);
    }
}

exports.logError = logError;
