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
    .replace(/Share this article:.*/gi, '')    // Remove "Share this article" and similar phrases
    .replace(/Read more.*$/gi, '')             // Remove "Read more" links
    .replace(/Related Articles:.*/gi, '')      // Remove "Related Articles" sections
    .trim();                                   // Trim leading and trailing whitespace
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
      removeUnwantedElements();

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
 * Sends the scraped content to the local Flask server for processing.
 *
 * @param {string} content - The scraped content.
 * @param {Object} metadata - The extracted metadata.
 * @returns {Promise<Object>} - A promise that resolves to the server's response.
 */
async function sendToAzure(content, metadata) {
  try {
    console.log("Sending data to local server:", { content, metadata });

    // Replace Azure URL with local server URL
    const response = await fetch('http://127.0.0.1:5000/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, metadata }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse and return JSON response
    const data = await response.json();
    console.log('Local server response data:', data);
    return data;
  } catch (error) {
    console.error("Error sending data to local server:", error.message);
    throw error;
  }
}



// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrape') {
    scrapePageContent()
      .then(result => {
        // Log successful scraping
        console.log('Scraped content and metadata:', result);

        // Send the data to Azure for further processing
        return sendToAzure(result.content, result.metadata);
      })
      .then(response => {
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        console.error('Error in processing:', error);
        sendResponse({ success: false, error: error.message });
      });

    // Indicate that the response will be sent asynchronously
    return true;
  }
});

