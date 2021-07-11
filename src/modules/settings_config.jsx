import * as settings from "../utils/settings";
import { loggingForModule } from "../utils/logging";
import { makeStyles, useTheme } from '@material-ui/core';
import { theme } from '../themes/default.jsx';
import { APP_ELEMENT_ID_PREFIX } from '../utils/const';
import React, { useRef, useState, useEffect } from 'react';
import ErrorBoundary from '../utils/error_boundary.jsx';
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
import * as translation from "../utils/translation";
import * as _ from "lodash";
var optionsWrapperDivId = `${APP_ELEMENT_ID_PREFIX}-options`
var optionsWrapperDiv;

function SettingsConfig(props) {
    const [settingsData, setSettingsData] = useState(props.settingsData);
    const save = () => {
        settings.setAll(settingsData)
    }
    const onDebugLoggingChange = (event) => {
        let newData = _.clone(settingsData)
        newData[settings.DEBUG_LOGGING_ENABLED] = Boolean(event.target.checked)
        setSettingsData(newData)
    };

    const setDebugBubbleRecognitionChange = (event) => {
        let newData = _.clone(settingsData)
        newData[settings.DEBUG_BUBBLE_RECOGNITION] = Boolean(event.target.checked)
        setSettingsData(newData)
    };

    const onSelectTranslationLanguage = (event) => {
        let newData = _.clone(settingsData)
        newData[settings.TRANSLATION_LANGUAGE_KEY] = event.target.value
        setSettingsData(newData)
    };

    const onSelectTranslationMethod = (event) => {
        let newData = _.clone(settingsData)
        newData[settings.TRANSLATION_METHOD_KEY] = event.target.value
        setSettingsData(newData)
    };

    const onUiScaleChange = (event) => {
        let newData = _.clone(settingsData)
        newData[settings.UI_SCALE] = parseFloat(event.target.value)
        setSettingsData(newData);
    }

    const languageMenuItems = translation.TranslationLanguageList.map((lang, i) => {
        return <MenuItem key={i} value={lang.name}>{lang.name}</MenuItem>
      })

    const classes = makeStyles({
        setting_group_paper: {
            padding: "16px 0px 16px 0px"
        },
        setting_group_title: {
            fontWeight: "bold",
            margin: 0,
            padding: "0px 0px 8px 8px",
        },
        setting_group_grid: {
        },
        setting_group_grid_item: {
        },
        setting_select: {
            width: "190px"
        },
        setting_textfield: {
        },
        setting_checkbox: {
            padding: 0,
            margin: 0
        },
        setting_toolbar: {
            padding: "8px, 32px, 8px, 32px",
            minHeight: '42px'
        }
    })(theme);

    return (
        <ErrorBoundary>
        <ThemeProvider theme={theme}>
            <Paper style={{ width: '100', padding: '5px'}}>
                <Grid container direction="column" spacing={1}>
                    <Grid item>
                       <Paper className={classes.setting_group_paper}>
                            <Typography className={classes.setting_group_title} edge="start">Translation</Typography>
                            <Grid container className={classes.setting_group_grid} direction="column" spacing={0}>
                            <Grid item className={classes.setting_group_grid_item}>
                                <Toolbar className={classes.setting_toolbar} style={{ width: '100'}}>
                                        <Typography edge="start">Translation Method</Typography>
                                        <div style={{ flexGrow: 1 }} />
                                        <Select
                                            value={settingsData[settings.TRANSLATION_METHOD_KEY]}
                                            onChange={onSelectTranslationMethod}
                                            className={classes.setting_select}
                                            autoWidth={false}>
                                            <MenuItem value={translation.TranslationMethod.GoogleTranslateTab}>Google Translate Tab</MenuItem>
                                            <MenuItem value={translation.TranslationMethod.GoogleTranslateApi}>Google Translate Api</MenuItem>
                                        </Select>
                                </Toolbar>
                            </Grid>
                                <Grid item className={classes.setting_group_grid_item}>
                                    <Toolbar className={classes.setting_toolbar} style={{ width: '100'}}>
                                            <Typography edge="start">Translation Language</Typography>
                                            <div style={{ flexGrow: 1 }} />
                                            <Select
                                                value={settingsData[settings.TRANSLATION_LANGUAGE_KEY]}
                                                onChange={onSelectTranslationLanguage}
                                                className={classes.setting_select}
                                                autoWidth={false}>
                                                {languageMenuItems}
                                            </Select>
                                    </Toolbar>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                    <Grid item>
                        <Paper className={classes.setting_group_paper}>
                            <Typography className={classes.setting_group_title} edge="start">UI</Typography>
                            <Grid container direction="column" className={classes.setting_group_grid} spacing={0}>
                                <Toolbar className={classes.setting_toolbar} style={{ width: '100'}}>
                                    <Typography edge="start">Scaling Factor</Typography>
                                    <div style={{ flexGrow: 1 }} />
                                    <Select
                                        value={settingsData[settings.UI_SCALE]}
                                        onChange={onUiScaleChange}
                                        className={classes.setting_select}
                                        autoWidth={false}>
                                        <MenuItem value={0.5}>50%</MenuItem>
                                        <MenuItem value={0.75}>75%</MenuItem>
                                        <MenuItem value={1.0}>100%</MenuItem>
                                        <MenuItem value={1.5}>150%</MenuItem>
                                        <MenuItem value={2.0}>200%</MenuItem>
                                        <MenuItem value={2.5}>250%</MenuItem>
                                        <MenuItem value={3.0}>300%</MenuItem>
                                    </Select>
                                </Toolbar>
                            </Grid>
                        </Paper>
                    </Grid>
                    <Grid item>
                        <Paper className={classes.setting_group_paper}>
                            <Typography className={classes.setting_group_title} edge="start">Debugging</Typography>
                            <Grid container direction="column" className={classes.setting_group_grid} spacing={0}>
                                <Grid item className={classes.setting_group_grid_item}>
                                    <Toolbar className={classes.setting_toolbar} style={{ width: '100'}}>
                                            <Typography edge="start">Debug Logging</Typography>
                                            <div style={{ flexGrow: 1 }} />
                                            <Checkbox edge="end" 
                                            className={classes.setting_checkbox}
                                            checked={settingsData[settings.DEBUG_LOGGING_ENABLED]} 
                                            onChange={onDebugLoggingChange}/>
                                    </Toolbar>
                                </Grid>
                                <Grid item className={classes.setting_group_grid_item}>
                                    <Toolbar className={classes.setting_toolbar} style={{ width: '100'}}>
                                            <Typography edge="start">Debug Bubble Recognition</Typography>
                                            <div style={{ flexGrow: 1 }} />
                                            <Checkbox edge="end" 
                                            className={classes.setting_checkbox}
                                            checked={settingsData[settings.DEBUG_BUBBLE_RECOGNITION]} 
                                            onChange={setDebugBubbleRecognitionChange}/>
                                    </Toolbar>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                    <Grid item>
                        <Toolbar className={classes.setting_toolbar} style={{ width: '100'}}>
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

export function display() {
    try {
        if (!optionsWrapperDiv) {
            optionsWrapperDiv = document.createElement('div');
            optionsWrapperDiv.id = optionsWrapperDivId;
            document.body.appendChild(optionsWrapperDiv);
            settings.getAll().then((settingsData) => {
                ReactDOM.render(<SettingsConfig settingsData={settingsData}/>, optionsWrapperDiv);
            });
        }
    } catch (e) {
        logging.error("failed to display options", s)
    }
}

