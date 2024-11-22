document.getElementById('analyzeButton').addEventListener('click', () => {
  // get current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // send scrape to content.js
    chrome.tabs.sendMessage(tabs[0].id, { action: 'scrape' }, (response) => {
      if (response.success) {
        // show the result from backend
        document.getElementById('summary').textContent = response.data.summary;
        document.getElementById('metadata').textContent = JSON.stringify(response.data.metadata, null, 2);
      } else {
        // show error message
        document.getElementById('error').textContent = `Error: ${response.error}`;
      }
    });
  });
});
