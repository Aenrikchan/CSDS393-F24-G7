import yaml
from flask import Flask, request, jsonify
import openai
import requests
import logging
from flask_cors import CORS
import os

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

# Load configuration from file
def load_config(config_path="config.yaml"):
    with open(config_path, 'r') as file:
        return yaml.safe_load(file)

config = load_config()

# Set API keys and other parameters
openai_api_key = os.getenv('OPENAI_API_KEY', '')
bing_api_key = os.getenv('BING_API_KEY', '')
MAX_TOKENS = config.get('max_tokens', 100)
SEARCH_RESULT_COUNT = config.get('search_result_count', 5)
SEARCH_RETRY_LIMIT = config.get('search_retry_limit', 3)

openai.api_key = openai_api_key

# Graceful fallback for missing keys
if not openai.api_key:
    logging.warning("OpenAI API key is missing. Summarization functionality will be disabled.")

if not bing_api_key:
    logging.warning("Bing API key is missing. Search functionality will be disabled.")

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
<<<<<<< Updated upstream
        response = openai.Completion.create(
            engine="gpt-4",
            prompt=f"Summarize and analyze: {text}",
=======
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                "role": "system",
                "content": (
                "You are an advanced summarization and analysis assistant with expertise in processing complex information. "
                "Your primary goal is to distill lengthy or intricate texts into concise, accurate, and professional responses "
                "while extracting critical insights and identifying gaps in the content. "
                "Your analysis must reflect a deep understanding of the material, presenting clear and structured insights. "
                "The user expects a well-rounded response that balances brevity with depth, ensuring no significant details are overlooked. "
                "Focus on the following objectives: "
                "\n1. Summarize the core ideas and arguments of the text in a comprehensive yet succinct manner, ensuring that all key points, examples, and conclusions are accurately captured. "
                "Emphasize the main themes and avoid redundancy. Provide a clear understanding of the overall purpose or message of the text. "
                "\n2. Analyze the text critically, identifying key implications, strengths, weaknesses, notable trends, and patterns. "
                "Examine the author's arguments for logical consistency, coherence, and evidence-based reasoning. "
                "Highlight areas where the text excels, such as well-supported claims, innovative ideas, or clarity in presentation. "
                "Critique any areas of weakness, including overgeneralizations, biases, unsupported claims, or lack of specificity. "
                "\n3. Identify ambiguities, gaps, or missing details explicitly, providing constructive suggestions where applicable. "
                "Note any areas where the text could be more detailed, where assumptions are made without justification, or where critical information is omitted. "
                "Offer specific examples of what is missing and how it could improve the overall quality of the argument or narrative. "
                "\n4. Use professional, precise, and accessible language to communicate insights effectively. Avoid vague terms or unnecessary jargon. "
                "Write in a concise yet formal style to ensure readability and clarity for a broad audience. "
                "\n5. Avoid making unfounded assumptions or speculations—flag unclear or insufficiently detailed sections of the text instead. "
                "Provide a fair and objective assessment of the content based on the information available, clearly stating when specific details are lacking or incomplete. "
                "\n6. Structure your response with clearly delineated sections for Summary, Analysis, and Ambiguities or Missing Information. "
                "Ensure that each section is independent yet cohesive, and collectively provides a comprehensive view of the text. "
                "\n7. Include relevant context where necessary, such as connections to broader themes, historical context, or domain-specific knowledge, to enhance the depth of the analysis. "
                "If the text relates to a larger issue or trend, briefly address its significance within that context. "
                "\n8. Highlight actionable insights or takeaways from the text, especially if the content involves recommendations, strategies, or next steps. "
                "Ensure that these are clear, practical, and directly tied to the main ideas of the text. "
                "\n9. Acknowledge nuances in the text, avoiding binary judgments. If the text has competing perspectives or mixed implications, address these complexities thoughtfully. "
                "\n10. Ensure the response adheres to the requested length limits and remains focused, avoiding extraneous details or off-topic commentary. "
                "Prioritize relevance and alignment with the user's objectives."

                "Adopt the following detailed format for your responses: "
                "\n\n### Format ###"
                "\n1. **Summary**: Provide a thorough overview of the key points, ensuring all major themes are addressed. "
                "Aim for 4-6 sentences that effectively capture the essence of the text while remaining concise. "
                "\n2. **Analysis**: Offer a 4-6 sentence evaluation of the content, focusing on critical insights, strengths, weaknesses, and implications. "
                "Mention any assumptions made by the author, patterns in the data, or notable conclusions. "
                "Highlight areas where the text excels in clarity or argumentation. "
                "Mention aspects that require further elaboration or could lead to misinterpretation. Provide constructive feedback where relevant."

                )
                },
                {
                "role": "user",
                "content": f"""
                    Analyze the following text and respond in the structured format below:
                
                    Text: {text}
                
                    Instructions:
                    - Carefully read and summarize the main ideas or arguments presented in the text.
                    - Analyze the content critically, highlighting any notable patterns, implications, or conclusions.
                    - Identify gaps, ambiguities, or key details that are missing from the text.
                    - Keep the response structured and professional, adhering to the format:
                        1. **Summary**: Key points in 4-6 sentences.
                        2. **Analysis**: Critical analysis in 4-6 sentences.
                    - Be concise, precise, and insightful. Avoid exceeding 3 total sentences per section.
                """
                }
            ],
>>>>>>> Stashed changes
            max_tokens=MAX_TOKENS
        )

        # Extract the generated content from the response
        summary = response['choices'][0]['message']['content'].strip()
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
<<<<<<< Updated upstream
    Main API endpoint to analyze content and return a summary with alternative sources.
    """
    try:
        # Extract and validate input
        data = request.json
=======
    Endpoint to analyze content, summarize it, and retrieve alternative sources.
    """
    try:
        # Parse input data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid or missing JSON body'}), 400

>>>>>>> Stashed changes
        text = preprocess_text(data.get('content', ''))
        metadata = data.get('metadata', {})

        # Validate input text
        if not text:
            return jsonify({'error': 'No content provided'}), 400

<<<<<<< Updated upstream
        # Summarize content
        summary = summarize_text(text)
        
        # Search for alternative sources
        alternative_sources = search_alternative_sources(summary)

        # Return combined results
=======
        # Summarize the text
        try:
            summary = summarize_text(text)
        except Exception as e:
            logging.error(f"Error summarizing text: {e}")
            return jsonify({'error': 'Failed to summarize content'}), 500

        # Search for alternative sources
        try:
            alternative_sources = search_alternative_sources(summary) or []
        except Exception as e:
            logging.error(f"Error fetching alternative sources: {e}")
            alternative_sources = []

        # Ensure metadata is valid
        if not isinstance(metadata, dict):
            metadata = {}

        # Return the response
>>>>>>> Stashed changes
        return jsonify({
            'summary': summary,
            'metadata': metadata,
            'alternative_sources': alternative_sources
        })

    except Exception as e:
<<<<<<< Updated upstream
        logging.error(f"Error in /analyze endpoint: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=8000)
=======
        logging.error(f"Unhandled error in /analyze endpoint: {e}")
        return jsonify({'error': 'An unexpected error occurred'}), 500
>>>>>>> Stashed changes
