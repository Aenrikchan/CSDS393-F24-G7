chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scraped') {
        console.log("Scraped", request);
        const { metadata = {}} = request.data;
        // Display metadata
        const metadataDiv = document.getElementById('metadata');
        metadataDiv.innerHTML = `
                                <p><strong>Title:</strong> ${metadata.title || 'Unknown Title'}</p>
                                <p><strong>Author:</strong> ${metadata.author || 'Unknown Author'}</p>
                                <p><strong>Date:</strong> ${metadata.date || 'Unknown Date'}</p>
                                <p><strong>Source:</strong> ${metadata.source || 'Unknown Source'}</p>
                            `;

    }
});

document.getElementById('scrapeBtn').addEventListener('click', () => {
    // Query the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];

        // Send a message to the content script to start scraping
        chrome.tabs.sendMessage(activeTab.id, { action: 'scrape' }, (response) => {
            console.log("Response", response);
            if (chrome.runtime.lastError) {
                document.getElementById('scrapedContent').textContent = 'Error: ' + chrome.runtime.lastError.message;
                return;
            }
            if (response && !response.success) {
                document.getElementById('scrapedContent').textContent = 'Error: ' + response.error;
                return;
            }
            if (response && response.success) {
                // Display the summarized content and alternative sources
                const { summary = "No summary available.", alternative_sources = [] } = response.data;


                // Display summarized content
                const contentDiv = document.getElementById('scrapedContent');
                contentDiv.textContent = summary;

                // Display alternative links
                const linksDiv = document.getElementById('alternativeLinks');
                if (Array.isArray(alternative_sources) && alternative_sources.length > 0) {
                    linksDiv.innerHTML = '<h3>Alternative Links:</h3>';
                    alternative_sources.forEach((link) => {
                        const linkElement = document.createElement('p');
                        linkElement.innerHTML = `<a href="${link.url}" target="_blank">${link.title}</a>: ${link.snippet}`;
                        linksDiv.appendChild(linkElement);
                    });
                } else {
                    linksDiv.innerHTML += '<p>No alternative links available.</p>';
                }
                return;
            }
            document.getElementById('scrapedContent').textContent = 'Error: Unknown error.';
        });
    });
});