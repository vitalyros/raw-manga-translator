import {default as initOpencvJs} from "@vitalyros/opencvjs-wasm-separate";
import * as events from "./events";
import {loggingForModule} from "../utils/logging";
import {APP_ELEMENT_ID_PREFIX} from "../utils/const";
import * as settings from "../utils/settings";

const moduleName = "bubble_recognition_opencv";
const logging = loggingForModule(moduleName);
var enabled = false;

var cv;

var CONTOUR_COLOR;
var RECTANGLE_COLOR;
var WHITE;
var BLACK;

async function initCV() {
    var url = browser.extension.getURL("./dist/ext/opencv/opencv.wasm");
    logging.debug("initializing CV", url);
    const wasm = await fetch(url);
    logging.debug("cv wasm fetched", wasm);
    const buffer = await wasm.arrayBuffer();
    logging.debug("cv wasm bufferized", buffer);
    cv = await initOpencvJs({
        wasmBinary: buffer
    });
    logging.debug("cv built", cv);
    CONTOUR_COLOR = new cv.Scalar(255, 0, 0, 255);
    RECTANGLE_COLOR = new cv.Scalar(0, 0, 255, 255);
    WHITE = new cv.Scalar(255);
    BLACK = new cv.Scalar(0);
}

// grayMode
// true: Do mask manipulation with gray version of the image, transform to RGBA on output 
// false: Do mask manipulation with RBGA image, no transformation on output
const grayMode = true; 

// Show preprocessed image that is fed to the contour finding algorythm
var showContourSource = false;
// Show original image with all contours on it. Do not use when the contour count is high, it's going to be extremely slow
var showAllContours = false;
const showAllContoursLimit = 10000;
// Show original image with contour that we consider a found bubble
var showBubbleContour = false
// Show cropped image with the bubble
var showCroppedMask = false;
// Show filtered bubble contents - the output of this module
var showOutput = false;
(async () => {
    let debug = await settings.getDebugBubbleRecogniton();
    logging.debug("Configuring bubble recognition debug", debug)
    showContourSource = debug;
    showAllContours = debug;
    showBubbleContour = debug;
    showCroppedMask = debug;
    showOutput = debug;
})();

// Cache image source, its grayscale version, contours and hierarchy
var useCache = true;
var cache;




// Configurations for preprocessing of the image before contour finding algorithm 
// Those might work better or worse depending on the processed image - the darkness of  the contrast and darkness of its edges and its textures

// The side of blure rectangle
// 3 would be rather small, 10 would be much, 20 - very much
const CP_BLUR_SIDE = 10;
// Half hypothenuse is the maximum influence distance of blur
const CP_BLUR_HALF_HYPOTENUSE = Math.sqrt(CP_BLUR_SIDE * CP_BLUR_SIDE * 2) / 2;
// The treshold value that turns gray colors into black. 
// It will be really bad if it is darker than the whitespace of the image or lighter than the edges of the bubble after the blur is applied. This might be the case with bad quality scans.
const CP_THRESHOLD_VALUE = 235;

var contourSourceCanvas;
var allContoursCanvas;
var bubbleContourCanvas;
var croppedMaskCanvas;
var outputCanvas;

// Calls delete on opencv object
function deleteCV(resource) {
    if (resource) {
        resource.delete();
    }
}

function initContourSourceCanvas() {
    if (!contourSourceCanvas) {
        contourSourceCanvas = document.createElement("canvas");
        contourSourceCanvas.id = `${APP_ELEMENT_ID_PREFIX}_contourSourceCanvas`;
        document.body.appendChild(contourSourceCanvas);
    }
}

function initAllContoursCanvas() {
    if (!allContoursCanvas) {
        allContoursCanvas = document.createElement("canvas");
        allContoursCanvas.id = `${APP_ELEMENT_ID_PREFIX}_allContoursCanvas`;
        document.body.appendChild(allContoursCanvas);
    }
}

function initBubbleContourCanvas() {
    if (!bubbleContourCanvas) {
        bubbleContourCanvas = document.createElement("canvas");
        bubbleContourCanvas.id = `${APP_ELEMENT_ID_PREFIX}_bubbleContourCanvas`;
        document.body.appendChild(bubbleContourCanvas);
    }
}

function initCroppedMaskCanvas() {
    if (!croppedMaskCanvas) {
        croppedMaskCanvas = document.createElement("canvas");
        croppedMaskCanvas.id = `${APP_ELEMENT_ID_PREFIX}_croppedMaskCanvas`;
        document.body.appendChild(croppedMaskCanvas);
    }
}

function initOutputCanvas() {
    if (!outputCanvas) {
        outputCanvas = document.createElement("canvas");
        outputCanvas.id = `${APP_ELEMENT_ID_PREFIX}_outputCanvas`;
        if (showOutput) {
            document.body.appendChild(outputCanvas);
        }
    }
}

// Crashes firefox
// function display(src, canvas) {
//   cv.imshow(canvas, src)
// }

// Crashes firefox
// function display(src, canvas) {
//   canvas.width = src.cols;
//   canvas.height = src.rows;
//   let arr = new Uint8ClampedArray(dst.data, dst.cols, dst.rows)
//   let imdata = new ImageData(arr, dst.cols, dst.rows);
//   const ctx = canvas.getContext('2d');
//   ctx.putImageData(imdata, 0, 0);
//   dst.delete()
// }

// Access forbidden
// function display(src, canvas) {
//   canvas.width = src.cols;
//   canvas.height = src.rows;
//   let arr = new Uint8ClampedArray(src.data, src.cols, src.rows)
//   let imdata = new ImageData(arr, src.cols, src.rows);
//   const ctx = canvas.getContext('2d');
//   const ctxImageData = ctx.createImageData(src.cols, src.rows);
//   ctxImageData.data.set(imdata.data)
//   ctx.putImageData(ctxImageData, 0, 0);
// }


// Uses putImageData copied from Firefox documentation
// function display(src, canvas) {
//   canvas.width = src.cols;
//   canvas.height = src.rows;
//   let arr = new Uint8ClampedArray(src.data, src.cols, src.rows)
//   let imdata = new ImageData(arr, src.cols, src.rows);
//   const ctx = canvas.getContext('2d');
//   putImageData(ctx, imdata, 0, 0);
// }

// Copied from documentation on putImageData for firefox
// function putImageData(ctx, imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
//   let data = imageData.data;
//   let height = imageData.height;
//   let width = imageData.width;
//   dirtyX = dirtyX || 0;
//   dirtyY = dirtyY || 0;
//   dirtyWidth = dirtyWidth !== undefined? dirtyWidth: width;
//   dirtyHeight = dirtyHeight !== undefined? dirtyHeight: height;
//   let limitBottom = dirtyY + dirtyHeight;
//   let limitRight = dirtyX + dirtyWidth;
//   for (let y = dirtyY; y < limitBottom; y++) {
//     for (let x = dirtyX; x < limitRight; x++) {
//       var pos = y * width + x;
//       ctx.fillStyle = `rgba(${data[pos*4+0]},${data[pos*4+1]},${data[pos*4+2]},${(data[pos*4+3]/255)})`;
//       ctx.fillRect(x + dx, y + dy, 1, 1);
//     }
//   }
// }

// Fast but has unnecessary transformation of src to ImageData
// function display(src, canvas, gray = false) {
//   canvas.width = src.cols;
//   canvas.height = src.rows;
//   let arr = new Uint8ClampedArray(src.data, src.cols, src.rows)
//   let srcImdata = new ImageData(arr, src.cols, src.rows);
//   const ctx = canvas.getContext('2d');
//   const ctxImageData = ctx.createImageData(src.cols, src.rows);
//   const outData = ctxImageData.data
//   const srcData = srcImdata.data
//   const length = srcData.length
//   if (gray) {
//     for (let i = 0; i < length; i += 1) {
//       outData[i * 4] = srcData[i];
//       outData[i * 4 + 1] = srcData[i];
//       outData[i * 4 + 2] = srcData[i];
//       outData[i * 4 + 3] = 255;
//     }
//   } else {
//     for (let i = 0; i < length; i += 1) {
//       outData[i] = srcData[i];
//     }
//   }
//   ctx.putImageData(ctxImageData, 0, 0);
// }


// Adjusts a point on image for given scale
function scaleImagePoint(point, scale) {
    return {
        x: point.x * scale.x,
        y: point.y * scale.y
    };
}

// Finds the scaling factors of image source for image DOM element
function findImageScale(imageRect, imageSrc) {
    return { 
        x: imageSrc.cols / imageRect.width,
        y: imageSrc.rows / imageRect.height
    };
}

function display(src, canvas, gray = false) {
    canvas.width = src.cols;
    canvas.height = src.rows;
    const srcData = src.data;
    const ctx = canvas.getContext("2d");
    const ctxImageData = ctx.createImageData(src.cols, src.rows);
    const outData = ctxImageData.data;
    const length = srcData.length;
    if (gray) {
    // src is one byte per pixel (gray8), canvas is four bytes per pixel (RGBA8)
        for (let i = 0, j = 0; i < length; i += 1, j += 4) {
            let srcByte = srcData[i];
            outData[j] = srcByte;
            outData[j + 1] = srcByte;
            outData[j + 2] = srcByte;
            outData[j + 3] = 255; // Non transparent
        }
    } else {
    // Both src and canvas are four bytes per pixel bixel (RGBA8)
        for (let i = 0; i < length; i += 1) {
            outData[i] = srcData[i];
        }
    }
    ctx.putImageData(ctxImageData, 0, 0);
}

function displayAllContours(src, contours, hierarchy) {
    if (showAllContours) {
        var clone;
        try {
            if (contours.size() > showAllContoursLimit) {
                logging.warn("Skipped display all contours. Too much contours", contours.size(), showAllContoursLimit);
                return;
            }
            const startDate = new Date();
            clone = src.clone();
            for (let i = 0; i < contours.size(); ++i) {
                cv.drawContours(clone, contours, i, CONTOUR_COLOR, 1, cv.LINE_8, hierarchy, 100);
            }
            const drawDate = new Date();
            logging.debug("drew all contours", drawDate.getTime() - startDate.getTime()); 
            initAllContoursCanvas();
            display(clone, allContoursCanvas);
            const displayDate = new Date();
            logging.debug("displayed all contours", displayDate.getTime() - drawDate.getTime(), displayDate.getTime() - startDate.getTime()); 
        } finally {
            if (clone) {
                clone.delete();
            }
        }
    }
}

function displayBubbleContour(src, contours, hierarchy, contourData, boundingRect) {
    if (showBubbleContour) {
        var clone;
        try {
            const startDate = new Date();
            clone = src.clone();
            cv.drawContours(clone, contours, contourData.index, CONTOUR_COLOR, 1, cv.LINE_8, hierarchy, 100);

            const drawContourDate = new Date();
            logging.debug("drew bubble contour", drawContourDate.getTime() - startDate.getTime()); 

            let point1 = new cv.Point(boundingRect.x, boundingRect.y);
            let point2 = new cv.Point(boundingRect.x + boundingRect.width, boundingRect.y + boundingRect.height);
            cv.rectangle(clone, point1, point2, RECTANGLE_COLOR, 2, cv.LINE_AA, 0);
            const drawRectDate = new Date();

            logging.debug("drew boundng rect", drawRectDate.getTime() - drawContourDate.getTime()); 

            initBubbleContourCanvas();
            display(clone, bubbleContourCanvas);
            const displayDate = new Date();
            logging.debug("displayed bubble contour", displayDate.getTime() - drawRectDate.getTime(), displayDate.getTime() - startDate.getTime()); 
        } finally {
            if (clone) {
                clone.delete();
            }
        }
    }
}

function displayContourSource(src) {
    if (showContourSource) {
        const startDate = new Date();
        initContourSourceCanvas();
        display(src, contourSourceCanvas, true); // contour sourse is alway grayscale
        const endDate = new Date();
        logging.debug("displayed contour source", endDate.getTime() - startDate.getTime()); 
    }
}

function displayCroppedMask(croppedMask) {
    if (showCroppedMask) {
        const startDate = new Date();
        initCroppedMaskCanvas();
        display(croppedMask, croppedMaskCanvas, grayMode);
        const endDate = new Date();
        logging.debug("displayed cropped mask", endDate.getTime() - startDate.getTime()); 
    }
}

function displayOutput(output) {
    const startDate = new Date();
    initOutputCanvas();
    display(output, outputCanvas, grayMode);
    const endDate = new Date();
    logging.debug("displayed output", endDate.getTime() - startDate.getTime()); 
}

function convertToGray(src) {
    try {
        const startDate = new Date();
        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        const endDate = new Date();
        logging.debug("converted to gray", gray, endDate.getTime() - startDate.getTime());
        return gray;
    } catch (e) {
        logging.error("failed convert to gray", src, e);
        return null;
    }
}

function readImage(image) {
    try {
        const startDate = new Date();
        logging.debug("CV", cv);
        const src = cv.imread(image);
        const endDate = new Date();
        logging.debug("image read", src, image, endDate.getTime() - startDate.getTime());
        return src;
    } catch (e) {
        logging.error("failed to read src image", image, e);
        return null;
    }
}

// Test purposes only
// function findContoursPreprocessing_none(srcGray) {
//     return srcGray.clone();
// }

// The fastes and the most simple, works good with good quality scans
// Works horribly with bad quality scans
// function findContoursPreprocessing_simpleBlurSimpleThreshold(srcGray) {
//     const startDate = new Date();
//     const result = new cv.Mat();
//     const ksize = new cv.Size(CP_BLUR_SIDE, CP_BLUR_SIDE);
//     const anchor = new cv.Point(-1, -1);
//     cv.boxFilter(srcGray, result, -1, ksize, anchor, true, cv.BORDER_DEFAULT);
//     const blurDate = new Date();
//     logging.debug("contour prerocessing: siple blur", blurDate.getTime() - startDate.getTime());
//     cv.threshold(result, result, CP_THRESHOLD_VALUE, 255, cv.THRESH_BINARY);
//     const thresholdData = new Date();
//     logging.debug("contour prerocessing: simple threshold", thresholdData.getTime() - blurDate.getTime());
//     return result;
// }

// Gaussian blur is about three times slower, but better at noise removal
function findContoursPreprocessing_gaussianBlurSimpleThreshold(srcGray) {
    const startDate = new Date();
    const result = new cv.Mat();
    const blurSide = CP_BLUR_SIDE % 2 == 1 ? CP_BLUR_SIDE : CP_BLUR_SIDE + 1; // Blur side can only be uneven for gaussian blur
    const ksize = new cv.Size(blurSide, blurSide);
    cv.GaussianBlur(srcGray, result, ksize, 0, 0, cv.BORDER_DEFAULT);
    const blurDate = new Date();
    logging.debug("contour prerocessing: gaussian blur", blurDate.getTime() - startDate.getTime());
    cv.threshold(result, result, CP_THRESHOLD_VALUE, 255, cv.THRESH_BINARY);
    const thresholdData = new Date();
    logging.debug("contour prerocessing: simple threshold", thresholdData.getTime() - blurDate.getTime());
    return result;
}

// Kinda whitens the picture, but great texture removal, probably better with bad quality scans
// function findContoursPreprocessing_gausianBlurOtsuThresholding(srcGray) {
//     const startDate = new Date();
//     const result = new cv.Mat();
//     const blurSide = CP_BLUR_SIDE % 2 == 1 ? CP_BLUR_SIDE : CP_BLUR_SIDE + 1; // Blur side can only be uneven for gaussian blur
//     const ksize = new cv.Size(blurSide, blurSide);
//     cv.GaussianBlur(srcGray, result, ksize, 0, 0, cv.BORDER_DEFAULT);
//     const blurDate = new Date();
//     logging.debug("contour prerocessing: gaussian blur", blurDate.getTime() - startDate.getTime());
//     cv.threshold(result, result, CP_THRESHOLD_VALUE, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
//     const thresholdData = new Date();
//     logging.debug("contour prerocessing: otsu threshold", thresholdData.getTime() - blurDate.getTime());
//     return result;
// }

// Does not remove textures at all, instead makes them fine
// May be the best for bad quality scans with darker whitespase and worse contrast overall
// function findContoursPreprocessing_simpleBlurAdaptiveGaussianThresholding(srcGray) {
//     const startDate = new Date();
//     const result = new cv.Mat();
//     const ksize = new cv.Size(CP_BLUR_SIDE, CP_BLUR_SIDE);
//     const anchor = new cv.Point(-1, -1);
//     cv.boxFilter(srcGray, result, -1, ksize, anchor, true, cv.BORDER_DEFAULT);
//     const blurDate = new Date();
//     logging.debug("contour prerocessing: simple blur", blurDate.getTime() - startDate.getTime());
//     // logging.debug("contour prerocessing: simple blur", blurDate.getTime() - startDate.getTime())
//     cv.adaptiveThreshold(srcGray, result, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
//     const thresholdData = new Date();
//     logging.debug("contour prerocessing: adaptive gaussian threshold", thresholdData.getTime() - blurDate.getTime());
//     return result;
// }

const findContoursPreprocessing = (srcGray) => findContoursPreprocessing_gaussianBlurSimpleThreshold(srcGray);


function findContours(srcGray) {
    var srcPrep;
    try {
        const startDate = new Date();
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        srcPrep = findContoursPreprocessing(srcGray);
        const prepDate = new Date();
        cv.findContours(srcPrep, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_NONE);
        const endDate = new Date();
        displayContourSource(srcPrep);
        if (contours.size() == 0) {
            logging.error("found 0 contours", endDate.getTime() - prepDate.getTime(), endDate.getTime() - startDate.getTime()); 
            return null;
        } else {
            logging.debug("found contours", contours.size(), contours, hierarchy, endDate.getTime() - prepDate.getTime(), endDate.getTime() - startDate.getTime());
            return {contours: contours, hierarchy: hierarchy};
        }
    } catch(e) {
        logging.error("failed to find contours", e); 
        return null;
    } finally {
        deleteCV(srcPrep);
    }
}

function cropContour(src, contours, hierarchy, contourData, boundingRect) {
    logging.debug("crop contour called", src, contours, hierarchy, contourData, boundingRect);
    var mask;
    var maskRoi;
    var maskCrop;
    var srcRoi;
    var srcCrop;
    try { 
        const startDate = new Date();
        mask = new cv.Mat(src.rows, src.cols, cv.CV_8UC1);
        mask.setTo(BLACK);
        cv.drawContours(mask, contours, contourData.index, WHITE, cv.FILLED, cv.LINE_8, hierarchy, 0);
        const maskDate = new Date();
        logging.debug("created mask", mask, maskDate.getTime() - startDate.getTime());

        maskCrop = new cv.Mat(boundingRect.height, boundingRect.width, cv.CV_8UC1);
        maskRoi = mask.roi(boundingRect);
        maskRoi.copyTo(maskCrop);
        const maskCropDate = new Date();
        displayCroppedMask(maskCrop);
        logging.debug("cropped mask", maskRoi, maskCrop, maskCropDate.getTime() - maskDate.getTime());


        srcCrop = new cv.Mat(boundingRect.height, boundingRect.width, cv.CV_8UC1);
        srcCrop.setTo(WHITE);
        srcRoi = src.roi(boundingRect);
        srcRoi.copyTo(srcCrop, maskRoi);
        const srcCropDate = new Date();
        logging.debug("cropped contour", srcRoi, srcCrop, srcCropDate.getTime() - maskCropDate.getTime(), srcCropDate.getTime() - startDate.getTime());
        return srcCrop;
    } catch (e) {
        logging.debug("failed to crop contour", e);
        return null;
    } finally {
    // Delete everything except for srcCrop which is our result
        deleteCV(mask);
        deleteCV(maskRoi);
        deleteCV(maskCrop);
        deleteCV(srcRoi);
    }
}

function BubbleFinder(imageArea, contours, hierarchy) {
    this.imageArea = imageArea;
    this.contours = contours;
    this.hierarchy = hierarchy;
    this.dataList = [];

    for (let i = 0; i < contours.size(); ++i) {
        let contour = contours.get(i);
        this.dataList.push({
            index: i,
            contour: contour,
            area: cv.contourArea(contour)
        });
    }

    this.filterContoursBySize = (min, max) => {
        this.dataList = this.dataList.filter((contourData) => {
            var result = true;
            if (min) {
                result &= contourData.area >= min;
            }
            if (max) {
                result &= contourData.area <= max;
            }
            return result;
        });
        return this;
    };

    this.filterContainingPoint = (x, y) => {
    // adjustment for possible preprocessing blur influence
        let maxDistance = -1 * CP_BLUR_HALF_HYPOTENUSE;
        this.dataList = this.dataList.filter((contourData) => {
            // Include if point is on the contour
            return cv.pointPolygonTest(contourData.contour, new cv.Point(x, y), true) >= maxDistance;
        });
        return this;
    };


    this.selectSmallest = () => {
        if (this.dataList.length == 0) {
            return null;
        } else {
            return this.dataList.reduce((acc, contourData) => {
                if (!acc) {
                    return contourData;
                } else {
                    if (acc.area > contourData.area) {
                        return contourData;
                    } else {
                        return acc;
                    }
                }
            });
        }
    };

    this.findBubbleContour = (point) => {
        const startDate = new Date();
        try {
            const result = this
                .filterContoursBySize(1000, this.imageArea /4)
                .filterContainingPoint(point.x, point.y)
                .selectSmallest();
            const endDate = new Date();
            if (!result) {
                logging.error("failed to find bubble contour, result is falsey");
            } else {
                logging.debug("found bubble contour", result, endDate.getTime() - startDate.getTime());
            }
            return result;
        } catch(e) {
            logging.error("failed to find bubble contour", e); 
            return null;
        }
    };
}

function invalidateCache() {
    if (cache) {
        deleteCV(cache.src);
        deleteCV(cache.contours);
        deleteCV(cache.hierarchy);
        deleteCV(cache.srcGray);
        logging.debug("cache invalidated", cache);
        cache = null;
    }
}

function saveCache(image, src, srcGray, contours, hierarchy) {
    if (useCache) {
        cache = {
            image: image,
            src: src,
            srcGray: srcGray,
            contours: contours,
            hierarchy: hierarchy
        };
        logging.debug("cache saved", cache);
    }
}


function findSpeechBubble(image, imagePoint, imageRect, area) {
    var src;
    var srcGray;
    var contours;
    var hierarchy;
    var boundingRect;
    var output;
    try {
        const startDate = new Date();
        if (useCache && cache && cache.image === image) {
            // Use data from recent cache
            src = cache.src;
            srcGray = cache.srcGray;
            contours = cache.contours;
            hierarchy = cache.hierarchy;
            logging.debug("cache loaded", cache);
        } else {
            invalidateCache();

            // Load new data
            src = readImage(image);

            // Convert to gray
            srcGray = convertToGray(src);
            if (!srcGray) {
                deleteCV(src);
                return null;
            }

            let contoursAndHiearchy = findContours(srcGray);
            if (!contoursAndHiearchy) {
                // In src read but hierarchy and contours not found, src needs to be deleted
                deleteCV(src);
                deleteCV(srcGray);
                return null;
            }
            contours = contoursAndHiearchy.contours;
            hierarchy = contoursAndHiearchy.hierarchy;

            saveCache(image, src, srcGray, contours, hierarchy);
        }
        displayAllContours(src, contours, hierarchy);
        let bubbleFinder = new BubbleFinder(area, contours, hierarchy);
        
        // DOM element for the image might be scaled from the source image, so the click point on DOM element might not be the same point on the source image. Possible scaling must be found and click point adjusted for scale.
        let scale = findImageScale(imageRect, src);
        let scaledImagePoint = scaleImagePoint(imagePoint, scale);
        logging.debug("found source to dom scaling and adjusted image point", scale, imagePoint, scaleImagePoint);

        const bubbleData = bubbleFinder.findBubbleContour(scaledImagePoint);
        if (!bubbleData) {
            return null;
        }
        boundingRect = cv.boundingRect(bubbleData.contour);
        displayBubbleContour(src, contours, hierarchy, bubbleData, boundingRect);
        if (grayMode) {
            output = cropContour(srcGray, contours, hierarchy, bubbleData, boundingRect);
        } else {
            output = cropContour(src, contours, hierarchy, bubbleData, boundingRect);
        }
        displayOutput(output);
        const result = {
            url: outputCanvas.toDataURL(),
            rect: boundingRect
        };
        const endDate = new Date();
        logging.debug("found bubble", result, endDate.getTime() - startDate.getTime());
        return result;
    } finally {
        deleteCV(output);
        // Do not remove src, srcGray, contours and hierarchy if they are in cache
        if (!useCache) {
            deleteCV(src);
            deleteCV(contours);
            deleteCV(hierarchy);
            deleteCV(srcGray);
        }
    }
}

function fireBubbleRecognitionFalure(event) {
    events.fire({
        type: events.EventTypes.BubbleRecognitionFailure,
        from: moduleName,
        data: {
            point: {
                pageX: event.pageX,
                pageY: event.pageY,
                clientX: event.clientX,
                clientY: event.clientY,
            },
            box: {
                x_scrolled: event.data.pageX,
                x_visible: event.data.clientX,
                y_scrolled: event.data.pageY,
                y_visible: event.data.clientY,
                width: 0,
                height: 0
            }
        }
    });
}

function onImagesClicked(event) {
    try {
        logging.debug("onImagesClicked called", event);
        const image = event.data.image;
        const imageRect = event.data.imageRect;
        const bubble = findSpeechBubble(image, { x: event.data.imageX, y: event.data.imageY }, imageRect, image.width * image.height);
        if (bubble) {
            var box = {
                x_scrolled: imageRect.pageX + bubble.rect.x,
                x_visible: imageRect.x + bubble.rect.x,
                y_scrolled: imageRect.pageY + bubble.rect.y,
                y_visible: imageRect.y + bubble.rect.y,
                width: bubble.rect.width,
                height: bubble.rect.height
            };
            events.fire({
                from: moduleName,
                type: events.EventTypes.ImageCaptureSuccess,
                data: {
                    point: event.data.point, 
                    box: box,
                    image_uri: bubble.url
                }
            });
        } else {
            fireBubbleRecognitionFalure(event);
        }
        logging.debug("onImagesClicked success", event);
    } catch (e) {
        logging.error("onImagesClicked failed", event, e);
        fireBubbleRecognitionFalure(event);
    }
}

function onZoomChanged(/*event*/) {
    invalidateCache();
}


export async function enable() {
    if (!enabled) {
        await initCV();
        events.addListener(onImagesClicked, events.EventTypes.ImagesClicked);
        window.addEventListener("resize", onZoomChanged);
        enabled = true;
    }
}

export async function disable() {
    if (enabled) {
        events.addListener(onImagesClicked, events.EventTypes.ImagesClicked);
        window.removeEventListener("resize", onZoomChanged);
        enabled = false;
    }
}