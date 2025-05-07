// ✅ script.js
let recognition = null;
let isListening = false;
let isSpeaking = false;
let synthUtterance = null;

const camera = document.getElementById("camera");
const askBtn = document.getElementById("askBtn");
const speechText = document.getElementById("speechText");
const resultText = document.getElementById("result");
const langSelect = document.getElementById("langSelect");
const canvas = document.getElementById("snapshot");

// ✅ 优先后置摄像头
navigator.mediaDevices.getUserMedia({
  video: { facingMode: { exact: "environment" } },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
})
.then(stream => {
  const video = document.getElementById("camera");
  video.srcObject = stream;
  video.muted = true;
})
.catch(() => {
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: true
  });
})
.then(stream => {
  if (stream) camera.srcObject = stream;
})
.catch(err => alert("Failed to access camera/mic: " + err));

askBtn.addEventListener("mousedown", handleButtonPress);
askBtn.addEventListener("mouseup", handleButtonRelease);
askBtn.addEventListener("touchstart", e => { e.preventDefault(); handleButtonPress(); });
askBtn.addEventListener("touchend", handleButtonRelease);

function handleButtonPress() {
  if (isSpeaking) {
    stopSpeaking();
  } else if (!isListening) {
    startListening();
  }
}

function handleButtonRelease() {
  if (isListening) {
    stopListening();
  }
}

function startListening() {
  isListening = true;
  askBtn.innerText = "⏹️ Listening...";
  speechText.innerText = "";
  resultText.innerText = "";

  // ✅ 截取图像
  // canvas.width = camera.videoWidth;
  // canvas.height = camera.videoHeight;
  // canvas.getContext("2d").drawImage(camera, 0, 0);
  // const imageBase64 = canvas.toDataURL("image/jpeg");

  canvas.width = 160;
  canvas.height = 120;
  canvas.getContext("2d").drawImage(camera, 0, 0, 160, 120);
  const imageBase64 = canvas.toDataURL("image/jpeg", 0.6); // 可选：压缩质量为60%

  recognition = new webkitSpeechRecognition();
  recognition.lang = langSelect.value;
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = async (event) => {
    const text = event.results[0][0].transcript;
    speechText.innerText = "You said: " + text;
    isListening = false;
    askBtn.innerHTML = `<div class='loader'></div>`; // ✅ 显示加载动画
    await sendToFastGPT(imageBase64, text);
  };

  recognition.onerror = () => {
    stopListening();
    speechText.innerText = "(Speech error)";
  };

  recognition.onend = () => {
    if (isListening) {
      stopListening();
      speechText.innerText = "(No speech detected)";
    }
  };

  recognition.start();
  setTimeout(() => {
    if (isListening) {
      recognition.abort();
      stopListening();
      speechText.innerText = "(Timeout: No speech)";
    }
  }, 5000);
}

function stopListening() {
  if (recognition) {
    recognition.abort();
    recognition = null;
  }
  isListening = false;
  if (!isSpeaking) askBtn.innerText = "🎤 Hold to Speak";
}

function stopSpeaking() {
  speechSynthesis.cancel();
  isSpeaking = false;
  askBtn.innerText = "🎤 Hold to Speak";
  startListening();
}

async function sendToFastGPT(imageBase64, text) {
  const response = await fetch("/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64, text: text })
  });

  const result = await response.json();
  const reply = result.reply;
  resultText.innerText = reply;

  isSpeaking = true;
  askBtn.innerText = "🔊 Speaking...";
  synthUtterance = new SpeechSynthesisUtterance(reply);
  synthUtterance.lang = detectLanguage(reply);
  synthUtterance.onend = () => {
    isSpeaking = false;
    askBtn.innerText = "🎤 Hold to Speak";
  };
  speechSynthesis.speak(synthUtterance);
}

function detectLanguage(text) {
  if (/[぀-ヿ]/.test(text)) return 'ja-JP';
  if (/[一-鿿]/.test(text)) return 'zh-CN';
  return 'en-US';
}

// ✅ 添加加载动画样式
const style = document.createElement("style");
style.innerHTML = `
  .loader {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
    display: inline-block;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
