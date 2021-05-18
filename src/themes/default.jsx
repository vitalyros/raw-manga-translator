import { createMuiTheme, responsiveFontSizes } from '@material-ui/core/styles';
import { red, orange, lightGreen, amber, grey} from '@material-ui/core/colors';


var themeBuilder = createMuiTheme({
    palette: {
      primary: {
        light: lightGreen[200],
        main: lightGreen[300],
        contrastText: grey[900]
      },
      secondary: {
        main: amber[300],
        contrastText: grey[900]
      },
      error: {
        main: red[500],
      },
      warning: {
        main: amber[500],
      },
      success: {
        main: orange[500],
      },
      grey: {
        light: grey[100],
        main: grey[200],
        dark: grey[300]
      }
    },
    overrides: {
      MuiFormLabel: {
        root: {
          "&$focused": {
            color: grey[600],
            fontWeight: "bold"
          }
        }, 
        
        focused: {}
      },
      MuiOutlinedInput: {
        root: {
          "&$focused": {
            'border-color': grey[600],
            'border-width': '2px'
          }
        }, 
        focused: {}
      }
    }

    // props: {
    //   MuiButton: {
    //     size: 'small',
    //   },
    //   MuiFilledInput: {
    //     margin: 'dense',
    //   },
    //   MuiFormControl: {
    //     margin: 'dense',
    //   },
    //   MuiFormHelperText: {
    //     margin: 'dense',
    //   },
    //   MuiIconButton: {
    //     size: 'small',
    //   },
    //   MuiInputBase: {
    //     margin: 'dense',
    //   },
    //   MuiInputLabel: {
    //     margin: 'dense',
    //   },
    //   MuiListItem: {
    //     dense: true,
    //   },
    //   MuiOutlinedInput: {
    //     margin: 'dense',
    //   },
    //   MuiFab: {
    //     size: 'small',
    //   },
    //   MuiTable: {
    //     size: 'small',
    //   },
    //   MuiTextField: {
    //     margin: 'dense',
    //   },
    //   MuiToolbar: {
    //     variant: 'dense',
    //   },
    // },
    // overrides: {
    //   MuiIconButton: {
    //     sizeSmall: {
    //       marginLeft: 4,
    //       marginRight: 4,
    //       padding: 12,
    //     },
    //   },
    // },
  });

themeBuilder = responsiveFontSizes(themeBuilder);

export const theme = themeBuilder;