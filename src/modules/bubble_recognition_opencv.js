import * as cv from 'opencv.js'
import * as events from './events'
import {loggingForModule} from '../utils/logging'
import {APP_ELEMENT_ID_PREFIX} from '../utils/const'

const debug = true;
const moduleName = 'bubble_recognition_opencv'
const logging = loggingForModule(moduleName)
var enabled = false;

const showAllContours = false;
const showBubbleContour = false;
const showCroppedMask = false;
const showOutput = false;

var cache;

let CONTOUR_COLOR = new cv.Scalar(255, 0, 0, 255);
let RECTANGLE_COLOR = new cv.Scalar(0, 0, 255, 255);
let WHITE = new cv.Scalar(255,255,255,255)
let BLACK = new cv.Scalar(0,0,0,255)

var allContoursCanvas;
var bubbleContourCanvas;
var croppedMaskCanvas;
var outputCanvas;

// Calls delete on opencv object
function deleteCV(resource) {
  if (resource) {
    resource.delete()
  }
}

function initAllContoursCanvas() {
  if (!allContoursCanvas) {
    allContoursCanvas = document.createElement('canvas');
    allContoursCanvas.id = `${APP_ELEMENT_ID_PREFIX}_allContoursCanvas`;
    document.body.appendChild(allContoursCanvas);
  }
}

function initBubbleContourCanvas() {
  if (!bubbleContourCanvas) {
    bubbleContourCanvas = document.createElement('canvas');
    bubbleContourCanvas.id = `${APP_ELEMENT_ID_PREFIX}_bubbleContourCanvas`;
    document.body.appendChild(bubbleContourCanvas);
  }
}

function initCroppedMaskCanvas() {
  if (!croppedMaskCanvas) {
    croppedMaskCanvas = document.createElement('canvas');
    croppedMaskCanvas.id = `${APP_ELEMENT_ID_PREFIX}_croppedMaskCanvas`;
    document.body.appendChild(croppedMaskCanvas);
  }
}

function initOutputCanvas() {
  if (!outputCanvas) {
    outputCanvas = document.createElement('canvas');
    outputCanvas.id = `${APP_ELEMENT_ID_PREFIX}_outputCanvas`;
    if (showOutput) {
      document.body.appendChild(outputCanvas);
    }
  }
}

function display(src, canvas) {
  canvas.width = src.cols;
  canvas.height = src.rows;
  let arr = new Uint8ClampedArray(src.data, src.cols, src.rows)
  let imdata = new ImageData(arr, src.cols, src.rows);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(src.cols, src.rows);
  for (let i = 0; i < imdata.data.length; i += 1) {
    imageData.data[i] = imdata.data[i];
  }
  ctx.putImageData(imageData, 0, 0);
}

function displayAllContours(src, contours, hierarchy) {
  if (showAllContours) {
    var clone;
    try {
      const startDate = new Date()
      clone = src.clone()
      for (let i = 0; i < contours.size(); ++i) {
        cv.drawContours(clone, contours, i, CONTOUR_COLOR, 1, cv.LINE_8, hierarchy, 100);
      }
      const drawDate = new Date()
      logging.debug("drew all contours", drawDate.getTime() - startDate.getTime()) 
      initAllContoursCanvas()
      display(clone, allContoursCanvas)
      const displayDate = new Date()
      logging.debug("displayed all contours", displayDate.getTime() - drawDate.getTime(), displayDate.getTime() - startDate.getTime()) 
    } finally {
      if (clone) {
        clone.delete()
      }
    }
  }
}

function displayBubbleContour(src, contours, hierarchy, contourData, boundingRect) {
  if (showBubbleContour) {
    var clone;
    try {
      const startDate = new Date()
      clone = src.clone()
      cv.drawContours(clone, contours, contourData.index, CONTOUR_COLOR, 1, cv.LINE_8, hierarchy, 100);

      const drawContourDate = new Date()
      logging.debug("drew bubble contour", drawContourDate.getTime() - startDate.getTime()) 

      let point1 = new cv.Point(boundingRect.x, boundingRect.y);
      let point2 = new cv.Point(boundingRect.x + boundingRect.width, boundingRect.y + boundingRect.height);
      cv.rectangle(clone, point1, point2, RECTANGLE_COLOR, 2, cv.LINE_AA, 0);
      const drawRectDate = new Date()

      logging.debug("drew boundng rect", drawRectDate.getTime() - drawContourDate.getTime()) 

      initBubbleContourCanvas()
      display(clone, bubbleContourCanvas)
      const displayDate = new Date()
      logging.debug("displayed bubble contour", displayDate.getTime() - drawRectDate.getTime(), displayDate.getTime() - startDate.getTime()) 
    } finally {
      if (clone) {
        clone.delete()
      }
    }
  }
}

function displayCroppedMask(croppedMask) {
  if (showCroppedMask) {
    initCroppedMaskCanvas()
    display(croppedMask, croppedMaskCanvas)
  }
}

function displayOutput(output) {
  initOutputCanvas()
  display(output, outputCanvas)
}

function readImage(image) {
  try {
    const startDate = new Date();
    const src = cv.imread(image);
    const endDate = new Date();
    logging.debug("image read", src, image, endDate.getTime() - startDate.getTime())
    return src
  } catch (e) {
    console.error("failed to read src image", image, e)
    return null
  }
}

function findContours(src) {
  var tmp;
  try {
    const startDate = new Date();
    tmp = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.cvtColor(src, tmp, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(tmp, tmp, 235, 255, cv.THRESH_BINARY);
    cv.findContours(tmp, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    const endDate = new Date();
    if (contours.size() == 0) {
      logging.error("found 0 contours") 
      return null
    } else {
      logging.debug("found contours", contours.size(), contours, hierarchy, endDate.getTime() - startDate.getTime())
      return {contours: contours, hierarchy: hierarchy}
    }
  } catch(e) {
    logging.error("failed to find contours", e) 
    return null;
  } finally {
    deleteCV(tmp)
  }
}

function cropContour(src, contours, hierarchy, contourData, boundingRect) {
  logging.debug("crop contour called", src, contours, hierarchy, contourData, boundingRect)
  var mask;
  var maskRoi;
  var maskCrop;
  var srcRoi;
  var srcCrop;
  try { 
    const startDate = new Date()
    mask = new cv.Mat(src.rows, src.cols, cv.CV_8UC4);
    mask.setTo(BLACK);
    cv.drawContours(mask, contours, contourData.index, WHITE, cv.FILLED, cv.LINE_8, hierarchy, 0);
    const maskDate = new Date()
    logging.debug("created mask", mask, maskDate.getTime() - startDate.getTime())

    maskCrop = new cv.Mat(boundingRect.height, boundingRect.width, cv.CV_8UC4);
    maskRoi = mask.roi(boundingRect)
    maskRoi.copyTo(maskCrop);
    const maskCropDate = new Date()
    displayCroppedMask(maskCrop)
    logging.debug("cropped mask", maskRoi, maskCrop, maskCropDate.getTime() - maskDate.getTime())


    srcCrop = new cv.Mat(boundingRect.height, boundingRect.width, cv.CV_8UC4);
    srcCrop.setTo(new cv.Scalar(255,255,255,255));
    srcRoi = src.roi(boundingRect);
    srcRoi.copyTo(srcCrop, maskRoi);
    const srcCropDate = new Date()
    logging.debug("cropped conour", srcRoi, srcCrop, srcCropDate.getTime() - maskCropDate.getTime(), srcCropDate.getTime() - startDate.getTime())
    return srcCrop;
  } catch (e) {
    logging.debug("failed to crop conour", e)
    return null;
  } finally {
    // Delete everything except for srcCrop which is our result
    deleteCV(mask)
    deleteCV(maskRoi)
    deleteCV(maskCrop)
    deleteCV(srcRoi)
  }
}

function BubbleFinder(imageArea, contours, hierarchy) {
  this.imageArea = imageArea;
  this.contours = contours;
  this.hierarchy = hierarchy;
  this.dataList = [];

  for (let i = 0; i < contours.size(); ++i) {
    let contour = contours.get(i)
    this.dataList.push({
      index: i,
      contour: contour,
      area: cv.contourArea(contour)
    });
  }

  this.filterContoursBySize = (min, max) => {
    this.dataList = this.dataList.filter((contourData) => {
      var result = true
      if (min) {
        result &= contourData.area >= min
      }
      if (max) {
        result &= contourData.area <= max
      }
      return result
    })
    return this;
  }

  this.filterContainingPoint = (x, y) => {
    this.dataList = this.dataList.filter((contourData) => {
      // Include if point is on the contour
      return cv.pointPolygonTest(contourData.contour, new cv.Point(x, y), true) >= 0;
    });
    return this;
  }

  this.filterContainingContours = () => {
    return this.dataList.map((contourData) => {
      
    }).filter((contourData) => {return Boolean(contourData)});
  }

  this.selectSmallest = () => {
    if (this.dataList.length == 0) {
      return null
    } else {
      return this.dataList.reduce((acc, contourData) => {
        if (!acc) {
          return contourData
        } else {
          if (acc.area > contourData.area) {
            return contourData
          } else {
            return acc
          }
        }
      });
    }
  }

  this.findBubbleContour = (clickX, clickY) => {
    const startDate = new Date();
    try {
      const result = this
      .filterContoursBySize(1000, this.imageArea /4)
      .filterContainingPoint(clickX, clickY)
      .selectSmallest();
      var endDate = new Date();
      if (!result) {
        logging.error("failed to find bubble contour, result is falsey")
      } else {
        logging.debug("found bubble contour", result, endDate.getTime() - startDate.getTime())
      }
      return result;
    } catch(e) {
      logging.error("failed to find bubble contour", e) 
      return null;
    }
  }
}


function findSpeechBubble(image, x, y, area) {
  var src;
  var contours;
  var hierarchy;
  var boundingRect;
  var output;
  try {
    if (cache && cache.image === image) {
      // Use data from recent cache
      src = cache.src
      contours = cache.contours
      hierarchy = cache.hierarchy
      console.log("cache loaded", cache)
    } else {
      // Invalidate cache
      if (cache) {
        deleteCV(cache.src)
        deleteCV(cache.contours)
        deleteCV(cache.hierarchy)
        console.log("cache invalidated", cache)
        cache = null;
      }

      // Load new data
      src = readImage(image);
      let contoursAndHiearchy = findContours(src)
      if (!contoursAndHiearchy) {
        // In src read but hierarchy and contours not found, src needs to be deleted
        deleteCV(src)
        return null
      }
      contours = contoursAndHiearchy.contours;
      hierarchy = contoursAndHiearchy.hierarchy;

      // Save recent cache
      cache = {
        image: image,
        src: src,
        hierarchy: hierarchy,
        contours: contours
      }
      console.log("cache saved", cache)
    }
    displayAllContours(src, contours, hierarchy)
    let bubbleFinder = new BubbleFinder(area, contours, hierarchy)
    const bubbleData = bubbleFinder.findBubbleContour(x, y)
    if (!bubbleData) {
      return null
    }
    boundingRect = cv.boundingRect(bubbleData.contour)
    displayBubbleContour(src, contours, hierarchy, bubbleData, boundingRect)
    output = cropContour(src, contours, hierarchy, bubbleData, boundingRect)
    displayOutput(output)
    return {
      url: outputCanvas.toDataURL(),
      rect: boundingRect
    }
  } finally {
    // Do not remove src, contours and hierarchy cause they are in recent cache
    deleteCV(output)
  }
}


function onImagesClicked(event) {
  try {
    logging.debug("onImagesClicked called", event);
    const images = event.data.images;
    // Just take the first image for now
    const image = images[0];
    const imageRect = image.getBoundingClientRect()
    const imageX = event.data.clientX - imageRect.x
    const imageY = event.data.clientY - imageRect.y
    const imageScrollX = window.scrollX + imageRect.x
    const imageScrollY = window.scrollY + imageRect.y
    logging.debug("onImagesClicked image", image, imageX, imageY);
    const bubble = findSpeechBubble(image, imageX, imageY, image.width * image.height);
    if (bubble) {
      var box = {
        x_scrolled: imageScrollX + bubble.rect.x,
        x_visible: imageRect.x + bubble.rect.x,
        y_scrolled: imageScrollY + bubble.rect.y,
        y_visible: imageRect.y + bubble.rect.y,
        width: bubble.rect.width,
        height: bubble.rect.height
      }
      events.fire({
        from: moduleName,
        type: events.EventTypes.ImageCaptureSuccess,
        data: {
            box: box,
            image_uri: bubble.url
        }
      });
    }
    logging.debug("onImagesClicked success", event);
  } catch (e) {
    logging.error("onImagesClicked failed", event, e);
  }
}


export async function enable() {
    if (!enabled) {
        events.addListener(onImagesClicked, events.EventTypes.ImagesClicked);
        enabled = true;
    }
}

export async function disable() {
    if (enabled) {
        events.addListener(onImagesClicked, events.EventTypes.ImagesClicked);
        enabled = false;
    }
}