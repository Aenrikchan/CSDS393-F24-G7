# News Content Analyzer

A browser extension that helps users quickly understand news articles by providing automatic summaries and relevant alternative sources.

## Features

- **Content Extraction**: Automatically extracts main content from news articles while filtering out advertisements, navigation elements, and other distracting content
- **Metadata Collection**: Captures important article information including:
  - Title
  - Author
  - Publication Date
  - Source Website
- **Article Summarization**: Provides concise summaries of article content
- **Alternative Sources**: Suggests related articles from different sources for a more comprehensive view of the topic
- **Clean Interface**: Simple popup interface with easy-to-use controls

## Technical Components

### Frontend (Browser Extension)

The extension consists of three main components:

1. **Content Script (content.js)**
   - Handles DOM manipulation and content extraction
   - Implements smart text cleaning and formatting
   - Manages communication with the backend API
   - Features robust error handling and retry mechanisms

2. **Popup Interface (popup.html & popup.js)**
   - Provides user interface for interaction
   - Displays article metadata
   - Shows article summaries
   - Manages alternative links display
   - Implements loading states and error handling

3. **Background Script**
   - Manages cross-script communication
   - Handles browser extension events

### Backend API

The backend service (hosted at Azure) provides:
- Content analysis and summarization
- Related article discovery
- API endpoint for content processing

## Installation

1. Clone this repository
```bash
git clone [repository-url]
```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

## Usage

1. Navigate to any news article
2. Click the extension icon in your browser
3. Click "Analyze Page" to process the article
4. View the article summary and metadata
5. Click "Get Alternative Links" to see related articles

## API Reference

The extension communicates with the backend API:

**Endpoint**: `https://sumlink-a8faegbrc0hthgfy.eastus2-01.azurewebsites.net/analyze`

**Request Format**:
```json
{
  "content": "Article content string",
  "metadata": {
    "title": "Article title",
    "author": "Author name",
    "date": "Publication date",
    "source": "Source website"
  }
}
```

**Response Format**:
```json
{
  "summary": "Generated summary string",
  "alternative_sources": [
    {
      "title": "Related article title",
      "url": "Article URL",
      "snippet": "Brief description"
    }
  ]
}
```

## Error Handling

The extension implements robust error handling:
- Automatic retry mechanism for failed API calls
- Exponential backoff strategy
- Timeout handling
- Graceful fallbacks for content extraction
- User-friendly error messages

## Development

### Key Files
- `content.js`: Content extraction and API communication
- `popup.html`: Extension popup interface
- `popup.js`: Popup interface logic and event handling

### Testing
Test the extension with various news websites to ensure compatibility. The content extraction selectors are designed to work with common news site layouts.

## Future Enhancements

Planned features and improvements:
- Support for more news sources
- Enhanced summarization algorithms
- Additional metadata extraction
- Improved user interface
- Offline functionality
- Customizable summary length
- Support for different languages
