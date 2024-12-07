import pytest
from unittest.mock import patch, mock_open
from app import app, load_config, preprocess_text, summarize_text, search_alternative_sources
import requests_mock
import os

@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

# Test configuration loading
def test_load_config():
    mock_yaml_content = """
    max_tokens: 150
    search_result_count: 5
    search_retry_limit: 3
    """
    with patch("builtins.open", mock_open(read_data=mock_yaml_content)):
        config = load_config("config.yaml")
        assert config['max_tokens'] == 150
        assert config['search_result_count'] == 5
        assert config['search_retry_limit'] == 3

    # Test missing file scenario
    with patch("builtins.open", side_effect=FileNotFoundError()):
        config = load_config("non_existent.yaml")
        assert config == {}

# Test preprocess_text function
def test_preprocess_text():
    text = "   This is a test text.   "
    assert preprocess_text(text) == "This is a test text."

# Test summarize_text function
def test_summarize_text():
    # Mocking OpenAI API response
    with patch("openai.ChatCompletion.create") as mock_openai:
        mock_openai.return_value = {
            'choices': [
                {'message': {'content': 'This is a summary.'}}
            ]
        }
        summary = summarize_text("This is a test text.")
        assert summary == "This is a summary."

    # Test when API response is empty
    with patch("openai.ChatCompletion.create", return_value={'choices': [{'message': {'content': ''}}]}):
        with pytest.raises(ValueError):
            summarize_text("This is a test text.")

# Test search_alternative_sources function
def test_search_alternative_sources():
    with requests_mock.Mocker() as m:
        mock_response = {
            "webPages": {
                "value": [
                    {"name": "Example Title", "url": "http://example.com", "snippet": "Example snippet."}
                ]
            }
        }
        m.get("https://api.bing.microsoft.com/v7.0/search", json=mock_response)

        result = search_alternative_sources("test query")
        assert len(result) == 1
        assert result[0]['title'] == "Example Title"
        assert result[0]['url'] == "http://example.com"
        assert result[0]['snippet'] == "Example snippet."

# Mock OpenAI and Bing API responses for testing purposes
def mock_openai_chat_completion(*args, **kwargs):
    return {
        'choices': [
            {'message': {'content': 'This is a mocked summary.'}}
        ]
    }

def mock_bing_search(*args, **kwargs):
    return {
        "webPages": {
            "value": [
                {"name": "Example Title", "url": "http://example.com", "snippet": "Example snippet."}
            ]
        }
    }

# Test /analyze endpoint
def test_analyze_content(client):
    with patch("app.summarize_text", return_value="This is a mocked summary."):
        with patch("app.search_alternative_sources", return_value=[
            {"title": "Example Title", "url": "http://example.com", "snippet": "Example snippet."}
        ]):
            response = client.post('/analyze', json={
                'content': 'This is a test text.',
                'metadata': {'author': 'test_author'}
            })
            assert response.status_code == 200
            json_data = response.get_json()
            assert json_data['summary'] == "This is a mocked summary."
            assert json_data['metadata'] == {'author': 'test_author'}
            assert len(json_data['alternative_sources']) == 1
            assert json_data['alternative_sources'][0]['title'] == "Example Title"

# Test /analyze endpoint with missing content
def test_analyze_content_missing(client):
    response = client.post('/analyze', json={})
    assert response.status_code == 400
    assert response.get_json()['error'] == 'No content provided'

# Test /analyze endpoint with invalid JSON
def test_analyze_content_invalid_json(client):
    response = client.post('/analyze', data="invalid json")
    assert response.status_code == 400
    assert response.get_json()['error'] == 'Invalid or missing JSON body'

# Test environment variables fallback
def test_environment_variables():
    with patch.dict(os.environ, {'OPENAI_API_KEY': '', 'BING_API_KEY': ''}):
        openai_api_key = os.getenv('OPENAI_API_KEY', '')
        bing_api_key = os.getenv('BING_API_KEY', '')
        assert openai_api_key == ''
        assert bing_api_key == '' 