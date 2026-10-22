const state = {
  view: "trade",
  positionMode: "明细",
  positionMarket: "证券",
  direction: "buy",
  price: 10.8,
  quantity: 100,
  orders: [],
};

const priceInput = document.querySelector("#priceInput");
const quantityInput = document.querySelector("#quantityInput");
const estimateValue = document.querySelector("#estimateValue");
const submitOrder = document.querySelector("#submitOrder");
const orderRows = document.querySelector("#orderRows");
const allCount = document.querySelector("#allCount");
const pendingCount = document.querySelector("#pendingCount");
const toast = document.querySelector("#toast");
const dataWorkspace = document.querySelector("#dataWorkspace");

const holdingColumns = {
  "对客": ["客户名称", "客户名", "交易账户", "交易对手号", "交易对手名称", "交易对手简称", "资金账户号", "资金账号", "资金账号名称", "框架名称", "证券代码", "证券名称", "合约代码", "合约名称", "上市状态", "可用数量", "持仓数量", "成本价", "持仓均价", "最新价", "持仓盈亏", "持仓盈亏率", "持仓市值", "期初数量", "交易冻结数量", "日内开仓成交数量", "日内平仓成交数量", "持仓类型", "业务类型"],
  "对冲": ["交易对手号", "交易对手名称", "客户名称", "客户名", "交易账户", "交易对手简称", "资金账户号", "资金账号", "资金账号名称", "框架名称", "证券代码", "证券名称", "合约代码", "合约名称", "上市状态", "对冲渠道", "对冲方资金账号", "可用数量", "持仓数量", "持仓均价", "最新价", "持仓市值", "期初数量", "日间开仓数量", "日间平仓数量", "交易冻结数量", "持仓类型", "业务类型"],
  "明细": ["客户名称", "客户名", "交易账户", "交易对手号", "交易对手名称", "交易对手简称", "资金账户号", "资金账号", "资金账号名称", "框架名称", "证券代码", "证券名称", "合约代码", "合约名称", "上市状态", "开仓日期", "开仓均价", "期初数量", "持仓数量", "初保比例", "期初汇率", "平仓盈亏", "开仓费率", "平仓费率", "单位待实现利率收益", "持仓类型", "业务类型"],
};

function makePositionRecord(marketType, symbol, name, contractCode, contractName, quantity, available, freeze, value, pnl) {
  const common = {
    "客户名称": "演示客户01", "客户名": "演示客户01", "交易账户": "DEMO-TR01", "交易对手号": "DEMO-PTY01",
    "交易对手名称": "演示交易对手", "交易对手简称": "演示对手", "资金账户号": "DEMO-PA01", "资金账号": "DEMO-1001",
    "资金账号名称": "演示资金账号01", "框架名称": "DEMO-FRAME", "证券代码": symbol, "证券名称": name,
    "合约代码": contractCode, "合约名称": contractName, "上市状态": "已上市", "可用数量": available,
    "持仓数量": quantity, "持仓均价": "10.20", "最新价": "10.80", "持仓市值": value, "期初数量": "100,000",
    "交易冻结数量": freeze, "持仓类型": "多头", "业务类型": marketType === "期货" ? "期货交易" : marketType === "债券" ? "债券交易" : "普通交易",
  };
  return {
    marketType,
    client: { ...common, "成本价": "10.10", "持仓盈亏": pnl, "持仓盈亏率": "5.94%", "日内开仓成交数量": "20,000", "日内平仓成交数量": "0" },
    hedge: { ...common, "对冲渠道": "DEMO-CHANNEL", "对冲方资金账号": "DEMO-HEDGE-01", "日间开仓数量": "20,000", "日间平仓数量": "0" },
    detail: { ...common, "开仓日期": "2026-10-22", "开仓均价": "10.20", "初保比例": "25.00%", "期初汇率": "1.000000", "平仓盈亏": "0.00", "开仓费率": "0.03%", "平仓费率": "0.03%", "单位待实现利率收益": "0.00" },
  };
}

const positionRecords = [
  makePositionRecord("证券", "000001.SZ", "演示证券A", "—", "—", "120,000", "110,000", "2,000", "1,296,000.00", "72,000.00"),
  makePositionRecord("期货", "—", "—", "IF2612.CFE", "演示期货合约", "12", "10", "1", "1,296,000.00", "72,000.00"),
  makePositionRecord("债券", "110001.SH", "演示债券A", "—", "—", "6,000", "5,500", "100", "1,296,000.00", "72,000.00"),
];

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.view === "system") {
      notify("系统设置模块将在对应需求分支继续复刻");
      return;
    }
    state.view = button.dataset.view;
    document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item === button));
    dataWorkspace.hidden = state.view !== "data";
    if (state.view === "data") renderHoldingsPage();
  });
});

document.querySelector("[data-open-holdings]").addEventListener("click", () => document.querySelector('[data-view="data"]').click());

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

function renderHoldingsPage() {
  const columns = holdingColumns[state.positionMode];
  const rows = positionRecords.filter(row => row.marketType === state.positionMarket).map(row => columns.map(column => row[state.positionMode === "对客" ? "client" : state.positionMode === "对冲" ? "hedge" : "detail"][column] ?? "—"));
  dataWorkspace.innerHTML = `<header class="data-page-heading"><div><span>数据查询</span><strong>持仓信息</strong></div><small>当前视图：${state.positionMode}</small></header>
    <div class="holdings-filters">
      <div class="holdings-filter-row"><input aria-label="客户名称" placeholder="客户名称"><input aria-label="客户名" placeholder="客户名"><input aria-label="交易账户" placeholder="交易账户"><input aria-label="交易对手名称" placeholder="交易对手名称"><input aria-label="交易对手简称" placeholder="交易对手简称"></div>
      <div class="holdings-filter-row"><input aria-label="资金账号" placeholder="资金账号"><input aria-label="资金账号名称" placeholder="资金账号名称"><input aria-label="证券代码 / 合约代码" placeholder="证券代码 / 合约代码"><button class="custom-query-button" type="button" data-query-holdings>查询</button><button class="custom-export-button" type="button" data-export-holdings>导出</button></div>
    </div>
    <div class="holdings-controls"><div class="holdings-market-tabs" role="group" aria-label="市场类别">${["证券", "期货", "债券"].map(x=>`<button type="button" data-position-market="${x}" class="${state.positionMarket===x?"active":""}" aria-pressed="${state.positionMarket===x}">${x}</button>`).join("")}</div><div class="holdings-mode-switch" role="radiogroup" aria-label="持仓类型">${["对客", "对冲", "明细"].map(x=>`<button type="button" role="radio" aria-checked="${state.positionMode===x}" data-position-mode="${x}" class="${state.positionMode===x?"active":""}"><span class="radio-dot"></span>${x}</button>`).join("")}</div></div>
    <div class="holdings-grid-wrap"><table class="data-table holdings-table"><thead><tr><th>序号</th>${columns.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map((row,i)=>`<tr class="${i===0?"selected":""}"><td>${i+1}</td>${row.map(v=>`<td>${v}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  dataWorkspace.querySelectorAll("[data-position-mode]").forEach(button => button.addEventListener("click", () => { state.positionMode = button.dataset.positionMode; renderHoldingsPage(); }));
  dataWorkspace.querySelectorAll("[data-position-market]").forEach(button => button.addEventListener("click", () => { state.positionMarket = button.dataset.positionMarket; renderHoldingsPage(); }));
  dataWorkspace.querySelector("[data-query-holdings]").addEventListener("click", () => notify("持仓信息查询条件已应用（原型）"));
  dataWorkspace.querySelector("[data-export-holdings]").addEventListener("click", () => notify("当前持仓信息已生成演示导出"));
}

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
