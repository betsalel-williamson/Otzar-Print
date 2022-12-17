// eslint-disable-next-line prefer-const
let PAGE_RANGE = [];

/*
examples:
1. all pages: PAGE_RANGE = [];
2. selected pages: PAGE_RANGE = [1,27];
3. from start page to end: PAGE_RANGE = [3];
*/
(async function (pageRange) {
  /* Global Constants */
  const TIME_BEFORE_PAGE_DOWNLOADS_MS = 25;
  const MAX_ATTEMPTS = 400;
  const PAGE_BTNS_SCROLL_VIEW_CLASS_NAMES =
    "vue-recycle-scroller wide-scroll ready direction-vertical";
  const PAGE_BUTTONS_CLASS_NAME = "item page-nav-item";
  const BOOK_SCROLL_VIEW_CLASS_NAMES = "scroller wide-scroll";
  const PAGE_NUMBER_ATTRIBUTE_NAME = "position";
  const CANVAS_PAGE_NUMBER_ATTRIBUTE_NAME = "page";
  const IMAGE_TYPE = "image/png";
  const NUM_ELEMS_TO_SCROLL = 40;
  const TIME_BETWEEN_SCROLL_MS = 5;

  /**
   * Helper function to wait for a duration in milliseconds
   *
   * @param {int} ms milliseconds to wait
   */
  async function waitMs(ms) {
    return await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Get the page range for the current book
   *
   * @param {string} bookScrollViewClassNames
   *
   * @param {string} pageBtnsScrollViewClassNames
   *
   * @param {string} pageButtonsClassName
   *
   * @param {int} numElemsToScroll
   *
   * @param {int} timeBetweenScrollMs
   *
   * @param {string} pageNumberAttributeName
   *
   * @return {Promise<[int, int]>} [First page, Last page]
   */
  async function getPageRange(
    bookScrollViewClassNames = BOOK_SCROLL_VIEW_CLASS_NAMES,
    pageBtnsScrollViewClassNames = PAGE_BTNS_SCROLL_VIEW_CLASS_NAMES,
    pageButtonsClassName = PAGE_BUTTONS_CLASS_NAME,
    numElemsToScroll = NUM_ELEMS_TO_SCROLL,
    timeBetweenScrollMs = TIME_BETWEEN_SCROLL_MS,
    pageNumberAttributeName = PAGE_NUMBER_ATTRIBUTE_NAME
  ) {
    document.getElementsByClassName(bookScrollViewClassNames)[0].scrollTo(0, 0);
    document
      .getElementsByClassName(pageBtnsScrollViewClassNames)[0]
      .scrollTo(0, 0);
    await waitMs(10);

    const pages = new Set();

    const buttonHeightPx = Number(
      document.getElementsByClassName(pageButtonsClassName)[0].offsetHeight
    );
    const scrollbyPx = numElemsToScroll * buttonHeightPx;

    const scrollViewElm = document.getElementsByClassName(
      pageBtnsScrollViewClassNames
    )[0];

    const scrollMax =
      scrollViewElm.scrollHeight + scrollbyPx; /* Add a little wiggle room */

    for (
      let scrollToPx = 0;
      scrollToPx <= scrollMax;
      scrollToPx += scrollbyPx
    ) {
      await new Promise((resolve) => {
        t = setTimeout(
          function (scrollViewElm, scrollToPx) {
            scrollViewElm.scrollTo(0, scrollToPx);
            resolve();
          },
          timeBetweenScrollMs,
          scrollViewElm,
          scrollToPx
        );
      });

      /* set this in a timeout to allow drawing to run */
      await new Promise((resolve) => {
        setTimeout(function () {
          const elms = document.querySelectorAll(
            "[" + pageNumberAttributeName + "]"
          );
          for (let i = 0; i < elms.length; i++) {
            pages.add(Number(elms[i].getAttribute(pageNumberAttributeName)));
          }
          resolve();
        });
      });
    }

    const result = [Math.min(...pages), Math.max(...pages)];
    console.log("Pages range from " + result[0] + " to " + result[1] + ".");

    return result;
  }

  /**
   * Adds two numbers together.
   *
   * @param {int} pageNum
   *
   * @param {int} maxAttempts
   *
   * @param {int} timeBeforePageDownloadsMs
   *
   * @param {int} pageNumberAttributeName
   *
   * @param {int} canvasPageNumberAttributeName
   *
   * @param {string} imageType
   *
   * @return {Promise<string>}
   */
  async function getPageAsDataURL(
    pageNum,
    maxAttempts = MAX_ATTEMPTS,
    timeBeforePageDownloadsMs = TIME_BEFORE_PAGE_DOWNLOADS_MS,
    pageNumberAttributeName = PAGE_NUMBER_ATTRIBUTE_NAME,
    canvasPageNumberAttributeName = CANVAS_PAGE_NUMBER_ATTRIBUTE_NAME,
    imageType = IMAGE_TYPE
  ) {
    console.time("page-" + pageNum);

    const pageBtn = document.querySelector(
      "[" + pageNumberAttributeName + '="' + pageNum + '"]'
    );

    if (!pageBtn) {
      throw new Error("Unable to find page: " + pageNum);
    }

    console.log("Downloading page: " + pageNum);

    let attempts = 0;
    let imageAsDataURL = "";
    pageBtn.click();

    const blank = document.createElement("canvas");
    while (true) {
      attempts++;
      if (attempts >= maxAttempts) {
        console.error("Unable to download page: " + pageNum);
        break;
      }

      await waitMs(timeBeforePageDownloadsMs);

      const page = document.querySelector(
        "[" + canvasPageNumberAttributeName + '="' + pageNum + '"]'
      );

      if (!page) {
        if (document.getElementsByClassName("limited-container").length > 0) {
          /* the page can't be loaded... */
          console.timeEnd("page-" + pageNum);
          console.warn("Page " + pageNum + " cannot be loaded due to paywall.");
          break;
        }
        /* else, element not yet loaded... */
        continue;
      }

      const canvas = page.parentElement.querySelector("canvas");
      if (!canvas) {
        /* element not yet loaded... */
        continue;
      }

      imageAsDataURL = canvas.toDataURL(imageType);
      blank.width = canvas.width;
      blank.height = canvas.height;
      const blankData = blank.toDataURL();

      if (imageAsDataURL !== blankData) {
        /* Success! */
        console.timeEnd("page-" + pageNum);
        break;
      }
    }

    blank.remove();

    return imageAsDataURL;
  }

  /**
   * Adds two numbers together.
   *
   * @param {[int,int]} pageRange for all pages [], for start page to end page [start page, end page], from start page to end [start page]
   *
   * @param {string} bookScrollViewClassNames
   *
   * @param {string} pageBtnsScrollViewClassNames
   *
   * @return {Promise<[[pageNum, imageAsDataURL]]>}
   */
  async function getPages(
    pageRange,
    bookScrollViewClassNames = BOOK_SCROLL_VIEW_CLASS_NAMES,
    pageBtnsScrollViewClassNames = PAGE_BTNS_SCROLL_VIEW_CLASS_NAMES
  ) {
    const [minPage, maxPage] = await getPageRange();
    const startPage = pageRange[0] || minPage;
    const endPage = pageRange[1] || maxPage;

    const imagesAsDataURL = [];

    document.getElementsByClassName(bookScrollViewClassNames)[0].scrollTo(0, 0);
    document
      .getElementsByClassName(pageBtnsScrollViewClassNames)[0]
      .scrollTo(0, 0);

    await waitMs(10);

    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const imageAsDataURL = await getPageAsDataURL(pageNum);

      if (imageAsDataURL === "") {
        // no more data left
        // since we are getting pages in sequence
        console.warn(
          "Will not download page(s): " + pageNum + " through " + endPage
        );
        break;
      }

      imagesAsDataURL.push([pageNum, imageAsDataURL]);
    }

    return imagesAsDataURL;
  }

  /**
   * Clear out the head and body of a webpage.
   */
  function clearDOM() {
    document.body.innerHTML = "";
    document.body.style = "";
    document.head.innerHTML = "";
  }

  /**
   * For the page range, get the images, and then display them for printing.
   *
   * @param {imagesAsDataURL} imagesAsDataURL
   */
  function printPages(imagesAsDataURL) {
    clearDOM();

    const startpage = imagesAsDataURL[0][0];
    const endpage = imagesAsDataURL[imagesAsDataURL.length - 1][0];

    const titleElm = document.createElement("title");
    titleElm.innerHTML = "Pages " + startpage + " to " + endpage;
    document.head.append(titleElm);

    document.body.attributes = "";
    const styleElm = document.createElement("style");
    styleElm.innerHTML =
      "html { height: 100%; } body { min-height: 100%; } img { max-height: 9.5in; max-width:7in; display: block; margin: 0 auto; object-fit: contain;}";

    document.head.append(styleElm);

    const divElm = document.createElement("div");
    document.body.append(divElm);

    for (let i = 0; i < imagesAsDataURL.length; i++) {
      const divElm = document.createElement("div");
      document.body.append(divElm);

      const image = document.createElement("img");
      image.src = imagesAsDataURL[i][1];
      divElm.append(image);
    }
  }

  const imagesAsDataURL = await getPages(pageRange);

  printPages(imagesAsDataURL);

  console.log("Ready to print...");
})(PAGE_RANGE);
