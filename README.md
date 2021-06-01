# Raw Manga Translator Firefox Plugin
An attempt to make an opensource firefox plugin that automatically recognizes and translates text in japanese manga on demand without a specialized backend service, i.e. with all the work done in browser or adopting existing services as backends.

## Current pipeline
- User switches to selection mode and selects an area of browser screen.
- A screenshot of the selected part is made.
- The screenshot is processed with tesseract.js OCR tool to get Japanese text.
- The Japanese text is then translated to English with the help of unfriendly (to Google) browser-based implementation of Google Translate API or a separate tab running the google translate site.
- The Translated English text is displayed near the selected area in a React js dialog

## Building Packaging Installing

### Installing from sources
- You will need [npm](https://www.npmjs.com/)  and [git](https://git-scm.com/) installed.
- Fetch these sources with `git clone https://github.com/vitalyros/raw-manga-translator.git` if you already have not done so.
- In source root directory run `npm install` to fetch dependencies.
- Build and package with by running `npm run dist`.
- Install by firefox page `about:debugging` -> `This Firefox` -> `Load Temporary Addon` -> select raw-manga-translator-firefox-plugin.xpi file

## Using
- Left-click on the page to open the context menu
- Choose `Select area to translate`
- Right-click and drag to select an area with text
- To disable choose `Cancel area selecton` in left-click context menu