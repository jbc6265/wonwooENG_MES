const orders = [
  { part: "CW-480-002", qty: 4, model: "HX480", serial: "25HX480-0003", target: 4800 },
  { part: "CW-320-001", qty: 6, model: "HX320", serial: "25HX320-0001", target: 3200 },
  { part: "CW-380-001", qty: 5, model: "HX380", serial: "25HX380-0002", target: 3800 },
  { part: "CW-520-001", qty: 3, model: "HX520", serial: "25HX520-0001", target: 5200 },
  { part: "CW-220-001", qty: 8, model: "HX220", serial: "25HX220-0005", target: 2200 },
  { part: "CW-550-001", qty: 2, model: "HX550", serial: "25HX550-0002", target: 5500 },
];

const state = {
  selectedIndex: null,
  started: false,
  interfaced: false,
  confirmed: false,
  ended: false,
  measuredWeight: null,
};

const rows = document.querySelector("#orderRows");
const selectedOrderText = document.querySelector("#selectedOrderText");
const startButton = document.querySelector("#startButton");
const endButton = document.querySelector("#endButton");
const interfaceButton = document.querySelector("#interfaceButton");
const confirmButton = document.querySelector("#confirmButton");
const weightValue = document.querySelector("#weightValue");
const targetWeight = document.querySelector("#targetWeight");
const judgeText = document.querySelector("#judgeText");
const stabilityText = document.querySelector("#stabilityText");
const measuredAt = document.querySelector("#measuredAt");
const statusMessage = document.querySelector("#statusMessage");
const messageType = document.querySelector("#messageType");
const shell = document.querySelector(".pop-shell");
const refreshButton = document.querySelector("#refreshButton");
const todayText = document.querySelector("#todayText");

const weekday = ["일", "월", "화", "수", "목", "금", "토"];
const today = new Date();
todayText.textContent = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")} (${weekday[today.getDay()]})`;

function renderRows() {
  rows.innerHTML = orders
    .map(
      (order, index) => `
        <tr class="${state.selectedIndex === index ? "is-selected" : ""}" data-index="${index}">
          <td><span class="radio-mark" aria-hidden="true"></span></td>
          <td>${order.part}</td>
          <td>${order.qty} EA</td>
          <td>${order.model}</td>
          <td>${order.serial}</td>
        </tr>
      `,
    )
    .join("");
}

function updateSteps(activeStep) {
  const order = ["select", "start", "interface", "confirm", "end"];
  const activeIndex = order.indexOf(activeStep);
  document.querySelectorAll(".step").forEach((step) => {
    const index = order.indexOf(step.dataset.step);
    step.classList.toggle("is-active", index === activeIndex);
    step.classList.toggle("is-done", index < activeIndex);
  });
}

function setMessage(type, message, mode = "") {
  messageType.textContent = type;
  statusMessage.textContent = message;
  shell.classList.toggle("is-working", mode === "working");
  shell.classList.toggle("is-alert", mode === "alert");
  shell.classList.toggle("is-complete", mode === "complete");
}

function resetMeasurement() {
  state.started = false;
  state.interfaced = false;
  state.confirmed = false;
  state.ended = false;
  state.measuredWeight = null;
  weightValue.textContent = "----";
  measuredAt.textContent = "-";
  judgeText.textContent = "대기";
  stabilityText.textContent = "작업시작 후 I/F 버튼을 누르세요.";
}

function syncControls() {
  const selected = state.selectedIndex !== null;
  startButton.disabled = !selected || state.started || state.ended;
  interfaceButton.disabled = !state.started || state.interfaced || state.ended;
  confirmButton.disabled = !state.interfaced || state.confirmed || state.ended;
  endButton.disabled = !state.confirmed || state.ended;
}

function selectOrder(index) {
  state.selectedIndex = index;
  resetMeasurement();
  const order = orders[index];
  selectedOrderText.textContent = `${order.part} / ${order.model} / ${order.serial}`;
  targetWeight.textContent = `${order.target.toLocaleString()} kg`;
  renderRows();
  updateSteps("start");
  setMessage("준비", "선택한 작업지시로 작업을 시작할 수 있습니다.");
  syncControls();
}

function startWork() {
  state.started = true;
  updateSteps("interface");
  setMessage("진행", "디지털저울에 제품을 올리고 무게 자동 I/F를 실행하세요.", "working");
  syncControls();
}

function requestInterface() {
  const order = orders[state.selectedIndex];
  interfaceButton.disabled = true;
  setMessage("I/F", "디지털저울에서 무게 데이터를 수신 중입니다.", "alert");
  stabilityText.textContent = "저울 통신 중...";

  window.setTimeout(() => {
    const variation = Math.round((Math.random() * 16 - 8) * 10) / 10;
    const measured = order.target + variation;
    state.measuredWeight = measured;
    state.interfaced = true;
    weightValue.textContent = measured.toLocaleString(undefined, {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    });
    measuredAt.textContent = new Date().toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    judgeText.textContent = Math.abs(measured - order.target) <= 30 ? "합격" : "재측정";
    stabilityText.textContent = "안정 상태 - 기준 범위 내 측정값입니다.";
    updateSteps("confirm");
    setMessage("확인", "수신된 무게를 확인한 뒤 무게 확정을 누르세요.", "working");
    syncControls();
  }, 850);
}

function confirmWeight() {
  state.confirmed = true;
  updateSteps("end");
  setMessage("확정", "무게가 확정되었습니다. 작업종료를 진행하세요.", "complete");
  syncControls();
}

function endWork() {
  state.ended = true;
  updateSteps("end");
  setMessage("완료", "최종검사 작업이 종료되었습니다. 다음 작업지시를 선택하세요.", "complete");
  syncControls();
}

rows.addEventListener("click", (event) => {
  const row = event.target.closest("tr");
  if (!row) return;
  selectOrder(Number(row.dataset.index));
});

startButton.addEventListener("click", startWork);
interfaceButton.addEventListener("click", requestInterface);
confirmButton.addEventListener("click", confirmWeight);
endButton.addEventListener("click", endWork);

refreshButton.addEventListener("click", () => {
  setMessage("갱신", "작업지시 목록을 최신 상태로 갱신했습니다.");
  renderRows();
});

renderRows();
syncControls();
