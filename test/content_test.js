// content_test.js
// Test script for content.js using Jest

const { JSDOM } = require('jsdom');
const { cleanText, removeUnwantedElements, extractMainContent, extractMetadata, scrapePageContent } = require('./content');

// Mock document and window for DOM manipulation
const setupDOM = (htmlContent) => {
  const dom = new JSDOM(htmlContent);
  global.document = dom.window.document;
  global.window = dom.window;
};

describe('Content Cleanup Functions', () => {
  test('cleanText should remove excessive whitespace and unwanted patterns', () => {
    const rawText = `  This is a   test.\n\nShare this article: Something\nRelated Articles: Other links `;
    const cleanedText = cleanText(rawText);
    expect(cleanedText).toBe('This is a test.');
  });
});

describe('DOM Manipulation Functions', () => {
  test('removeUnwantedElements should remove unwanted elements from the DOM', () => {
    const htmlContent = `
      <body>
        <nav>Navigation Bar</nav>
        <div class="content-body">Main Content</div>
        <footer>Footer</footer>
        <div class="advertisement">Ad Content</div>
      </body>
    `;
    setupDOM(htmlContent);
    removeUnwantedElements();
    expect(document.querySelector('nav')).toBeNull();
    expect(document.querySelector('footer')).toBeNull();
    expect(document.querySelector('.advertisement')).toBeNull();
    expect(document.querySelector('.content-body')).not.toBeNull();
  });

  test('extractMainContent should extract main content from common article selectors', () => {
    const htmlContent = `
      <body>
        <div class="post-content">This is the main article content.</div>
        <div class="sidebar">Sidebar content</div>
      </body>
    `;
    setupDOM(htmlContent);
    const mainContent = extractMainContent();
    expect(mainContent).toBe('This is the main article content.');
  });

  test('extractMainContent should fall back to body content if no main selectors match', () => {
    const htmlContent = `
      <body>
        <div>No specific article tag here, just body text.</div>
      </body>
    `;
    setupDOM(htmlContent);
    const mainContent = extractMainContent();
    expect(mainContent).toBe('No specific article tag here, just body text.');
  });

  test('extractMetadata should extract metadata like title, author, and date', () => {
    const htmlContent = `
      <head>
        <title>Test Article</title>
        <meta property="og:site_name" content="Test Site" />
      </head>
      <body>
        <div class="author">John Doe</div>
        <time datetime="2024-10-25">October 25, 2024</time>
      </body>
    `;
    setupDOM(htmlContent);
    const metadata = extractMetadata();
    expect(metadata.title).toBe('Test Article');
    expect(metadata.author).toBe('John Doe');
    expect(metadata.date).toBe('2024-10-25');
    expect(metadata.source).toBe('Test Site');
  });

  test('extractMetadata should use fallback values if metadata is not found', () => {
    const htmlContent = `<body><div>No metadata here.</div></body>`;
    setupDOM(htmlContent);
    const metadata = extractMetadata();
    expect(metadata.title).toBe('No title found');
    expect(metadata.author).toBe('Unknown Author');
    expect(metadata.date).toBe('Unknown Date');
    expect(metadata.source).toBe(global.window.location.hostname);
  });
});

describe('Page Scraping Function', () => {
  test('scrapePageContent should resolve with content and metadata', async () => {
    const htmlContent = `
      <head>
        <title>Test Article</title>
      </head>
      <body>
        <div class="post-content">This is the main article content.</div>
        <div class="author">John Doe</div>
        <time datetime="2024-10-25">October 25, 2024</time>
      </body>
    `;
    setupDOM(htmlContent);

    const scrapedData = await scrapePageContent();
    expect(scrapedData.content).toBe('This is the main article content.');
    expect(scrapedData.metadata.title).toBe('Test Article');
    expect(scrapedData.metadata.author).toBe('John Doe');
    expect(scrapedData.metadata.date).toBe('2024-10-25');
  });

  test('scrapePageContent should reject if insufficient content is found', async () => {
    const htmlContent = `<body><div>Short content</div></body>`;
    setupDOM(htmlContent);

    await expect(scrapePageContent()).rejects.toBe('Insufficient content found to summarize.');
  });
});