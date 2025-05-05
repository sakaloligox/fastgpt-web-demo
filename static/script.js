// 开启摄像头和麦克风
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    document.getElementById("camera").srcObject = stream;
  })
  .catch(err => alert("获取摄像头失败：" + err));

function captureAndSend() {
  const btn = document.getElementById("askBtn");
  btn.disabled = true;
  btn.innerText = "识别中...";

  const video = document.getElementById("camera");
  const canvas = document.getElementById("snapshot");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  const imageBase64 = canvas.toDataURL("image/jpeg");

  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'zh-CN';
  recognition.onresult = async (event) => {
    const text = event.results[0][0].transcript;
    document.getElementById("speechText").innerText = "你说的是：" + text;
    await sendToFastGPT(imageBase64, text);
    btn.disabled = false;
    btn.innerText = "🎤 继续提问";
  };
  recognition.onerror = () => {
    btn.disabled = false;
    btn.innerText = "🎤 再试一次";
  };
  recognition.start();
}

async function sendToFastGPT(imageBase64, text) {
  const response = await fetch("/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64, question: text })
  });

  const result = await response.json();
  const reply = result.reply;
  document.getElementById("result").innerText = reply;

  // 文本语音播报
  const utterance = new SpeechSynthesisUtterance(reply);

  // 简单语言判断（可根据需求扩展）
  if (/[\u3040-\u30ff\u31f0-\u31ff]/.test(reply)) {
    utterance.lang = "ja-JP";  // 日文
  } else if (/[a-zA-Z]/.test(reply) && !/[\u4e00-\u9fff]/.test(reply)) {
    utterance.lang = "en-US";  // 英文
  } else {
    utterance.lang = "zh-CN";  // 默认中文
  }

  speechSynthesis.speak(utterance);

}
