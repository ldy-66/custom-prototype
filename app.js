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

const positionRecords = [
  { marketType: "证券", client: ["演示客户01", "DEMO-2304", "DEMO-TR01", "000001.SZ", "平安银行", "深交所", "110,000", "120,000", "108,000", "2,000", "106,000"], hedge: ["QFII-DEMO", "HEDGE-DEMO01", "000001.SZ", "平安银行", "深交所", "112,000", "120,000", "109,000", "3,000", "106,000"], detail: ["演示客户01", "DEMO-2304", "000001.SZ", "平安银行", "深交所", "120,000", "25.00%", "1.000000", "42,600.00", "0.03%", "0.03%", "0.00", "多头", "普通交易"] },
  { marketType: "证券", client: ["演示客户02", "DEMO-2305", "DEMO-TR02", "600000.SH", "浦发银行", "上交所", "73,000", "80,000", "71,000", "2,000", "69,000"], hedge: ["CHANNEL-B", "HEDGE-DEMO02", "600000.SH", "浦发银行", "上交所", "76,000", "80,000", "74,000", "2,000", "72,000"], detail: ["演示客户02", "DEMO-2305", "600000.SH", "浦发银行", "上交所", "80,000", "30.00%", "1.000000", "18,200.00", "0.03%", "0.03%", "0.00", "多头", "普通交易"] },
  { marketType: "期货", client: ["演示客户01", "DEMO-2304", "DEMO-TR01", "IF2606.CFE", "沪深300股指", "中金所", "8", "10", "8", "2", "6"], hedge: ["QFII-DEMO", "HEDGE-FUT01", "IF2606.CFE", "沪深300股指", "中金所", "12", "15", "12", "3", "9"], detail: ["演示客户01", "DEMO-2304", "IF2606.CFE", "沪深300股指", "中金所", "10", "12.00%", "1.000000", "3,200.00", "0.02%", "0.02%", "0.00", "多头", "期货交易"] },
  { marketType: "期货", client: ["演示客户02", "DEMO-2305", "DEMO-TR02", "au2612.SHF", "沪金2612", "上期所", "20", "25", "20", "5", "15"], hedge: ["CHANNEL-B", "HEDGE-FUT02", "au2612.SHF", "沪金2612", "上期所", "30", "35", "30", "5", "25"], detail: ["演示客户02", "DEMO-2305", "au2612.SHF", "沪金2612", "上期所", "25", "10.00%", "1.000000", "1,850.00", "0.02%", "0.02%", "0.00", "多头", "期货交易"] },
  { marketType: "债券", client: ["演示客户01", "DEMO-2304", "DEMO-TR01", "230023.IB", "23国债23", "银行间", "5,000", "6,000", "5,500", "500", "5,000"], hedge: ["QFII-DEMO", "HEDGE-BOND01", "230023.IB", "23国债23", "银行间", "8,000", "9,000", "8,500", "500", "8,000"], detail: ["演示客户01", "DEMO-2304", "230023.IB", "23国债23", "银行间", "6,000", "5.00%", "1.000000", "1,200.00", "0.01%", "0.01%", "0.00", "多头", "债券交易"] },
  { marketType: "债券", client: ["演示客户02", "DEMO-2305", "DEMO-TR02", "019773.SH", "24国债08", "上交所", "3,000", "4,000", "3,600", "400", "3,200"], hedge: ["CHANNEL-B", "HEDGE-BOND02", "019773.SH", "24国债08", "上交所", "5,000", "6,000", "5,600", "400", "5,200"], detail: ["演示客户02", "DEMO-2305", "019773.SH", "24国债08", "上交所", "4,000", "4.00%", "1.000000", "800.00", "0.01%", "0.01%", "0.00", "多头", "债券交易"] },
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
  const definitions = {
    "对客": { columns: ["客户名称", "资金账号", "交易账户", "标的代码", "标的名称", "市场", "期初持仓数量", "持仓数量", "可用数量（T+0）", "冻结数量", "可用数量（T+1）"], key: "client" },
    "对冲": { columns: ["对冲渠道", "对冲账号", "标的代码", "标的名称", "市场", "期初持仓数量", "持仓数量", "可用数量（T+0）", "冻结数量", "可用数量（T+1）"], key: "hedge" },
    "明细": { columns: ["客户名称", "资金账号", "标的代码", "标的名称", "市场", "持仓数量", "初保比例", "期初汇率", "平仓盈亏", "开仓费率", "平仓费率", "单位待实现利率收益", "持仓类型", "业务类型"], key: "detail" },
  };
  const view = definitions[state.positionMode];
  const rows = positionRecords.filter(row => row.marketType === state.positionMarket).map(row => row[view.key]);
  dataWorkspace.innerHTML = `<header class="data-page-heading"><div><span>数据查询</span><strong>持仓信息</strong></div><small>当前视图：${state.positionMode}</small></header>
    <div class="holdings-filters">
      <div class="holdings-filter-row"><input aria-label="客户名称" placeholder="客户名称"><input aria-label="客户名" placeholder="客户名"><input aria-label="交易账户" placeholder="交易账户"><input aria-label="交易对手名称" placeholder="交易对手名称"><input aria-label="交易对手简称" placeholder="交易对手简称"></div>
      <div class="holdings-filter-row"><input aria-label="资金账号" placeholder="资金账号"><input aria-label="资金账号名称" placeholder="资金账号名称"><input aria-label="标的代码" placeholder="标的代码"><button class="custom-query-button" type="button" data-query-holdings>查询</button><button class="custom-export-button" type="button" data-export-holdings>导出</button></div>
    </div>
    <div class="holdings-controls"><div class="holdings-market-tabs" role="group" aria-label="市场类别">${["证券", "期货", "债券"].map(x=>`<button type="button" data-position-market="${x}" class="${state.positionMarket===x?"active":""}" aria-pressed="${state.positionMarket===x}">${x}</button>`).join("")}</div><div class="holdings-mode-switch" role="radiogroup" aria-label="持仓类型">${["对客", "对冲", "明细"].map(x=>`<button type="button" role="radio" aria-checked="${state.positionMode===x}" data-position-mode="${x}" class="${state.positionMode===x?"active":""}"><span class="radio-dot"></span>${x}</button>`).join("")}</div></div>
    <div class="holdings-grid-wrap"><table class="data-table holdings-table"><thead><tr><th>序号</th>${view.columns.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map((row,i)=>`<tr class="${i===0?"selected":""}"><td>${i+1}</td>${row.map(v=>`<td>${v}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
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
