var events = require('./events.js');

const module_name = 'area_selection';

const borderWidth = 2;

var enabled = false;

var selection_mode = false;
var document_bak = null;

var isMouseDown = false;


var endX = 0;
var startX = 0;
var endY = 0;
var startY = 0;
var selectionDiv = null;
var areaThreshold = 400;

var exclusionZones = {};
var exclusionZoneDragged = false;
var exclusionZonesDivs = {};
var debugExclusionZones = false;

var scrollX = 0;
var scrollY = 0;

async function startSelectionMode() {
    try {
        if (!selection_mode) {
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
            window.addEventListener('scroll', onScroll);
            selection_mode = true;
        }
    } catch (e) {
        console.error("Failed enableSelectionMode", e)
    }
}

async function stopSelectionMode() {
    console.log("stop selection mode")
    try {
        if (selection_mode) {
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
                window.removeEventListener('scroll', onScroll);
                document_bak = null;
            }
            hideSelectionDiv();
            selection_mode = false;
        }
    } catch (e) {
        console.error("Failed disableSelectionMode", e)
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

function initializeSelectionDiv() {
    if (typeof selectionDiv === "undefined" || selectionDiv === null) {
        selectionDiv = document.createElement("div");
        selectionDiv.style.position = "absolute";
        selectionDiv.style['z-index'] = 1299;
        selectionDiv.style.border = `${borderWidth}px dashed #212121`;
        window.document.body.appendChild(selectionDiv);
    }
}

function showSelectionDiv() {
    if (typeof selectionDiv !== "undefined" && selectionDiv != null) {
        selectionDiv.style.display = "block";
    }
}

function hideSelectionDiv() {
    if (typeof selectionDiv !== "undefined" && selectionDiv != null) {
        selectionDiv.style.display = "none";
    }
}


function onMouseMove(event) {
    if (event.button != 0) {
        isMouseDown = false;
        // hideSelectionDiv();   
    }
    if (isMouseDown) {
        if (exclusionZoneDragged) {
            isMouseDown = false;
        } else if (isInExclusionZone(event.pageX, event.pageY)) {
            isMouseDown = false;
            hideSelectionDiv();
        } else {
            scrollX = window.scrollX
            scrollY = window.scrollY
            endX = event.pageX;
            endY = event.pageY;
            if (typeof selectionDiv !== "undefined" || selectionDiv == null) {
                selectionDiv.style.left = `${selectionDivUpperCornerX()}px`;
                selectionDiv.style.width = `${selectionDivWidth()}px`;
                selectionDiv.style.top = `${selectionDivUpperCornerY()}px`;
                selectionDiv.style.height = `${selectionDivHeight()}px`;
            }
        }
    }
}

function onScroll(event) {
    if (isMouseDown) {
        if (!exclusionZoneDragged) {
            endX -= scrollX;
            scrollX = window.scrollX;
            endX += scrollX;

            endY -= scrollY;
            scrollY = window.scrollY;
            endY += scrollY;
            if (typeof selectionDiv !== "undefined" || selectionDiv == null) {
                selectionDiv.style.left = `${selectionDivUpperCornerX()}px`;
                selectionDiv.style.width = `${selectionDivWidth()}px`;
                selectionDiv.style.top = `${selectionDivUpperCornerY()}px`;
                selectionDiv.style.height = `${selectionDivHeight()}px`;
            }
        } else {
            isMouseDown = false;
            // hideSelectionDiv();
        }
    }
}


function onMouseUp(event) {
    if (isMouseDown) {
        isMouseDown = false;
        if (!exclusionZoneDragged && !isInExclusionZone(event.pageX, event.pageY)) {
            scrollX = window.scrollX
            scrollY = window.scrollY
            endX = event.pageX;
            endY = event.pageY;
            console.log(`Ended Dragging ${endX} ${endY}`);
            var x_scrolled = selectionDivUpperCornerX();
            var y_scrolled = selectionDivUpperCornerY();
            var x_visible = x_scrolled - scrollX;
            var y_visible = y_scrolled - scrollY;
            var width = selectionDivWidth();
            var height = selectionDivHeight();
            var box = {
                x_scrolled: x_scrolled + borderWidth,
                y_scrolled: y_scrolled + borderWidth,
                x_visible: x_visible + borderWidth,
                y_visible: y_visible + borderWidth,
                width: width - borderWidth * 2,
                height: height - borderWidth * 2
            }
            if (width * height >= areaThreshold) {
                events.fire({
                    type: events.EventTypes.area_selected,
                    from: module_name,
                    data: {
                        box: box
                    }
                })
            } else {
                hideSelectionDiv();
            }
        }
        hideSelectionDiv();
    }
}

function onMouseDown(event) {
    if (!isMouseDown && !exclusionZoneDragged &&!isInExclusionZone(event.pageX, event.pageY)) {
        isMouseDown = true;
        scrollX = window.scrollX
        scrollY = window.scrollY
        startX = event.pageX;
        startY = event.pageY;
        initializeSelectionDiv();
        selectionDiv.style.left = `${startX}px`;
        selectionDiv.style.width = `0px`;
        selectionDiv.style.top = `${startY}px`;
        selectionDiv.style.height = `0px`;
        showSelectionDiv();
    }
}

function isInExclusionZone(x, y) {
    var result = Object.keys(exclusionZones).find(function(key) {
        var zone = exclusionZones[key]
        if (x >= zone.left && x <= zone.right && y >= zone.top && y <= zone.bottom) {
            return true;
        } else {
            return false;
        }
    });
    return Boolean(result);
}

function onExclusionZoneUpdate(event) {
    var rect = event.data.rect
    var name = event.data.name
    if (event.data.remove) {
        delete exclusionZones[name]
        if (debugExclusionZones) {
            var exclusionZoneDiv = exclusionZonesDivs[name]
            if (exclusionZoneDiv) {
                window.document.body.removeChild(exclusionZoneDiv);
                delete exclusionZonesDivs[name]
            }
            
        }
    } else {
        exclusionZones[name] = rect
        if (debugExclusionZones) {
            var borderWidth = 3
            var exclusionZoneDiv = exclusionZonesDivs[name]
            if (!exclusionZoneDiv) {
                exclusionZoneDiv = document.createElement("div");
                exclusionZoneDiv.style.position = 'absolute';
                exclusionZoneDiv.style['z-index']= 1200;
                exclusionZoneDiv.style.border = `${borderWidth}px solid red`;
                window.document.body.appendChild(exclusionZoneDiv);
                exclusionZonesDivs[name] = exclusionZoneDiv
            }
            exclusionZoneDiv.style.left = `${rect.x - borderWidth}px`;
            exclusionZoneDiv.style.width = `${rect.width + borderWidth * 2}px`;
            exclusionZoneDiv.style.top = `${rect.y - borderWidth}px`;
            exclusionZoneDiv.style.height = `${rect.height + borderWidth * 2}px`;
        }
            
    }
}

function onExclusionZoneDragUpdate(event) {
    exclusionZoneDragged = event.data.dragged;
}

export async function enable() {
    if (!enabled) {
        events.addListener(onExclusionZoneUpdate, events.EventTypes.AreaSelectionExclusionZoneUpdate)
        events.addListener(onExclusionZoneDragUpdate, events.EventTypes.AreaSelectionExclusionZoneDragUpdate)
        events.addListener(startSelectionMode, events.EventTypes.start_select_area)
        events.addListener(stopSelectionMode, events.EventTypes.cancel_select_area)      
        await events.fire({
           from: module_name,
           type: events.EventTypes.module_area_selection_enabled,
           data: {} 
        });
        enabled = true
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onExclusionAreaUpdate, events.EventTypes.AreaSelectionExclusionZoneUpdate)
        events.removeListener(onExclusionZoneDragUpdate, events.EventTypes.AreaSelectionExclusionZoneDragUpdate)
        events.removeListener(startSelectionMode, events.EventTypes.start_select_area)
        events.removeListener(stopSelectionMode, events.EventTypes.cancel_select_area)      
        enabled = false
    }
}