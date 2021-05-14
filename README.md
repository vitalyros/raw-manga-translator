# Raw Manga Translator Firefox Plugin
An attempt to make an opensource firefox plugin that automatically recognizes and translates text in japanese manga on demand without a specialized backend service, i.e. with all the work done in browser or adopting existing services as backends.

## Current pipeline
- User switches to selection mode and selects an area of browser screen.
- A screenshot of the selected part is made.
- The screenshot is processed with tesseract.js OCR tool to get Japanese text.
- The Japanese text is then translated to English with the help of unfriendly (to Google) browser-based implementation of Google Translate API or a separate tab running the google translate site.
- The Translated English text is displayed near the selected area in a React js dialog