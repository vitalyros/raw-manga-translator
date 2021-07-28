# Raw Manga Translator Firefox Plugin
An attempt to make an opensource firefox plugin that automatically recognizes and translates text in japanese manga on demand without a specialized backend service, i.e. with all the work done in browser or adopting existing services as backends.

## Testing site list
### Works on
- [rawdevart](https://rawdevart.com)
- [comico](https://comico.jp)
- [pixiv](https://comic.pixiv.net)
- [raw.senmanga](https://raw.senmanga.com)
- [tonarinoyj](https://tonarinoyj.jp)
- [rawlazy](https://rawlazy.com/)
- [urasunday](https://urasunday.com)
- [sukima](https://www.sukima.me)
- [mangaz](https://www.mangaz.com)
- [ganganonline](https://www.ganganonline.com)

### Works with problems
- [mangabox](https://www.mangabox.me)
- [comic-waker](https://comic-walker.com)
- [alphapolis](https://www.alphapolis.co.jp)

### Does not work on
- [ebookjapan](https://ebookjapan.yahoo.co.jp)

## Current pipeline
- User switches to selection mode and selects an area of browser screen.
- A screenshot of the selected part is made.
- The screenshot is processed with tesseract.js OCR tool to get Japanese text.
- The Japanese text is then translated to English with the help of browser-based implementation of Google Translate API or a separate tab running the google translate site.
- The Translated English text is displayed near the selected area in a React js dialog

## Building Packaging Installing

### Installing the latest distro
All distributives and their release notes are available [here](https://github.com/vitalyros/raw-manga-translator/releases)

Download and install [the latest distro](https://github.com/vitalyros/raw-manga-translator/releases/download/v0.1.1/raw_manga_translator-0.1.1-fx.xpi) with firefox.


### Installing from sources
- You will need [npm](https://www.npmjs.com/)  and [git](https://git-scm.com/) installed.
- Fetch these sources with `git clone https://github.com/vitalyros/raw-manga-translator.git` if you already have not done so.
- In source root directory run `npm install` to fetch dependencies.
- Build and package with by running `npm run dist`.
- Install by firefox page `about:debugging` -> `This Firefox` -> `Load Temporary Addon` -> select raw-manga-translator-firefox-plugin.xpi file

## How to use
- Enable translation mode in the tab with manga:
  - Click the plugin icon in the firefox toolkit
  - Or left-click on the page to open the context menu and choose `Enable raw manga translation` 
- Select a text bubble or a text area:
  - Right click a text bubble to translate it
  - If the text is not in the bubble or the recontition failed - right click and drag to select an area with text
- To disable translation mode:
  - Click once again on the plugin icon in the firefox toolkit
  - Or left-click on the page to open the context menu and choose `Disable raw manga translation` 

If the UI is too big or too small for you, change it on the `about:addons` page in `raw manga translator` -> `preferences`

## License
- All code in the `src` directory is under Apache License 2.0
- All icons in the `icons` directory are under CC BY-SA 4.0