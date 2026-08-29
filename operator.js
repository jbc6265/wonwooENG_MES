(() => {
  const STORAGE_KEY = "wonwoo-operator-name-v1";
  const DEFAULT_OPERATOR = "조병철";

  function getCurrentOperator() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)?.trim();
      return saved || DEFAULT_OPERATOR;
    } catch (error) {
      console.warn("작업자 정보를 불러오지 못해 기본 작업자를 사용합니다.", error);
      return DEFAULT_OPERATOR;
    }
  }

  function renderOperator(name = getCurrentOperator()) {
    document.querySelectorAll("[data-operator-name]").forEach((element) => {
      element.textContent = name;
    });
  }

  const dialog = document.createElement("dialog");
  dialog.className = "operator-dialog";
  dialog.setAttribute("aria-labelledby", "operatorDialogTitle");
  dialog.innerHTML = `
    <form method="dialog" id="operatorForm">
      <div class="operator-dialog-header">
        <span>MES POP 작업자 설정</span>
        <h2 id="operatorDialogTitle">작업자 이름을 입력하세요</h2>
      </div>
      <div class="operator-dialog-body">
        <label for="operatorNameInput">작업자 이름
          <input id="operatorNameInput" name="operatorName" type="text" maxlength="20" autocomplete="off" placeholder="이름 입력" required />
        </label>
      </div>
      <div class="operator-dialog-actions">
        <button class="operator-dialog-cancel" id="operatorCancelButton" type="button">취소</button>
        <button class="operator-dialog-confirm" type="submit">작업자 적용</button>
      </div>
    </form>
  `;
  document.body.append(dialog);

  const form = dialog.querySelector("#operatorForm");
  const input = dialog.querySelector("#operatorNameInput");
  const cancelButton = dialog.querySelector("#operatorCancelButton");

  document.querySelectorAll(".operator-select-button").forEach((button) => {
    button.addEventListener("click", () => {
      input.value = getCurrentOperator();
      input.setCustomValidity("");
      dialog.showModal();
      window.setTimeout(() => input.select(), 0);
    });
  });

  input.addEventListener("input", () => input.setCustomValidity(""));
  cancelButton.addEventListener("click", () => dialog.close());

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = input.value.trim();
    if (!name) {
      input.setCustomValidity("작업자 이름을 입력하세요.");
      input.reportValidity();
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch (error) {
      console.warn("작업자 정보를 저장하지 못했습니다.", error);
    }
    renderOperator(name);
    dialog.close();
    document.dispatchEvent(new CustomEvent("operatorchange", { detail: { name } }));
  });

  window.getCurrentOperator = getCurrentOperator;
  renderOperator();
})();
