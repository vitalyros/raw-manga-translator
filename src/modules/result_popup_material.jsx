import * as events from "./events.js";
import React from 'react';
import ReactDOM from 'react-dom';
import { makeStyles } from '@material-ui/core';
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

const module_name = 'result_popup';

var enabled = false;
const wrapper_div_id = "romatora-translation-popup-wrapper"
var wrapper_div = null;
var dialog_component = null;

function PaperComponent(props) {
    return (
      <Draggable handle="#romatora-draggable-dialog-title" cancel={'[class*="MuiDialogContent-root"]'}>
        <Paper {...props} />
      </Draggable>
    );
  }

function TranslationTool(props) {
  console.log("props", props)
  const textFieldStyle = {
      minWidth: '400px'
  };

  const [inputText, setInputText] = React.useState(props.recognizedText);
  
  const translateText = () => {
    props.translateText(props.translationService, inputText)
  };

  const handleInputTextChanged = (event) => {
    setInputText(event.target.value);
  };
  return (<Grid container
    spacing={3}  
    direction="column"
    justify="flex-start"
    alignItems="flex-start">
      <Grid item>
        <TextField
          id="romatora-recognized-text"
          label="Recognized text"
          multiline
          noValidate
          rows={5}
          fullWidth
          variant="outlined"
          onChange={handleInputTextChanged}
          value={inputText}
          style={textFieldStyle}
          variant="outlined"
        />
      </Grid>
      <Toolbar color="inherit" variant="dense">
        <Select edge="start"
          value={props.translationService}
          onChange={props.onSelectTranslationService}
        >
          <MenuItem value={translation.TranslationService.Stub}>Stub</MenuItem>
          <MenuItem value={translation.TranslationService.GoogleTranslateApi}>Google Translate Api</MenuItem>
          <MenuItem value={translation.TranslationService.GoogleTranslateTab}>Google Translate Tab</MenuItem>
        </Select>
        <Button edge="end" onClick={translateText} color="primary">
          Translate
        </Button>
      </Toolbar>
      <Grid item>
        <TextField
          id="romatora-translated-text"
          label="Translated text"
          noValidate
          multiline
          fullWidth
          variant="outlined"
          InputProps={{
            readOnly: true
          }}
          style={textFieldStyle}
          rows={5}
          value={props.translatedText}
          variant="outlined"
        />
      </Grid>
    </Grid>);
}

class TranslationDialog extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        open: false,
        box: { x_visible:0, y_visible: 0, width :0},
        recognizedText: "",
        translatedText: "",
        hocr: null,
        imageUri: null,
        translationService: translation.TranslationService.Stub
      };


      this.boundOnTextRecognized = this.onTextRecognized.bind(this)
      this.boundOnTextTranslated = this.onTextTranslated.bind(this)
    }

    componentDidMount() {
      events.addListener(this.boundOnTextRecognized, events.EventTypes.text_recognized)
      events.addListener(this.boundOnTextTranslated, events.EventTypes.text_translated)

    }
  
    componentWillUnmount() { 
      events.removeListener(this.boundOnTextRecognized, events.EventTypes.text_recognized)
      events.removeListener(this.boundOnTextTranslated, events.EventTypes.text_translated)
    }

    onSelectTranslationService(event) {
      console.log("set translation service", event)
      console.log("set translation service", event.target.value)
      this.setState({
        translationService: event.target.value
      })
      console.log("state", this.state)
    };

    onTextRecognized(event) {
      this.setState({
        box: event.data.box,
        open: true,
        imageUri: event.data.image_uri,
        hocr: event.data.ocr_result.data.hocr,
        recognizedText: event.data.recognized_text
      })
      this.translateText(this.state.translationService, this.state.recognizedText)
    }
    
    onTextTranslated(event) {
      this.setState({
        translatedText: event.data.translatedText
      })
    }

    translateText(translationService, textToTranslate) {
      events.fire({
        type: events.EventTypes.translation_requested,
        from: module_name,
        data: {
          serviceName: translationService,
          textToTranslate: textToTranslate
        }
      })
    }
    
    makeClasses(box) { return makeStyles({
        grow: {
          flexGrow: 1,
        },
        dialog: {
          position: 'absolute',
          left: box.x_visible + box.width,
          top: box.y_visible
        },
        dialog_content: {
          overflow: "hidden" 
        }
      });
    }

    handleClose() {
      this.setState({
        open: false
      })
    };

    render() {
      var classes = this.makeClasses(this.state.box)
      return ( 
      <div>
          <Dialog 
            position="absolute"
            classes={{
              paper: classes.dialog
            }}
            disableEnforceFocus
            hideBackdrop
            open={this.state.open}
            fullWidth={false}
            maxWidth='xs'
            onClose={() => this.handleClose()}
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
              <IconButton edge="end" onClick={() => this.handleClose()} color="primary">
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </DialogTitle>
          <DialogContent className={classes.dialog_content} id="romatora-draggable-dialog-content">
              <Grid container 
              spacing={3}  
              direction="row"
              justify="flex-start"
              alignItems="flex-start">
                <Grid item xs={6}>
                  <DisplayHocrWithImage hocr={this.state.hocr} imageUri={this.state.imageUri}/>
                </Grid>
                <Grid item xs={6}>
                  <TranslationTool 
                  recognizedText={this.state.recognizedText} 
                  translatedText={this.state.translatedText}
                  translateText={this.translateText} 
                  translationService={this.state.translationService}
                  onSelectTranslationService={(e) => this.onSelectTranslationService(e)}/>
                </Grid>
              </Grid>
              </DialogContent> 
            </Dialog>
          </div>
      );
    }
}


export async function onTestTranslated(event) {
    try {
        box = event.data.box;
        var hocr_wrapper = document.createElement('div');
        hocr_wrapper.innerHTML = raw_hocr;
        hocr = hocr_wrapper.innerHTML;
        if (!dialogCreated) {
            createDialogWrapper(wrapper_div_id);
            await ReactDOM.render(<TranslationDialog />, document.querySelector(`#${wrapper_div_id}`));
            dialogCreated = true
        }
    } catch (e) {
        logError("onTestTranslated", message, e)
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
      dialog_component = await ReactDOM.render(<TranslationDialog />, document.querySelector(`#${wrapper_div_id}`));
    } catch(e) {
      console.error ("Failed to initialize popup", dialog_component, ee)
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