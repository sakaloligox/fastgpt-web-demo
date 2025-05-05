from flask import Flask, request, jsonify
from flask_cors import CORS  # ✅ 新增这行

app = Flask(__name__)
CORS(app)  # ✅ 添加这行来允许跨域访问

@app.route('/api', methods=['POST'])
def mock_fastgpt():
    data = request.get_json()
    question = data.get("question", "")
    image = data.get("image", "")
    reply_text = f"收到图像（{len(image)}字节），你问了：'{question}'，这是 FastGPT 的模拟回复～"
    return jsonify({"reply": reply_text})

if __name__ == '__main__':
    app.run(port=5000)
