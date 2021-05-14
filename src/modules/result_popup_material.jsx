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
import ErrorBoundary from './error_boundary.jsx';
// import List from '@material-ui/core/List';
// import ListItem from '@material-ui/core/LisListItemt';


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
  const textFieldStyle = {
      minWidth: '350px'
  };

  return (
    <div style={{ width: 'fit-content' }}>
  <Grid container
    spacing={3}  
    direction="column"
    justify="flex-start"
    alignItems="flex-start">
      <Grid item>
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
          style={textFieldStyle}
          variant="outlined"
        />
      </Grid>
      <Toolbar color="inherit" variant="dense" style={{ width: "100%"}}>
        <Select edge="start"
          value={props.translationService}
          onChange={props.onSelectTranslationService}
        >
          <MenuItem value={translation.TranslationService.GoogleTranslateTab}>Google Translate Tab</MenuItem>
          <MenuItem value={translation.TranslationService.GoogleTranslateApi}>Google Translate Api</MenuItem>
          <MenuItem value={translation.TranslationService.Stub}>Stub</MenuItem>
        </Select>
        <div style={{ flexGrow: 1 }} />
        <Button edge="end" onClick={props.translateText} color="primary">
          Translate
        </Button>
      </Toolbar>
      <Grid item>
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
          style={textFieldStyle}
          rows={5}
          value={props.translatedText}
          variant="outlined"
        />
      </Grid>
    </Grid>
    </div>
   );
}

class ResultPopupTitle extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <DialogTitle style={{ cursor: 'move' }} id="romatora-draggable-dialog-title">
        <Toolbar color="inherit" variant="dense">
          <Typography edge="start" variant="h6" className={this.props.classes.title}>
            ロマトラ
          </Typography>
          <div style={{ flexGrow: 1 }} />
          <IconButton edge="end" onClick={this.props.handleClose} color="primary">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </DialogTitle>
     );  
  }
}

class ResultPopupContent extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (<DialogContent style={{ overflow: 'hidden'}} id="romatora-draggable-dialog-content">
      <Grid container 
      spacing={3}  
      direction="row"
      justify="flex-start"
      alignItems="flex-start">
        <Grid item>
          <DisplayHocrWithImage hocr={this.props.hocr} imageUri={this.props.imageUri}/>
        </Grid>
        <Grid item>
        <TranslationTool 
          originalText={this.props.originalText} 
          translatedText={this.props.translatedText}
          translateText={this.props.translateText} 
          translationService={this.props.translationService}
          onOriginalTextInput={this.props.onOriginalTextInput}
          onSelectTranslationService={this.props.onSelectTranslationService}/>
        </Grid>
      </Grid>
    </DialogContent>);
  }
}

class TranslationDialog extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        open: false,
        box: { x_visible:0, y_visible: 0, width :0},
        originalText: "",
        translatedText: "",
        hocr: null,
        imageUri: null,
        translationService: translation.TranslationService.GoogleTranslateTab
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
      var newTranslationService = event.target.value
      this.translateText(newTranslationService, this.state.originalText)
      this.setState({
        translationService:  newTranslationService
      });
    };

    onTextRecognized(event) {
      var newOriginalText = event.data.recognized_text
      this.translateText(this.state.translationService, newOriginalText)
      this.setState({
        box: event.data.box,
        open: true,
        imageUri: event.data.image_uri,
        hocr: event.data.ocr_result.data.hocr,
        originalText: newOriginalText
      })
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
      });
    }

    handleClose() {
      this.setState({
        open: false
      })
    };

    handleOriginalTextInput(event) {
      this.setState({
        originalText: event.target.value
      });
    }

    render() {
      var classes = this.makeClasses(this.state.box)
      return ( 
        <Dialog 
          position="absolute"
          classes={{
            paper: classes.dialog
          }}
          disableBackdropClick
          disableEnforceFocus
          hideBackdrop
          open={this.state.open}
          fullWidth={false}
          scroll='body'
          maxWidth='xl'
          onClose={() => this.handleClose()}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperComponent={PaperComponent}
          PaperProps={{
            open: this.state.open
          }}
        >
          
          <ErrorBoundary>
            <ResultPopupTitle 
              open={this.state.open}
              classes={classes} 
              handleClose={() => this.handleClose()}/>
          </ErrorBoundary>
          <ErrorBoundary>
            <ResultPopupContent
              open={this.state.open} 
              hocr={this.state.hocr} 
              imageUri={this.state.imageUri}
              originalText={this.state.originalText}
              translatedText={this.state.translatedText}
              translateText={() => this.translateText(this.state.translationService, this.state.originalText)}
              translationService={this.state.translationService}
              onOriginalTextInput={(e) => this.handleOriginalTextInput(e)}
              onSelectTranslationService={(e) => this.onSelectTranslationService(e)}
            />
          </ErrorBoundary>
        </Dialog>
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