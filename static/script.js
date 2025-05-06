let recognition = null;
let isListening = false;
let isSpeaking = false;
let synthUtterance = null;

// ✅ 优先使用后置摄像头（若失败则自动使用前置）
navigator.mediaDevices.getUserMedia({
  video: { facingMode: { exact: "environment" } },
  audio: true
})
.then(stream => {
  document.getElementById("camera").srcObject = stream;
})
.catch(err => {
  console.warn("Back camera not found, fallback to front camera.", err);
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: true
  });
})
.then(stream => {
  if (stream) {
    document.getElementById("camera").srcObject = stream;
  }
})
.catch(err => alert("Failed to access camera/microphone: " + err));

// ✅ 控制按钮行为
document.getElementById("askBtn").addEventListener("click", () => {
  if (isListening) {
    stopListening();
  } else if (isSpeaking) {
    stopSpeaking();
  } else {
    startListening();
  }
});

function startListening() {
  const button = document.getElementById("askBtn");
  isListening = true;
  button.disabled = false;
  button.innerText = "⏹️ Stop Listening";

  const video = document.getElementById("camera");
  const canvas = document.getElementById("snapshot");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  const imageBase64 = canvas.toDataURL("image/jpeg");

  // ✅ 图像预览
  document.getElementById("preview").src = imageBase64;

  const lang = document.getElementById("langSelect").value;
  recognition = new webkitSpeechRecognition();
  recognition.lang = lang;
  recognition.interimResults = false;
  recognition.continuous = false;

  let hasResult = false;

  recognition.onresult = async (event) => {
    hasResult = true;
    const text = event.results[0][0].transcript;
    document.getElementById("speechText").innerText = "You said: " + text;
    isListening = false;
    button.innerText = "⏳ Waiting...";
    await sendToFastGPT(imageBase64, text);
  };

  recognition.onerror = () => {
    isListening = false;
    button.innerText = "🎤 Ask GPT";
  };

  recognition.onend = () => {
    if (!hasResult) {
      button.innerText = "🎤 Ask GPT";
      document.getElementById("speechText").innerText = "(No speech detected)";
    }
    isListening = false;
  };

  recognition.start();

  setTimeout(() => {
    if (!hasResult && isListening) {
      stopListening();
      document.getElementById("speechText").innerText = "(No speech detected)";
    }
  }, 5000);
}

function stopListening() {
  if (recognition) {
    recognition.abort();
    recognition = null;
  }
  isListening = false;
  document.getElementById("askBtn").innerText = "🎤 Ask GPT";
}

function stopSpeaking() {
  speechSynthesis.cancel();
  isSpeaking = false;
  document.getElementById("askBtn").innerText = "🎤 Ask GPT";
}

async function sendToFastGPT(imageBase64, text) {
  const response = await fetch("/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64, text: text })
  });

  const result = await response.json();
  const reply = result.reply;
  document.getElementById("result").innerText = reply;

  const button = document.getElementById("askBtn");
  button.innerText = "🔊 Speaking...";
  isSpeaking = true;

  synthUtterance = new SpeechSynthesisUtterance(reply);
  synthUtterance.lang = detectLanguage(reply);
  synthUtterance.onend = () => {
    isSpeaking = false;
    button.innerText = "🎤 Ask GPT";
  };
  speechSynthesis.speak(synthUtterance);
}

function detectLanguage(text) {
  if (/[\u3040-\u30ff]/.test(text)) {
    return 'ja-JP';
  } else if (/[\u4e00-\u9fff]/.test(text)) {
    return 'zh-CN';
  } else {
    return 'en-US';
  }
}
