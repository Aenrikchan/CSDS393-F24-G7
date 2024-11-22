// popup.js
//this function is use to hide/displlay a block of div in html(intended to use for Alternative news link)
function toggleDivVisibility(divId) {
  const div = document.getElementById(divId);
  if (div.style.display === "none") {
      div.style.display = "block"; // Show the div
  } else {
      div.style.display = "none"; // Hide the div
  }
}

//input a list of url and it will modify the html to show clickable link for each url. 
function updateURL(urls) {
  const urlList = document.getElementById('urlList'); // Select the <ul> element
  urlList.innerHTML = ''; // Clear existing content

  // Loop through the URLs array and create list items
  urls.forEach(url => {
      const listItem = document.createElement('li'); // Create a new <li>
      const link = document.createElement('a'); // Create a new <a> tag

      link.href = url; // Set the URL
      link.target = '_blank'; // Open in a new tab
      link.rel = 'noopener noreferrer'; // Add security attributes
      link.textContent = url; // Display the URL as the link text

      listItem.appendChild(link); // Append the <a> tag to the <li>
      urlList.appendChild(listItem); // Append the <li> to the <ul>
  });
}

// Example Usage of p
const urls = [
  'https://www.npr.org/',
  'https://www.bbc.com/news',
  'https://www.cnn.com'
];
updateURL(urls);



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