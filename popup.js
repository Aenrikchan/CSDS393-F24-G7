// popup.js
// This function is used to toggle the visibility of a div element in the HTML.
function toggleDivVisibility(divId) {
    const div = document.getElementById(divId);
    if (!div) {
        console.error(`Div with ID "${divId}" not found.`);
        return;
    }
    if (div.style.display === "none") {
        div.style.display = "block"; // Show the div
    } else {
        div.style.display = "none"; // Hide the div
    }
}

// This function updates the URL list in the HTML with clickable links for each URL provided.
function updateURL(urls) {
    const urlList = document.getElementById('urlList'); // Select the <ul> element
    if (!urlList) {
        console.error("URL list element not found.");
        return;
    }

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

// Example usage of updateURL
const urls = [
    'https://www.npr.org/',
    'https://www.bbc.com/news',
    'https://www.cnn.com'
];
updateURL(urls);

// Wait for DOM content to load before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
    const analyzeButton = document.getElementById('analyzeButton');

    if (!analyzeButton) {
        console.error("Analyze button not found. Please check your popup.html.");
        return;
    }

    // Add click event listener to the Analyze button
    analyzeButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            // Send a message to the content script
            chrome.tabs.sendMessage(tabs[0].id, { action: 'scrape' }, (response) => {
                if (chrome.runtime.lastError) {
                    // Handle runtime errors (e.g., content script not found)
                    document.getElementById('error').textContent = `Error: ${chrome.runtime.lastError.message}`;
                    console.error(`Runtime error: ${chrome.runtime.lastError.message}`);
                    return;
                }

                if (response && response.success) {
                    // Display summary and metadata from the response
                    const summaryElement = document.getElementById('summary');
                    const metadataElement = document.getElementById('metadata');
                    if (summaryElement) {
                        summaryElement.textContent = response.data.summary;
                    } else {
                        console.error("Summary element not found.");
                    }
                    if (metadataElement) {
                        metadataElement.textContent = JSON.stringify(response.data.metadata, null, 2);
                    } else {
                        console.error("Metadata element not found.");
                    }
                } else {
                    // Display error message if response is unsuccessful
                    const errorElement = document.getElementById('error');
                    if (errorElement) {
                        errorElement.textContent = `Error: ${response ? response.error : "No response received."}`;
                    } else {
                        console.error("Error element not found.");
                    }
                }
            });
        });
    });
});
