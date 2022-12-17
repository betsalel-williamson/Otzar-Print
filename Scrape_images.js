/* This version didn't work very well.
It made assumptions about the canvas elements that were
not correct and caused a bug where the same image would
be used for multiple pages.

See Scrape_images.v2.js for a better scraper.
*/

const START_PAGE = 1;
const END_PAGE = 27;
const TIME_BETWEEN_PAGE_DOWNLOADS_MS = 2000;
const TIME_AFTER_CLICK_MS = 200;
const SCROLL_VIEW_CLASS_NAME =
  "vue-recycle-scroller wide-scroll ready direction-vertical";
const PAGE_BUTTONS_CLASS_NAME = "item page-nav-item";
const PAGE_NUMBER_ATTRIBUTE_NAME = "position";

/**
 * Gets the content for pages and opens up a new window for print
 * @param {int} startpage The page to start at.
 * @param {int} endpage The page to end at.
 */
async function getPages(startpage, endpage) {
  const numElemsToScroll = 5;
  const buttonHeightPx = Number(
    document.getElementsByClassName(PAGE_BUTTONS_CLASS_NAME)[0].offsetHeight
  );
  const scrollbyPx = numElemsToScroll * buttonHeightPx;
  const timeBetweenScrollMs = 200;

  /*
//
// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
// dec2hex :: Integer -> String
// i.e. 0-255 -> '00'-'ff'
*/
  /**
   * Create a unique session ID for the downloads
   * @param {int} dec The first number.
   * @param {int} num2 The second number.
   * @return {string} The sum of the two numbers.
   */
  function dec2hex(dec) {
    return dec.toString(16).padStart(2, "0");
  }

  /**
   * Get a random ID.
   * @param {int} len Length of the generated ID.
   * @return {string} Random ID of size len.
   */
  function generateId(len) {
    const arr = new Uint8Array((len || 40) / 2);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, dec2hex).join("");
  }

  console.time("get-page-buttons");

  const scrollViewElm = document.getElementsByClassName(
    SCROLL_VIEW_CLASS_NAME
  )[0];
  const pageButtons = {};

  /* init -- add first set of buttons before scrolling */

  const downloadedPages = new Set();

  /**
   * @param {pageButtons} pageButtons Object.
   * @return {pageButtons} Modified object.
   */
  async function addButtons(pageButtons) {
    pageButtonsArray = new Array(
      ...document.getElementsByClassName(PAGE_BUTTONS_CLASS_NAME)
    );
    for (let i = 0; i < pageButtonsArray.length; i++) {
      const pageName = pageButtonsArray[i].getAttribute(
        PAGE_NUMBER_ATTRIBUTE_NAME
      );

      // const imageAsDataURL = await Promise((resolve) => {
      //   // download image
      // });
      if (!downloadedPages.has(pageName)) {
        // download page
        downloadedPages.add(pageName);
      }
    }
    return pageButtons;
  }

  let scrollMax = endpage * buttonHeightPx;
  if (scrollMax > scrollViewElm.scrollHeight) {
    scrollMax = scrollViewElm.scrollHeight;
  }

  const getPageButtonPromises = [];
  for (
    let scrollToPx = (startpage - 1) * buttonHeightPx;
    scrollToPx <= scrollMax;
    scrollToPx += scrollbyPx
  ) {
    getPageButtonPromises.push(
      new Promise((resolve) => {
        t = setTimeout(
          function (scrollViewElm, scrollToPx, pageButtons) {
            console.log(scrollToPx);
            scrollViewElm.scrollTo(0, scrollToPx);
            pageButtons = addButtons(pageButtons);
            console.log(pageButtons);
            resolve();
          },
          timeBetweenScrollMs * (scrollToPx / scrollbyPx),
          scrollViewElm,
          scrollToPx,
          pageButtons
        );
        console.log("setTimeout " + t + " for scrollTo: " + scrollToPx);
      })
    );
  }
  await Promise.all(getPageButtonPromises);
  console.timeEnd("get-page-buttons");

  console.time("calculate-page-rage");

  /**
   * @param {pageButtons} pageButtons
   * @return {int} The first page.
   */
  function getMinPage(pageButtons) {
    return Object.keys(pageButtons).reduce(function (a, b) {
      return Number(a) < Number(b) ? Number(a) : Number(b);
    });
  }

  /**
   * @param {pageButtons} pageButtons
   * @return {int} The last page.
   */
  function getMaxPage(pageButtons) {
    return Object.keys(pageButtons).reduce(function (a, b) {
      return Number(a) > Number(b) ? Number(a) : Number(b);
    });
  }

  const minPage = getMinPage(pageButtons);
  const maxPage = getMaxPage(pageButtons);

  if (startpage < minPage) {
    throw new Error("Must set startpage to a value >= to " + minPage);
  }

  if (endpage > maxPage) {
    throw new Error("Must set endpage to a value <= to " + endpage);
  }

  console.log(
    "Loaded " +
      Object.keys(pageButtons).length +
      " page(s). Range loaded is " +
      getMinPage(pageButtons) +
      " to " +
      getMaxPage(pageButtons)
  );

  console.timeEnd("calculate-page-rage");

  console.time("print-pages");

  console.log("Printing page(s) " + startpage + " to " + endpage);

  /**
   * @param {canvas} canvas The first number.
   * @return {bool} True if the canvas is empty. False if the canvas isn't empty.
   */
  function isCanvasBlank(canvas) {
    const blank = document.createElement("canvas");

    blank.width = canvas.width;
    blank.height = canvas.height;

    result = canvas.toDataURL() === blank.toDataURL();
    blank.remove();
    return result;
  }

  /**
   * @param {int} canvas Canvas HTML element
   * @param {int} filenamePrefix a filename prefix
   * @param {int} pageNum the page number
   */
  function downloadCanvas(canvas, filenamePrefix, pageNum) {
    const type = "image/png";
    const typeExt = type.split("/")[1];
    console.log("Downloading page: " + pageNum);
    const image = canvas.toDataURL(type);

    const a = document.createElement("a");
    a.id = filenamePrefix;
    a.download = filenamePrefix + "." + typeExt;
    a.href = image;
    a.click();
    a.remove();
  }

  /*
// if number is within the page
// click buttons to load content
// download the page
// start at top get items
// scroll while scroll changed
*/
  const sessionId = generateId();
  const pagesToDownload = [];

  for (const i in pageButtons) {
    if (pageButtons.hasOwnProperty(i)) {
      iasnum = Number(i);
      if (iasnum >= startpage && iasnum <= endpage) {
        pagesToDownload.push([iasnum, pageButtons[i], 0]);
      }
    }
  }

  /**
   * loadImageTimetout
   * @param {int} pageNum
   * @param {Node} elm
   * @param {int} attempts
   * @param {string} sessionId
   * @param {[pagesToDownload]} pagesToDownload
   * @param {Promise.resolve} resolve
   */
  function loadImageTimetout(
    pageNum,
    elm,
    attempts,
    sessionId,
    pagesToDownload,
    resolve
  ) {
    console.time("load-page-" + pageNum);

    console.log("Loading page: " + pageNum);
    elm.click();

    t2 = setTimeout(
      afterClickTimeout,
      TIME_AFTER_CLICK_MS,
      pageNum,
      elm,
      attempts,
      sessionId,
      pagesToDownload,
      resolve
    );

    console.log("setTimeout " + t2 + " for click: " + pageNum);
  }

  /**
   * afterClickTimeout
   * @param {int} pageNum
   * @param {Node} elm
   * @param {int} attempts
   * @param {string} sessionId
   * @param {[pagesToDownload]} pagesToDownload
   * @param {Promise.resolve} resolve
   */
  function afterClickTimeout(
    pageNum,
    elm,
    attempts,
    sessionId,
    pagesToDownload,
    resolve
  ) {
    /* Assumption that the first canvas element is the page after elm.click() */
    canvas = document.getElementsByTagName("canvas")[0];
    console.timeEnd("load-page-" + pageNum);

    /* TODO: want to wait for image to load here -- don't know how long that could take? */
    const isImageReady = canvas && !isCanvasBlank(canvas);
    if (isImageReady) {
      console.time("download-page-" + pageNum);
      downloadCanvas(
        canvas,
        sessionId + "-" + Number(pageNum).toString().padStart(2, "0"),
        pageNum
      );
      console.timeEnd("download-page-" + pageNum);
    } else if (attempts > 5) {
      console.error(
        "No data for page: " +
          pageNum +
          " after " +
          attempts +
          " attempts. Not retrying."
      );
    } else {
      /* retry */
      console.error(
        "No data for page: " +
          pageNum +
          " attempt: " +
          attempts +
          ". Will retry download..."
      );
      pagesToDownload.unshift([pageNum, elm, attempts + 1]);
    }

    resolve();
  }

  while (pagesToDownload.length) {
    const [pageNum, elm, attempts] = pagesToDownload.shift();

    await new Promise((resolve) => {
      t = setTimeout(
        loadImageTimetout,
        TIME_BETWEEN_PAGE_DOWNLOADS_MS,
        pageNum,
        elm,
        attempts,
        sessionId,
        pagesToDownload,
        resolve
      );
      console.log("setTimeout " + t + " for page: " + pageNum);
    });
  }

  console.timeEnd("print-pages");
}

getPages(START_PAGE, END_PAGE);
