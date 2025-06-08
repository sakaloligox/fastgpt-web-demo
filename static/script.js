let recognition = null;
let isListening = false;
let isSpeaking = false;
let synthUtterance = null;

let smoothedVolume = 0;
const smoothingFactor = 0.8; // 越接近 1 越平滑，推荐 0.8~0.95

let audioContext, analyser, microphone, javascriptNode;

const camera = document.getElementById("camera");
const askBtn = document.getElementById("askBtn");
const speechText = document.getElementById("speechText");
const resultText = document.getElementById("result");
const langSelect = document.getElementById("langSelect");
const canvas = document.getElementById("snapshot");

// 创建音量条元素
const volumeBar = document.createElement("div");
volumeBar.id = "volumeBar";
volumeBar.style.width = "0%";
volumeBar.style.height = "10px";
volumeBar.style.backgroundColor = "#4caf50";
volumeBar.style.margin = "10px auto";
volumeBar.style.transition = "width 0.1s ease";
volumeBar.style.maxWidth = "400px";
document.body.insertBefore(volumeBar, askBtn);


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
  const video = document.getElementById("camera");
  video.srcObject = stream;
  video.muted = true;
  initAudioLevel(stream); // ✅ 初始化音量检测
})
.catch(() => {
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: true
  });
})
.then(stream => {
  if (stream) {
    camera.srcObject = stream;
    initAudioLevel(stream); // ✅ 再次初始化音量检测
  }
})
.catch(err => alert("Failed to access camera/mic: " + err));

function initAudioLevel(stream) {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  microphone = audioContext.createMediaStreamSource(stream);
  javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

  analyser.smoothingTimeConstant = 0.8;
  analyser.fftSize = 1024;

  microphone.connect(analyser);
  analyser.connect(javascriptNode);
  javascriptNode.connect(audioContext.destination);

  javascriptNode.onaudioprocess = function () {
    let array = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    let values = 0;

    for (let i = 0; i < array.length; i++) {
      values += array[i];
    }

    let average = values / array.length;

    // 平滑处理音量值
    smoothedVolume = smoothingFactor * smoothedVolume + (1 - smoothingFactor) * average;

    // 设置最小阈值，避免噪音误报
    const threshold = 5;
    let volumePercent = smoothedVolume < threshold ? 0 : Math.min(100, smoothedVolume * 1.5);

    volumeBar.style.width = volumePercent + "%";
  };
}

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
    askBtn.innerHTML = `<div class='loader'></div>`;
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
const video = document.getElementById("camera"); // 重新获取 video DOM

// 在语音播放前尝试暂停摄像头视频，提升外放概率
video.muted = true;
video.pause();  // 🔧 暂停摄像头画面，有助于释放音频焦点

synthUtterance = new SpeechSynthesisUtterance(reply);
synthUtterance.lang = detectLanguage(reply);
synthUtterance.onend = () => {
  isSpeaking = false;
  askBtn.innerText = "🎤 Hold to Speak";

  // 播放完语音后恢复摄像头
  video.muted = true;
  video.play();
};

speechSynthesis.speak(synthUtterance);

}

function detectLanguage(text) {
  if (/[぀-ヿ]/.test(text)) return 'ja-JP';
  if (/[一-鿿]/.test(text)) return 'zh-CN';
  return 'en-US';
}

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

// iOS 语音播放权限
function unlockVoicePlayback() {
  const utter = new SpeechSynthesisUtterance('');
  window.speechSynthesis.speak(utter);
  document.removeEventListener("touchstart", unlockVoicePlayback);
  document.removeEventListener("click", unlockVoicePlayback);
}
document.addEventListener("touchstart", unlockVoicePlayback);
document.addEventListener("click", unlockVoicePlayback);
