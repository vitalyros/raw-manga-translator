import * as events from "./events.js";
import { loggingForModule } from '../utils/logging'

var enabled = false;
var word_hocr_wrapper_div = null
var line_hocr_wrapper_div = null
var image = null
const logging = loggingForModule("hocr_display")

function markHocrElement(element, bbox_start_index, border, border_offset, color) {
    logging.debug("element", element)
    var i = bbox_start_index
    var arr = element.title.split(" ");
    logging.debug(`bbox ${arr[i]} ${arr[i + 1]} ${arr[i + 2]} ${arr[i + 3]}`)
    var left = parseInt(arr[i])
    var top = parseInt(arr[i + 1])
    var right = parseInt(arr[i + 2])
    var bottom = parseInt(arr[i + 3])
    logging.debug(`bbox parsed ${left} ${top} ${right} ${bottom}`)
    var width = right - left;
    var height = bottom - top;
    element.style.position = "absolute";
    element.style.left = `${left - border_offset}px`;
    element.style.top = `${top - border_offset}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.border = border;
    element.style.color = color;
}

function markHocrElements(wrapper, clazz, bbox_start_index, border, border_offset, color) {
    Array.from(wrapper.getElementsByClassName(clazz)).forEach(element => {
        markHocrElement(element, bbox_start_index, border, border_offset, color);
    });
}

export async function onTextRecognized(event) {
    try {
        var box = event.data.box;
        var ocr_result = event.data.ocr_result;
        if (image === null) {
            image = document.createElement('img');
            image.style.position = "absolute"
           
            document.body.appendChild(image);
        }
        image.style.left = `${box.x_scrolled}px`;
        image.style.top = `${box.y_scrolled + box.height}px`;
        image.src = event.data.image_uri;

        // var word_hocr_wrapper_div_id = "romatora-word-hocr-popup-wrapper"
        // if (word_hocr_wrapper_div === null) {
        //     word_hocr_wrapper_div = document.createElement('div');
        //     word_hocr_wrapper_div.id = word_hocr_wrapper_div_id;
        //     word_hocr_wrapper_div.style.position = "absolute"
        //     document.body.appendChild(word_hocr_wrapper_div);
        // }
        // word_hocr_wrapper_div.style.left = `${box.x_scrolled}px`;
        // word_hocr_wrapper_div.style.top = `${box.y_scrolled + box.height}px`;
        // word_hocr_wrapper_div.innerHTML = ocr_result.data.hocr;
        // markHocrElements(word_hocr_wrapper_div, 'ocrx_word', 1, "2px solid red", 0, "red");

        var line_hocr_wrapper_div_id = "romatora-line-hocr-popup-wrapper"
        if (line_hocr_wrapper_div === null) {
            line_hocr_wrapper_div = document.createElement('div');
            line_hocr_wrapper_div.id = line_hocr_wrapper_div_id;
            line_hocr_wrapper_div.style.position = "absolute"
            document.body.appendChild(line_hocr_wrapper_div);
        }
        line_hocr_wrapper_div.style.left = `${box.x_scrolled}px`;
        line_hocr_wrapper_div.style.top = `${box.y_scrolled + box.height}px`;
        line_hocr_wrapper_div.innerHTML = ocr_result.data.hocr;
        markHocrElements(line_hocr_wrapper_div, 'ocrx_word', 1, "2px solid green", 0, "green");
    } catch (e) {
        logging.error("onTextRecognized", message, e)
    }
}

export async function enable() {
    if (!enabled) {
        events.addListener(onTextRecognized, events.EventTypes.RecognitionSuccess)
        enabled = true
    }
}

export async function disable() {
    if (enabled) {
        if (popup_wrapper_div != null) {
            document.body.removeChild(popup_wrapper_div)
        }
        events.removeListener(onTextRecognized, events.EventTypes.RecognitionSuccess)
        enabled = false
    }
}
  