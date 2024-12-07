// chrome_extension_test.js
// Test script for chrome extension popup functionality using Jest and JSDOM

const { JSDOM } = require('jsdom');

// Mock the Chrome runtime API
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn()
  },
  tabs: {
    query: jest.fn((queryInfo, callback) => {
      callback([{ id: 1, active: true }]);
    }),
    sendMessage: jest.fn((tabId, message, callback) => {
      if (message.action === 'scrape') {
        callback({ success: true, data: { summary: 'This is a test summary.', alternative_sources: [{ title: 'Example Link', url: 'http://example.com', snippet: 'Example snippet.' }] } });
      }
    })
  },
  runtime: {
    lastError: null
  }
};

// Set up the DOM using JSDOM
const setupDOM = (htmlContent) => {
  const dom = new JSDOM(htmlContent);
  global.document = dom.window.document;
  global.window = dom.window;
};

describe('Chrome Extension Popup Functions', () => {
  beforeEach(() => {
    // Set up the HTML structure for the popup
    const htmlContent = `
      <div id="metadata"></div>
      <div id="scrapedContent"></div>
      <div id="alternativeLinks"></div>
      <button id="scrapeBtn">Scrape</button>
    `;
    setupDOM(htmlContent);
  });

  test('should display metadata when receiving a scraped message', () => {
    // Mock the chrome.runtime.onMessage listener
    const onMessageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];

    // Simulate receiving a message
    onMessageListener({
      action: 'scraped',
      data: {
        metadata: {
          title: 'Test Title',
          author: 'Test Author',
          date: '2024-11-06',
          source: 'Test Source'
        }
      }
    });

    const metadataDiv = document.getElementById('metadata');
    expect(metadataDiv.innerHTML).toContain('<strong>Title:</strong> Test Title');
    expect(metadataDiv.innerHTML).toContain('<strong>Author:</strong> Test Author');
    expect(metadataDiv.innerHTML).toContain('<strong>Date:</strong> 2024-11-06');
    expect(metadataDiv.innerHTML).toContain('<strong>Source:</strong> Test Source');
  });

  test('should clear existing content and display loading animation when scrape button is clicked', () => {
    const scrapeBtn = document.getElementById('scrapeBtn');
    scrapeBtn.click();

    const scrapedContentDiv = document.getElementById('scrapedContent');
    expect(scrapedContentDiv.innerHTML).toContain('Loading...');
  });

  test('should display summary and alternative links after scraping', () => {
    const scrapeBtn = document.getElementById('scrapeBtn');
    scrapeBtn.click();

    // Simulate the response from the content script
    chrome.tabs.sendMessage.mock.calls[0][2]({
      success: true,
      data: {
        summary: 'This is a test summary.',
        alternative_sources: [
          { title: 'Example Link', url: 'http://example.com', snippet: 'Example snippet.' }
        ]
      }
    });

    const scrapedContentDiv = document.getElementById('scrapedContent');
    expect(scrapedContentDiv.textContent).toBe('This is a test summary.');

    const linksDiv = document.getElementById('alternativeLinks');
    expect(linksDiv.innerHTML).toContain('<a href="http://example.com" target="_blank">Example Link</a>');
    expect(linksDiv.innerHTML).toContain('Example snippet.');
  });

  test('should handle error response when scraping fails', () => {
    const scrapeBtn = document.getElementById('scrapeBtn');
    scrapeBtn.click();

    // Simulate an error response from the content script
    chrome.tabs.sendMessage.mock.calls[0][2]({
      success: false,
      error: 'Failed to scrape content.'
    });

    const scrapedContentDiv = document.getElementById('scrapedContent');
    expect(scrapedContentDiv.textContent).toBe('Error: Failed to scrape content.');
  });

  test('should toggle alternative links visibility when button is clicked', () => {
    const scrapeBtn = document.getElementById('scrapeBtn');
    scrapeBtn.click();

    // Simulate the response from the content script
    chrome.tabs.sendMessage.mock.calls[0][2]({
      success: true,
      data: {
        summary: 'This is a test summary.',
        alternative_sources: [
          { title: 'Example Link', url: 'http://example.com', snippet: 'Example snippet.' }
        ]
      }
    });

    const linksDiv = document.getElementById('alternativeLinks');
    const showLinksButton = linksDiv.querySelector('button');
    expect(showLinksButton).not.toBeNull();
    expect(showLinksButton.textContent).toBe('Get Alternative Links');

    // Click to show links
    showLinksButton.click();
    expect(linksDiv.querySelector('div').style.display).toBe('block');
    expect(showLinksButton.textContent).toBe('Hide Alternative Links');

    // Click to hide links
    showLinksButton.click();
    expect(linksDiv.querySelector('div').style.display).toBe('none');
    expect(showLinksButton.textContent).toBe('Show Alternative Links');
  });
});