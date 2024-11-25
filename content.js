/* content.js */
/**
 * Helper function to clean up extracted text.
 * Removes excessive whitespace, line breaks, and unwanted patterns.
 *
 * @param {string} text - The raw text extracted from the webpage.
 * @returns {string} - The cleaned text.
 */
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')                      // Replace multiple spaces/newlines with a single space
    .replace(/(\r\n|\n|\r)/gm, ' ')            // Remove line breaks
    .replace(/Share this article:.*/gi, '')     // Remove "Share this article" and similar phrases
    .replace(/Read more.*$/gi, '')              // Remove "Read more" links
    .replace(/Related Articles:.*/gi, '')       // Remove "Related Articles" sections
    .trim();                                    // Trim leading and trailing whitespace
}

/**
 * Removes unwanted elements from the webpage to clean up the DOM.
 * Targets elements like navigation bars, footers, sidebars, ads, comments, etc.
 */
function removeUnwantedElements() {
  const unwantedSelectors = [
    'nav',
    'footer',
    'aside',
    '.advertisement',
    '.adsbygoogle',
    '.comments',
    '.related-posts',
    '.share-buttons',
    '.promo',
    '.newsletter-signup',
    '.modal',
    '.popup',
    '.cookie-consent',
    '.top-banner',
    '.bottom-banner'
    // Add more here during testing when we find other selectors in specific websites
  ];

  unwantedSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      element.remove();
    });
  });
}

/**
 * Extracts the main content of the article using common selectors.
 * Falls back to the entire body text if specific selectors do not match.
 *
 * @returns {string} - The extracted main content.
 */
function extractMainContent() {
  const articleSelectors = [
    'article',
    'main',
    '.post-content',
    '.entry-content',
    '#content',
    '.article-body',
    '.story-body',
    '.news-content',
    '.post-body',
    '.content-body'
    // Add more here during testing/iteration when we find other selectors in specific websites
  ];

  for (let selector of articleSelectors) {
    const articleElement = document.querySelector(selector);
    if (articleElement) {
      return cleanText(articleElement.innerText);
    }
  }

  // Fallback to entire body text if no specific article container is found
  return cleanText(document.body.innerText) || 'No readable content found on this page.';
}

/**
 * Extracts metadata such as the article title, author, and publication date.
 *
 * @returns {Object} - An object containing the metadata.
 */
function extractMetadata() {
  const metadata = {
    title: document.title || 'No title found',
    author: 'Unknown Author',
    date: 'Unknown Date',
    source: 'Unknown Source'
  };

  // Attempt to extract the author
  const authorSelectors = [
    '.author-name',
    '.byline',
    '.author',
    '[rel="author"]',
    '.article-author',
    '.writer',
    '.posted-by'
    // Add more here during testing/iteration when we find other selectors in specific websites
  ];
  for (let selector of authorSelectors) {
    const authorElement = document.querySelector(selector);
    if (authorElement) {
      metadata.author = authorElement.innerText.trim();
      break;
    }
  }

  // Attempt to extract the publication date
  const dateSelectors = [
    'time[datetime]',
    '.publish-date',
    '.pub-date',
    '.date',
    '.article-date',
    '.posted-on'
    // Add more here during testing/iteration when we find other selectors in specific websites
  ];
  for (let selector of dateSelectors) {
    const dateElement = document.querySelector(selector);
    if (dateElement) {
      metadata.date = dateElement.getAttribute('datetime') || dateElement.innerText.trim();
      break;
    }
  }

  // Attempt to extract the source/site name
  const sourceMeta = document.querySelector('meta[property="og:site_name"]');
  if (sourceMeta) {
    metadata.source = sourceMeta.getAttribute('content') || metadata.source;
  } else {
    metadata.source = window.location.hostname;
  }

  return metadata;
}

/**
 * Main function to scrape and prepare the content.
 * Removes unwanted elements, extracts main content and metadata.
 *
 * @returns {Promise<Object>} - A promise that resolves to an object containing the content and metadata.
 */
function scrapePageContent() {
  return new Promise((resolve, reject) => {
    try {
      // Remove unwanted elements from the DOM
      // removeUnwantedElements();

      // Extract main content
      const content = extractMainContent();

      // Extract metadata
      const metadata = extractMetadata();

      // Ensure that some content is found
      if (!content || content.length < 100) {
        reject('Insufficient content found to summarize.');
        return;
      }

      resolve({ content, metadata });
    } catch (error) {
      reject(`Scraping failed: ${error.message}`);
    }
  });
}



/**
 * Sends the scraped content and metadata to the backend API for summarization and alternative links.
 * Includes a robust retry mechanism with timeout and exponential backoff for error handling.
 *
 * @param {Object} scrapedData - The object containing `content` and `metadata`.
 * @returns {Promise<Object>} - The response from the backend API.
 */
function sendToBackend(scrapedData) {
  const backendUrl = "https://sumlink-a8faegbrc0hthgfy.eastus2-01.azurewebsites.net/analyze";
  const maxRetries = 15; // Maximum number of retries
  const timeoutLimit = 10000; // Timeout for fetch in milliseconds

  // Validate and align the request body structure
  const requestBody = {
    content: scrapedData?.content || "Default content",
    metadata: scrapedData?.metadata || { source: "Unknown source" },
  };

  // Fetch with timeout support
  const fetchWithTimeout = (url, options, timeout) =>
    Promise.race([
      fetch(url, options),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeout)),
    ]);

  const fetchWithRetry = (retriesLeft) => {
    console.log(`Attempting to send request. Retries left: ${retriesLeft}`);
    return fetchWithTimeout(
      backendUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
      timeoutLimit
    )
      .then((response) => {
        if (!response.ok) {
          console.warn(`Request failed with status: ${response.status} - ${response.statusText}`);
          throw new Error(`Backend error: ${response.statusText}`);
        }
        return response.json();
      })
      .catch((error) => {
        if (retriesLeft > 0) {
          console.warn(`Retrying... (${maxRetries - retriesLeft + 1}/${maxRetries}) due to: ${error.message}`);
          const delay = Math.min(2000 * 2 ** (maxRetries - retriesLeft), 15000); // Exponential backoff with max delay
          return new Promise((resolve) => setTimeout(() => resolve(fetchWithRetry(retriesLeft - 1)), delay));
        } else {
          console.error("Max retries reached. No further attempts will be made.");
          throw error; // Final failure
        }
      });
  };

  // Start the fetch with retries
  return fetchWithRetry(maxRetries);
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrape') {
    console.log("Scraping page content", request);
    scrapePageContent()
      .then((scrapedData) => {
        chrome.runtime.sendMessage({ action: 'scraped', data: scrapedData });
        // Send the scraped data to the backend
        sendToBackend(scrapedData)
          .then((backendResponse) => {
            console.log("Backend response", backendResponse);
            sendResponse({ success: true, data: backendResponse });
          });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    // Indicate that the response will be sent asynchronously
    return true;
  }
});
