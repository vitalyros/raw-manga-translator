import { createMuiTheme, responsiveFontSizes } from '@material-ui/core/styles';
import { red, orange, lightGreen, amber, grey} from '@material-ui/core/colors';


var themeBuilder = createMuiTheme({
    palette: {
      primary: {
        light: lightGreen[200],
        main: lightGreen[300],
        dark: lightGreen[500],
        veryDark: lightGreen[700],
        contrastText: grey[800]
      },
      secondary: {
        main: amber[300],
        contrastText: grey[900]
      },
      error: {
        main: red[500],
      },
      warning: {
        main: amber[700],
      },
      success: {
        main: lightGreen[500],
      },
      grey: {
        light: grey[300],
        main: grey[500],
        dark: grey[700],
        veryDark: grey[900],
      }
    },
    overrides: {
      // MuiFormLabel: {
      //   root: {
      //     // "&$focused": {
      //     //   color: grey[700],
      //     //   fontWeight: "bold",
      //     // },
      //     // "& .MuiOutlinedInput-notchedOutline": {
      //     //   borderColor: "blue"
      //     // },
      //     // "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      //     //   borderColor: "red"
      //     // }
      //   }, 
      //   focused: {}
      // },
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