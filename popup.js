// popup.js
document.getElementById('analyzeButton').addEventListener('click', () => {
  // get current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // send scape information to content.js
    chrome.tabs.sendMessage(tabs[0].id, { action: 'scrape' }, (response) => {
      if (response.success) {
        // show the output return from backend
        document.getElementById('summary').textContent = response.data.summary;
        document.getElementById('metadata').textContent = JSON.stringify(response.data.metadata, null, 2);
      } else {
        // show message error
        document.getElementById('error').textContent = `Error: ${response.error}`;
      }
    });
  });
})