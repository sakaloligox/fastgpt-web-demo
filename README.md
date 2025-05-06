# FastGPT Web Demo

This is a multimodal web demo that allows users to interact with a large language model (LLM) via image and voice input. It leverages the [FastGPT](https://github.com/labring/FastGPT) platform for knowledge base construction and API access, and is deployed to the public internet via Render.

## 🔧 Project Overview

- 💬 **LLM Backend:** Built with FastGPT, supporting knowledge base Q&A and multimodal inputs (text + image).
- 🌐 **Frontend:** A lightweight HTML/JavaScript interface developed in VS Code, featuring:
  - Real-time webcam capture (defaults to rear camera on mobile)
  - Voice input (speech recognition with language selection)
  - Image preview before sending
  - Speech synthesis playback of the model's response
- ☁️ **Deployment:** Publicly accessible via [Render](https://render.com/), making the application easy to use from any device.

## 📦 Project Structure

```
fastgpt-web-demo/
├── templates/
│   └── index.html        # Main HTML UI
├── static/
│   └── script.js         # Frontend logic (camera, speech, fetch)
├── .env                  # Environment variables for API key and URL
├── .render.yaml          # Render deployment configuration
├── server.py             # Flask backend handling API proxy
└── README.md             # Project description (this file)
```

## 🧪 Local Development

1. **Install dependencies**:
   ```bash
   pip install flask flask-cors python-dotenv requests
   ```

2. **Set up environment variables**:
   Create a `.env` file:
   ```
   FASTGPT_API_KEY=your-fastgpt-api-key
   FASTGPT_URL=https://api.fastgpt.in/api/v1/chat/completions
   ```

3. **Start the server**:
   ```bash
   python server.py
   ```

4. **Access via browser**:
   ```
   http://localhost:5000
   ```

## 🌍 Deployment via Render

1. Push your code to GitHub.
2. Create a **Web Service** on [Render](https://render.com/).
3. Set `Start Command` to:
   ```bash
   python server.py
   ```
4. Add environment variables (`FASTGPT_API_KEY`, `FASTGPT_URL`) via the Render dashboard.

> ⚠️ Do **not** hardcode your API key into the source code. Use environment variables for security.

## ✨ Features

- 📷 Image capture via webcam (auto rear-facing on mobile)
- 🎙️ Speech recognition in Chinese, English, or Japanese
- 🖼️ Image preview before sending to GPT
- 🧠 Multimodal GPT response with knowledge base integration
- 🔊 Spoken feedback of GPT's response (auto language detection)
- 🔁 Toggle buttons for voice input and speech playback

## 📌 TODO / Ideas

- Add file upload support
- Add GPT function calling or tool support
- Display conversation history
- Dark mode UI

## 📄 License

MIT License

---

**Made with ❤️ using FastGPT + Flask + Render**
