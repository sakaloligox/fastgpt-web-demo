// 开启摄像头和麦克风
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    document.getElementById("camera").srcObject = stream;
  })
  .catch(err => alert("获取摄像头失败：" + err));

function captureAndSend() {
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
  };
  recognition.start();
}

async function sendToFastGPT(imageBase64, text) {
  const response = await fetch("http://localhost:5000/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64, question: text })
  });

  const result = await response.json();
  document.getElementById("result").innerText = result.reply;
}
