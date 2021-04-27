import messaging from "./messaging.js";
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

const module_name = 'result_popup';

var enabled = false;
var dialogCreated = false;
var showDialog = () => {};

var box = {
    y_visible: 0,
    x_visible: 0,
    widht: 0
};
var translated_text = '';
var popup_wrapper_div = null;

function PaperComponent(props) {
    return (
      <Draggable handle="#draggable-dialog-title" cancel={'[class*="MuiDialogContent-root"]'}>
        <Paper {...props} />
      </Draggable>
    );
  }

function TranslationDialog() {
    const [open, setOpen] = React.useState(false);

    const classes = makeStyles({
        dialog: {
          position: 'absolute',
          left: box.x_visible + box.width,
          top: box.y_visible
        }
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
          classes={{
            paper: classes.dialog
          }}
          disableEnforceFocus
          hideBackdrop
          open={open}
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperComponent={PaperComponent}
        >
        <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
          Translated text
        </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {translated_text}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }


function onTestTranslated(message) {
    box = message.data.box;
    translated_text = message.data.translated_text;
    if (!dialogCreated) {
        var wrapper_div_id = "romatora-translation-popup-wrapper"
        if (popup_wrapper_div === null) {
            popup_wrapper_div = document.createElement('div');
            popup_wrapper_div.id = wrapper_div_id;
            document.body.appendChild(popup_wrapper_div);
        }
        ReactDOM.render(<TranslationDialog />, document.querySelector(`#${wrapper_div_id}`));
        dialogCreated = true
    }
    showDialog();
}

export function enable() {
    if (!enabled) {
        messaging.addListener(onTestTranslated, messaging.MessageTypes.text_translated)
        enabled = true
    }
}

export function disable() {
    if (enabled) {
        if (popup_wrapper_div != null) {
            document.body.removeChild(popup_wrapper_div)
        }
        messaging.removeListener(onTestTranslated, messaging.MessageTypes.text_translated)
        enabled = false
    }
}

export function init() { enable() }
