import * as events from './events';
import {loggingForModule} from '../utils/logging';

const moduleName = 'event_logger';
const logging = loggingForModule(moduleName)

var enabled = false;

function onEvent(event) {
    logging.debug(event);
}

export async function enable() {
    if (!enabled) {
        events.addListener(onEvent);
        enabled = true;
        logging.debug("module enabled")
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onEvent);
        enabled = false;
        logging.debug("module disabled")
    }
}