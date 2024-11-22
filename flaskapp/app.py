import yaml
from flask import Flask, request, jsonify
import openai
import requests
import logging
from datetime import datetime

app = Flask(__name__)

# Load configuration from file
def load_config(config_path="config.yaml"):
    with open(config_path, 'r') as file:
        return yaml.safe_load(file)

config = load_config()

# Set API keys and other parameters
openai.api_key = config['openai_api_key']
bing_api_key = config['bing_api_key']
MAX_TOKENS = config['max_tokens']
SEARCH_RESULT_COUNT = config['search_result_count']
SEARCH_RETRY_LIMIT = config['search_retry_limit']

log_level = getattr(logging, config.get('log_level', 'INFO').upper(), logging.INFO)
logging.basicConfig(level=log_level, format='%(asctime)s - %(levelname)s - %(message)s')

def preprocess_text(text):
    """
    Preprocess input text to remove noise and unnecessary elements.
    """
    return text.strip()

def summarize_text(text):
    """
    Use OpenAI GPT to summarize the given text.
    """
    try:
        response = openai.Completion.create(
            engine="gpt-4",
            prompt=f"Summarize and analyze: {text}",
            max_tokens=MAX_TOKENS
        )
        summary = response.get('choices', [{}])[0].get('text', '').strip()
        if not summary:
            raise ValueError("Empty summary returned by GPT.")
        return summary
    except Exception as e:
        logging.error(f"GPT summarization error: {e}")
        raise

def search_alternative_sources(query, retry_count=0):
    """
    Use Bing Search API to find alternative sources for the given query.
    Implements retries for robustness.
    """
    if retry_count >= SEARCH_RETRY_LIMIT:
        logging.error(f"Search retry limit reached for query: {query}")
        return []

    search_url = "https://api.bing.microsoft.com/v7.0/search"
    headers = {"Ocp-Apim-Subscription-Key": bing_api_key}
    params = {"q": query, "count": SEARCH_RESULT_COUNT, "safeSearch": "Strict"}

    try:
        response = requests.get(search_url, headers=headers, params=params)
        response.raise_for_status()
        search_results = response.json()

        links = [
            {
                "title": result.get("name"),
                "url": result.get("url"),
                "snippet": result.get("snippet")
            }
            for result in search_results.get("webPages", {}).get("value", [])
        ]

        # Filter duplicates and irrelevant links
        unique_links = {link['url']: link for link in links}.values()
        return list(unique_links)

    except requests.RequestException as e:
        logging.warning(f"Search API request failed: {e}, retrying...")
        return search_alternative_sources(query, retry_count + 1)

@app.route('/analyze', methods=['POST'])
def analyze_content():
    """
    Main API endpoint to analyze content and return a summary with alternative sources.
    """
    try:
        # Extract and validate input
        data = request.json
        text = preprocess_text(data.get('content', ''))
        metadata = data.get('metadata', {})
        
        if not text:
            return jsonify({'error': 'No content provided'}), 400

        # Summarize content
        summary = summarize_text(text)
        
        # Search for alternative sources
        alternative_sources = search_alternative_sources(summary)

        # Return combined results
        return jsonify({
            'summary': summary,
            'metadata': metadata,
            'alternative_sources': alternative_sources
        })

    except Exception as e:
        logging.error(f"Error in /analyze endpoint: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=8000)
