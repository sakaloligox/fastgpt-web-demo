navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    document.getElementById("camera").srcObject = stream;
  })
  .catch(err => alert("Failed to access camera/microphone: " + err));

function captureAndSend() {
  const button = document.getElementById("askBtn");
  button.disabled = true;
  button.innerText = "🎤 Listening...";

  const video = document.getElementById("camera");
  const canvas = document.getElementById("snapshot");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  const imageBase64 = canvas.toDataURL("image/jpeg");

  const lang = document.getElementById("langSelect").value;
  const recognition = new webkitSpeechRecognition();
  recognition.lang = lang;
  recognition.interimResults = false;
  recognition.continuous = false;

  let hasResult = false;

  recognition.onresult = async (event) => {
    hasResult = true;
    const text = event.results[0][0].transcript;
    document.getElementById("speechText").innerText = "You said: " + text;
    await sendToFastGPT(imageBase64, text);
    button.disabled = false;
    button.innerText = "🎤 Ask GPT";
  };

  recognition.onerror = () => {
    button.disabled = false;
    button.innerText = "🎤 Ask GPT";
  };

  recognition.start();

  setTimeout(() => {
    if (!hasResult) {
      recognition.abort();
      button.disabled = false;
      button.innerText = "🎤 Ask GPT";
      document.getElementById("speechText").innerText = "(No speech detected)";
    }
  }, 5000); // stop if no speech in 5 seconds
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

  const utterance = new SpeechSynthesisUtterance(reply);
  utterance.lang = detectLanguage(reply);
  speechSynthesis.speak(utterance);
}

function detectLanguage(text) {
  if (/[\u3040-\u30ff]/.test(text)) {
    return 'ja-JP'; // 日语平假名和片假名
  } else if (/[\u4e00-\u9fff]/.test(text)) {
    return 'zh-CN'; // 中文汉字
  } else {
    return 'en-US'; // 英文默认
  }
}

