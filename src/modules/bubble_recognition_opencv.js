import {default as initOpencvJs} from "@vitalyros/opencvjs-wasm-separate";
import * as events from "./events";
import {loggingForModule} from "../utils/logging";
import {APP_ELEMENT_ID_PREFIX} from "../utils/const";
import * as settings from "../utils/settings";

const moduleName = "bubble_recognition_opencv";
const logging = loggingForModule(moduleName);
var enabled = false;

var bufferInputImage; // Image element that is used to put image to opencv when original image source element is not an image or a canvas 

var cv;

var CLICK_POINT_COLOR;
var CONTOUR_COLOR;
var RECTANGLE_COLOR;
var WHITE;
var BLACK;

async function initDebug() {
    let debug = await settings.getDebugBubbleRecogniton();
    logging.debug("Configuring bubble recognition debug", debug);
    showBufferImputImage = debug;
    showContourSource = debug;
    showAllContours = debug;
    showBubbleContour = debug;
    showCroppedMask = debug;
    showOutput = debug;
}

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
    CLICK_POINT_COLOR = new cv.Scalar(0, 255, 0, 255);
    RECTANGLE_COLOR = new cv.Scalar(0, 0, 255, 255);
    WHITE = new cv.Scalar(255);
    BLACK = new cv.Scalar(0);
}

// grayMode
// true: Do mask manipulation with gray version of the image, transform to RGBA on output 
// false: Do mask manipulation with RBGA image, no transformation on output
const grayMode = true; 

// Show input image that is used as buffer when source element is not an image or a canvas
var showBufferImputImage = false;
// Show preprocessed image that is fed to the contour finding algorythm
var showContourSource = false;
// Show original image with all contours on it. Do not use when the contour count is high, it's going to be extremely slow
var showAllContours = false;
const showAllContoursLimit = 10000;
// Show original image with contour that we consider a found bubble
var showBubbleContour = false;
// Show cropped image with the bubble
var showCroppedMask = false;
// Show filtered bubble contents - the output of this module
var showOutput = false;

// Cache image source, its grayscale version, contours and hierarchy
var useCache = true;
var cache;

// Configurations for preprocessing of the image before contour finding algorithm 
// Those might work better or worse depending on the processed image - the darkness of  the contrast and darkness of its edges and its textures

// The side of blure rectangle
// 3 would be rather small, 10 would be much, 20 - very much
const CP_BLUR_SIDE = 5;
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

function initBufferInputImage() {
    if (!bufferInputImage) {
        bufferInputImage = document.createElement("img");
        bufferInputImage.id = `${APP_ELEMENT_ID_PREFIX}_bufferInputImage`;
        if (showBufferImputImage) {
            document.body.appendChild(bufferInputImage);
        }
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

// Crashes firefox
// function display(src, canvas) {
//   cv.imshow(canvas, src)
// }

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

function adjustImagePoint(element, elementRect, imageSrc, point) {
    let oas = findImageOffsetAndScale(element, elementRect, imageSrc);
    logging.debug("image point offset and scale", oas);
    return {
        x: (point.x + oas.offset.x) * oas.scale.x,
        y: (point.y + oas.offset.y) * oas.scale.y 
    };
}

function findImageOffsetAndScale(element, elementRect, imageSrc) {
    let backgroundImage = element.style["background-image"];
    if (element instanceof HTMLCanvasElement || element instanceof HTMLImageElement) {
        // Assume that ther is no offset for canvas or image
        return {
            offset: {
                x: 0,
                y: 0
            },
            scale: {
                x: imageSrc.cols / elementRect.width,
                y: imageSrc.rows / elementRect.height
            }
        };
    } if (backgroundImage) {
        // Only implemented rescaling for background images for comic.pixiv.net
        // todo: Make or find universal background image extractor and click point scaler
        let computedStyle = window.getComputedStyle(element, null);
        let backgroundSize = computedStyle.backgroundSize;
        let backgroundPositionX = computedStyle.backgroundPositionX;
        logging.debug("element background size and x position", backgroundSize, backgroundPositionX);
        if (backgroundSize === "contain") {
            let scale = imageSrc.rows / elementRect.height;
            let offsetX;
            if (backgroundPositionX === "100%") {
                offsetX = -1 * (elementRect.width - imageSrc.cols / scale);
            } else if (backgroundPositionX === "0%") {
                offsetX = 0;
            } else {
                throw `unsupported image source element ${element}`;
            }
            return {
                offset: {
                    x: offsetX,
                    y: 0
                },
                scale: {
                    x: scale,
                    y: scale
                }
            };
        } else {
            throw `unsupported image source element ${element}`;
        }
    } else {
        throw `unsupported image source element ${element}`;
    }
}

// function findImageScale(element, elementRect, imageSrc) {
//     let type = typeof element
//     let backgroundImage = element["background-image"]
//     if (type === HTMLCanvasElement || type === HTMLImageElement) {
//         return { 
//             x: imageSrc.cols / elementRect.width,
//             y: imageSrc.rows / elementRect.height
//         };
//     } else if (backgroundImage) {
//         let computedStyle = window.getComputedStyle(element, null)
//         logging.debug("computed style for element", element, computedStyle)
//         let backgroundSize = computedStyle.backgroundSize.trim().split(/\s+/)
//         logging.debug("element background size", computedStyle.backgroundSize)
//     } else {
//         throw `unsupported image source element ${element}`
//     }
// }


// Drawis a cross in the presumed point where the click was made  
function drawImagePointCross(mat, imagePoint) {
    let radius = 10; // cross of this radius
    let thickness = 2;
    let p11 = new cv.Point(imagePoint.x - radius, imagePoint.y - radius);
    let p12 = new cv.Point(imagePoint.x + radius, imagePoint.y + radius);
    cv.line(mat, p11, p12, CLICK_POINT_COLOR, thickness);
    let p21 = new cv.Point(imagePoint.x - radius, imagePoint.y + radius);
    let p22 = new cv.Point(imagePoint.x + radius, imagePoint.y - radius);
    cv.line(mat, p21, p22, CLICK_POINT_COLOR, thickness);
}

function displayAllContours(src, contours, hierarchy, imagePoint) {
    if (showAllContours) {
        var clone;
        try {
            if (contours.size() > showAllContoursLimit) {
                logging.warn("Skipped display all contours. Too much contours", contours.size(), showAllContoursLimit);
                return;
            }
            const startDate = new Date();
            clone = src.clone();

            // Drawing contour outline
            for (let i = 0; i < contours.size(); ++i) {
                cv.drawContours(clone, contours, i, CONTOUR_COLOR, 1, cv.LINE_8, hierarchy, 100);
            }
            drawImagePointCross(clone, imagePoint);

            cv.draw;
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

function displayBubbleContour(src, contours, hierarchy, contourData, boundingRect, imagePoint) {
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
            drawImagePointCross(clone, imagePoint);

            logging.debug("drew boundng rect and click point", drawRectDate.getTime() - drawContourDate.getTime()); 

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

async function readImage(element) {
    try {
        const startDate = new Date();
        logging.debug("CV", cv);
        var src;
        if (element instanceof HTMLImageElement || element instanceof HTMLCanvasElement) {
            src = cv.imread(element);
        } else {
            // specificaly made for comic.pixiv.net which displays manga through divs with background-image
            // background-image string looks like url("blob:https://image")
            // the image is loaded into bufferInputImage element, after loading opencv reads it from bufferInputImage
            initBufferInputImage();
            let backgroundImage = element.style["background-image"];
            logging.debug("extracting image url from background-image style", backgroundImage);
            let backgroundImageUrl = backgroundImage.replace(/"\)$/, "");
            backgroundImageUrl = backgroundImageUrl.replace(/^url\("/, "");
            logging.debug("background image url", backgroundImageUrl);
            await new Promise((resolve, reject) => {
                bufferInputImage.onload = () => {
                    logging.debug("image loaded to buffer image element", bufferInputImage, backgroundImageUrl);
                    return resolve();
                };
                bufferInputImage.onerror = reject;
                bufferInputImage.src = backgroundImageUrl;
            });
            src = cv.imread(bufferInputImage);
        }
        const endDate = new Date();
        logging.debug("image read", src, element, endDate.getTime() - startDate.getTime());
        return src;
    } catch (e) {
        logging.error("failed to read src image", element, e);
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

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function samplePoints(srcGray) {
    const minSampleSize = 5000;
    const maxSampleSize = 10000;
    const desirableSampleSizeRate = 500;
    const srcCols = srcGray.cols;
    const srcRows = srcGray.rows;
    const srcSize = srcRows * srcCols
    var sampleSize = Math.floor(srcSize / desirableSampleSizeRate);
    if (sampleSize > maxSampleSize) {
        sampleSize = maxSampleSize
    } else if (sampleSize < minSampleSize) {
        sampleSize = minSampleSize
    }
    const sample = new cv.Mat(sampleSize, 1, cv.CV_32F);
    const randomInterval = Math.floor(srcSize / sampleSize);
    logging.debug("sampling from source by interval", srcSize, sampleSize, randomInterval)
    if (sampleSize > srcSize) {
        // Probably useless code for a case when our image is very small
        for (var y = 0; y < srcRows; y++ ) {
            for (var x = 0; x < srcCols; x++ ) {
                sample.floatPtr(y * x + x)[0] = srcGray.ucharPtr(y, x)[0];
            }
        }
    } else {
        for (var i = 0; i < sampleSize; i++) {
            const randomIncrement = getRandomInt(0, randomInterval);
            const sourcePixelIndex = i * randomInterval + randomIncrement;
            y = Math.floor(sourcePixelIndex / srcCols);
            x = sourcePixelIndex % srcCols;
            // logging.debug("x, y", randomIncrement, sourcePixelIndex, srcCols, x , srcRows, y)
            sample.floatPtr(i)[0] = srcGray.ucharPtr(y, x)[0];
        }
    }
    return sample
}

// Finds k-means for sample
// Returns a sorted array of left/center/right values of clusters sorted by centers
function kmeans(sample, clusterCount) {
    const labels = new cv.Mat();
    const attempts = 5;
    const centers = new cv.Mat();
    try {
        const crite = new cv.TermCriteria(cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER, 100, 1);
        cv.kmeans(sample, clusterCount, labels, crite, attempts, cv.KMEANS_RANDOM_CENTERS, centers);
        const groups = new Array(clusterCount);
        for(var i = 0; i < clusterCount; i++) {
            groups[i] = { 
                left: null,
                center: centers.floatAt(i, 0),
                right: null,
                count: 0,
            }
        }
        for (var i = 0; i < labels.rows; i++) {
            const groupIndex = labels.intAt(i);
            const pixelValue = sample.floatAt(i, 0);
            const group = groups[groupIndex];
            group.count = group.count + 1;
            if (pixelValue > group.center && (group.right == null || pixelValue > group.right)) {
                logging.debug("new rigth", i, groupIndex, pixelValue, group);
                group.right = pixelValue;
            } else if (group.left == null || pixelValue < group.left ) {
                logging.debug("new left", i, groupIndex, pixelValue, group);
                group.left = pixelValue;
            }
        }
        groups.sort(function(a, b) {
            return a.center - b.center;
        });
        groups.forEach(group => {
            group.right = Math.round(group.right);
            group.center = Math.round(group.center);
            group.left = Math.round(group.left);
        });
        return groups
    } finally {
        deleteCV(labels);
        deleteCV(centers);
    }
}

function findContoursPreprocessing_canny(srcGray) {
    const startDate = new Date();
    const result = new cv.Mat();

    cv.normalize(srcGray, result, 0, 255, cv.NORM_MINMAX)

    cv.Canny(result, result, 50, 250, 3, false);
    const endDate = new Date();
    logging.debug("contour prerocessing: finished", result, endDate.getTime() - startDate.getTime());
    return result;
}

// - Normalize
// - Blur
// - Take a sample of an image pixels
// Calculate K-means of the sample with 5
// Assume the folowing heuristic: 
//      Either paper color or abnormally light pixels will be collected in group 5
// Threshold by the lower border (darker pixel) of group 1
// - Erode
function findContoursPreprocessing_kmeansErode(srcGray) {
    const startDate = new Date();
    const result = new cv.Mat();

    cv.normalize(srcGray, result, 0, 255, cv.NORM_MINMAX)
    const normalizeDate = new Date();
    logging.debug("contour prerocessing: normalize", normalizeDate.getTime() - startDate.getTime())

    const blurSide = CP_BLUR_SIDE % 2 == 1 ? CP_BLUR_SIDE : CP_BLUR_SIDE + 1; // Blur side can only be uneven for gaussian blur
    const ksize = new cv.Size(blurSide, blurSide);
    cv.GaussianBlur(result, result, ksize, 0, 0, cv.BORDER_DEFAULT);

    // Sampling
    const sample = samplePoints(srcGray);
    const samplingDate = new Date();
    logging.debug("contour prerocessing: sampling for kmeans", sample, samplingDate.getTime() - normalizeDate.getTime())

    // K-means
    const clusterCount = 6;
    var groups;
    try {
        groups = kmeans(sample, clusterCount);
    } finally {
        deleteCV(sample);
    }
    const kmeansDate = new Date();
    logging.debug("contour prerocessing: kmeans", groups, kmeansDate.getTime() - samplingDate.getTime());

    // Threshold
    const thresholdValue = groups[4].right;
    cv.threshold(result, result, thresholdValue, 255, cv.THRESH_BINARY);
    const thresholdDate = new Date();
    logging.debug("contour prerocessing: threshold", thresholdValue, result, thresholdDate.getTime() - kmeansDate.getTime());

    const anchor = new cv.Point(-1, -1);
    const erodeMat = cv.Mat.ones(2, 2, cv.CV_8U);
    try {
        cv.erode(result, result, erodeMat, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    } finally {
        deleteCV(erodeMat);
    }
    const erodeDate = new Date();
    logging.debug("contour prerocessing: erode", result, erodeDate.getTime() - thresholdDate.getTime());
    logging.debug("contour prerocessing: finished", result, erodeDate.getTime() - startDate.getTime());
    
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

const findContoursPreprocessing = (srcGray) => findContoursPreprocessing_kmeansErode(srcGray);


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

function saveCache(element, src, srcGray, contours, hierarchy) {
    if (useCache) {
        cache = {
            element: element,
            src: src,
            srcGray: srcGray,
            contours: contours,
            hierarchy: hierarchy
        };
        logging.debug("cache saved", cache);
    }
}


async function findSpeechBubble(element, elementPoint, elementRect, area) {
    var src;
    var srcGray;
    var contours;
    var hierarchy;
    var boundingRect;
    var output;
    try {
        const startDate = new Date();
        if (useCache && cache && cache.element === element) {
            // Use data from recent cache
            src = cache.src;
            srcGray = cache.srcGray;
            contours = cache.contours;
            hierarchy = cache.hierarchy;
            logging.debug("cache loaded", cache);
        } else {
            invalidateCache();

            // Load new data
            src = await readImage(element);

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

            saveCache(element, src, srcGray, contours, hierarchy);
        }
        // DOM element for the image might be scaled from the source image, so the click point on DOM element might not be the same point on the source image. Possible scaling must be found and click point adjusted for scale.
        let imagePoint = adjustImagePoint(element, elementRect, src, elementPoint);
        logging.debug("found source to dom scaling and adjusted image point", elementPoint, imagePoint);
         
        displayAllContours(src, contours, hierarchy, imagePoint);

        let bubbleFinder = new BubbleFinder(area, contours, hierarchy);
        const bubbleData = bubbleFinder.findBubbleContour(imagePoint);
        if (!bubbleData) {
            return null;
        }
        boundingRect = cv.boundingRect(bubbleData.contour);
        displayBubbleContour(src, contours, hierarchy, bubbleData, boundingRect, imagePoint);
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

async function onImageClicked(event) {
    try {
        logging.debug("onImageClicked called", event);
        const element = event.data.element;
        const elementRect = event.data.elementRect;
        const bubble = await findSpeechBubble(element, { x: event.data.elementX, y: event.data.elementY }, elementRect, element.width * element.height);
        if (bubble) {
            var box = {
                x_scrolled: elementRect.pageX + bubble.rect.x,
                x_visible: elementRect.x + bubble.rect.x,
                y_scrolled: elementRect.pageY + bubble.rect.y,
                y_visible: elementRect.y + bubble.rect.y,
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
        logging.debug("onImageClicked success", event);
    } catch (e) {
        logging.error("onImageClicked failed", event, e);
        fireBubbleRecognitionFalure(event);
    }
}

function onZoomChanged(/*event*/) {
    invalidateCache();
}


export async function enable() {
    if (!enabled) {
        await initCV();
        await initDebug();
        events.addListener(onImageClicked, events.EventTypes.ImageClicked);
        window.addEventListener("resize", onZoomChanged);
        enabled = true;
        logging.debug("enabled");
    }
}

export async function disable() {
    if (enabled) {
        events.addListener(onImageClicked, events.EventTypes.ImageClicked);
        window.removeEventListener("resize", onZoomChanged);
        enabled = false;
        logging.debug("disabled");

    }
}