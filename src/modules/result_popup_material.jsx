import * as events from "./events.js";
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { makeStyles, useTheme } from '@material-ui/core';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Paper from '@material-ui/core/Paper';
import Draggable from 'react-draggable';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import DisplayHocrWithImage from './display_hocr_react.jsx';
import * as translation from './translation.js';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import ErrorBoundary from './error_boundary.jsx';
import * as settings from './settings.js';
import { theme } from '../themes/default.jsx';

const module_name = 'result_popup';

var enabled = false;
const wrapper_div_id = "romatora-translation-popup-wrapper"
var wrapper_div = null;
var dialog_component = null;

function fireExclusionZoneUpdate(component, exclusionAreaName, nodeOpen) {
  var node = ReactDOM.findDOMNode(component);
  console.log('title node', node)
  var rect = node.getBoundingClientRect();
  console.log("title bounding", rect.top, rect.right, rect.bottom, rect.left);
  if (nodeOpen) {
    events.fire({
      type: events.EventTypes.AreaSelectionExclusionZoneUpdate,
      from: module_name,
      data: {
        name: exclusionAreaName,
        remove: false,
        rect: rect
      }
    });
  } else {
    events.fire({
      type: events.EventTypes.AreaSelectionExclusionZoneUpdate,
      from: module_name,
      data: {
        name: exclusionAreaName,
        remove: true
      }
    });
  }
}

class PaperComponent extends React.Component {
  constructor(props) {
    super(props)

    this.exclusionAreaName="result_popup_paper"
  }
  
  onDragStart() {
    events.fire({
      type: events.EventTypes.AreaSelectionExclusionZoneDragUpdate,
      from: module_name,
      data: {
        dragged: true
      }
    });
  }
  
  onDragStop() {
    events.fire({
      type: events.EventTypes.AreaSelectionExclusionZoneDragUpdate,
      from: module_name,
      data: {
        dragged: false
      }
    });
    fireExclusionZoneUpdate(this, this.exclusionAreaName, this.props.open)
  }

  componentDidUpdate() {
    fireExclusionZoneUpdate(this, this.exclusionAreaName, this.props.open)
  }

  render() {
    return (
      <Draggable 
        handle="#romatora-draggable-dialog-title" 
        cancel={'[class*="MuiDialogContent-root"]'}
        onStart={() => this.onDragStart()}
        onStop={() => this.onDragStop()}
        >
        <Paper {...this.props} />
      </Draggable>
    );
  }
}

function TranslationTool(props) {
  return (
    <div style={{ width: 'fit-content' }}>
  <Grid container
    spacing={3}  
    direction="column"
    justify="flex-start"
    alignItems="stretch">
      <Grid item>
        <ErrorBoundary>
          <TextField
            id="romatora-recognized-text"
            label="Recognized"
            multiline
            noValidate
            rows={5}
            fullWidth
            variant="outlined"
            onChange={props.onOriginalTextInput}
            value={props.originalText}
            className={props.classes.textfield}
            variant="outlined"
          />
        </ErrorBoundary>
      </Grid>
      <Grid item>
        <ErrorBoundary>
          <Toolbar variant="dense" className={props.classes.translate_toolbar}>
            <Select edge="start"
              value={props.translationMethod}
              onChange={props.onSelectTranslationMethod}
            >
              <MenuItem value={translation.TranslationMethod.GoogleTranslateTab}>Google Translate Tab</MenuItem>
              <MenuItem value={translation.TranslationMethod.GoogleTranslateApi}>Google Translate Api</MenuItem>
              <MenuItem value={translation.TranslationMethod.Stub}>Stub</MenuItem>
            </Select>
            <div style={{ flexGrow: 1 }} />
            <Button edge="end" className={props.classes.button_translate} onClick={props.translateText}>
              Translate
            </Button>
          </Toolbar>
        </ErrorBoundary>
      </Grid>
      <Grid item>
        <ErrorBoundary>
          <TextField
            id="romatora-translated-text"
            label="Translated"
            noValidate
            multiline
            fullWidth
            variant="outlined"
            InputProps={{
              readOnly: true
            }}
            rows={5}
            className={props.classes.textfield}
            value={props.translatedText}
            variant="outlined"
          />
        </ErrorBoundary>
      </Grid>
    </Grid>
    </div>
   );
}

function ResultPopupTitle(props) {
  console.log("classes in title", props.classes)
  return (
    <DialogTitle className={props.classes.dialog_title} id="romatora-draggable-dialog-title">
      <Toolbar className={props.classes.dialog_toolbar} variant="dense">
        <Typography className={props.classes.title_text} edge="start" variant="h6">
          ロマトラ
        </Typography>
        <div style={{ flexGrow: 1 }} />
        <IconButton edge="end" size="small" onClick={props.handleClose} className={props.classes.button_close}>
          <CloseIcon />
        </IconButton>
      </Toolbar>
    </DialogTitle>
    );  
}

function ResultPopupContent(props) {
  return (<DialogContent className={ props.classes.dialog_content} style={{ overflow: 'hidden'}} id="romatora-draggable-dialog-content">
      <Grid container 
      spacing={3}  
      direction="row"
      justify="flex-start"
      alignItems="flex-start">
        {/* <Grid item>
          <DisplayHocrWithImage hocr={this.props.hocr} imageUri={this.props.imageUri}/>
        </Grid> */}
        <Grid item>
        <TranslationTool 
          classes={props.classes}
          originalText={props.originalText} 
          translatedText={props.translatedText}
          translateText={props.translateText} 
          translationMethod={props.translationMethod}
          onOriginalTextInput={props.onOriginalTextInput}
          onSelectTranslationMethod={props.onSelectTranslationMethod}/>
        </Grid>
      </Grid>
    </DialogContent>);
}

function TranslationDialog(props) {
    const [open, setOpen] = useState(false);  
    const [box, setBox] = useState({ x_visible:0, y_visible: 0, width :0});  
    const [originalText, setOriginalText] = useState("");  
    const [translatedText, setTranslatedText] = useState("");  
    const [hocr, setHocr] = useState(null);  
    const [imageUri, setImageUri] = useState(null);  
    const [translationMethod, setTranslationMethod] = useState(props.translationMethod);  

    const onSelectTranslationMethod = (event) => {
      var newTranslationMethod = event.target.value
      settings.setDefaultTranslationMethod(newTranslationMethod)
      translateText(newTranslationMethod, originalText)
      setTranslationMethod(newTranslationMethod)
    };

    const onTextRecognized = (event) => {
      var newOriginalText = event.data.recognized_text
      setBox(event.data.box)
      setOpen(true)
      setImageUri(event.data.image_uri)
      setHocr(event.data.ocr_result.data.hocr)
      setOriginalText(newOriginalText)
      translateText(translationMethod, newOriginalText)
    }

    const translateText = (translationMethod, textToTranslate) => {
      setTranslatedText("")
      if (textToTranslate && translationMethod) {
        events.fire({
          type: events.EventTypes.translation_requested,
          from: module_name,
          data: {
            serviceName: translationMethod,
            textToTranslate: textToTranslate
          }
        })
      }
    }
    
    const onTextTranslated = (event) => {
      setTranslatedText(event.data.translatedText)
    }
    
    useEffect(() => {
      events.addListener(onTextTranslated, events.EventTypes.text_translated)
      events.addListener(onTextRecognized, events.EventTypes.text_recognized)
      return () => {
        events.removeListener(onTextRecognized, events.EventTypes.text_recognized)
        events.removeListener(onTextTranslated, events.EventTypes.text_translated)
      }
    });

    const classes = makeStyles({
        dialog: {
          position: 'absolute',
          left: box.x_visible + box.width,
          top: box.y_visible,
          border: `3px solid ${theme.palette.grey.main}`
        },
        dialog_title: {
          cursor: 'move',
          'background-color': theme.palette.grey.main,
          padding: 0,
          'padding-left': 0,
          'padding-right': 0,
        },
        dialog_toolbar: {
          'background-color': theme.palette.grey.main,
          'padding-left': '16px',
          'padding-right': '16px'
        },
        title_text: {
          'color': theme.palette.primary.dark,
          fontWeight: 800
        },
        textfield: {
          minWidth: '350px',
          '&:focus': {
            color: theme.palette.grey.dark
          }
        },
        translate_toolbar: {
          'padding-left': '0px',
          'padding-right': '0px'
        },
        dialog_content: {
          padding: '16px'
        },
        button_close: {
          color: theme.palette.primary.contrastText,
          'background-color': theme.palette.primary.main,
        },
        button_translate: {
          color: theme.palette.secondary.contrastText,
          'background-color': theme.palette.secondary.main,
        },
        grow: {
          flexGrow: 1,
        },
        
    })(theme);

    const handleClose = () => {
      setOpen(false)
    }

    const handleOriginalTextInput = (event) => {
      setOriginalText(event.target.value)
    }

    console.log("classes", classes)
    return ( 
      <ThemeProvider theme={theme}>
        <Dialog 
          position="absolute"
          classes={{
            paper: classes.dialog
          }}
          color="inherit"
          disableBackdropClick
          disableEnforceFocus
          hideBackdrop
          open={open}
          fullWidth={false}
          scroll='body'
          maxWidth='xl'
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperComponent={PaperComponent}
          PaperProps={{
            open: open
          }}
        >
          
          <ErrorBoundary>
            <ResultPopupTitle 
              open={open}
              theme={theme}
              classes={classes}
              handleClose={handleClose}/>
          </ErrorBoundary>
          <ErrorBoundary>
            <ResultPopupContent
              open={open} 
              hocr={hocr} 
              imageUri={imageUri}
              originalText={originalText}
              translatedText={translatedText}
              translateText={() => translateText(translationMethod, originalText)}
              translationMethod={translationMethod}
              onOriginalTextInput={handleOriginalTextInput}
              onSelectTranslationMethod={onSelectTranslationMethod}
              classes={classes}
            />
          </ErrorBoundary>
        </Dialog>
      </ThemeProvider>
    );
}

async function lazyInitComponent() {
  if (!wrapper_div) {
    wrapper_div = document.createElement('div');
    wrapper_div.id = wrapper_div_id;
    document.body.appendChild(wrapper_div);
  }
  if (!dialog_component) {
    try {
      var translationMethod = await settings.getDefaultTranslationMethod()
      console.log("translation method", translationMethod)
      if (!translationMethod) {
        translationMethod = translation.TranslationMethod.GoogleTranslateTab
      }
      dialog_component = await ReactDOM.render(<TranslationDialog translationMethod={translationMethod}/>, document.querySelector(`#${wrapper_div_id}`));
    } catch(e) {
      console.error ("Failed to initialize popup", dialog_component, e)
    }
  }
}

export async function enable() {
    if (!enabled) {
        events.addListener(lazyInitComponent, events.EventTypes.start_select_area)
        enabled = true
    }
}

export async function disable() {
    if (enabled) {
        if (wrapper_div) {
            document.body.removeChild(wrapper_div)
            wrapper_div = null;
        }
        if (dialog_component) {
            ReactDOM.unmountComponentAtNode(dialog_component)
            dialog_component = null;
        }
        events.removeListener(lazyInitComponent, events.EventTypes.start_select_area)
        enabled = false
    }
}