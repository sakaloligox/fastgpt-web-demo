# FastGPT Web Demo

A simple web interface for interacting with a multimodal FastGPT agent using real-time **camera image** and **microphone audio** from your mobile device.

![screenshot](screenshot.png)

---

## 🚀 Features

- 📸 Capture camera image (one frame)
- 🎙️ Record microphone audio and transcribe to text (Web Speech API)
- 🤖 Send both image and question text to FastGPT API
- 💬 Display response in real time

---

## 🧠 Requirements

- Python 3.8+
- Node.js (for local static server, optional)
- A [FastGPT](https://fastgpt.in/) API endpoint and key

---

## 🛠️ Installation

1. **Clone the repository**

```bash
git clone https://github.com/sakaloligox/fastgpt-web-demo.git
cd fastgpt-web-demo
```

2. **Create `.env` file**

Create a file named `.env` in the root directory and fill in your FastGPT credentials:

```env
FASTGPT_URL=https://api.fastgpt.in/api/v1/chat/completions
FASTGPT_API_KEY=your-api-key-here
```

> ⚠️ Never commit `.env` to public GitHub!

3. **Install Python dependencies**

```bash
pip install -r requirements.txt
```

---

## ▶️ Running Locally

1. **Start Flask backend server**

```bash
python server.py
```

> This starts the API on `http://localhost:5000`

2. **Serve frontend locally**

```bash
python -m http.server 8000
```

Visit: [http://localhost:8000](http://localhost:8000)

---

## ☁️ Deploy to Render

This project is ready to deploy via [Render](https://render.com). The deployment configuration is specified in `.render.yaml`.

Steps:

1. Push this repo to GitHub
2. Create a new Web Service on Render
3. Add the environment variables:
   - `FASTGPT_URL`
   - `FASTGPT_API_KEY`
4. Click **Deploy**

---

## 🛡️ Security

- `.env` is excluded from Git using `.gitignore`
- `.render.yaml` does **not** include secrets (uses `sync: false`)
- Frontend never sees your API key

---

## 📄 License

[MIT License](LICENSE)