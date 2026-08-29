const todayText = document.querySelector("#todayText");
const clockText = document.querySelector("#clockText");
const weekday = ["일", "월", "화", "수", "목", "금", "토"];

function renderClock() {
  const now = new Date();
  todayText.textContent = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} (${weekday[now.getDay()]})`;
  clockText.textContent = now.toLocaleTimeString("ko-KR", { hour12: false });
}

renderClock();
window.setInterval(renderClock, 1000);
