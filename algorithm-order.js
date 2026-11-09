(() => {
  // Fixed session times make empty-field cases repeatable in the prototype.
  const sampleSession = { start: "2026-11-09T10:20", end: "2026-11-09T15:00" };
  function open({ direction, price, quantity, onConfirm }) {
    const dialog = document.createElement("dialog");
    dialog.className = "ticket-settings";
    dialog.setAttribute("aria-labelledby", "algoTitle");
    dialog.innerHTML = `<form><header><strong id="algoTitle">订单确认</strong><button type="button" data-dismiss aria-label="关闭">×</button></header>
      <div class="ticket-settings-body">
        <p>${direction} · ${price} · ${quantity} · TWAP</p>
        <label class="ticket-setting-row">开始时间<input type="datetime-local" name="start"></label><small>不填写默认发单时间</small>
        <label class="ticket-setting-row">结束时间<input type="datetime-local" name="end"></label><small>不填写默认收盘时间</small>
        <label class="ticket-setting-row">市场成交占比（%）<input type="number" name="share" min="0" max="100" step="1"></label>
        <p class="algorithm-error" role="alert"></p>
      </div><footer><button type="button" data-dismiss>返回修改</button><button type="submit" class="ticket-save">确认发送</button></footer></form>`;
    const form = dialog.querySelector("form");
    function validate() {
      const start = form.elements.start.value || sampleSession.start;
      const end = form.elements.end.value || sampleSession.end;
      const valid = new Date(end) - new Date(start) > 60_000;
      dialog.querySelector(".algorithm-error").textContent = valid ? "" : "起止时间间隔必须大于1分钟";
      return valid;
    }
    form.addEventListener("change", validate);
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!validate()) return;
      dialog.close();
      onConfirm();
    });
    dialog.querySelectorAll("[data-dismiss]").forEach(button => button.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("close", () => dialog.remove());
    document.body.append(dialog);
    dialog.showModal();
  }
  window.AlgorithmOrder = { open };
})();
