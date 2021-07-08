import * as events from "./events.js";
import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { makeStyles, useTheme } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';
import Box from '@material-ui/core/Box';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import * as translation from '../utils/translation';
import ErrorBoundary from '../utils/error_boundary.jsx';
import * as settings from '../utils/settings';
import { theme } from '../themes/default.jsx';
import _ from "lodash";
import { loggingForModule } from '../utils/logging';

const moduleName = 'translation_progress_ui';
const logging = loggingForModule(moduleName)
var enabled = false;
const wrapper_div_id = "romatora-translation-progress-wrapper"
var wrapper_div = null;
var dialog_component = null;

const SCALING_FACTOR = 2

function getCurrentZoom() {
  return window.devicePixelRatio
}

function repositionBasedOnZoomChange(position, oldZoom, newZoom) {
  const zoomRatio = oldZoom / newZoom 
  return { 
    x: position.x * zoomRatio,
    y: position.y * zoomRatio
  }
}

function RecognitionProgress(props) {
  useTheme(theme)
  const interrupted = useRef(false)
  const [zoom, setZoom] = useState(getCurrentZoom())
  const [baseZoom, setBaseZoom] = useState(getCurrentZoom())
  const [position, setPosition] = useState({x: 0, y: 0})
  const [shown, setShown] = useState(false)
  const [progress, setProgress] = useState(0.0)
  const onRecognitionStart = async (event) => {
    const point = event.data.point;
    const positionOffset = 10;
    const positionThreshold = 60;
    var baseX = point.pageX + positionOffset
    var baseY = point.pageY + positionOffset
    var fixX = window.innerWidth - point.clientX - positionOffset - positionThreshold 
    var fixY = window.innerHeight - point.clientY - positionOffset - positionThreshold
    if (fixX < 0) {
      baseX = baseX + fixX
    }
    if (fixY < 0) {
      baseY = baseY + fixY
    }
    setBaseZoom(getCurrentZoom())
    setPosition({ x: baseX, y: baseY})
    setProgress(0)
    // Showing is slightly delayed.
    interrupted.current = false;
    await new Promise(r => setTimeout(r, 150));
    if (!interrupted.current) {
      setShown(true)
    }
  }
  const onRecognitionProgress = (event) => {
    setProgress(event.data.progress)
  }
  const onRecognitionFinished = (event) => {
    interrupted.current = true
    setShown(false)
    setProgress(0)
  }
  const onZoomChanged = (event) => {
    setZoom(getCurrentZoom())
  }
  useEffect(() => {
    events.addListener(onRecognitionStart, events.EventTypes.RecognitionStart)
    events.addListener(onRecognitionProgress, events.EventTypes.RecognitionProgress)
    events.addListener(onRecognitionFinished, events.EventTypes.RecognitionFailure)
    events.addListener(onRecognitionFinished, events.EventTypes.RecognitionSuccess)
    window.addEventListener('resize', onZoomChanged)
    return () => {
      events.removeListener(onRecognitionStart, events.EventTypes.RecognitionStart)
      events.removeListener(onRecognitionProgress, events.EventTypes.RecognitionProgress)
      events.removeListener(onRecognitionFinished, events.EventTypes.RecognitionFailure)
      events.removeListener(onRecognitionFinished, events.EventTypes.RecognitionSuccess)
      window.removeEventListener('resize', onZoomChanged)
    }
  }, []);
 
  const adjustedPosition = repositionBasedOnZoomChange(position, baseZoom, zoom)

  const classes = makeStyles({ 
    recognition_progress_box: {
      display: "inline-flex",
      position: 'absolute',
      left: `${adjustedPosition.x}px`,
      top: `${adjustedPosition.y}px`,
      zIndex: 1501,
    },
    recognition_progress_text: {
      color: theme.palette.primary.veryDark,
      fontWeight: 'bold',
      fontSize: '1rem',
    }
  })(theme);

  const scale = SCALING_FACTOR / zoom
  const value = Math.ceil(progress * 100)
  
  if (shown) {
    return (
      <ThemeProvider theme={theme}>
        <Box style={{transformOrigin: "left top", transform: `scale(${scale})`}} className={classes.recognition_progress_box} >
            <CircularProgress size='70px' color='primary' disableShrink/>
          <Box
            top={0}
            left={0}
            bottom={0}
            right={0}
            position="absolute"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Typography className={classes.recognition_progress_text}>{`${value}%`}</Typography>
          </Box>
        </Box>
      </ThemeProvider>
      
    );
  } else {
    return <div></div>;
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
      dialog_component = await ReactDOM.render(<RecognitionProgress/>, document.querySelector(`#${wrapper_div_id}`));
    } catch(e) {
      logging.error("Failed to initialize popup", dialog_component, e)
    }
  }
}

export async function enable() {
    if (!enabled) {
        events.addListener(lazyInitComponent, events.EventTypes.SelectAreaEnabled)
        enabled = true
        logging.debug("module enabled")
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
        events.removeListener(lazyInitComponent, events.EventTypes.SelectAreaEnabled)
        enabled = false
        logging.debug("module disabled")
    }
}