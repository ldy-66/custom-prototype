const state = {
  direction: "buy",
  price: 10.8,
  quantity: 100,
  orders: [],
  holdingsView: "summary",
  holdingsMode: "客户+渠道",
  holdingsAppliedMode: "客户+渠道",
  holdingsBoard: "全部",
  holdingsAppliedBoard: "全部",
  holdingsStart: "2026-10-21",
  holdingsEnd: "2026-10-22",
  holdingsSymbol: "",
  holdingsAppliedSymbol: "",
  holdingsModal: null,
};

const priceInput = document.querySelector("#priceInput");
const quantityInput = document.querySelector("#quantityInput");
const estimateValue = document.querySelector("#estimateValue");
const submitOrder = document.querySelector("#submitOrder");
const orderRows = document.querySelector("#orderRows");
const allCount = document.querySelector("#allCount");
const pendingCount = document.querySelector("#pendingCount");
const toast = document.querySelector("#toast");
const workspace = document.querySelector(".workspace");
const tradeWorkspace = document.querySelectorAll("[data-trade-workspace]");
const holdingsPage = document.querySelector("#holdingsPage");
const holdingsContent = document.querySelector("#holdingsContent");
const holdingsModalRoot = document.querySelector("#holdingsModalRoot");

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    const view = button.dataset.view;
    if (view === "system") {
      notify(`${button.textContent.trim()}模块将在对应需求分支继续复刻`);
      return;
    }
    document.querySelectorAll(".nav-item:not(.system)").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    const isDataView = view === "data";
    workspace.classList.toggle("data-mode", isDataView);
    tradeWorkspace.forEach(section => { section.hidden = isDataView; });
    holdingsPage.hidden = !isDataView;
  });
});

const holdingsRecords = [
  { board: "主板", customer: "演示客户01", channel: "QFII-DEMO", symbol: "000001.SZ", name: "平安银行", market: "深交所", opening: 120000, position: 130000, t0: 85000, frozen: 5000, t1: 12000 },
  { board: "主板", customer: "演示客户02", channel: "CHANNEL-B", symbol: "000001.SZ", name: "平安银行", market: "深交所", opening: 60000, position: 55000, t0: 40000, frozen: 3000, t1: 12000 },
  { board: "主板", customer: "演示客户01", channel: "CHANNEL-B", symbol: "600000.SH", name: "浦发银行", market: "上交所", opening: 80000, position: 78000, t0: 65000, frozen: 2000, t1: 11000 },
  { board: "科创板", customer: "演示客户03", channel: "QFII-DEMO", symbol: "688001.SH", name: "华兴源创", market: "上交所", opening: 8000, position: 9000, t0: 6000, frozen: 500, t1: 2500 },
  { board: "创业板", customer: "演示客户02", channel: "CHANNEL-B", symbol: "300750.SZ", name: "宁德时代", market: "深交所", opening: 10000, position: 10000, t0: 8000, frozen: 1000, t1: 1000 },
  { board: "港股", customer: "演示客户04", channel: "HK-DEMO", symbol: "00700.HK", name: "腾讯控股", market: "港交所", opening: 1000, position: 1200, t0: 800, frozen: 100, t1: 300 },
  { board: "美股", customer: "演示客户04", channel: "US-DEMO", symbol: "AAPL.US", name: "Apple", market: "NASDAQ", opening: 500, position: 550, t0: 550, frozen: 0, t1: 0 },
];

const holdingsTrades = [
  { board: "主板", symbol: "000001.SZ", order: "ORD-DEMO-001", trade: "EXEC-DEMO-001", date: "2026-10-22", direction: "买入", quantity: 2000, position: 130000 },
  { board: "主板", symbol: "000001.SZ", order: "ORD-DEMO-002", trade: "EXEC-DEMO-002", date: "2026-10-22", direction: "卖出", quantity: 1000, position: 55000 },
  { board: "主板", symbol: "600000.SH", order: "ORD-DEMO-003", trade: "EXEC-DEMO-003", date: "2026-10-21", direction: "买入", quantity: 3000, position: 78000 },
  { board: "科创板", symbol: "688001.SH", order: "ORD-DEMO-004", trade: "EXEC-DEMO-004", date: "2026-10-22", direction: "买入", quantity: 1000, position: 9000 },
  { board: "创业板", symbol: "300750.SZ", order: "ORD-DEMO-005", trade: "EXEC-DEMO-005", date: "2026-10-21", direction: "卖出", quantity: 500, position: 10000 },
  { board: "港股", symbol: "00700.HK", order: "ORD-DEMO-006", trade: "EXEC-DEMO-006", date: "2026-10-22", direction: "买入", quantity: 200, position: 1200 },
  { board: "美股", symbol: "AAPL.US", order: "ORD-DEMO-007", trade: "EXEC-DEMO-007", date: "2026-10-22", direction: "买入", quantity: 50, position: 550 },
];

function formatHoldingNumber(value) {
  return Number(value).toLocaleString("zh-CN");
}

function holdingsTable(columns, rows, summary) {
  return `<div class="data-table-scroll holdings-result"><table class="data-table holdings-table"><thead><tr><th>序号</th>${columns.map(column => `<th>${column}</th>`).join("")}</tr></thead><tbody>${rows.map((row, index) => `<tr class="${index === 0 ? "selected" : ""}"><td>${index + 1}</td>${row.map(value => `<td>${value}</td>`).join("")}</tr>`).join("")}</tbody></table>${rows.length ? "" : `<div class="holdings-empty">暂无符合条件的持仓记录</div>`}</div><div class="holdings-summary-line">${summary} · 共 ${rows.length} 条</div>`;
}

function holdingsSummaryRows(mode, board) {
  const groupFields = {
    "客户+渠道": ["customer", "channel", "symbol", "name", "market"],
    "客户+标的": ["customer", "symbol", "name", "market"],
    "渠道+标的": ["channel", "symbol", "name", "market"],
    "标的汇总": ["symbol", "name", "market"],
  };
  const fieldLabels = { customer: "客户", channel: "渠道", symbol: "标的代码", name: "简称", market: "市场" };
  const valueLabels = { opening: "期初持仓数量", position: "持仓数量", t0: "可用数量（T+0）", frozen: "冻结数量", t1: "可用数量（T+1）" };
  const fields = groupFields[mode] || groupFields["客户+渠道"];
  const groups = new Map();
  holdingsRecords.filter(row => board === "全部" || row.board === board).forEach(row => {
    const key = fields.map(field => row[field]).join("|");
    if (!groups.has(key)) groups.set(key, { ...Object.fromEntries(fields.map(field => [field, row[field]])), opening: 0, position: 0, t0: 0, frozen: 0, t1: 0 });
    const group = groups.get(key);
    ["opening", "position", "t0", "frozen", "t1"].forEach(field => group[field] += row[field]);
  });
  return {
    columns: [...fields.map(field => fieldLabels[field]), ...Object.values(valueLabels)],
    rows: [...groups.values()].map(group => [...fields.map(field => group[field]), ...Object.keys(valueLabels).map(field => formatHoldingNumber(group[field]))]),
    totals: ["opening", "position", "t0", "frozen", "t1"].map(field => holdingsRecords.filter(row => board === "全部" || row.board === board).reduce((sum, row) => sum + row[field], 0)),
  };
}

function renderHoldings() {
  const boards = ["全部", "主板", "科创板", "创业板", "港股", "美股"];
  const modes = ["客户+渠道", "客户+标的", "渠道+标的", "标的汇总"];
  const boardOptions = boards.map(board => `<option ${board === state.holdingsBoard ? "selected" : ""}>${board}</option>`).join("");
  const modeOptions = modes.map(mode => `<option ${mode === state.holdingsMode ? "selected" : ""}>${mode}</option>`).join("");
  const tabs = `<div class="holdings-subtabs"><button type="button" data-holdings-view="summary" class="${state.holdingsView === "summary" ? "active" : ""}">持仓汇总</button><button type="button" data-holdings-view="query" class="${state.holdingsView === "query" ? "active" : ""}">持仓查询</button><span>演示数据</span></div>`;
  if (state.holdingsView === "summary") {
    const result = holdingsSummaryRows(state.holdingsAppliedMode, state.holdingsAppliedBoard);
    const totalText = ["期初持仓", "持仓", "可用（T+0）", "冻结", "可用（T+1）"].map((label, index) => `${label} ${formatHoldingNumber(result.totals[index])}`).join("　");
    holdingsContent.innerHTML = `${tabs}<div class="holdings-toolbar">
      <label>持仓日期<input type="date" value="2026-10-22"></label>
      <label>汇总方式<select data-holdings-mode>${modeOptions}</select></label>
      <label>板块<select data-holdings-board>${boardOptions}</select></label>
      <button class="holdings-search" type="button" data-holdings-query>查询</button><button class="holdings-export" type="button" data-holdings-export>导出</button>
    </div>${holdingsTable(result.columns, result.rows, `持仓汇总 · ${state.holdingsAppliedMode}　合计：${totalText}`)}`;
  } else {
    const rows = holdingsTrades.filter(row => (state.holdingsAppliedBoard === "全部" || row.board === state.holdingsAppliedBoard) && row.date >= state.holdingsStart && row.date <= state.holdingsEnd && (!state.holdingsAppliedSymbol || row.symbol.toLowerCase().includes(state.holdingsAppliedSymbol.toLowerCase())))
      .map(row => [row.symbol, `<button class="holdings-link" data-holdings-detail="order">${row.order}</button>`, `<button class="holdings-link" data-holdings-detail="trade">${row.trade}</button>`, row.date, row.direction, formatHoldingNumber(row.quantity), formatHoldingNumber(row.position)]);
    holdingsContent.innerHTML = `${tabs}<div class="holdings-toolbar">
      <label>交易日期<input type="date" data-holdings-start value="${state.holdingsStart}"></label><span class="holdings-range">至</span>
      <label><span class="visually-hidden">结束日期</span><input type="date" data-holdings-end value="${state.holdingsEnd}"></label>
      <label>板块<select data-holdings-board>${boardOptions}</select></label><label>标的代码<input placeholder="标的代码" data-holdings-symbol value="${state.holdingsSymbol}"></label>
      <button class="holdings-search" type="button" data-holdings-query>查询</button><button class="holdings-export" type="button" data-holdings-export>导出</button>
    </div>${holdingsTable(["标的代码", "订单编号", "成交编号", "交易日期", "交易方向", "交易数量", "持仓数量"], rows, "持仓交易明细")}`;
  }
  holdingsModalRoot.innerHTML = state.holdingsModal ? renderHoldingsModal(state.holdingsModal) : "";
}

function renderHoldingsModal(type) {
  const isOrder = type === "order";
  const title = isOrder ? "订单详情" : "交易详情";
  const facts = isOrder
    ? [["交易员", "DEMO交易员01"], ["资金账号", "DEMO-1001"], ["对冲渠道", "QFII-DEMO"], ["提交时间", "2026-10-22 10:18:20"], ["委托价格", "10.80"], ["委托数量", "2,000"], ["交易方式", "普通交易"], ["算法策略", "TWAP（演示）"], ["委托方式", "限价单"], ["成交数量", "2,000"], ["成交均价", "10.78"], ["交易方向", "买入"], ["累计利息", "--"], ["框架", "DEMO-FRAME"]]
    : [["交易员", "DEMO交易员01"], ["资金账号", "DEMO-1001"], ["对冲渠道", "QFII-DEMO"], ["提交时间", "2026-10-22 10:18:20"], ["成交价格", "10.78"], ["成交数量", "2,000"], ["交易方式", "普通交易"], ["算法策略", "TWAP（演示）"], ["委托方式", "限价单"]];
  const logs = isOrder
    ? [["2026-10-22 10:19:02", "QFII-DEMO", "成交反馈", "成交数量 2,000；成交编号 EXEC-DEMO-001"], ["2026-10-22 10:18:45", "审批员A", "审批", "审批通过"], ["2026-10-22 10:18:30", "DEMO交易员01", "修改", "委托数量：1,500 → 2,000"], ["2026-10-22 10:18:21", "QFII-DEMO", "错误反馈", "渠道返回演示异常：价格精度不符合要求，调整后重新提交"], ["2026-10-22 10:18:20", "DEMO交易员01", "提交", "备注：演示订单"]]
    : [["2026-10-22 10:19:02", "QFII-DEMO", "成交反馈", "成交数量 2,000；成交编号 EXEC-DEMO-001"], ["2026-10-22 10:18:30", "DEMO交易员01", "修改", "成交数量：1,500 → 2,000"], ["2026-10-22 10:18:21", "QFII-DEMO", "错误反馈", "渠道返回演示异常：价格精度不符合要求，调整后重新提交"], ["2026-10-22 10:18:20", "DEMO交易员01", "提交", "备注：演示成交"]];
  const table = rows => `<div class="holdings-modal-table"><table class="data-table"><thead><tr>${rows[0].map(value => `<th>${value}</th>`).join("")}</tr></thead><tbody>${rows.slice(1).map(row => `<tr>${row.map(value => `<td>${value}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  return `<div class="holdings-modal-mask"><section class="holdings-dialog"><header><h2>${title}</h2><button type="button" data-holdings-close aria-label="关闭">×</button></header><div class="holdings-dialog-body">
    <div class="holdings-facts">${facts.map(([label, value]) => `<div><span>${label}</span><b>${value}</b></div>`).join("")}</div>
    <h3>日志（按更新时间倒序）</h3>${table([["事件时间", "操作人", "事件名称", "事件内容"], ...logs])}
    ${isOrder ? `<h3>子单成交信息</h3>${table([["代码", "成交编号", "交易日期", "交易方向", "交易数量"], ["000001.SZ", "EXEC-DEMO-001", "2026-10-22", "买入", "2,000"]])}` : ""}
    <p class="holdings-demo-footnote">演示详情；事件内容用于展示交互，最终字段以需求确认及接口数据为准。</p>
  </div><footer><button type="button" data-holdings-close>关闭</button></footer></section></div>`;
}

holdingsPage.addEventListener("change", event => {
  if (event.target.matches("[data-holdings-mode]")) state.holdingsMode = event.target.value;
  if (event.target.matches("[data-holdings-board]")) state.holdingsBoard = event.target.value;
  if (event.target.matches("[data-holdings-start]")) state.holdingsStart = event.target.value;
  if (event.target.matches("[data-holdings-end]")) state.holdingsEnd = event.target.value;
});

holdingsPage.addEventListener("input", event => {
  if (event.target.matches("[data-holdings-symbol]")) state.holdingsSymbol = event.target.value;
});

holdingsPage.addEventListener("click", event => {
  const viewButton = event.target.closest("[data-holdings-view]");
  if (viewButton) { state.holdingsView = viewButton.dataset.holdingsView; renderHoldings(); return; }
  if (event.target.closest("[data-holdings-query]")) { state.holdingsAppliedBoard = state.holdingsBoard; state.holdingsAppliedMode = state.holdingsMode; state.holdingsAppliedSymbol = state.holdingsSymbol; renderHoldings(); notify("持仓查询条件已应用（演示数据）"); return; }
  if (event.target.closest("[data-holdings-export]")) { notify("当前持仓结果已生成演示导出"); return; }
  const detailButton = event.target.closest("[data-holdings-detail]");
  if (detailButton) { state.holdingsModal = detailButton.dataset.holdingsDetail; renderHoldings(); return; }
  if (event.target.closest("[data-holdings-close]")) { state.holdingsModal = null; renderHoldings(); }
});

holdingsModalRoot.addEventListener("click", event => {
  if (event.target.closest("[data-holdings-close]")) { state.holdingsModal = null; renderHoldings(); }
});

document.querySelectorAll(".order-tabs button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".order-tabs button").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    notify(`已切换为${button.textContent.trim()}`);
  });
});

document.querySelectorAll("[data-direction]").forEach(button => {
  button.addEventListener("click", () => setDirection(button.dataset.direction));
});

document.querySelectorAll("[data-step]").forEach(button => {
  button.addEventListener("click", () => {
    const delta = Number(button.dataset.delta);
    if (button.dataset.step === "price") {
      state.price = Math.max(0, Number((state.price + delta).toFixed(2)));
      priceInput.value = state.price.toFixed(2);
    } else {
      state.quantity = Math.max(0, state.quantity + delta);
      quantityInput.value = state.quantity;
    }
    updateEstimate();
  });
});

priceInput.addEventListener("input", () => {
  state.price = Number(priceInput.value) || 0;
  updateEstimate();
});

quantityInput.addEventListener("input", () => {
  state.quantity = Math.max(0, Number.parseInt(quantityInput.value || "0", 10));
  updateEstimate();
});

document.querySelectorAll("[data-ratio]").forEach(button => {
  button.addEventListener("click", () => {
    state.quantity = Math.floor((25000 * Number(button.dataset.ratio)) / 100) * 100;
    quantityInput.value = state.quantity;
    updateEstimate();
  });
});

document.querySelector("#expandOrder").addEventListener("click", event => {
  const extra = document.querySelector("#orderExtra");
  extra.hidden = !extra.hidden;
  event.currentTarget.classList.toggle("open", !extra.hidden);
  event.currentTarget.childNodes[0].textContent = extra.hidden ? "展开 " : "收起 ";
});

submitOrder.addEventListener("click", () => {
  if (!state.price || !state.quantity) {
    notify("请输入有效的委托价格和数量");
    return;
  }
  state.orders.unshift({
    id: state.orders.length + 1,
    account: "DEMO-04501",
    type: "限价单",
    symbol: "000001.SZ",
    name: "平安银行",
    direction: state.direction === "buy" ? "买入" : "卖出",
    price: state.price.toFixed(2),
    quantity: state.quantity.toLocaleString("zh-CN"),
    mode: "LowTouch",
    status: "已提交",
  });
  renderOrders();
  notify(`${state.direction === "buy" ? "买入" : "卖出"}委托已提交`);
});

document.querySelector("#batchOrder").addEventListener("click", () => notify("请选择待批量下单的委托"));

function setDirection(direction) {
  state.direction = direction;
  const wrapper = document.querySelector(".direction-switch");
  wrapper.classList.toggle("sell", direction === "sell");
  wrapper.querySelectorAll("button").forEach(button => button.classList.toggle("active", button.dataset.direction === direction));
  submitOrder.textContent = direction === "buy" ? "买入" : "卖出";
  submitOrder.classList.toggle("sell", direction === "sell");
}

function updateEstimate() {
  estimateValue.textContent = (state.price * state.quantity).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderOrders() {
  allCount.textContent = state.orders.length;
  pendingCount.textContent = state.orders.length;
  if (!state.orders.length) {
    orderRows.innerHTML = '<tr class="empty-row"><td colspan="13">暂无委托</td></tr>';
    return;
  }
  orderRows.innerHTML = state.orders.map((order, index) => `
    <tr>
      <td>${index + 1}</td><td>□</td><td>${order.account}</td><td>${order.type}</td><td>${order.symbol}</td><td>${order.name}</td>
      <td class="${order.direction === "买入" ? "orange" : "green"}">${order.direction}</td><td>${order.price}</td><td>${order.quantity}</td><td>${order.mode}</td><td>${order.status}</td><td>--</td><td>0</td>
    </tr>`).join("");
}

let toastTimer;
function notify(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

updateEstimate();
renderOrders();
renderHoldings();
