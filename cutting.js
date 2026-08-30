const STORAGE_KEY = "wonwoo-cutting-pop-v1";

const initialOrders = [
  { id: "WO-001", receivedAt: "2026-08-30", steel: "SS400", supplier: "동국제강", thickness: 12, width: 2438, height: 6096, qty: 5, source: "sheet" },
  { id: "WO-002", receivedAt: "2026-08-30", steel: "SS400", supplier: "현대제철", thickness: 9, width: 1524, height: 6096, qty: 8, source: "sheet" },
  { id: "WO-003", receivedAt: "2026-08-29", steel: "SM355", supplier: "포스코", thickness: 10, width: 1219, height: 2438, qty: 4, source: "residue", residueId: "R-20260829-001" },
  { id: "WO-004", receivedAt: "2026-08-29", steel: "SM490", supplier: "포스코", thickness: 16, width: 2438, height: 6096, qty: 3, source: "sheet" },
  { id: "WO-005", receivedAt: "2026-08-28", steel: "SS400", supplier: "현대제철", thickness: 12, width: 1524, height: 3048, qty: 10, source: "sheet" },
  { id: "WO-006", receivedAt: "2026-08-28", steel: "SS400", supplier: "세아제강", thickness: 8, width: 1000, height: 2000, qty: 1, source: "residue", residueId: "R-20260828-002" },
  { id: "WO-007", receivedAt: "2026-08-27", steel: "SM355", supplier: "동국제강", thickness: 10, width: 2438, height: 6096, qty: 4, source: "sheet" },
  { id: "WO-008", receivedAt: "2026-08-27", steel: "SS400", supplier: "현대제철", thickness: 6, width: 914, height: 1829, qty: 2, source: "residue", residueId: "R-20260827-003" },
  { id: "WO-009", receivedAt: "2026-08-26", steel: "SM490", supplier: "포스코", thickness: 16, width: 1524, height: 6096, qty: 6, source: "sheet" },
  { id: "WO-010", receivedAt: "2026-08-26", steel: "SS400", supplier: "동국제강", thickness: 9, width: 2438, height: 3048, qty: 12, source: "sheet" },
].map((order) => ({ ...order, materialCode: makeMaterialCode(order) }));

const initialResidues = [
  { id: "R-20260829-001", originalCode: "SM355-10T-2438x6096", steel: "SM355", supplier: "포스코", thickness: 10, width: 1219, height: 2438, qty: 4, registeredAt: "2026-08-29", status: "가용" },
  { id: "R-20260828-002", originalCode: "SS400-8T-2438x6096", steel: "SS400", supplier: "세아제강", thickness: 8, width: 1000, height: 2000, qty: 1, registeredAt: "2026-08-28", status: "가용" },
  { id: "R-20260827-003", originalCode: "SS400-6T-1219x2438", steel: "SS400", supplier: "현대제철", thickness: 6, width: 914, height: 1829, qty: 2, registeredAt: "2026-08-27", status: "가용" },
];

const state = {
  data: loadData(),
  selectedIds: new Set(),
  phase: "select",
  queue: [],
  queueIndex: 0,
  activeTab: "orders",
  inventoryChange: null,
};

const elements = {
  todayText: document.querySelector("#todayText"), orderRows: document.querySelector("#orderRows"), residueRows: document.querySelector("#residueRows"), resultRows: document.querySelector("#resultRows"),
  selectedCount: document.querySelector("#selectedCount"), clearSelectionButton: document.querySelector("#clearSelectionButton"), materialCount: document.querySelector("#materialCount"), residueCount: document.querySelector("#residueCount"), resultCount: document.querySelector("#resultCount"),
  ordersTab: document.querySelector("#ordersTab"), residueTab: document.querySelector("#residueTab"), resultsTab: document.querySelector("#resultsTab"), ordersView: document.querySelector("#ordersView"), residueView: document.querySelector("#residueView"), resultsView: document.querySelector("#resultsView"),
  currentCode: document.querySelector("#currentCode"), currentSpec: document.querySelector("#currentSpec"), currentSize: document.querySelector("#currentSize"), currentSource: document.querySelector("#currentSource"),
  queuePosition: document.querySelector("#queuePosition"), inventoryChangeStatus: document.querySelector("#inventoryChangeStatus"), inventoryChangeSummary: document.querySelector("#inventoryChangeSummary"), inventoryBeforeQty: document.querySelector("#inventoryBeforeQty"), inventoryAfterQty: document.querySelector("#inventoryAfterQty"), inventoryChangeResult: document.querySelector("#inventoryChangeResult"),
  residueEntry: document.querySelector("#residueEntry"), residueStatus: document.querySelector("#residueStatus"), residueWidth: document.querySelector("#residueWidth"), residueHeight: document.querySelector("#residueHeight"), inputGuide: document.querySelector("#inputGuide"), popupInputGuide: document.querySelector("#popupInputGuide"),
  receiptButton: document.querySelector("#receiptButton"), cutButton: document.querySelector("#cutButton"), completeButton: document.querySelector("#completeButton"), residueProcessButton: document.querySelector("#residueProcessButton"), noResidueButton: document.querySelector("#noResidueButton"), residueConfirmButton: document.querySelector("#residueConfirmButton"), resetButton: document.querySelector("#resetButton"),
  messageType: document.querySelector("#messageType"), statusMessage: document.querySelector("#statusMessage"), statusBox: document.querySelector(".status-message"),
  receiptDialog: document.querySelector("#receiptDialog"), receiptForm: document.querySelector("#receiptForm"), steelInput: document.querySelector("#steelInput"), supplierInput: document.querySelector("#supplierInput"), thicknessInput: document.querySelector("#thicknessInput"), widthInput: document.querySelector("#widthInput"), heightInput: document.querySelector("#heightInput"), quantityInput: document.querySelector("#quantityInput"), codePreview: document.querySelector("#codePreview"),
  noResidueDialog: document.querySelector("#noResidueDialog"), noResidueCode: document.querySelector("#noResidueCode"), confirmNoResidueButton: document.querySelector("#confirmNoResidueButton"), changeToResidueButton: document.querySelector("#changeToResidueButton"),
  residueSizeDialog: document.querySelector("#residueSizeDialog"), residueDialogCode: document.querySelector("#residueDialogCode"), residueDialogSourceSize: document.querySelector("#residueDialogSourceSize"), closeResidueDialog: document.querySelector("#closeResidueDialog"), cancelResidueButton: document.querySelector("#cancelResidueButton"),
};

function cloneInitialData() {
  return synchronizeResidueInventory({ orders: initialOrders, residues: initialResidues, results: [], residueSequence: 3, resultSequence: 0 });
}

function makeMaterialCode(material) {
  return `${String(material.steel).toUpperCase()}-${Number(material.thickness)}T-${Number(material.width)}x${Number(material.height)}`;
}

function residueMatchesOrder(residue, order) {
  return residue.steel === order.steel
    && Number(residue.thickness) === Number(order.thickness)
    && Number(residue.width) === Number(order.width)
    && Number(residue.height) === Number(order.height);
}

function makeResidueOrder(residue) {
  const order = {
    id: `WO-${residue.id}`,
    receivedAt: residue.registeredAt,
    steel: residue.steel,
    supplier: residue.supplier || "잔재 재고",
    thickness: residue.thickness,
    width: residue.width,
    height: residue.height,
    qty: residue.qty,
    source: "residue",
    residueId: residue.id,
  };
  return { ...order, materialCode: makeMaterialCode(order) };
}

function synchronizeResidueInventory(data) {
  const orders = (data.orders || []).map((order) => ({ ...order }));
  let residueSequence = Number.isInteger(data.residueSequence) ? data.residueSequence : 0;
  const residues = (data.residues || []).map((residue) => {
    const matchingOrder = orders.find((order) => order.source === "residue"
      && (order.residueId === residue.id || residueMatchesOrder(residue, order)));
    const fallbackQty = Number.isInteger(matchingOrder?.qty) ? Math.max(0, matchingOrder.qty) : 1;
    const qty = Number.isInteger(residue.qty) ? Math.max(0, residue.qty) : fallbackQty;
    return {
      ...residue,
      supplier: residue.supplier || matchingOrder?.supplier || "잔재 재고",
      qty,
      status: qty > 0 ? "가용" : "소진",
    };
  });

  const linkedResidueIds = new Set();
  orders.forEach((order) => {
    if (order.source !== "residue") return;
    let residue = residues.find((item) => item.id === order.residueId && !linkedResidueIds.has(item.id));
    if (!residue) residue = residues.find((item) => !linkedResidueIds.has(item.id) && residueMatchesOrder(item, order));
    if (!residue) {
      residueSequence += 1;
      residue = {
        id: `R-${String(order.receivedAt).replaceAll("-", "")}-${String(residueSequence).padStart(3, "0")}`,
        originalCode: order.materialCode,
        steel: order.steel,
        supplier: order.supplier,
        thickness: order.thickness,
        width: order.width,
        height: order.height,
        qty: Math.max(0, Number(order.qty) || 0),
        registeredAt: order.receivedAt,
        status: order.qty > 0 ? "가용" : "소진",
      };
      residues.push(residue);
    }
    order.residueId = residue.id;
    order.qty = residue.qty;
    linkedResidueIds.add(residue.id);
  });

  residues.forEach((residue) => {
    if (!linkedResidueIds.has(residue.id)) orders.unshift(makeResidueOrder(residue));
  });

  return {
    ...data,
    orders,
    residues,
    results: Array.isArray(data.results) ? data.results : [],
    residueSequence,
    resultSequence: Number.isInteger(data.resultSequence) ? data.resultSequence : 0,
  };
}

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.orders) && Array.isArray(saved.residues) && Number.isInteger(saved.residueSequence)) {
      return synchronizeResidueInventory({
        ...saved,
        results: Array.isArray(saved.results) ? saved.results : [],
        resultSequence: Number.isInteger(saved.resultSequence) ? saved.resultSequence : 0,
      });
    }
  } catch (error) {
    console.warn("저장 데이터를 불러오지 못해 초기 데이터로 시작합니다.", error);
  }
  return cloneInitialData();
}

function saveData() {
  state.data = synchronizeResidueInventory(state.data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function formatToday(date = new Date()) {
  const weekday = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} (${weekday[date.getDay()]})`;
}

function formatDateKey(date = new Date()) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function formatIsoDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateTime(date = new Date()) {
  return `${formatIsoDate(date)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}

function renderOrders() {
  elements.orderRows.innerHTML = state.data.orders.map((order) => {
    const selected = state.selectedIds.has(order.id);
    const empty = order.qty <= 0;
    return `<tr data-id="${escapeHtml(order.id)}" class="${selected ? "is-selected" : ""} ${empty ? "is-empty" : ""}">
      <td><input type="radio" name="materialSelection" aria-label="${escapeHtml(order.materialCode)} 선택" ${selected ? "checked" : ""} ${empty || state.phase !== "select" ? "disabled" : ""}></td>
      <td>${escapeHtml(order.receivedAt)}</td><td>${escapeHtml(order.supplier)}</td><td>${escapeHtml(order.materialCode)}</td><td>${escapeHtml(order.steel)}</td>
      <td>${order.thickness}T</td><td>${order.width.toLocaleString()} × ${order.height.toLocaleString()}</td><td>${order.qty}장</td>
      <td><span class="source-mark ${order.source === "sheet" ? "is-on" : "is-off"}">${order.source === "sheet" ? "O" : "X"}</span></td>
      <td><span class="source-mark ${order.source === "residue" ? "is-on" : "is-off"}">${order.source === "residue" ? "O" : "X"}</span></td>
    </tr>`;
  }).join("");

  const totalQuantity = state.data.orders.reduce((sum, order) => sum + order.qty, 0);
  elements.materialCount.textContent = String(totalQuantity);

}

function renderResidues() {
  elements.residueRows.innerHTML = state.data.residues.map((residue) => {
    const linkedOrder = state.data.orders.find((order) => order.residueId === residue.id);
    const selected = linkedOrder ? state.selectedIds.has(linkedOrder.id) : false;
    const unavailable = !linkedOrder || residue.qty <= 0;
    return `<tr data-order-id="${escapeHtml(linkedOrder?.id || "")}" class="${selected ? "is-selected" : ""} ${unavailable ? "is-empty" : ""}">
      <td><input type="radio" name="materialSelection" aria-label="${escapeHtml(residue.id)} 잔재 선택" ${selected ? "checked" : ""} ${unavailable || state.phase !== "select" ? "disabled" : ""}></td>
      <td>${escapeHtml(residue.id)}</td><td>${escapeHtml(residue.originalCode)}</td><td>${escapeHtml(residue.steel)}</td>
      <td>${residue.thickness}T</td><td>${residue.width.toLocaleString()} × ${residue.height.toLocaleString()}</td><td>${residue.qty.toLocaleString()}개</td><td>${escapeHtml(residue.registeredAt)}</td>
      <td><span class="stock-status ${residue.qty > 0 ? "" : "is-empty"}">${escapeHtml(residue.status)}</span></td>
    </tr>`;
  }).join("");
  const totalQuantity = state.data.residues.reduce((sum, residue) => sum + residue.qty, 0);
  elements.residueCount.textContent = String(totalQuantity);
}

function renderResults() {
  elements.resultCount.textContent = String(state.data.results.length);
  if (!state.data.results.length) {
    elements.resultRows.innerHTML = '<tr class="empty-result-row"><td colspan="9">잔재 미처리로 절단 완료된 작업실적이 없습니다.</td></tr>';
    return;
  }
  elements.resultRows.innerHTML = state.data.results.map((result) => `<tr>
    <td>${escapeHtml(result.id)}</td><td>${escapeHtml(result.completedAt)}</td><td>${escapeHtml(result.materialCode)}</td>
    <td>${escapeHtml(result.steel)}</td><td>${result.thickness}T</td><td>${result.width.toLocaleString()} × ${result.height.toLocaleString()}</td>
    <td>${result.source === "sheet" ? "원장" : "잔재"}</td><td><span class="result-status">${escapeHtml(result.result)}</span></td><td>${escapeHtml(result.operator)}</td>
  </tr>`).join("");
}

function getCurrentMaterial() {
  if (state.queue.length) return state.queue[state.queueIndex] || null;
  const firstSelected = [...state.selectedIds][0];
  return state.data.orders.find((order) => order.id === firstSelected) || null;
}

function renderDetail() {
  const current = getCurrentMaterial();
  elements.selectedCount.textContent = `선택 ${state.selectedIds.size}건`;
  const phaseLabels = {
    select: current ? "선택" : "대기",
    cutting: "절단 중",
    decision: "처리 판단",
    "residue-entry": "크기 입력",
  };
  elements.queuePosition.textContent = phaseLabels[state.phase] || "대기";

  if (state.inventoryChange) {
    const change = state.inventoryChange;
    elements.inventoryChangeStatus.textContent = change.status;
    elements.inventoryChangeSummary.textContent = change.materialCode;
    elements.inventoryBeforeQty.textContent = `${change.beforeQty.toLocaleString()}${change.unit}`;
    elements.inventoryAfterQty.textContent = `${change.afterQty.toLocaleString()}${change.unit}`;
    elements.inventoryChangeResult.textContent = change.result;
  } else if (current) {
    const unit = current.source === "sheet" ? "장" : "개";
    elements.inventoryChangeStatus.textContent = "절단 대기";
    elements.inventoryChangeSummary.textContent = current.materialCode;
    elements.inventoryBeforeQty.textContent = `${current.qty.toLocaleString()}${unit}`;
    elements.inventoryAfterQty.textContent = "-";
    elements.inventoryChangeResult.textContent = "자재 선택";
  } else {
    elements.inventoryChangeStatus.textContent = "대기";
    elements.inventoryChangeSummary.textContent = "변동 내역 없음";
    elements.inventoryBeforeQty.textContent = "-";
    elements.inventoryAfterQty.textContent = "-";
    elements.inventoryChangeResult.textContent = "대기";
  }

  if (!current) {
    elements.currentCode.textContent = "작업할 자재를 선택하세요";
    elements.currentSpec.textContent = "-";
    elements.currentSize.textContent = "-";
    elements.currentSource.textContent = "-";
    return;
  }

  elements.currentCode.textContent = current.materialCode;
  elements.currentSpec.textContent = `${current.steel} / ${current.thickness}T`;
  elements.currentSize.textContent = `${current.width.toLocaleString()} × ${current.height.toLocaleString()} mm`;
  elements.currentSource.textContent = current.source === "sheet" ? "원장" : "잔재";
}

function setTab(tab) {
  state.activeTab = tab;
  const showOrders = tab === "orders";
  const showResidues = tab === "residues";
  const showResults = tab === "results";
  elements.ordersView.hidden = !showOrders;
  elements.residueView.hidden = !showResidues;
  elements.resultsView.hidden = !showResults;
  elements.ordersTab.classList.toggle("is-active", showOrders);
  elements.residueTab.classList.toggle("is-active", showResidues);
  elements.resultsTab.classList.toggle("is-active", showResults);
  elements.ordersTab.setAttribute("aria-selected", String(showOrders));
  elements.residueTab.setAttribute("aria-selected", String(showResidues));
  elements.resultsTab.setAttribute("aria-selected", String(showResults));
}

function updateFlow(activeStep) {
  document.querySelectorAll(".flow-step").forEach((step) => {
    const index = Number(step.dataset.step);
    step.classList.toggle("is-active", index === activeStep);
    step.classList.toggle("is-done", index < activeStep || (activeStep === 1 && index === 0));
  });
}

function setMessage(type, message, mode = "") {
  elements.messageType.textContent = type;
  elements.statusMessage.textContent = message;
  elements.statusBox.className = `status-message${mode ? ` is-${mode}` : ""}`;
}

function syncControls() {
  const isSelecting = state.phase === "select";
  elements.receiptButton.disabled = !isSelecting;
  elements.cutButton.disabled = !isSelecting || state.selectedIds.size === 0;
  elements.clearSelectionButton.disabled = !isSelecting || state.selectedIds.size === 0;
  elements.completeButton.disabled = state.phase !== "cutting";
  elements.residueProcessButton.disabled = state.phase !== "decision";
  elements.noResidueButton.disabled = state.phase !== "decision";
  elements.residueConfirmButton.disabled = state.phase !== "residue-entry";
  const enteringResidue = state.phase === "residue-entry";
  elements.residueWidth.disabled = !enteringResidue;
  elements.residueHeight.disabled = !enteringResidue;
  elements.residueEntry.classList.toggle("is-active", enteringResidue);
  elements.residueStatus.textContent = enteringResidue ? "크기 입력 중" : state.phase === "decision" ? "처리 선택" : "처리 대기";
  elements.inputGuide.textContent = enteringResidue ? "팝업에서 잔재 크기를 입력하고 확정하세요." : "잔재 처리 선택 시 팝업에서 크기를 입력합니다.";
  if (!enteringResidue) elements.popupInputGuide.classList.remove("is-error");
}

function renderAll() {
  renderOrders();
  renderResidues();
  renderResults();
  renderDetail();
  syncControls();
}

function toggleSelection(id) {
  if (state.phase !== "select") return;
  const order = state.data.orders.find((item) => item.id === id);
  if (!order || order.qty <= 0) return;
  if (state.selectedIds.has(id)) {
    clearSelection();
    return;
  }
  state.inventoryChange = null;
  state.selectedIds.clear();
  state.selectedIds.add(id);
  renderAll();
  setMessage("준비", "자재 1건이 선택되었습니다. 자재 절단을 누르세요.", "working");
}

function clearSelection() {
  if (state.phase !== "select") return;
  state.selectedIds.clear();
  renderAll();
  setMessage("대기", "작업할 자재를 선택하거나 자재 입고를 진행하세요.");
}

function handleSelectionClick(event, row, id) {
  if (!row || !id || state.phase !== "select") return;
  if (event.target.closest('input[type="radio"]')) {
    if (state.selectedIds.has(id)) {
      event.preventDefault();
      clearSelection();
    }
    return;
  }
  toggleSelection(id);
}

function startCutting() {
  state.phase = "cutting";
  updateFlow(2);
  setMessage("절단", `${state.selectedIds.size}건의 자재 절단을 진행 중입니다. 완료 후 절단 완료를 누르세요.`, "working");
  renderAll();
}

function completeCutting() {
  state.queue = [...state.selectedIds].map((id) => {
    const order = state.data.orders.find((item) => item.id === id);
    return order ? { ...order } : null;
  }).filter(Boolean);

  state.queue.forEach((queued) => {
    const order = state.data.orders.find((item) => item.id === queued.id);
    if (!order || order.qty <= 0) return;
    const beforeQty = order.qty;
    if (order.source === "residue") {
      const residue = state.data.residues.find((item) => item.id === order.residueId);
      if (residue && residue.qty > 0) {
        residue.qty -= 1;
        residue.status = residue.qty > 0 ? "가용" : "소진";
        order.qty = residue.qty;
      }
    } else {
      order.qty -= 1;
    }
    state.inventoryChange = {
      materialCode: order.materialCode,
      beforeQty,
      afterQty: order.qty,
      unit: order.source === "sheet" ? "장" : "개",
      result: "절단 수량 1 차감",
      status: "반영",
    };
  });
  saveData();
  state.queueIndex = 0;
  state.phase = "decision";
  updateFlow(4);
  setMessage("판단", "현재 자재의 잔재 처리 또는 잔재 미처리를 선택하세요.", "alert");
  renderAll();
}

function beginResidueEntry() {
  const current = getCurrentMaterial();
  if (!current) return;
  state.phase = "residue-entry";
  elements.residueWidth.value = "";
  elements.residueHeight.value = "";
  elements.popupInputGuide.textContent = "원자재보다 작은 잔재 가로·세로 길이를 입력하세요.";
  elements.popupInputGuide.classList.remove("is-error");
  elements.residueDialogCode.textContent = current.materialCode;
  elements.residueDialogSourceSize.textContent = `원자재 크기 ${current.width.toLocaleString()} × ${current.height.toLocaleString()} mm`;
  updateFlow(5);
  setMessage("입력", "잔재 크기를 입력한 뒤 잔재 확정을 누르세요.", "working");
  renderAll();
  elements.residueSizeDialog.showModal();
  elements.residueWidth.focus();
}

function cancelResidueEntry() {
  elements.residueSizeDialog.close();
  state.phase = "decision";
  updateFlow(4);
  setMessage("판단", "잔재 처리 또는 잔재 미처리를 다시 선택하세요.", "alert");
  renderAll();
}

function validateResidueSize() {
  const current = getCurrentMaterial();
  const width = Number(elements.residueWidth.value);
  const height = Number(elements.residueHeight.value);
  let message = "";
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) message = "가로와 세로를 1mm 이상의 정수로 입력하세요.";
  else if (width > current.width || height > current.height) message = "잔재 크기는 원자재 크기를 초과할 수 없습니다.";
  else if (width === current.width && height === current.height) message = "가로 또는 세로 중 한 변은 원자재보다 작아야 합니다.";

  elements.popupInputGuide.textContent = message || "입력값이 확인되었습니다.";
  elements.popupInputGuide.classList.toggle("is-error", Boolean(message));
  return message ? null : { width, height };
}

function confirmResidue() {
  const size = validateResidueSize();
  if (!size) {
    setMessage("오류", "잔재 크기를 확인해 주세요.", "alert");
    return;
  }
  const current = getCurrentMaterial();
  state.data.residueSequence += 1;
  const residue = {
    id: `R-${formatDateKey()}-${String(state.data.residueSequence).padStart(3, "0")}`,
    originalCode: current.materialCode,
    steel: current.steel,
    supplier: current.supplier,
    thickness: current.thickness,
    width: size.width,
    height: size.height,
    qty: 1,
    registeredAt: formatIsoDate(),
    status: "가용",
  };
  state.data.residues.unshift(residue);
  state.data.orders.unshift(makeResidueOrder(residue));
  if (state.inventoryChange) {
    state.inventoryChange.result = "절단 -1 · 잔재 +1 등록";
    state.inventoryChange.status = "완료";
  }
  saveData();
  elements.residueSizeDialog.close();
  advanceQueue(true);
}

function registerNoResidueResult() {
  const current = getCurrentMaterial();
  if (!current) return;
  if (state.inventoryChange) {
    state.inventoryChange.result = "절단 -1 · 잔재 미등록";
    state.inventoryChange.status = "완료";
  }
  state.data.resultSequence += 1;
  state.data.results.unshift({
    id: `CUT-${formatDateKey()}-${String(state.data.resultSequence).padStart(3, "0")}`,
    completedAt: formatDateTime(),
    workOrderId: current.id,
    materialCode: current.materialCode,
    steel: current.steel,
    thickness: current.thickness,
    width: current.width,
    height: current.height,
    source: current.source,
    result: "잔재 미처리",
    operator: window.getCurrentOperator?.() || "조병철",
  });
  saveData();
}

function openNoResidueConfirmation() {
  const current = getCurrentMaterial();
  if (!current) return;
  elements.noResidueCode.textContent = current.materialCode;
  elements.noResidueDialog.showModal();
}

function advanceQueue(registered) {
  const completedCode = state.queue[state.queueIndex]?.materialCode || "자재";
  state.queueIndex += 1;
  elements.residueWidth.value = "";
  elements.residueHeight.value = "";
  elements.popupInputGuide.textContent = "원자재보다 작은 잔재 가로·세로 길이를 입력하세요.";

  if (state.queueIndex >= state.queue.length) {
    const total = state.queue.length;
    state.phase = "select";
    state.queue = [];
    state.queueIndex = 0;
    state.selectedIds.clear();
    updateFlow(1);
    setMessage("완료", `${total}건의 절단 및 잔재 판단이 완료되었습니다.`, "complete");
    renderAll();
    return;
  }

  state.phase = "decision";
  updateFlow(4);
  setMessage(registered ? "등록" : "미처리", `${completedCode} 처리가 완료되었습니다. 다음 자재의 잔재 처리 여부를 선택하세요.`, "working");
  renderAll();
}

function updateCodePreview() {
  elements.codePreview.textContent = makeMaterialCode({ steel: elements.steelInput.value, thickness: elements.thicknessInput.value, width: elements.widthInput.value, height: elements.heightInput.value });
}

elements.todayText.textContent = formatToday();
elements.ordersTab.addEventListener("click", () => setTab("orders"));
elements.residueTab.addEventListener("click", () => setTab("residues"));
elements.resultsTab.addEventListener("click", () => setTab("results"));

elements.orderRows.addEventListener("change", (event) => {
  if (!event.target.matches('input[type="radio"]')) return;
  const row = event.target.closest("tr");
  if (row) toggleSelection(row.dataset.id);
});

elements.orderRows.addEventListener("click", (event) => {
  const row = event.target.closest("tr");
  handleSelectionClick(event, row, row?.dataset.id);
});

elements.residueRows.addEventListener("change", (event) => {
  if (!event.target.matches('input[type="radio"]')) return;
  const row = event.target.closest("tr");
  if (row?.dataset.orderId) toggleSelection(row.dataset.orderId);
});

elements.residueRows.addEventListener("click", (event) => {
  const row = event.target.closest("tr");
  handleSelectionClick(event, row, row?.dataset.orderId);
});

elements.clearSelectionButton.addEventListener("click", clearSelection);

elements.cutButton.addEventListener("click", startCutting);
elements.completeButton.addEventListener("click", completeCutting);
elements.residueProcessButton.addEventListener("click", beginResidueEntry);
elements.noResidueButton.addEventListener("click", openNoResidueConfirmation);
elements.residueConfirmButton.addEventListener("click", confirmResidue);
elements.residueWidth.addEventListener("input", validateResidueSize);
elements.residueHeight.addEventListener("input", validateResidueSize);
elements.confirmNoResidueButton.addEventListener("click", () => {
  elements.noResidueDialog.close();
  registerNoResidueResult();
  advanceQueue(false);
});
elements.changeToResidueButton.addEventListener("click", () => {
  elements.noResidueDialog.close();
  beginResidueEntry();
});
elements.closeResidueDialog.addEventListener("click", cancelResidueEntry);
elements.cancelResidueButton.addEventListener("click", cancelResidueEntry);
elements.residueSizeDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  cancelResidueEntry();
});

elements.receiptButton.addEventListener("click", () => {
  updateCodePreview();
  elements.receiptDialog.showModal();
});

[elements.steelInput, elements.thicknessInput, elements.widthInput, elements.heightInput].forEach((input) => input.addEventListener("input", updateCodePreview));

elements.receiptForm.addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  if (!elements.receiptForm.reportValidity()) return;
  const material = {
    id: `WO-${Date.now()}`,
    receivedAt: formatIsoDate(),
    steel: elements.steelInput.value,
    supplier: elements.supplierInput.value.trim(),
    thickness: Number(elements.thicknessInput.value),
    width: Number(elements.widthInput.value),
    height: Number(elements.heightInput.value),
    qty: Number(elements.quantityInput.value),
    source: "sheet",
  };
  material.materialCode = makeMaterialCode(material);
  state.data.orders.unshift(material);
  state.inventoryChange = {
    materialCode: material.materialCode,
    beforeQty: 0,
    afterQty: material.qty,
    unit: "장",
    result: `자재 입고 +${material.qty}`,
    status: "입고",
  };
  saveData();
  elements.receiptDialog.close();
  setTab("orders");
  updateFlow(1);
  setMessage("입고", `${material.materialCode} 원장 ${material.qty}장이 입고 등록되었습니다.`, "complete");
  renderAll();
});

elements.resetButton.addEventListener("click", () => {
  if (!window.confirm("입고·절단·잔재 데이터를 최초 더미 상태로 되돌릴까요?")) return;
  state.data = cloneInitialData();
  state.selectedIds.clear();
  state.phase = "select";
  state.queue = [];
  state.queueIndex = 0;
  state.inventoryChange = null;
  saveData();
  setTab("orders");
  updateFlow(1);
  setMessage("초기화", "초기 자재 재고 10건과 잔재 재고 3건을 복원하고 작업실적을 초기화했습니다.", "complete");
  renderAll();
});

setTab("orders");
updateFlow(1);
renderAll();
