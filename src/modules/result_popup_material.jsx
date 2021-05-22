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
import _ from "lodash";

const module_name = 'result_popup';

var enabled = false;
const wrapper_div_id = "romatora-translation-popup-wrapper"
var wrapper_div = null;
var dialog_component = null;

class PaperComponent extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      position: {x: 0, y: 0},
      lastReportedExclusionAreaEventData: null
    }
    this.exclusionAreaName="result_popup_paper"
    this.onTextRecognizedWrapped = (e) => this.onTextRecognized(e)
  }
  
  onDragStart(event, data) {
    console.log("on drag start", data)
    events.fire({
      type: events.EventTypes.AreaSelectionExclusionZoneDragUpdate,
      from: module_name,
      data: {
        dragged: true
      }
    });
  }
  
  onDragStop(event, data) {
    console.log("on drag stop", data)
    events.fire({
      type: events.EventTypes.AreaSelectionExclusionZoneDragUpdate,
      from: module_name,
      data: {
        dragged: false
      }
    });
    this.fireExclusionZoneUpdate()
  }

  onDrag(event, data) {
    this.setState({
      position: {
        x: data.x,
        y: data.y
      }
    })
  }

  onTextRecognized(event) {
    this.setState({
      position: { 
        x: 0,
        y: 0}
    })
    this.fireExclusionZoneUpdate()
  }

  fireExclusionZoneUpdate() {
    try {
      var eventData = null;
      if (this.props.open) {
        var node = ReactDOM.findDOMNode(this);
        var boundingRect = node.getBoundingClientRect();
        var scrollX = window.scrollX;
        var scrollY = window.scrollY;
        var rect = {
          x: boundingRect.x + scrollX,
          y: boundingRect.y + scrollY,
          left: boundingRect.left + scrollX,
          right: boundingRect.right + scrollX,
          top: boundingRect.top + scrollY,
          bottom: boundingRect.bottom + scrollY,
          width: boundingRect.width,
          height: boundingRect.height
        }
        eventData = {
          name: this.exclusionAreaName,
          remove: false,
          rect: rect
        }
        
      } else {
        eventData = {
          name: this.exclusionAreaName,
          remove: true
        }
      }
      if (eventData && !_.isEqual(eventData, this.state.lastReportedExclusionAreaEventData)) {
        events.fire({
          type: events.EventTypes.AreaSelectionExclusionZoneUpdate,
          from: module_name,
          data: eventData
        });
        this.setState({
          lastReportedExclusionAreaEventData: eventData
        });
      }
    } catch(e) {
      console.error("failed to fire exclusion zone update", this, e)
    }
  }

  componentDidMount() {
    events.addListener(this.onTextRecognizedWrapped, events.EventTypes.text_recognized)
  }

  componentWillUnmount() {
    events.removeListener(this.onTextRecognizedWrapped, events.EventTypes.text_recognized)
  }

  componentDidUpdate() {
    this.fireExclusionZoneUpdate()
  }

  render() {
    return (
      <Draggable 
        position={this.state.position}
        handle="#romatora-draggable-dialog-title" 
        cancel={'[class*="MuiDialogContent-root"]'}
        onStart={(e, d) => this.onDragStart(e, d)}
        onDrag={(e, d) => this.onDrag(e, d)}
        onStop={(e, d) => this.onDragStop(e, d)}
        >
        <Paper {...this.props} />
      </Draggable>
    );
  }
}

function TranslationTool(props) {
  const languageMenuItems = translation.TranslationLanguageList.map((lang, i) => {
    return <MenuItem key={i} className={props.classes.translate_language_select_menu_item} value={lang.name}>{lang.name}</MenuItem>
  })
  return (
    <div style={{ width: 'fit-content' }}>
  <Grid container
    spacing={1}  
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
            onKeyDown={props.onOriginalTextKeyDown}
            onChange={props.onOriginalTextInput}
            value={props.originalText}
            className={props.classes.textfield_original_text}
            variant="outlined"
          />
        </ErrorBoundary>
      </Grid>
      <Grid item>
        <ErrorBoundary>
          <Toolbar variant="dense" className={props.classes.translate_toolbar}>
            <Select edge="start"
              className={props.classes.translate_method_select}
              value={props.translationMethod}
              onChange={props.onSelectTranslationMethod}
            >
              <MenuItem className={props.classes.translate_method_select_menu_item} value={translation.TranslationMethod.GoogleTranslateTab}>Google Translate Tab</MenuItem>
              <MenuItem className={props.classes.translate_method_select_menu_item} value={translation.TranslationMethod.GoogleTranslateApi}>Google Translate Api</MenuItem>
              <MenuItem className={props.classes.translate_method_select_menu_item} value={translation.TranslationMethod.Stub}>Stub</MenuItem>
            </Select>
            <Select
              className={props.classes.translate_language_select}
              value={props.translationLanguage}
              onChange={props.onSelectTranslationLanguage}>
              {languageMenuItems}
            </Select>
            <div style={{ flexGrow: 1 }} />
            <Button edge="end" className={props.classes.translate_button} onClick={props.translate}>
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
            disabled
            variant="outlined"
            InputProps={{
              readOnly: true
            }}
            rows={5}
            className={props.classes.textfield_translated_text}
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
  return (
    <DialogTitle className={props.classes.dialog_title} id="romatora-draggable-dialog-title">
      <Toolbar className={props.classes.dialog_toolbar} variant="dense">
        <Typography className={props.classes.title_text} edge="start" variant="subtitle1">
          Translation
        </Typography>
        <div style={{ flexGrow: 1 }} />
        <IconButton edge="end" size="small" onClick={props.handleClose} className={props.classes.close_button}>
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
          translate={props.translate}
          translationMethod={props.translationMethod}
          translationLanguage={props.translationLanguage}
          onOriginalTextInput={props.onOriginalTextInput}
          onOriginalTextKeyDown={props.onOriginalTextKeyDown}
          onSelectTranslationMethod={props.onSelectTranslationMethod}
          onSelectTranslationLanguage={props.onSelectTranslationLanguage}/>
        </Grid>
      </Grid>
    </DialogContent>);
}

function TranslationDialog(props) {
    const [open, setOpen] = useState(false);  
    const [defaultPosition, setDefaultPosition] = useState({ x: 0, y: 0 })
    const [originalText, setOriginalText] = useState("");  
    const [translatedText, setTranslatedText] = useState("");  
    const [hocr, setHocr] = useState(null);  
    const [imageUri, setImageUri] = useState(null);  
    const [translationMethod, setTranslationMethod] = useState(props.translationMethod);  
    const [translationLanguage, setTranslationLanguage] = useState(props.translationLanguage)
    const [translationRequestedAfterInput, setTranslationRequestedAfterInput] = useState(false)

    const onSelectTranslationMethod = (event) => {
      var newTranslationMethod = event.target.value
      settings.setDefaultTranslationMethod(newTranslationMethod)
      translateText(newTranslationMethod, translationLanguage, originalText)
      setTranslationMethod(newTranslationMethod)
    };

    const onSelectTranslationLanguage = (event) => {
      var newTranslationLanguage = event.target.value
      settings.setDefaultTranslationLanguage(newTranslationLanguage)
      translateText(translationMethod, newTranslationLanguage, originalText)
      setTranslationLanguage(newTranslationLanguage)
    }

    const onTextRecognized = (event) => {
      var newOriginalText = event.data.recognized_text
      var xPositionThreshold = 442;
      var defaultY = event.data.box.y_scrolled
      var defaultX = event.data.box.x_scrolled + event.data.box.width;
      if (defaultX > window.screen.width - xPositionThreshold) {
        defaultX = event.data.box.x_scrolled - xPositionThreshold
      }
      setDefaultPosition({ x: defaultX, y: defaultY})
      setOpen(true)
      setImageUri(event.data.image_uri)
      setHocr(event.data.ocr_result.data.hocr)
      setOriginalText(newOriginalText)
      translateText(translationMethod, translationLanguage, newOriginalText)
    }

    const translateText = (translationMethod, translationLanguage, textToTranslate) => {
      if (textToTranslate && translationMethod && translationLanguage) {
        events.fire({
          type: events.EventTypes.translation_requested,
          from: module_name,
          data: {
            translationMethod: translationMethod,
            translationLanguage: translationLanguage,
            textToTranslate: textToTranslate
          }
        })
      }
    }

    const translate = () => { translateText(translationMethod, translationLanguage, originalText) }

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
        },
        dialog_paper: {
          position: 'absolute',
          left: defaultPosition.x,
          top: defaultPosition.y,
          margin: '0 16px 0 16px',
          border: `3px solid ${theme.palette.grey.light}`
        },
        dialog_title: {
          cursor: 'move',
          backgroundColor: theme.palette.grey.light,
          padding: 0,
          paddingLeft: 0,
          paddingRight: 0,
        },
        dialog_toolbar: {
          backgroundColor: theme.palette.grey.light,
          paddingLeft: '12px',
          paddingRight: '12px',
          minHeight: '42px' 
        },
        title_text: {
          color: theme.palette.grey.dark,
          fontWeight: 'bold'
        },
        translate_method_select: {
          color: theme.palette.primary.veryDark,
          fontSize: "0.9rem"
        },
        translate_method_select_menu_item: {
          color: theme.palette.primary.veryDark,
          fontSize: "0.9rem"
        },
        translate_language_select: {
          marginLeft: '10px',
          color: theme.palette.primary.veryDark,
          fontSize: "0.9rem"
        },
        translate_language_select_menu_item: {
          color: theme.palette.primary.veryDark,
          fontSize: "0.9rem"
        },
        textfield_original_text : {
          minWidth: '380px',
          marginBottom: '2px',
          "& .MuiInputLabel-outlined": {
            color: theme.palette.grey.main
          },
          "&:hover .MuiInputLabel-outlined": {
            color: theme.palette.grey.dark
          },
          "& .MuiInputLabel-outlined.Mui-focused": {
            color: theme.palette.grey.veryDark,
          },
          "&:hover .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.grey.dark,
          },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.grey.veryDark,
            borderWidth: '1px'
          },
        },
        textfield_translated_text: {
          minWidth: '380px',
          marginBottom: '2px',
          "& .MuiInputLabel-outlined.Mui-disabled": {
            color: theme.palette.grey.main,
          },
          "& .MuiInputBase-root.Mui-disabled": {
            color: theme.palette.grey.veryDark,
          },
        },
        translate_toolbar: {
          paddingLeft: '0px',
          paddingRight: '0px'
        },
        dialog_content: {
          padding: '16px'
        },
        close_button: {
          color: theme.palette.primary.contrastText,
          backgroundColor: theme.palette.primary.main,
        },
        translate_button: {
          color: theme.palette.secondary.contrastText,
          backgroundColor: theme.palette.secondary.main,
          paddingLeft: '12px',
          paddingRight: '12px'
        },
        grow: {
          flexGrow: 1,
        },
        
    })(theme);

    const handleClose = () => {
      setOpen(false)
    }

    const onOriginalTextInput = (event) => {
      console.log("New original text", event.target.value)
      setOriginalText(event.target.value)
      if (translationRequestedAfterInput) {
        setTranslationRequestedAfterInput(false)
        translate()
      }
    }

    const onOriginalTextKeyDown = (event) => {
      if (event.keyCode == 13) {
        console.log("Key code ENTER")
        setTranslationRequestedAfterInput(true)
      }
    }

    return ( 
      <ThemeProvider theme={theme}>
        <Dialog 
          classes={{
            root: classes.dialog,
            paper: classes.dialog_paper
          }}
          style = {{ position: "absolute"}}
          position="absolute"
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
            open: open,
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
              translate={translate}
              translationMethod={translationMethod}
              translationLanguage={translationLanguage}
              onOriginalTextInput={onOriginalTextInput}
              onOriginalTextKeyDown={onOriginalTextKeyDown}
              onSelectTranslationMethod={onSelectTranslationMethod}
              onSelectTranslationLanguage={onSelectTranslationLanguage}
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
      if (!translationMethod) {
        translationMethod = translation.TranslationMethod.GoogleTranslateTab
      }
      console.log("translation method", translationMethod)
      var translationLanguage = await settings.getDefaultTranslationLanguage()
      if (!translationLanguage) {
        translationLanguage = translation.TranslationLanguages.English.name
      }
      console.log("translation language", translationLanguage)
      dialog_component = await ReactDOM.render(<TranslationDialog translationMethod={translationMethod} translationLanguage={translationLanguage}/>, document.querySelector(`#${wrapper_div_id}`));
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