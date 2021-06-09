// Aggregator for page logic on enabling plugin page interaction
import * as events from './events';
import * as logging from '../utils/logging';
import {onMouseDown, onMouseUp, onMouseMove, onScroll, hideSelectionDiv} from './area_selection';
import {onClick} from './image_click';

const module_name = 'selection_mode';
var selection_mode = false;
var enabled = false;

var document_bak = null;
var body_bak = null;

async function startSelectionMode() {
    try {
        logging.debug(module_name, "startSelectionMode called")
        if (enabled && !selection_mode) {
            body_bak = {};
            if (typeof document.body.onclick !== 'undefined') {
                body_bak.onclick = document.body.onclick;
            }   
            window.onclick = onClick;

            document_bak = {};
            if (typeof document.onclick !== 'undefined') {
                document_bak.onclick = document.onclick;
            }     
            if (typeof document.onmousemove !== 'undefined') {
                document_bak.onmousemove = document.onmousemove;
            }
            if (typeof document.onmouseup !== 'undefined') {
                document_bak.onmouseup = document.onmouseup;
            }
            if (typeof document.onmousedown !== 'undefined') {
                document_bak.onmousedown = document.onmousedown;
            }
            if (typeof document.ondragstart !== 'undefined') {
                document_bak.ondragstart = document.ondragstart;
            }
            if (typeof document.onselectstart !== 'undefined') {
                document_bak.onselectstart = document.onselectstart;
            }
            document.onmousemove = onMouseMove;
            document.onmouseup = onMouseUp;
            document.onmousedown = onMouseDown;
            document.ondragstart = function(e) {
                e.preventDefault();
                return false
            };
            document.onselectstart = function(e) {
                e.preventDefault();
                return false
            };
            window.addEventListener('scroll', onScroll);
            selection_mode = true;
            logging.debug(module_name, "startSelectionMode success")
        }
    } catch (e) {
        logging.error(module_name, "startSelectionMode failed", e)
    }
}

async function stopSelectionMode() {
    try {
        logging.debug(module_name, "stopSelectionMode called")
        if (enabled && selection_mode) {
            if (body_bak != null) {
                if (typeof body_bak.onclick !== 'undefined') {
                    document.body.onclick = body_bak.onclick;
                }
            }
            if (document_bak != null) {
                if (typeof document_bak.onclick !== 'undefined') {
                    document.onclick = document_bak.onclick;
                }
                if (typeof document_bak.onmousemove !== 'undefined') {
                    document.onmousemove = document_bak.onmousemove;
                }
                if (typeof document_bak.onmouseup !== 'undefined') {
                    document.onmouseup = document_bak.onmouseup;
                }
                if (typeof document_bak.onmousedown !== 'undefined') {
                    document.onmousedown = document_bak.onmousedown;
                }
                if (typeof document_bak.ondragstart !== 'undefined') {
                    document.ondragstart = document_bak.ondragstart;
                }
                if (typeof document_bak.onselectstart !== 'undefined') {
                    document.onselectstart = document_bak.onselectstart;
                }
                document_bak = null;
            }
            window.removeEventListener('scroll', onScroll);
            hideSelectionDiv();
            selection_mode = false;
            logging.debug(module_name, "stopSelectionMode success")
        }
    } catch (e) {
        logging.error(module_name, "stopSelectionMode failed", e)
    }
}


export async function enable() {
    if (!enabled) {
        events.addListener(startSelectionMode, events.EventTypes.SelectAreaEnabled)
        events.addListener(stopSelectionMode, events.EventTypes.SelectAreaDisabled)      
        await events.fire({
           from: module_name,
           type: events.EventTypes.SelectionModeEnabled,
           data: {} 
        });
        enabled = true
        logging.debug(module_name, "module enabled")
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(startSelectionMode, events.EventTypes.SelectAreaEnabled)
        events.removeListener(stopSelectionMode, events.EventTypes.SelectAreaDisabled)      
        enabled = false
        logging.debug(module_name, "module disabled")
    }
}