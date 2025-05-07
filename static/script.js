let recognition = null;
let isListening = false;
let isSpeaking = false;
let synthUtterance = null;
let chatHistory = []; // 🧠 上下文缓存
let voiceUnlocked = false;

let chatId = localStorage.getItem("chatId");
if (!chatId) {
  chatId = crypto.randomUUID();  // ✅ 生成 UUID
  localStorage.setItem("chatId", chatId);  // 保存在本地直到关闭标签页
}


const camera = document.getElementById("camera");
const askBtn = document.getElementById("askBtn");
const speechText = document.getElementById("speechText");
const resultText = document.getElementById("result");
const langSelect = document.getElementById("langSelect");
const canvas = document.getElementById("snapshot");


// 摄像头与麦克风权限
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
  // ✅ iOS 语音播报权限解锁（只做一次）
  if (!voiceUnlocked) {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
    }
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
  if (isListening) {
    stopListening();
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
  const imageBase64 = canvas.toDataURL("image/jpeg", 0.6);

  recognition = new webkitSpeechRecognition();
  recognition.lang = langSelect.value;
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = async (event) => {
    const text = event.results[0][0].transcript;
    speechText.innerText = "You said: " + text;
    isListening = false;
    askBtn.classList.add("loading");
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
  // ✅ 构建当前提问（不加入历史）
  const currentMessage = [{
    role: "user",
    content: [
      { type: "text", text: text },
      { type: "image_url", image_url: { url: imageBase64 } }
    ]
  }];

  const response = await fetch("/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: currentMessage,  // ✅ 只发送当前消息
      chatId: chatId
    })
  });

  const result = await response.json();
  const reply = result.reply;
  chatId = result.chatId || chatId;

  resultText.innerText = reply;

  // ✅ 仍然保存到 chatHistory，用于界面展示或未来切换功能
  chatHistory.push({
    role: "user",
    content: [
      { type: "text", text: text },
      { type: "image_url", image_url: { url: imageBase64 } }
    ]
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

function startNewChat() {
  chatHistory = [];
  resultText.innerText = '';
  speechText.innerText = '';

  // ❗️生成新的 chatId 并保存（使其成为新的对话线程）
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
