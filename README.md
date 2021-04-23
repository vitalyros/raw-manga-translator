# Raw Manga Translator
A firefox plugin that automatically translates texts in japanese manga on demand

## Current pipeline
- User switches to selection mode and selects an area of browser screen 
- A screenshot of the selected part is made
- The screenshot is processed with tesseract.js OCR tool to get Japanese text
- The Japanese text is translated to English with the help of unfriendly (to Google) browser-based implementation of Google Translate API
- The Translated English text is displayed near the selected area