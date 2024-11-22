from flask import Flask, request, jsonify
from flask_cors import CORS  # 导入 CORS

app = Flask(__name__)
CORS(app)  # 启用 CORS

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    if not data:
        return jsonify({"error": "No data received"}), 400

    # 模拟分析结果
    return jsonify({
        "summary": "This is a mocked summary for testing.",
        "metadata": data.get("metadata", {})
    })

if __name__ == '__main__':
    app.run(port=5000)
