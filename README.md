# Otzar-Print

Javascript in the browser to print pages from <otzar.org> (website version
around 2022-12-17).

## How to Use

1. Navigate to <https://tablet.otzar.org/> and select a book (for example:
<https://tablet.otzar.org/#/b/169812/p/1/t/1670820464770/fs/0/start/0/end/0/c>).

2. Copy the minified script `Scrape_images.v2.min.js` (contents starts with
`javascript:...`) into a text editor.

3. Choose one of the following methods:

    1. To download all pages, leave the settings as is (for example `PAGE_RANGE
    = []`)

    2. To download a range of pages, enter `[#S, #E]` where `#S` is the starting
    page, and `#E` is the ending page (for example `PAGE_RANGE = [2,27]`)

    3. To download a range of pages starting from a specific page, enter `[#S]`
    where `#S` is the starting page (for example `PAGE_RANGE = [27]`)

4. Paste the code into the URL bar of the browser

    1. For Safari, enable the `Develop` menu from the settings and then enable
    `Allow JavaScript from Smart Search Field`

5. It may take a minute for the script to run and gather all of the pages.

6. When the script finishes, the webpage should reload to show only the book
content.

7. Save the page or print it for later viewing.

## Common Failures

### The script says that it can't find the page?

Try running the script one more time.  Sometimes the webpage takes too long to
load before the script starts looking for data.

### The script stops processing pages?

The script only has access to the public data.  The script will end if it
detects a page that shows the paywall limit.

## How it works

The script uses simple automation. To find the total page numbers it scrolls
through the page list-view from top to bottom.  To get the page content it then
clicks each page button and saves the image.  Finally, the image data is
reloaded into a blank web page with CSS settings to properly display the images
so they print well.

### Project Setup

`npm i`

### Generate minified file

`npm run build`

### Run linter

`npm run lint`

### Run linter with auto fix

`npm run lint-fix`

### Fixing markdownlint -- line wrap

Example with `README.md` file:

```bash

fmt -w 80 README.md > README.md.temp; rm README.md; mv README.md.temp README.md

```
