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
   * @return {Promise<[int, int]>} [First page, Last page]
   */
  async function getPageRange() {
    document
      .getElementsByClassName(BOOK_SCROLL_VIEW_CLASS_NAMES)[0]
      .scrollTo(0, 0);
    document
      .getElementsByClassName(PAGE_BTNS_SCROLL_VIEW_CLASS_NAMES)[0]
      .scrollTo(0, 0);
    await waitMs(10);

    const pages = new Set();

    const buttonHeightPx = Number(
      document.getElementsByClassName(PAGE_BUTTONS_CLASS_NAME)[0].offsetHeight
    );
    const scrollbyPx = NUM_ELEMS_TO_SCROLL * buttonHeightPx;

    const scrollViewElm = document.getElementsByClassName(
      PAGE_BTNS_SCROLL_VIEW_CLASS_NAMES
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
          TIME_BETWEEN_SCROLL_MS,
          scrollViewElm,
          scrollToPx
        );
      });

      /* set this in a timeout to allow drawing to run */
      await new Promise((resolve) => {
        setTimeout(function () {
          const elms = document.querySelectorAll(
            "[" + PAGE_NUMBER_ATTRIBUTE_NAME + "]"
          );
          for (let i = 0; i < elms.length; i++) {
            pages.add(Number(elms[i].getAttribute(PAGE_NUMBER_ATTRIBUTE_NAME)));
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
   * @param {pageRange} pageRange for all pages [], for start page to end page [start page, end page], from start page to end [start page]
   *
   * @return {Promise<[imagesAsDataURL]>}
   */
  async function getPages(pageRange) {
    const [minPage, maxPage] = await getPageRange();
    const startpage = pageRange[0] || minPage;
    const endpage = pageRange[1] || maxPage;

    const imagesAsDataURL = [];

    document
      .getElementsByClassName(BOOK_SCROLL_VIEW_CLASS_NAMES)[0]
      .scrollTo(0, 0);
    document
      .getElementsByClassName(PAGE_BTNS_SCROLL_VIEW_CLASS_NAMES)[0]
      .scrollTo(0, 0);

    await waitMs(10);

    for (let i = startpage; i <= endpage; i++) {
      const pageBtn = document.querySelector(
        "[" + PAGE_NUMBER_ATTRIBUTE_NAME + '="' + i + '"]'
      );
      if (pageBtn) {
        console.time("page-" + i);

        await new Promise(async (resolve) => {
          console.log("Downloading page: " + i);

          let attempts = 0;
          const blank = document.createElement("canvas");
          pageBtn.click();
          while (true) {
            attempts++;
            if (attempts >= MAX_ATTEMPTS) {
              console.error("Unable to download page: " + i);
              break;
            }

            await waitMs(TIME_BEFORE_PAGE_DOWNLOADS_MS);

            const page = document.querySelector(
              "[" + CANVAS_PAGE_NUMBER_ATTRIBUTE_NAME + '="' + i + '"]'
            );

            if (!page) {
              if (
                document.getElementsByClassName("limited-container").length > 0
              ) {
                /* the page can't be loaded... */
                console.timeEnd("page-" + i);
                i = endpage;
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

            const imageAsDataURL = canvas.toDataURL(IMAGE_TYPE);
            blank.width = canvas.width;
            blank.height = canvas.height;
            const blankData = blank.toDataURL();

            if (imageAsDataURL !== blankData) {
              imagesAsDataURL.push([i, imageAsDataURL]);
              break;
            }
          }

          blank.remove();

          resolve();
        });

        console.timeEnd("page-" + i);
      } else {
        throw new Error("Unable to find page: " + i);
      }
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
