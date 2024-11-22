// popup.js
// This function is used to toggle the visibility of a div element in the HTML.
// This function toggles the visibility of a div element in the HTML.
function toggleDivVisibility(divId) {
    const div = document.getElementById(divId);
    if (!div) {
        console.error(`Div with ID "${divId}" not found.`);
        return;
    }
    div.style.display = (div.style.display === "none") ? "block" : "none";
}

// This function updates the URL list in the HTML with clickable links for each URL provided.
function updateURL(urls) {
    const urlList = document.getElementById('urlList');
    if (!urlList) {
        console.error("URL list element not found.");
        return;
    }

    urlList.innerHTML = ''; // Clear existing content

    urls.forEach(url => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');

        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = url;

        listItem.appendChild(link);
        urlList.appendChild(listItem);
    });
}

// Example usage of updateURL
const exampleURLs = [
    'https://www.npr.org/',
    'https://www.bbc.com/news',
    'https://www.cnn.com'
];
updateURL(exampleURLs);

// Wait for the DOM content to load before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
    const analyzeButton = document.getElementById('analyzeButton');
    const errorElement = document.getElementById('error');
    const summaryElement = document.getElementById('summary');
    const metadataElement = document.getElementById('metadata');

    // Check if the required elements exist
    if (!analyzeButton) {
        console.error("Analyze button not found. Please check your popup.html.");
        return;
    }
    if (!errorElement || !summaryElement || !metadataElement) {
        console.error("Required elements (error, summary, metadata) not found in popup.html.");
        return;
    }

    // Add click event listener to the Analyze button
    analyzeButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            // Send a message to the content script
            chrome.tabs.sendMessage(tabs[0].id, { action: 'scrape' }, (response) => {
                if (chrome.runtime.lastError) {
                    // Handle runtime errors (e.g., content script not found)
                    errorElement.textContent = `Error: ${chrome.runtime.lastError.message}`;
                    console.error(`Runtime error: ${chrome.runtime.lastError.message}`);
                    return;
                }

                if (response && response.success) {
                    // Display the summary
                    if (response.data && response.data.summary) {
                        summaryElement.textContent = response.data.summary;
                    } else {
                        summaryElement.textContent = "No summary available.";
                        console.warn("Response does not contain summary data.");
                    }

                    // Display the metadata
                    if (response.data && response.data.metadata) {
                        metadataElement.textContent = JSON.stringify(response.data.metadata, null, 2);
                    } else {
                        metadataElement.textContent = "No metadata available.";
                        console.warn("Response does not contain metadata data.");
                    }
                } else {
                    // Display an error message if response is unsuccessful
                    errorElement.textContent = `Error: ${response ? response.error : "No response received."}`;
                    console.error("Error in response:", response);
                }
            });
        });
    });
});
