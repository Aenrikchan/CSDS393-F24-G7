// popup.js

document.getElementById('scrapeBtn').addEventListener('click', () => {
    // Query the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
  
      // Send a message to the content script to start scraping
      chrome.tabs.sendMessage(activeTab.id, { action: 'scrape' }, (response) => {
        if (chrome.runtime.lastError) {
          // Handle errors (e.g., content script not found)
          document.getElementById('scrapedContent').textContent = 'Error: ' + chrome.runtime.lastError.message;
          return;
        }
  
        if (response.success) {
          // Display the scraped content
          const { content, metadata } = response.data;
          document.getElementById('scrapedContent').textContent = content;
  
          // Display the metadata
          const metadataDiv = document.getElementById('metadata');
          metadataDiv.innerHTML = `
            <p><strong>Title:</strong> ${metadata.title}</p>
            <p><strong>Author:</strong> ${metadata.author}</p>
            <p><strong>Date:</strong> ${metadata.date}</p>
            <p><strong>Source:</strong> ${metadata.source}</p>
          `;
        } else {
          // Display the error message
          document.getElementById('scrapedContent').textContent = 'Error: ' + response.error;
        }
      });
    });
  });
  