let recognition = null;
let isListening = false;
let isSpeaking = false;
let synthUtterance = null;
let chatHistory = [];
let voiceUnlocked = false;

let chatId = localStorage.getItem("chatId");
if (!chatId) {
  chatId = crypto.randomUUID();
  localStorage.setItem("chatId", chatId);
}

const camera = document.getElementById("camera");
const askBtn = document.getElementById("askBtn");
const speechText = document.getElementById("speechText");
const resultText = document.getElementById("result");
const langSelect = document.getElementById("langSelect");
const canvas = document.getElementById("snapshot");

// 🧠 强制激活扬声器（防止 iOS 走听筒）
const audioTest = document.createElement("audio");
audioTest.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=";
audioTest.play().catch(() => {});

let currentImageBase64 = "";

navigator.mediaDevices.getUserMedia({
  video: { facingMode: { exact: "environment" } },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
})
.then(stream => {
  camera.srcObject = stream;
  camera.muted = true;
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
  if (!voiceUnlocked) {
    if (speechSynthesis.paused) speechSynthesis.resume();
    const testVoice = new SpeechSynthesisUtterance('');
    speechSynthesis.speak(testVoice);
    voiceUnlocked = true;
  }

  if (isSpeaking) {
    stopSpeaking();
  } else if (!isListening) {
    startListening();
  }
}

function handleButtonRelease() {
  if (isListening && recognition) {
    recognition.stop(); // 手动结束识别
  }
}

function startListening() {
  isListening = true;
  askBtn.innerText = "⏹️ Listening...";
  speechText.innerText = "";
  resultText.innerText = "";

  canvas.width = 160;
  canvas.height = 120;
  canvas.getContext("2d").drawImage(camera, 0, 0, 160, 120);
  currentImageBase64 = canvas.toDataURL("image/jpeg", 0.6);

  recognition = new webkitSpeechRecognition();
  recognition.lang = langSelect.value;
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = async (event) => {
    const result = event.results[event.resultIndex];
    if (result && result[0]) {
      const rawText = result[0].transcript.trim();
      const cleanText = removeRepeatingPhrases(rawText);
      if (!cleanText) {
        speechText.innerText = "(No speech detected)";
        stopListening();
        return;
      }

      speechText.innerText = "You said: " + cleanText;
      askBtn.classList.add("loading");
      stopListening();
      await sendToFastGPT(currentImageBase64, cleanText);
    }
  };

  recognition.onerror = () => {
    speechText.innerText = "(Speech error)";
    stopListening();
  };

  recognition.onend = () => {
    // 👈 关键：确保 stopListening 被执行
    stopListening();
  };

  recognition.start();
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

function removeRepeatingPhrases(text) {
  const words = text.split(/[\s，。！？、,.!?]/).filter(Boolean);
  const deduped = [];
  for (let i = 0; i < words.length; i++) {
    if (i === 0 || words[i] !== words[i - 1]) {
      deduped.push(words[i]);
    }
  }
  return deduped.join(" ");
}

async function sendToFastGPT(imageBase64, text) {
  const currentMessage = [{
    role: "user",
    content: [
      { type: "text", text: text },
      { type: "image_url", image_url: { url: imageBase64 } }
    ]
  }];

  // ✅ 设置按钮状态为加载中
  askBtn.innerText = "⌛ Waiting...";
  askBtn.classList.add("loading");

  const response = await fetch("/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: currentMessage,
      chatId: chatId
    })
  });

  const result = await response.json();
  const reply = result.reply;
  chatId = result.chatId || chatId;
  resultText.innerText = reply;

  chatHistory.push({
    role: "user",
    content: currentMessage[0].content
  });

  chatHistory.push({
    role: "assistant",
    content: [{ type: "text", text: reply }]
  });

  isSpeaking = true;
  askBtn.classList.remove("loading");
  askBtn.innerText = "🔊 Speaking...";

  synthUtterance = new SpeechSynthesisUtterance(reply);
  synthUtterance.lang = detectLanguage(reply);
  synthUtterance.volume = 1;
  synthUtterance.rate = 1;
  synthUtterance.pitch = 1;
  synthUtterance.onend = () => {
    isSpeaking = false;
    askBtn.innerText = "🎤 Hold to Speak";
  };
  speechSynthesis.speak(synthUtterance);
}


function detectLanguage(text) {
  const hasJapanese = /[\u3040-\u30ff\u31f0-\u31ff\uFF66-\uFF9F]/.test(text);
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  if (hasJapanese) return 'ja-JP';
  if (hasChinese) return 'zh-CN';
  return 'en-US';
}

function startNewChat() {
  chatHistory = [];
  resultText.innerText = '';
  speechText.innerText = '';
  chatId = crypto.randomUUID();
  localStorage.setItem("chatId", chatId);
}

// iOS语音解锁
function unlockVoicePlayback() {
  const utter = new SpeechSynthesisUtterance('');
  window.speechSynthesis.speak(utter);
  document.removeEventListener("touchstart", unlockVoicePlayback);
  document.removeEventListener("click", unlockVoicePlayback);
}
document.addEventListener("touchstart", unlockVoicePlayback);
document.addEventListener("click", unlockVoicePlayback);
