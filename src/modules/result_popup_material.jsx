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
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ErrorBoundary from './error_boundary.jsx';
import * as settings from './settings.js';
import { theme } from '../themes/default.jsx';
import _, { get } from "lodash";

const module_name = 'result_popup';

var enabled = false;
const wrapper_div_id = "romatora-translation-popup-wrapper"
var wrapper_div = null;
var dialog_component = null;

const SCALING_FACTOR = 2

function getCurrentZoom() {
  return window.devicePixelRatio
}

function repositionBasedOnZoomChange(position, oldZoom, newZoom) {
  const zoomRatio = oldZoom / SCALING_FACTOR
    return { 
    x: position.x * zoomRatio,
    y: position.y * zoomRatio
  }
}

class PaperComponent extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      // windowProps: {width: document.body.clientWidth, height: document.body.clientHeight},
      position: {x: 0, y: 0},
      lastReportedExclusionAreaEventData: null
    }
    this.exclusionAreaName="result_popup_paper"
    this.onTextRecognizedWrapped = (e) => this.onTextRecognized(e)
    this.onResizedWrapped = (e) => this.onResized(e)
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

  onResized(event) {
    // this.setState({
    //   windowProps: {width: document.body.clientWidth, height: document.body.clientHeight}
    // })
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
    events.addListener(this.onTextRecognizedWrapped, events.EventTypes.RecognitionSuccess)
    // window.addEventListener('resize', this.onResizedWrapped)
  }

  componentWillUnmount() {
    events.removeListener(this.onTextRecognizedWrapped, events.EventTypes.RecognitionSuccess)
    // window.removeEventListener('resize', this.onResizedWrapped)
  }

  componentDidUpdate() {
    this.fireExclusionZoneUpdate()
  }

  render() {
    // var position = repositionBasedOnZoomChange(this.state.position, this.props.baseZoom, this.props.zoom)
    var scale = SCALING_FACTOR / this.props.zoom
    // todo: infer these numbers from styles
    var elevationBorderFix = 16
    var rightBound = 420
    var bottomBound = 46
    return (
      <div style={{transformOrigin: "left top", transform: `scale(${scale})`}}>
      <Draggable 
        // drag is bound within base position. left bound is fixed by dialog elevation border
        bounds={{ 
          left: -1 * this.props.basePosition.x - elevationBorderFix, 
          top: -1 * this.props.basePosition.y, 
          // right: this.state.windowProps.width - this.props.basePosition.x - rightBound - elevationBorderFix,
          // bottom: this.state.windowProps.height - this.props.basePosition.y - bottomBound
        }}
        position={this.state.position}
        scale={scale}
        handle="#romatora-draggable-dialog-title" 
        cancel={'[class*="MuiDialogContent-root"]'}
        onStart={(e, d) => this.onDragStart(e, d)}
        onDrag={(e, d) => this.onDrag(e, d)}
        onStop={(e, d) => this.onDragStop(e, d)}
        >
          {/* <div style={{transform: `scale(${scale})`}}> */}
            <Paper {...this.props} />
          {/* </div> */}
      </Draggable>
      </div>
    );
  }
}

function TranslationTool(props) {
  const [expanded, setExpanded] = useState(false)
  
  const onChangeAccordion = (event, value) => {
    setExpanded(value)
  }

  const languageMenuItems = translation.TranslationLanguageList.map((lang, i) => {
    return <MenuItem key={i} className={props.classes.translate_language_select_menu_item} value={lang.name}>{lang.name}</MenuItem>
  })
  var resultTextClass = props.classes.textfield_result_text_translated
  if (props.errorFlags.error) {
    resultTextClass = props.classes.textfield_result_text_error
  } else if (props.errorFlags.warn) {
    resultTextClass = props.classes.textfield_result_text_warn
  }
  const resultTextField = <TextField
      id="romatora-translated-text"
      noValidate
      multiline
      fullWidth
      disabled
      InputProps={{
        readOnly: true
      }}
      rowsMax={10}
      className={`${props.classes.textfield_result_text} ${resultTextClass}`}
      value={props.resultText}
      variant="outlined"
    />
  const recognizedTextField = <TextField
      id="romatora-recognized-text"
      label="Recognized text"
      multiline
      noValidate
      rowsMax={10}
      fullWidth
      variant="outlined"
      onKeyDown={props.onOriginalTextKeyDown}
      onChange={props.onOriginalTextInput}
      value={props.originalText}
      className={props.classes.textfield_original_text}
      variant="outlined"
    />

  const translationToolbar = <Toolbar variant="dense" className={props.classes.translate_toolbar}>
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

  const accordionText = expanded 
    ? <Typography variant="subtitle2">Translation options</Typography> 
    : <Typography variant="subtitle2">Expand translation options</Typography> 

  return (
    <div style={{ width: 'fit-content' }}>
      <Grid container
        spacing={1}  
        direction="column"
        justify="flex-start"
        alignItems="stretch">
        <Grid item>
          <ErrorBoundary>
            {resultTextField}
          </ErrorBoundary>
        </Grid>
        <Grid item>
          <ErrorBoundary>
            <Accordion onChange={onChangeAccordion} expanded={expanded} className={props.classes.accordion}>
              <AccordionSummary expandIcon={<ExpandMoreIcon/>} className={props.classes.accordion_summary}>
                {accordionText}
              </AccordionSummary>
              <AccordionDetails className={props.classes.accordion_details}>
                <Grid container
                  spacing={1}  
                  direction="column"
                  justify="flex-start"
                  alignItems="stretch">
                    <Grid item>
                      <ErrorBoundary>
                        {recognizedTextField}
                      </ErrorBoundary>
                    </Grid>
                    <Grid item>
                      <ErrorBoundary>
                        {translationToolbar}
                      </ErrorBoundary>
                    </Grid>
                </Grid>
              </AccordionDetails>  
            </Accordion>
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
          resultText={props.resultText}
          translate={props.translate}
          errorFlags={props.errorFlags}
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
    try {
    const [zoom, setZoom] = useState(getCurrentZoom());
    const [open, setOpen] = useState(false);  
    const [baseZoom, setBaseZoom] = useState(getCurrentZoom());
    const [basePosition, setBasePosition] = useState({ x: 0, y: 0 })
    const [originalText, setOriginalText] = useState("");  
    const [resultText, setResultText] = useState("");  
    const [errorFlags, setErrorFlags] = useState({error: false, warn: false})
    const [hocr, setHocr] = useState(null);  
    const [imageUri, setImageUri] = useState(null);  
    const [translationMethod, setTranslationMethod] = useState(props.translationMethod);  
    const [translationLanguage, setTranslationLanguage] = useState(props.translationLanguage)
    const [translationRequestedAfterInput, setTranslationRequestedAfterInput] = useState(false)

    const setWarn = () => {
      setErrorFlags({error: false, warn: true})
    }

    const setError = () => {
      setErrorFlags({error: true, warn: false})
    }

    const clearWarnAndError = () => {
      setErrorFlags({error: false, warn: false})
    }

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

    const openWindowOnRecongitionEvent = (event) => {
      var xPositionThreshold = 442;
      var baseY = event.data.box.y_scrolled
      var baseX = event.data.box.x_scrolled + event.data.box.width;
      if (baseX > window.screen.width - xPositionThreshold) {
        baseX = event.data.box.x_scrolled - xPositionThreshold
      }
      setBasePosition({ x: baseX, y: baseY})
      setBaseZoom(getCurrentZoom())
      setOpen(true)
    }

    const onRecognitionFailure = (event) => {
      openWindowOnRecongitionEvent(event)
      setError(true)
      setOriginalText("")
      setResultText("Recognition failed. Try reloading the page")
    }


    const onRecognitionSuccess = (event) => {
      openWindowOnRecongitionEvent(event)
      var newOriginalText = event.data.recognized_text

      setImageUri(event.data.image_uri)
      setHocr(event.data.ocr_result.data.hocr)
      if (newOriginalText === "") {
        setWarn(true)
        setResultText("No text recognized")
        setOriginalText("")
      } else {
        clearWarnAndError()
        setResultText("")
        setOriginalText(newOriginalText)
        translateText(translationMethod, translationLanguage, newOriginalText)
      }
    }

    const translateText = (translationMethod, translationLanguage, textToTranslate) => {
      if (textToTranslate && translationMethod && translationLanguage) {
        events.fire({
          type: events.EventTypes.TranslationRequested,
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

    const onTranslationSuccess = (event) => {
      clearWarnAndError()
      setResultText(event.data.translatedText)
    }

    const onTranslationFailure = (event) => {
      setError(true)
      setResultText("Translation Failed. Try another translation method by selecting it down below.")
    }

    const onZoomChanged = (event) => {
      setZoom(getCurrentZoom())
    }

    const onTabZoomChanged = (event) => {
      // console.log (`${(window.outerWidth - 10 ) / window.innerWidth}`)
      // setZoom(event.data.newZoomFactor)
    }

    const adjustedPosition = repositionBasedOnZoomChange(basePosition, baseZoom, zoom)
    
    useEffect(() => {
      events.addListener(onTranslationFailure, events.EventTypes.TranslationFailure)
      events.addListener(onTranslationSuccess, events.EventTypes.TranslationSuccess)
      events.addListener(onRecognitionFailure, events.EventTypes.RecognitionFailure)
      events.addListener(onRecognitionSuccess, events.EventTypes.RecognitionSuccess)
      events.addListener(onTabZoomChanged, events.EventTypes.TabZoomChanged)
      window.addEventListener('resize', onZoomChanged)
      return () => {
        events.removeListener(onTranslationFailure, events.EventTypes.TranslationFailure)
        events.removeListener(onTranslationSuccess, events.EventTypes.TranslationSuccess)
        events.removeListener(onRecognitionFailure, events.EventTypes.RecognitionFailure)
        events.removeListener(onRecognitionSuccess, events.EventTypes.RecognitionSuccess)
        events.removeListener(onTabZoomChanged, events.EventTypes.TabZoomChanged)
        window.removeEventListener('resize', onZoomChanged)
      }
    }, []);

    const classes = makeStyles({
        dialog: {
          position: 'absolute',
        },
        dialog_paper: {
          position: 'absolute',
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          margin: '0 16px 0 16px',
          border: `3px solid ${theme.palette.grey.light}`,
          borderRadius: "5px",
          backgroundColor: theme.palette.grey.light
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

        accordion: {
          minHeight: '36px',
          borderTop: `1px solid ${theme.palette.grey.light}`,
          '& .MuiAccordionSummary-expandIcon': {
            padding: 0
          },
          '& .MuiAccordionSummary-content': {
            padding: 0,
            margin: 0
          },
          '& .MuiAccordionSummary-root.Mui-expanded': {
            minHeight: '36px' 
          },
        },
        accordion_summary: {
          minHeight: '36px',
          '& .MuiAccordionSummary-expandIcon': {
            padding: 0
          }
        },
        accordion_details: {
          padding: "8px 16px 8px 16px"
        },
        translate_method_select: {
          color: theme.palette.grey.veryDark,
          fontSize: "0.9rem",
          width: "170px"
        },
        translate_method_select_menu_item: {
          color: theme.palette.grey.veryDark,
          fontSize: "0.9rem"
        },
        translate_language_select: {
          marginLeft: '10px',
          color: theme.palette.grey.veryDark,
          fontSize: "0.9rem",
          width: "80px"
        },
        translate_language_select_menu_item: {
          color: theme.palette.grey.veryDark,
          fontSize: "0.9rem"
        },
        textfield_original_text : {
          minWidth: '380px',
          marginBottom: '3px',
          "& .MuiInputBase-input": {
            fontSize: "1rem",
            color: theme.palette.grey.veryDark
          },
          "& .MuiOutlinedInput-root": {
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
        textfield_result_text: {
          minWidth: '400px',
          marginBottom: '2px',
          "& .MuiOutlinedInput-multiline": {
            fontSize: "1.5rem",
            padding: "16px 16px 8px 16px"
          },
          "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
            border: "1px"
          },
          "& .MuiInputLabel-outlined.Mui-disabled": {
            color: theme.palette.grey.main,
          },
        },
        textfield_result_text_translated: {
          "& .MuiInputBase-root.Mui-disabled": {
            color: theme.palette.grey.veryDark,
          }      
        },
        textfield_result_text_warn: {
          "& .MuiInputBase-root.Mui-disabled": {
            color: theme.palette.warning.main,
          }      
        },
        textfield_result_text_error: {
          "& .MuiInputBase-root.Mui-disabled": {
            color: theme.palette.error.main,
          }      
        },
        translate_toolbar: {
          paddingLeft: 0,
          paddingRight: 0
        },
        dialog_content: {
          padding: 0,
          borderTop: `3px solid white`,
          borderRadius: "5px",
          backgroundColor: 'white'
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
      <ErrorBoundary>
        <ThemeProvider theme={theme}>

          <Dialog 
            classes={{
              root: classes.dialog,
              paper: classes.dialog_paper
            }}
            style = {{ position: "absolute"}}
            // position="abso
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
              basePosition: adjustedPosition,
              baseZoom: baseZoom,
              zoom: zoom
            }}
          >
            {/* <div style={{transformOrigin: "top left", transform: `scale(${1 / zoom})`}}> */}
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
                errorFlags={errorFlags}
                imageUri={imageUri}
                originalText={originalText}
                resultText={resultText}
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
            {/* </div> */}
          </Dialog>
        </ThemeProvider>
      </ErrorBoundary>
    );
  } catch(e) {
    console.log("ERROR", e)
    return <div/>
  }
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