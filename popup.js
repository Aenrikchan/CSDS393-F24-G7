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
    const scrapedContentDiv = document.getElementById('scrapedContent');
    const linksDiv = document.getElementById('alternativeLinks');

    // Clear existing content
    scrapedContentDiv.innerHTML = '';
    linksDiv.innerHTML = '';

    // Add "Loading" with dots
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';

    const loadingText = "Loading...";
    for (let char of loadingText) {
        const span = document.createElement('span');
        span.textContent = char;
        loadingDiv.appendChild(span);
    }

    scrapedContentDiv.appendChild(loadingDiv);

    // Query the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];

        // start scraping
        chrome.tabs.sendMessage(activeTab.id, { action: 'scrape' }, (response) => {
            if (chrome.runtime.lastError) {
                scrapedContentDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
                return;
            }
            if (response && !response.success) {
                scrapedContentDiv.textContent = 'Error: ' + response.error;
                return;
            }
            if (response && response.success) {
                const { summary = "No summary available.", alternative_sources = [] } = response.data;

                // Remove loading animation
                scrapedContentDiv.innerHTML = '';
                scrapedContentDiv.textContent = summary;

                // Display alternative links if available
                if (Array.isArray(alternative_sources) && alternative_sources.length > 0) {
                    // Create a wrapper for header and links
                    const linksWrapper = document.createElement('div');
                    linksWrapper.style.display = 'none'; // Hide initially

                    const header = document.createElement('h3');
                    header.textContent = 'Alternative Links:';
                    linksWrapper.appendChild(header);

                    alternative_sources.forEach((link) => {
                        const linkElement = document.createElement('p');
                        linkElement.innerHTML = `<a href="${link.url}" target="_blank">${link.title}</a>: ${link.snippet}`;
                        linksWrapper.appendChild(linkElement);
                    });

                    linksDiv.appendChild(linksWrapper);

                    // Create "Show/Hide Links" button
                    const showLinksButton = document.createElement('button');
                    showLinksButton.textContent = 'Get Alternative Links';
                    showLinksButton.style.marginTop = '10px';
                    showLinksButton.style.padding = '10px';
                    showLinksButton.style.backgroundColor = '#4CAF50';
                    showLinksButton.style.color = 'white';
                    showLinksButton.style.border = 'none';
                    showLinksButton.style.cursor = 'pointer';

                    showLinksButton.addEventListener('click', () => {
                        // Toggle visibility of the links wrapper
                        if (linksWrapper.style.display === 'none') {
                            linksWrapper.style.display = 'block';
                            showLinksButton.textContent = 'Hide Alternative Links';
                        } else {
                            linksWrapper.style.display = 'none';
                            showLinksButton.textContent = 'Show Alternative Links';
                        }
                    });

                    linksDiv.appendChild(showLinksButton);
                } else {
                    linksDiv.innerHTML = '<p>No alternative links available.</p>';
                }
            } else {
                scrapedContentDiv.textContent = 'Error: Unknown error.';
            }
        });
    });
});