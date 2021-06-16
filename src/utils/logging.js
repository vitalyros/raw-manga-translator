import {getDebugEnabled} from "./settings";
import {APP_NAME, APP_NICK} from "./const";

var debugEnabled = true;

export async function init() {
    debugEnabled = await getDebugEnabled();
    if (debugEnabled) {
        warn("debug enabled");
    } else {
        warn("debug disabled");
    }
}

export function error(...args) {
    console.error(APP_NAME, ...args);
}

export function warn(...args) {
    console.warn(APP_NAME, ...args);
}

export function info(...args) {
    console.info(APP_NAME, ...args);
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
        info: (...args) => info(moduleName, ...args),
        debug: (...args) => debug(moduleName, ...args),
    };
}
