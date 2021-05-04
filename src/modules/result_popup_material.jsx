import * as events from "./events.js";
import React from 'react';
import ReactDOM from 'react-dom';
import { makeStyles } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Paper from '@material-ui/core/Paper';
import Draggable from 'react-draggable';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import DisplayHocr from './display_hocr_react.jsx';

const module_name = 'result_popup';

var enabled = false;
var dialogCreated = false;
var showDialog = () => {};
const wrapper_div_id = "romatora-translation-popup-wrapper"
var box = {
    y_visible: 0,
    x_visible: 0,
    widht: 0
};
var hocr = '';
var recogined_image_uri = '';
var recognized_text = '';
var translated_text = '';
var popup_wrapper_div = null;

function HocrComponent() {
    return (
      // <Paper>
        /* <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute' }}>
            <img src={recogined_image_uri}></img>
          </div>
          <DisplayHocr hocr={hocr} />
        </div> */
        <div>
          <div style={{ position: 'relative' }}>
                    {/* <img style={{ position: 'absolute' }} src={recogined_image_uri}></img> */}
                    <DisplayHocr hocr={hocr} />
                    <img src={recogined_image_uri}>
                    </img>
                  </div>
        </div>
      // </Paper>
    );
  }

function PaperComponent(props) {
    return (
      <Draggable handle="#romatora-draggable-dialog-title" cancel={'[class*="MuiDialogContent-root"]'}>
        <Paper {...props} />
      </Draggable>
    );
  }

function TranslationDialog() {
    const [open, setOpen] = React.useState(false);

    const classes = makeStyles({
        grow: {
          flexGrow: 1,
        },
        // title: {
        //   height: '50px'
        // },
        dialog: {
          position: 'absolute',
          left: box.x_visible + box.width,
          top: box.y_visible
        },
      })();

    const handleClose = () => {
      setOpen(false);
    };

    showDialog = () => {
        setOpen(true);
    }
    
    return (
      <div>
        <Dialog 
          position="absolute"
          classes={{
            paper: classes.dialog
          }}
          disableEnforceFocus
          hideBackdrop
          open={open}
          fullWidth={false}
          maxWidth='xs'
          // scroll='body'
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperComponent={PaperComponent}
        >
        <DialogTitle style={{ cursor: 'move' }} id="romatora-draggable-dialog-title">
          <Toolbar color="inherit" variant="dense">
            <Typography edge="start" variant="h6" className={classes.title}>
              ロマトラ
            </Typography>
            <div className={classes.grow} />
            <IconButton edge="end" onClick={handleClose} color="primary">
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </DialogTitle>
        <DialogContent id="romatora-draggable-dialog-content">
          <Grid container 
          spacing={3}  
          direction="row"
          justify="flex-start"
          alignItems="flex-start">
            <Grid item xs={6}>
              <HocrComponent/>
            </Grid>
            <Grid item xs={6}>
              <Paper>
                <Grid container
                spacing={3}  
                direction="column"
                justify="flex-start"
                alignItems="flex-start">
                  <Grid item>
                    <TextField
                      id="romatora-recognized-text"
                      label="Recognized text"
                      multiline
                      rows={4}
                      defaultValue={recognized_text}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item>
                    <TextField
                      id="romatora-translated-text"
                      label="Translated text"
                      multiline
                      rows={4}
                      defaultValue={translated_text}
                      variant="outlined"
                    />
                  </Grid>
              </Grid>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent> 
        </Dialog>
      </div>
    );
}


export async function onTestTranslated(event) {
    try {
        box = event.data.box;
        recognized_text = event.data.recognized_text;
        translated_text = event.data.translated_text;
        recogined_image_uri = event.data.image_uri;

        var raw_hocr = event.data.ocr_result.data.hocr;
        // alert(raw_hocr)
        var hocr_wrapper = document.createElement('div');
        hocr_wrapper.innerHTML = raw_hocr;
        markHocrElements(hocr_wrapper, 'ocr_line', 1, "2px solid green", 0, "green");
        hocr = hocr_wrapper.innerHTML;
        // alert(hocr)

        if (!dialogCreated) {
            createDialogWrapper(wrapper_div_id);
            await ReactDOM.render(<TranslationDialog />, document.querySelector(`#${wrapper_div_id}`));
            dialogCreated = true
        }
        await showDialog();
    } catch (e) {
        logError("onTestTranslated", message, e)
    }
}

function createDialogWrapper() {
  if (popup_wrapper_div === null) {
    popup_wrapper_div = document.createElement('div');
    popup_wrapper_div.id = wrapper_div_id;
    document.body.appendChild(popup_wrapper_div);
  }
}

// function createHocrWrapper() {
//   var line_hocr_wrapper_div_id = "romatora-line-hocr-popup-wrapper"
//   if (line_hocr_wrapper_div === null) {
//       line_hocr_wrapper_div = document.createElement('div');
//       line_hocr_wrapper_div.id = line_hocr_wrapper_div_id;
//       line_hocr_wrapper_div.style.position = "absolute"
//       document.body.appendChild(line_hocr_wrapper_div);
//   }
//   
//   markHocrElements(line_hocr_wrapper_div, 'ocr_line', 1, "2px solid green", 0, "green");
//   hocr_wrapper = document.getElementById('romatora-hocr-wrapper')
//   hocr_wrapper.appendChild(line_hocr_wrapper_div)
// }

function markHocrElement(element, bbox_start_index, border, border_offset, color) {
  console.log("element", element)
  var i = bbox_start_index
  var arr = element.title.split(" ");
  console.log(`bbox ${arr[i]} ${arr[i + 1]} ${arr[i + 2]} ${arr[i + 3]}`)
  var left = parseInt(arr[i])
  var top = parseInt(arr[i + 1])
  var right = parseInt(arr[i + 2])
  var bottom = parseInt(arr[i + 3])
  console.log(`bbox parsed ${left} ${top} ${right} ${bottom}`)
  var width = right - left;
  var height = bottom - top;
  element.style["z-index"] = "1400";
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

export async function enable() {
    if (!enabled) {
        events.addListener(onTestTranslated, events.EventTypes.text_translated)
        enabled = true
    }
}

export async function disable() {
    if (enabled) {
        if (popup_wrapper_div != null) {
            document.body.removeChild(popup_wrapper_div)
        }
        events.removeListener(onTestTranslated, events.EventTypes.text_translated)
        enabled = false
    }
}