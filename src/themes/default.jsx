import { createMuiTheme, responsiveFontSizes } from '@material-ui/core/styles';
import { red, orange, lightGreen, amber, grey} from '@material-ui/core/colors';


var themeBuilder = createMuiTheme({
    palette: {
      primary: {
        main: lightGreen[300],
      },
      secondary: {
        main: amber[300],
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
        main: grey[100]
      }
    },
  });

themeBuilder = responsiveFontSizes(themeBuilder);

export const theme = themeBuilder;