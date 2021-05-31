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
        main: amber[700],
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
  });

themeBuilder = responsiveFontSizes(themeBuilder);

export const theme = themeBuilder;