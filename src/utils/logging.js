import {getDebugEnabled} from "./settings";
import {APP_NAME, APP_NICK} from "./const";

const debugEnabled = getDebugEnabled();
debug();

export function error(...args) {
    console.error(APP_NAME, ...args);
}

export function warn(...args) {
    console.error(APP_NAME, ...args);
}

export function debug(...args) {
    if (debugEnabled) {
        console.debug(APP_NICK, ...args);
    }
}

export function loggingForModule(moduleName) {
    return {
        error: (...args) => error(moduleName, ...args),
        warn: (...args) => warn(moduleName, ...args),
        debug: (...args) => debug(moduleName, ...args),
    };
}