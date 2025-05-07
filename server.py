import os
import requests
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

FASTGPT_URL = os.getenv("FASTGPT_URL")
FASTGPT_API_KEY = os.getenv("FASTGPT_API_KEY")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api", methods=["POST"])

def call_fastgpt():
    data = request.get_json()
    messages = data.get("messages", [])
    chat_id = data.get("chatId")  # ✅ 注意名称为 chatId（不是 thread_id）

    payload = {
        "model": "gpt-4-vision-preview",
        "chatId": chat_id,  # ✅ FastGPT 官方接口参数
        "messages": messages,
        "stream": False
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {FASTGPT_API_KEY}"
    }

    try:
        response = requests.post(FASTGPT_URL, json=payload, headers=headers, timeout=30)
        result = response.json()
        reply_text = result.get("choices", [{}])[0].get("message", {}).get("content", "[No reply]")
        new_chat_id = result.get("chat_id") or chat_id  # ✅ 捕获返回的新 chat_id
        return jsonify({
            "reply": reply_text,
            "chatId": new_chat_id
        })

    except Exception as e:
        return jsonify({"reply": f"[FastGPT 请求失败] {str(e)}"})



if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
