import os
import requests
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv


# ✅ 加载本地环境变量
load_dotenv()

app = Flask(__name__)
CORS(app)

# ✅ 从环境变量读取密钥和地址（不再写死）
FASTGPT_URL = os.getenv("FASTGPT_URL")
FASTGPT_API_KEY = os.getenv("FASTGPT_API_KEY")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api", methods=["POST"])
def call_fastgpt():
    data = request.get_json()
    image_base64 = data.get("image", "")
    text = data.get("text", "")

    payload = {
        "model": "gpt-4",
        "messages": [
            {"role": "user", "content": text}
        ],
        "images": [image_base64],
        "stream": False
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {FASTGPT_API_KEY}"
    }

    try:
        response = requests.post(FASTGPT_URL, json=payload, headers=headers, timeout=30)
        print("FastGPT 返回原始内容：")
        print(response.text)

        result = response.json()
        reply_text = result.get("choices", [{}])[0].get("message", {}).get("content", "[无回复]")
        return jsonify({"reply": reply_text})

    except Exception as e:
        err_text = ""
        try:
            err_text = response.text
        except:
            pass
        return jsonify({"reply": f"[FastGPT 请求失败] {str(e)}\\n原始返回：{err_text}"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
