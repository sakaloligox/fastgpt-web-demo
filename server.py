import os
import requests
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
import base64

# 加载环境变量
load_dotenv()

app = Flask(__name__)
CORS(app)

FASTGPT_URL = os.getenv("FASTGPT_URL")
FASTGPT_API_KEY = os.getenv("FASTGPT_API_KEY")

@app.route("/")
def index():
    return render_template("index.html")  # 模板文件应放在 templates/index.html

@app.route("/api", methods=["POST"])
def call_fastgpt():
    data = request.get_json()
    image_base64 = data.get("image", "")
    text = data.get("text", "")

    # 🚨 将图像嵌入到 messages.content 的 image_url 中，标准格式如下
    payload = {
        "model": "gpt-4-vision-preview",  # 🚨 确保你平台支持此模型
        "messages": [
            {
                "role": "user",
                "content": [
                    { "type": "text", "text": text },
                    { "type": "image_url", "image_url": { "url": image_base64 } }
                ]
            }
        ],
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
        return jsonify({"reply": f"[FastGPT 请求失败] {str(e)}\n原始返回：{err_text}"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
