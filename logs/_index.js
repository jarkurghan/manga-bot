function logError(commandOrAction, error) {
    const logsDir = path.join(__dirname, "logs");
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
    }

    const logFilePath = path.join(logsDir, "error_log.txt");
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}_${commandOrAction}_${error.message}\n`;

    fs.appendFileSync(logFilePath, logMessage, "utf8");
}

exports.logError = logError;
