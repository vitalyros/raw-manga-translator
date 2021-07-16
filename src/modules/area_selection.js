import { loggingForModule } from "../utils/logging";
import * as events from "./events";
import * as settings from "../utils/settings";
import {APP_ELEMENT_ID_PREFIX} from "../utils/const";

const moduleName = "area_selection";
const logging = loggingForModule(moduleName);

var selection_mode = false;
var document_bak = null;

var enabled = false;

var isMouseDown = false;

const baseBorderWidth = 2;

// Factor by witch we increase the size of all of our elements
// With factor of 1 elements look to small on high resolution screens
var scalingFactor = 2.0;
var currentZoom = getCurrentZoom();
var borderWidth = getBorderWidth();
(async () => {
    scalingFactor = await settings.getUiScale();
    logging.debug("configured scaling factor", scalingFactor);
    borderWidth = getBorderWidth();
})();


var endX = 0;
var startX = 0;
var endY = 0;
var startY = 0;
var selectionDiv = null;

// Selection area valid range
var selectionMinArea = 200;
var selectionMaxArea = (window.innerHeight * window.innerWidth) * 0.5; // ridiculously large selection area - the whole screen

// Max selection area we consider it a click
var clickMaxArea = 100;

var exclusionZones = {};
var exclusionZoneDragged = false;
var exclusionZonesDivs = {};
var debugExclusionZones = false;

var scrollX = 0;
var scrollY = 0;

var coverDiv;

function getBorderStyle() {
    return `${borderWidth}px dashed #212121`;
}

function getBorderWidth() {
    return baseBorderWidth * scalingFactor / currentZoom;
}

function getCurrentZoom() {
    return window.devicePixelRatio;
}

function onZoomChanged() {
    currentZoom = getCurrentZoom();
    borderWidth = getBorderWidth();
    console.debug(`${scalingFactor} ${currentZoom} ${baseBorderWidth} ${borderWidth}`)
    if (selectionDiv) {
        selectionDiv.style.border = getBorderStyle();
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

function isSelectionDivAreaValid() {
    let area = selectionDivWidth() * selectionDivHeight();
    return area >= selectionMinArea && area <= selectionMaxArea;
}

function isSelectionDivAreaValidForClick() {
    let area = selectionDivWidth() * selectionDivHeight();
    return area <= clickMaxArea;
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
        selectionDiv.style["z-index"] = 1299;
        selectionDiv.style.display = "block";
        selectionDiv.style.visibility = "hidden";
        selectionDiv.style.border = getBorderStyle();
        window.document.body.appendChild(selectionDiv);
    }
}

function showSelectionDiv() {
    if (selectionDiv) {
        selectionDiv.style.visibility = "visible";
    }
}

export function hideSelectionDiv() {
    if (selectionDiv) {
        selectionDiv.style.visibility = "hidden";
    }
}

function allElementsFromPoint(clientX, clientY, susTagNames, predicate) {
    logging.debug("allElementsFromPoint called", clientX, clientY, susTagNames, predicate);
    var start = true;
    var element;
    var result = [];
    var elements = [];
    var susElements = [];
    var susPointerEvents = [];
    var clickPointerEvents = [];
    try {
        // If target elements would have pointerEvents = none, document.elementFromPoint will not find them, so before searching for all suspected elements pointerEvents = all is set
        susElements = susTagNames.map((tagName) => {
            return Array.from(document.getElementsByTagName(tagName));
        }).flat();
        logging.debug("elementFromPoint suspected elements", susElements);
        susElements.forEach((susElement) => {
            susPointerEvents.push(susElement.style.pointerEvents);
            susElement.style.pointerEvents = "all";
        });

        while (start || element && element !== document.documentElement) {
            start = false;
            element = document.elementFromPoint(clientX, clientY);
            logging.debug("elementFromPoint", clientX, clientY, element);
            if (element && element !== document.documentElement) {
                let found = predicate(element);
                if (found) {
                    result.push(element);
                }
                elements.push(element);
                clickPointerEvents.push( element.style.pointerEvents);
                element.style.pointerEvents = "none";
            }
        }
    } finally {
        for (let k = 0; k < elements.length; k++) {
            elements[k].style.pointerEvents = clickPointerEvents[k];
        }
        for (let k = 0; k < susPointerEvents.length; k++) {
            susElements[k].style.pointerEvents = susPointerEvents[k];
        }
    }
    result.reverse();
    logging.debug("allElementsFromPoint success", clientX, clientY, susTagNames, predicate, elements, result);
    return result;
}

function isAnyOfTypes(types, element) {
    return types.find((type) => {
        return element instanceof type;
    });
}

function isAnyOfTypesPredicate(types) {
    return (element) => isAnyOfTypes(types, element);
}

function allButtonsAndLinksFromPoint(clientX, clientY) {
    return allElementsFromPoint(clientX, clientY, ["button", "a"], isAnyOfTypesPredicate([HTMLButtonElement, HTMLLinkElement])); 
}

function allImageElementsFromPoint(clientX, clientY) { 
    return allElementsFromPoint(clientX, clientY, ["div", "img", "canvas"], (element) => {
        let isImageOrCanvas = isAnyOfTypes([HTMLImageElement, HTMLCanvasElement], element);
        // specificaly made for comic.pixiv.net which displays manga through divs with background-image
        let backgroundImage = element.style["background-image"];
        let isDivWithBackgroundImage = element instanceof HTMLDivElement && Boolean(backgroundImage);
        return isImageOrCanvas || isDivWithBackgroundImage;
    });
}

export function onMouseMove(event) {
    if (event.button != 0) {
        isMouseDown = false;
        // hideSelectionDiv();   
    }
    if (isMouseDown) {
        if (exclusionZoneDragged) {
            isMouseDown = false;
        } else if (intersetcWithExclusionZone(startX, startY, event.pageX, event.pageY)) {
            isMouseDown = false;
            hideSelectionDiv();
        } else {
            scrollX = window.scrollX;
            scrollY = window.scrollY;
            endX = event.pageX;
            endY = event.pageY;
            if (typeof selectionDiv !== "undefined" || selectionDiv == null) {
                selectionDiv.style.left = `${selectionDivUpperCornerX()}px`;
                selectionDiv.style.width = `${selectionDivWidth()}px`;
                selectionDiv.style.top = `${selectionDivUpperCornerY()}px`;
                selectionDiv.style.height = `${selectionDivHeight()}px`;
            }
            if (!isSelectionDivAreaValid()) {
                hideSelectionDiv();
            } else {
                showSelectionDiv();
            }
        }
    }
}

export function onScroll(/*event*/) {
    if (isMouseDown) {
        if (!exclusionZoneDragged) {
            endX -= scrollX;
            scrollX = window.scrollX;
            endX += scrollX;

            endY -= scrollY;
            scrollY = window.scrollY;
            endY += scrollY;
            if (intersetcWithExclusionZone(startX, startY, endY, endY)) {
                isMouseDown = false;
                hideSelectionDiv();
            } else {
                if (typeof selectionDiv !== "undefined" || selectionDiv == null) {
                    selectionDiv.style.left = `${selectionDivUpperCornerX()}px`;
                    selectionDiv.style.width = `${selectionDivWidth()}px`;
                    selectionDiv.style.top = `${selectionDivUpperCornerY()}px`;
                    selectionDiv.style.height = `${selectionDivHeight()}px`;
                }
                if (!isSelectionDivAreaValid()) {
                    hideSelectionDiv();
                } else {
                    showSelectionDiv();
                }
            }
        } else {
            isMouseDown = false;
        }
    }
}


export function onMouseUp(event) {
    if (isMouseDown) {
        isMouseDown = false;            
        if (!exclusionZoneDragged && !intersetcWithExclusionZone(startX, startY, event.pageX, event.pageY)) {
            scrollX = window.scrollX;
            scrollY = window.scrollY;
            endX = event.pageX;
            endY = event.pageY;
            const x_scrolled = selectionDivUpperCornerX();
            const y_scrolled = selectionDivUpperCornerY();
            const x_visible = x_scrolled - scrollX;
            const y_visible = y_scrolled - scrollY;
            const width = selectionDivWidth();
            const height = selectionDivHeight();
            const point = {
                pageX: event.pageX,
                pageY: event.pageY,
                clientX: event.clientX,
                clientY: event.clientY,
            };
            const box = {
                x_scrolled: x_scrolled + borderWidth,
                y_scrolled: y_scrolled + borderWidth,
                x_visible: x_visible + borderWidth,
                y_visible: y_visible + borderWidth,
                width: width - borderWidth * 2,
                height: height - borderWidth * 2
            };
            if (isSelectionDivAreaValid()) {
                events.fire({
                    type: events.EventTypes.SelectAreaSuccess,
                    from: moduleName,
                    data: {
                        point: point,
                        box: box
                    }
                });
            } else {
                hideSelectionDiv();
                if (isSelectionDivAreaValidForClick()) {
                    const elements = allImageElementsFromPoint(event.clientX, event.clientY);
                    if (elements.length > 0) {
                        const element = elements[0];
                        const elementRect = element.getBoundingClientRect();
                        elementRect.pageX = elementRect.x + window.scrollX; 
                        elementRect.pageY = elementRect.y + window.scrollY;
                        // Fire event with all image elements and let the bubble recognition decide which to use
                        events.fire({
                            from: moduleName,
                            type: events.EventTypes.ImageClicked,
                            data: {
                                point: point,
                                element: element,
                                elementRect: elementRect,
                                elementX: event.clientX - elementRect.x,
                                elementY: event.clientY - elementRect.y
                            }
                        }, true);
                    }
                }
            }
        }
        hideSelectionDiv();
    }
}

export function onMouseDown(event) {
    if (!isMouseDown && !exclusionZoneDragged &&!isInExclusionZone(event.pageX, event.pageY) && event.button === 0) {
        isMouseDown = true;
        scrollX = window.scrollX;
        scrollY = window.scrollY;
        startX = event.pageX;
        startY = event.pageY;
        initializeSelectionDiv();
        selectionDiv.style.left = `${startX}px`;
        selectionDiv.style.width = "0px";
        selectionDiv.style.top = `${startY}px`;
        selectionDiv.style.height = "0px";
        events.fire({
            type: events.EventTypes.SelectAreaStart,
            from: moduleName,
            data: {}
        });
    }
}

function intersetcWithExclusionZone(startX, startY, endX, endY) {
    var result = Object.keys(exclusionZones).find(function(key) {
        var zone = exclusionZones[key];
        const left = Math.min(startX, endX);
        const right = Math.max(startX, endX);
        const top = Math.min(startY, endY);
        const bottom = Math.max(startY, endY);
        const crossedByX = left <= zone.right && right >= zone.left;
        const crossedByY = top <= zone.bottom && bottom >= zone.top;
        return crossedByX && crossedByY;
    });
    return Boolean(result);
}

function isInExclusionZone(x, y) {
    var result = Object.keys(exclusionZones).find(function(key) {
        var zone = exclusionZones[key];
        if (x >= zone.left && x <= zone.right && y >= zone.top && y <= zone.bottom) {
            return true;
        } else {
            return false;
        }
    });
    return Boolean(result);
}

function onExclusionZoneUpdate(event) {
    var rect = event.data.rect;
    var name = event.data.name;
    if (event.data.remove) {
        delete exclusionZones[name];
        if (debugExclusionZones) {
            let exclusionZoneDiv = exclusionZonesDivs[name];
            if (exclusionZoneDiv) {
                window.document.body.removeChild(exclusionZoneDiv);
                delete exclusionZonesDivs[name];
            }
            
        }
    } else {
        exclusionZones[name] = rect;
        if (debugExclusionZones) {
            var borderWidth = 3;
            let exclusionZoneDiv = exclusionZonesDivs[name];
            if (!exclusionZoneDiv) {
                exclusionZoneDiv = document.createElement("div");
                exclusionZoneDiv.style.position = "absolute";
                exclusionZoneDiv.style["z-index"]= 1200;
                exclusionZoneDiv.style.border = `${borderWidth}px solid red`;
                window.document.body.appendChild(exclusionZoneDiv);
                exclusionZonesDivs[name] = exclusionZoneDiv;
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

function preventPropagation(event) {
    logging.debug("prevent progagation", event);
    try {
        let buttons = allButtonsAndLinksFromPoint(event.clientX, event.clientY);
        let images = allImageElementsFromPoint(event.clientX, event.clientY);
        logging.debug("cover div intercepted", event, buttons, images);
        if (images.length > 0 && buttons.length === 0) {
            event.preventDefault();
            event.stopPropagation();
        }
    } catch (e) {
        logging.error("cover div interception failed", event, e);
    }
}


// Div that covers all page and prevents onclick and onmousedown on images but not on buttons or links
function createCoverDiv() {
    if (!coverDiv) {
        coverDiv = document.createElement("div");
        coverDiv.style.position = "absolute";
        coverDiv.style.width = "100%";
        coverDiv.style.height = "100%";
        coverDiv["z-index"] = 1298;
        coverDiv.id=`${APP_ELEMENT_ID_PREFIX}-area-selection-cover`;
        coverDiv.onclick = preventPropagation;
        coverDiv.onmousedown = preventPropagation;
    }
    document.body.appendChild(coverDiv);
}

function removeCoverDiv() {
    document.body.removeChild(coverDiv);
    coverDiv = null;
}

async function startSelectionMode() {
    try {
        logging.debug(moduleName, "startSelectionMode called");
        if (enabled && !selection_mode) {
            document_bak = {};
            if (typeof document.onclick !== "undefined") {
                document_bak.onclick = document.onclick;
            }     
            if (typeof document.onmousemove !== "undefined") {
                document_bak.onmousemove = document.onmousemove;
            }
            if (typeof document.onmouseup !== "undefined") {
                document_bak.onmouseup = document.onmouseup;
            }
            if (typeof document.onmousedown !== "undefined") {
                document_bak.onmousedown = document.onmousedown;
            }
            if (typeof document.ondragstart !== "undefined") {
                document_bak.ondragstart = document.ondragstart;
            }
            if (typeof document.onselectstart !== "undefined") {
                document_bak.onselectstart = document.onselectstart;
            }

            document.onmousemove = onMouseMove;
            document.onmouseup = onMouseUp;
            document.onmousedown = onMouseDown;
            document.onclick = preventPropagation;
            document.ondragstart = preventPropagation;
            createCoverDiv();
            window.addEventListener("scroll", onScroll);
            selection_mode = true;
            logging.debug(moduleName, "startSelectionMode success");
        }
    } catch (e) {
        logging.error(moduleName, "startSelectionMode failed", e);
    }
}

async function stopSelectionMode() {
    try {
        logging.debug(moduleName, "stopSelectionMode called");
        if (enabled && selection_mode) {
            if (document_bak != null) {
                if (typeof document_bak.onclick !== "undefined") {
                    document.onclick = document_bak.onclick;
                }
                if (typeof document_bak.onmousemove !== "undefined") {
                    document.onmousemove = document_bak.onmousemove;
                }
                if (typeof document_bak.onmouseup !== "undefined") {
                    document.onmouseup = document_bak.onmouseup;
                }
                if (typeof document_bak.onmousedown !== "undefined") {
                    document.onmousedown = document_bak.onmousedown;
                }
                if (typeof document_bak.ondragstart !== "undefined") {
                    document.ondragstart = document_bak.ondragstart;
                }
                if (typeof document_bak.onselectstart !== "undefined") {
                    document.onselectstart = document_bak.onselectstart;
                }
                document_bak = null;
            }
            removeCoverDiv();
            window.removeEventListener("scroll", onScroll);
            hideSelectionDiv();
            selection_mode = false;
            logging.debug(moduleName, "stopSelectionMode success");
        }
    } catch (e) {
        logging.error(moduleName, "stopSelectionMode failed", e);
    }
}

export async function enable() {
    if (!enabled) {
        events.addListener(onExclusionZoneUpdate, events.EventTypes.AreaSelectionExclusionZoneUpdate);
        events.addListener(onExclusionZoneDragUpdate, events.EventTypes.AreaSelectionExclusionZoneDragUpdate);
        events.addListener(startSelectionMode, events.EventTypes.SelectAreaEnabled);
        events.addListener(stopSelectionMode, events.EventTypes.SelectAreaDisabled);     
        window.addEventListener("resize", onZoomChanged); 
        await events.fire({
            from: moduleName,
            type: events.EventTypes.AreaSelectionModuleEnabled,
            data: {} 
        });
        enabled = true;
        logging.debug("module enabled");
    }
}

export async function disable() {
    if (enabled) {
        events.removeListener(onExclusionZoneUpdate, events.EventTypes.AreaSelectionExclusionZoneUpdate);
        events.removeListener(onExclusionZoneDragUpdate, events.EventTypes.AreaSelectionExclusionZoneDragUpdate);
        events.removeListener(startSelectionMode, events.EventTypes.SelectAreaEnabled);
        events.removeListener(stopSelectionMode, events.EventTypes.SelectAreaDisabled);    
        window.removeEventListener("resize", onZoomChanged);   
        enabled = false;
        logging.debug("module disabled");
    }
}