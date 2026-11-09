(() => {
  const panels = [
    ["retained", "保留字段"], ["numbers", "常用数字"],
    ["protection", "操作保护"], ["futures", "期货交易"],
  ];
  const escape = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function load(key, defaults) {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(key)) }; }
    catch { return { ...defaults }; }
  }

  function open({ key, values, fields, onSave }) {
    const opener = document.activeElement;
    const dialog = document.createElement("dialog");
    dialog.className = "ticket-settings";
    dialog.setAttribute("aria-labelledby", "ticketSettingsTitle");
    dialog.innerHTML = `<form><header><strong id="ticketSettingsTitle">自定义设置</strong><button type="button" data-dismiss aria-label="关闭">×</button></header>
      <nav aria-label="自定义设置分类">${panels.map(([id, label]) => `<button type="button" data-tab="${id}">${label}</button>`).join("")}</nav>
      <div class="ticket-settings-body">
        <section data-panel="retained"><p>订单下达后下单面板保留的要素</p><div class="ticket-keep">${fields.map(label => `<label><input type="checkbox" data-keep value="${escape(label)}" ${values.keep.includes(label) ? "checked" : ""}>${escape(label)}</label>`).join("")}</div></section>
        <section data-panel="numbers"><p>常用数量（手）</p><div class="ticket-numbers">${[0,1,2,3].map(i => `<input type="number" min="1" step="1" data-number aria-label="常用数量 ${i + 1}" value="${values.quantities[i] ?? ""}">`).join("")}</div></section>
        <section data-panel="protection"><p>允许鼠标滚轮调整</p>
          <label class="ticket-setting-row">委托价格<input class="ticket-switch" type="checkbox" role="switch" name="priceWheel" ${values.priceWheel ? "checked" : ""}></label>
          <label class="ticket-setting-row">委托数量<input class="ticket-switch" type="checkbox" role="switch" name="quantityWheel" ${values.quantityWheel ? "checked" : ""}></label>
        </section>
        <section data-panel="futures"><fieldset class="ticket-setting-row"><legend>自动开平优先级</legend>
          ${[["today","优先平今"],["yesterday","优先平昨"]].map(([id,label]) => `<label><input type="radio" name="priority" value="${id}" ${values.priority === id ? "checked" : ""}>${label}</label>`).join("")}
        </fieldset></section>
      </div><footer><button type="button" data-dismiss>取消</button><button type="submit" class="ticket-save">保存</button></footer>
    </form>`;
    function select(tab) {
      dialog.querySelectorAll("[data-tab]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.tab === tab)));
      dialog.querySelectorAll("[data-panel]").forEach(section => { section.hidden = section.dataset.panel !== tab; });
    }
    dialog.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click", () => select(button.dataset.tab)));
    dialog.querySelectorAll("[data-dismiss]").forEach(button => button.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("close", () => { dialog.remove(); if (opener?.isConnected) opener.focus(); });
    const form = dialog.querySelector("form");
    form.addEventListener("invalid", () => select("numbers"), true);
    form.addEventListener("submit", event => {
      event.preventDefault();
      const next = {
        keep: [...form.querySelectorAll("[data-keep]:checked")].map(input => input.value),
        quantities: [...form.querySelectorAll("[data-number]")].map(input => input.value ? input.valueAsNumber : null),
        priceWheel: form.elements.priceWheel.checked,
        quantityWheel: form.elements.quantityWheel.checked,
        priority: form.elements.priority.value,
      };
      localStorage.setItem(key, JSON.stringify(next));
      dialog.close();
      onSave(next);
    });
    select("retained");
    document.body.append(dialog);
    dialog.showModal();
  }

  function bindWheel(input, enabled, step, apply) {
    if (!input) return;
    input.addEventListener("wheel", event => {
      if (!enabled || document.activeElement !== input || !event.deltaY) return;
      event.preventDefault();
      const value = Number(input.value) || step;
      const next = Math.max(step, Number((value + (event.deltaY < 0 ? step : -step)).toFixed(6)));
      input.value = next;
      apply(next);
    }, { passive: false });
  }
  function quantityButtons(values, attribute) {
    return values.filter(Number.isSafeInteger).map(value => `<button type="button" ${attribute}="${value}">${value} 手</button>`).join("");
  }
  window.TicketSettings = { load, open, bindWheel, quantityButtons };
})();
