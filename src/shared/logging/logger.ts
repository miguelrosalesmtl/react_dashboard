const logger = {
    info: (message: string, ...optionalParams: Event[]) => {
        console.info(`INFO: ${message}`, ...optionalParams);
    },
    warn: (message: string, ...optionalParams: Event[]) => {
        console.warn(`WARN: ${message}`, ...optionalParams);
    },
    error: (message: string, ...optionalParams: Event[]) => {
        console.error(`ERROR: ${message}`, ...optionalParams);
    }
};

export default logger;