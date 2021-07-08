import * as settings from "./utils/settings";
import { loggingForModule } from "./utils/logging";
import { theme } from './themes/default.jsx';
import { APP_ELEMENT_ID_PREFIX } from './utils/const';
import React, { useRef, useState, useEffect } from 'react';
import ErrorBoundary from './utils/error_boundary.jsx';
import ReactDOM from 'react-dom';
import { ThemeProvider } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Checkbox from '@material-ui/core/Checkbox'
import Typography from '@material-ui/core/Typography'
import Toolbar from '@material-ui/core/Toolbar'
import Paper from '@material-ui/core/Paper';
import Button from "@material-ui/core/Button";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import * as translation from "./utils/translation";

var optionsWrapperDivId = `${APP_ELEMENT_ID_PREFIX}-options`
var optionsWrapperDiv;

function Options(props) {
    const [settingsData, setSettingsData] = useState(props.settingsData);
    const save = () => {
        settings.setAll(settingsData)
    }
    const onDebugLoggingChange = (event) => {
        let newData = settingsData
        newData[settings.DEBUG_LOGGING_ENABLED] = event.target.checked
        setSettingsData(newData)
    };

    const setDebugBubbleRecognitionChange = (event) => {
        let newData = settingsData
        newData[settings.DEBUG_BUBBLE_RECOGNITION] = event.target.checked
        setSettingsData(newData)
    };

    const onSelectTranslationLanguage = (event) => {
        let newData = settingsData
        newData[settings.TRANSLATION_LANGUAGE_KEY] = event.target.value
        setSettingsData(newData)
    };

    const onSelectTranslationMethod = (event) => {
        let newData = settingsData
        newData[settings.TRANSLATION_METHOD_KEY] = event.target.value
        setSettingsData(newData)
      }


    const languageMenuItems = translation.TranslationLanguageList.map((lang, i) => {
        return <MenuItem key={i} value={lang.name}>{lang.name}</MenuItem>
      })

    alert(`${settingsData[settings.TRANSLATION_METHOD_KEY]}`)
    return (
        <ErrorBoundary>
        <ThemeProvider theme={theme}>
            <Paper style={{ width: '100', padding: '5px'}}>
                <Grid container direction="column" spacing={2}>
                    <Grid item>
                    <Typography edge="start">Translation</Typography>
                        <Grid container direction="column" spacing={1}>
                            <Grid item>
                                <Toolbar style={{ width: '100'}} variant="dense">
                                        <Typography edge="start">Translation Method</Typography>
                                        <div style={{ flexGrow: 1 }} />
                                        <Select
                                            value={settingsData[settings.TRANSLATION_METHOD_KEY]}
                                            onChange={onSelectTranslationMethod}
                                            autoWidth={true}>
                                            <MenuItem value={translation.TranslationMethod.GoogleTranslateTab}>Google Translate Tab</MenuItem>
                                            <MenuItem value={translation.TranslationMethod.GoogleTranslateApi}>Google Translate Api</MenuItem>
                                        </Select>
                                </Toolbar>
                            </Grid>
                            <Grid item>
                                <Toolbar style={{ width: '100'}} variant="dense">
                                        <Typography edge="start">Translation Language</Typography>
                                        <div style={{ flexGrow: 1 }} />
                                        <Select
                                            value={settingsData[settings.TRANSLATION_LANGUAGE_KEY]}
                                            onChange={onSelectTranslationLanguage}
                                            autoWidth={true}>
                                            {languageMenuItems}
                                        </Select>
                                </Toolbar>
                            </Grid>
                        </Grid>
                        <Typography edge="start">Debugging</Typography>
                        <Grid container direction="column" spacing={1}>
                            <Grid item>
                                <Toolbar style={{ width: '100'}} variant="dense">
                                        <Typography edge="start">Debug Logging</Typography>
                                        <div style={{ flexGrow: 1 }} />
                                        <Checkbox edge="end" checked={settingsData[settings.DEBUG_LOGGING_ENABLED]} onChange={onDebugLoggingChange}/>
                                </Toolbar>
                            </Grid>
                            <Grid item>
                                <Toolbar style={{ width: '100'}} variant="dense">
                                        <Typography edge="start">Debug Image Processing</Typography>
                                        <div style={{ flexGrow: 1 }} />
                                        <Checkbox edge="end" checked={settingsData[settings.DEBUG_BUBBLE_RECOGNITION]} onChange={setDebugBubbleRecognitionChange}/>
                                </Toolbar>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item>
                        <Toolbar style={{ width: '100'}} variant="dense">
                            <div style={{ flexGrow: 1 }} />
                            <Button variant="contained" color="primary" edge="end" onClick={save}>Save</Button>
                        </Toolbar>
                    </Grid>
                </Grid>
            </Paper>
        </ThemeProvider>
        </ErrorBoundary>
    )
}
if (!optionsWrapperDiv) {
    optionsWrapperDiv = document.createElement('div');
    optionsWrapperDiv.id = optionsWrapperDivId;
    document.body.appendChild(optionsWrapperDiv);
    settings.getAll().then((settingsData) => {
        ReactDOM.render(<Options settingsData={settingsData}/>, optionsWrapperDiv);
    });
}
