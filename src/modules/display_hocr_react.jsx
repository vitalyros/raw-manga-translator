import { Paper } from '@material-ui/core';
import { loggingForModule } from '../utils/logging'
import React from 'react';

const logging = loggingForModule('display_hocr_react')

const ElementType = {
    Page: { name: "page", className: "ocr_page", bboxOffset: 3, order: 1 },
    Area: { name: "area", className: "ocr_carea", bboxOffset: 1, order: 2 },
    Paragraph: { name: "paragraph", className: "ocr_par", bboxOffset: 1, order: 3 },
    Line: { name: "line", className: "ocr_line", bboxOffset: 1, order: 4  },
    Word: { name: "word", className: "ocrx_word", bboxOffset: 1, order: 5  }
}

try {
var ElementTypeByClass = Object.fromEntries(Object.keys(ElementType).map(function(key) {
    var elementType = ElementType[key];
    return [elementType.className, elementType];
}));
} catch(e) {
    logging.error(e)
}

export default function DisplayHocrWithImage(props) {
  return (props.hocr && props.imageUri && 
    <Paper>
        <div style={{ position: 'relative', width: 'fit-content' }}>
            <DisplayHocr hocr={props.hocr} />
            <img src={props.imageUri} />
        </div>
    </Paper>);
}

export function DisplayHocr(props) {
    var base_id = props.id
    if (typeof props.id === 'undefined') {
        base_id = 'display-hocr'
    }

    var borders = {
        "ocr_page": "2px solid blue",
        "ocr_carea": "2px solid green",
        "ocr_par": "2px solid yellow",
        "ocr_line": "2px solid orange",
        "ocrx_word": "2px solid red",
    }

    var buildStyle = (type, bbox) => {
        var style = {}
        var border = borders[type.className];
        if (typeof border !== 'undefined' && border !== null) {
            style.border = border;
        }
        if (type === ElementType.Word) {
            style.color = "red";
        }
        style.position = "absolute";
        style.left = bbox.left;
        style.top = bbox.top;
        style.width = bbox.width;
        style.height = bbox.height;
        return style;
    }

    logging.log("DisplayHocr props", props)
    var parseHocr = (hocr) => {
        try {
            var hocr_parse_html_wrapper = document.createElement('div');
            hocr_parse_html_wrapper.innerHTML = hocr;
            return processElement(hocr_parse_html_wrapper.firstElementChild, 0, null, 0)
        } catch (e) {
            logging.error("DisplayHocr error", e)
            return <div></div>
        }
    } 

    var flatChildren = (element) => {
        var acc = []
        var children = Array.from(element.children)
        acc = acc.concat(children)
        children.forEach(child => { 
            acc = acc.concat(flatChildren(child, acc)) 
        });
        return acc;
    }

    var processElement = (root_element) => {
        var elements = flatChildren(root_element).concat([root_element]);
        logging.log("elements", elements);
        var elements_data = elements.map (element => {
            var className = element.className;
            if (typeof className === 'undefined') {
                return null;
            }
            var type = ElementTypeByClass[className];
            if (typeof type === 'undefined') {
                return null
            } 
            var title = element.title
            if (typeof title === 'undefined') {
                return null
            }
            var id = element.id
            if (typeof id === 'undefined') {
                return null
            }
            var text = "";
            if (type === ElementType.Word) {
                text = element.innerHTML;
            }
            return {
                id: id,
                order: type.order,
                type: type,
                bbox: parseBbox(title, type.bboxOffset),
                text: text
            }
        }).filter(Boolean).sort((a, b) => {
            return a.order - b.order;
        })
        logging.log("elements_data", elements_data);
        var result_elements = elements_data.map((element_data, i) => {
            var style = buildStyle(element_data.type, element_data.bbox);
            return <div style={style} id={base_id + "-" + element_data.id} key={i} className={element_data.type.className}>
                {element_data.text}
            </div>
        })
        logging.log("result_elements", result_elements);
        return <div style={{ position: "absolute"}}>{result_elements}</div>;
    }

    var parseBbox = (title, index_offset) => {
        var result = {};
        var arr = title.split(" ");
        logging.log(`bbox ${arr[index_offset]} ${arr[index_offset + 1]} ${arr[index_offset + 2]} ${arr[index_offset + 3]}`)
        result.left = parseInt(arr[index_offset]);
        result.top = parseInt(arr[index_offset + 1])
        result.right = parseInt(arr[index_offset + 2])
        result.bottom = parseInt(arr[index_offset + 3])
        result.width = result.right - result.left;
        result.height = result.bottom - result.top;
        return result;
    } 

    return (
        parseHocr(props.hocr)
    );
}
