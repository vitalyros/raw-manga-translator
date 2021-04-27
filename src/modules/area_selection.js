var messaging = require('./messaging.js');

const module_name = 'area_selection';

var enabled = false;

var document_bak = null;

var isMouseDown = false;
var endX = 0;
var startX = 0;
var endY = 0;
var startY = 0;
var selectionDiv = null;

function started() {
    document_bak = {};
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
}

function canceled() {
    if (document_bak != null) {
        if (typeof document.onmousemove !== 'undefined') {
            document.onmousemove = document_bak.onmousemove;
        }
        if (typeof document.onmouseup !== 'undefined') {
            document.onmouseup = document_bak.onmouseup;
        }
        if (typeof document.onmousedown !== 'undefined') {
            document.onmousedown = document_bak.onmousedown;
        }
        if (typeof document.ondragstart !== 'undefined') {
            document.ondragstart = document_bak.ondragstart;
        }
        if (typeof document.onselectstart !== 'undefined') {
            document.onselectstart = document_bak.onselectstart;
        }
    }
}


function selectionDivSide(start, end) {
    if (typeof selectionDiv != "undefined" || selectionDiv == null) {
        if (end > start) {
            return end - start;
        } else if (end < start ) {
            return start - end;
        } else {
            return 0;
        }
    } else {
        return 0;
    }
}

function selectionDivWidth() {
    return selectionDivSide(startX, endX);
}

function selectionDivHeight() {
    return selectionDivSide(startY, endY);
}

function selectionDivUpperCorner(start, end) {
    if (end >= start) {
        return start;
    } else {
        return end;
    }
}

function selectionDivUpperCornerX() {
    return selectionDivUpperCorner(startX, endX);
}

function selectionDivUpperCornerY() {
    return selectionDivUpperCorner(startY, endY);
}

function onMouseMove(event) {
    if (event.button != 0) {
        isMouseDown = false;
    }
    if (isMouseDown) {
        endX = event.clientX;
        endY = event.clientY;
        console.log(`Dragging ${endX} ${endY}`);

        if (typeof selectionDiv != "undefined" || selectionDiv == null) {
            selectionDiv.style.left = `${selectionDivUpperCornerX()}px`;
            selectionDiv.style.width = `${selectionDivWidth()}px`;
            selectionDiv.style.top = `${selectionDivUpperCornerY()}px`;
            selectionDiv.style.height = `${selectionDivHeight()}px`;
        }
    }
}

function onMouseUp(event) {
    if (isMouseDown) {
        isMouseDown = false;
        endX = event.clientX;
        endY = event.clientY;
        var x_visible = selectionDivUpperCornerX();
        var y_visible = selectionDivUpperCornerY();
        var x_scrolled = x_visible + window.scrollX;
        var y_scrolled = y_visible + window.scrollY;
        var box = {
            x_scrolled: x_scrolled,
            y_scrolled: y_scrolled,
            x_visible: x_visible,
            y_visible: y_visible,
            width: selectionDivWidth(),
            height: selectionDivHeight()
        }
        messaging.send({
            type: messaging.MessageTypes.area_selected,
            from: module_name,
            data: {
                box: box
            }
        })
        console.log(`Ended Dragging ${endX} ${endY}`);
        if (typeof selectionDiv != "undefined" && selectionDiv != null) {
            selectionDiv.style.display = "none";
        }
    }
}

function onMouseDown(event) {
    isMouseDown = true;
    startX = event.clientX;
    startY = event.clientY;
    console.log(`Start Dragging ${startX} ${startY}`)
    if (typeof selectionDiv == "undefined" || selectionDiv == null) {
        selectionDiv = document.createElement("div");
        selectionDiv.style.position = "fixed";
        selectionDiv.style.border = "3px solid black";
        window.document.body.appendChild(selectionDiv);
    }
    selectionDiv.style.left = `${startX}px`;
    selectionDiv.style.width = `0px`;
    selectionDiv.style.top = `${startY}px`;
    selectionDiv.style.height = `0px`;
    selectionDiv.style.display = "block";
}

function reset() {
    canceled();
}

function enable() {
    if (!enabled) {
        messaging.addListener(started, messaging.MessageTypes.start_select_area)
        messaging.addListener(canceled, messaging.MessageTypes.cancel_select_area)      
        enabled = true
    }
}

function disable() {
    if (enabled) {
        messaging.removeListener(started, messaging.MessageTypes.start_select_area)
        messaging.removeListener(canceled, messaging.MessageTypes.cancel_select_area)      
        enabled = false
    }
}

module.exports.disable = disable;
module.exports.init = enable;
module.exports.enable = enable;