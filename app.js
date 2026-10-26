const defaultQuickQuantities = [100, 500, 1000, 5000];
const defaultQuickAmounts = [100000, null, null, null];

const state = {
  view: "trade",
  positionMode: "明细",
  positionMarket: "证券",
  positionBoard: "全部",
  direction: "buy",
  price: 10.8,
  quantity: 100,
  availableQuantity: 25000,
  tradeUnit: 100,
  quantityMode: "specified",
  quickQuantities: loadPresetValues("customQuickQuantities", defaultQuickQuantities),
  quickAmounts: loadPresetValues("customQuickAmounts", defaultQuickAmounts),
  allowPriceWheel: localStorage.getItem("customAllowPriceWheel") === "true",
  allowQuantityWheel: localStorage.getItem("customAllowQuantityWheel") === "true",
  settingsTab: "retained",
  orders: [],
  notificationOpen: false,
  notificationFilter: "全部",
  notificationSubFilter: "全部",
  selectedNotification: 1,
};

const notifications = [
  { id: 1, category: "订单", orderLevel: "母单", event: "拒单", level: "danger", icon: "!", title: "母单拒单", summary: "000001.SZ 母单未通过 OMS 校验。", body: "该母单在进入后续处理前被拒绝，请根据拒单原因调整委托信息后重新提交。", time: "10:21", unread: true, order: "P-ORD-DEMO-01", parentOrder: "P-ORD-DEMO-01", childOrder: "--", account: "DEMO-04501", rejectStage: "OMS 校验", rejectReason: "委托价格超出当前允许范围" },
  { id: 2, category: "订单", orderLevel: "子单", event: "拒单", level: "danger", icon: "!", title: "子单拒单", summary: "600000.SH 子单在柜台报送环节被拒绝。", body: "该子单报送柜台后被拒绝，母单状态与剩余可执行数量请在订单详情中查看。", time: "10:18", unread: true, order: "C-ORD-DEMO-02", parentOrder: "P-ORD-DEMO-02", childOrder: "C-ORD-DEMO-02", account: "DEMO-04502", rejectStage: "柜台报送", rejectReason: "柜台返回：申报数量不符合要求" },
  { id: 3, category: "订单", orderLevel: "母单", event: "已提交", level: "success", icon: "✓", title: "母单提交成功", summary: "000001.SZ 买入母单已提交。", body: "买入母单已成功提交，后续拆单与执行结果可在委托列表中查看。", time: "10:05", unread: true, order: "P-ORD-DEMO-03", parentOrder: "P-ORD-DEMO-03", childOrder: "--", account: "DEMO-04501" },
  { id: 4, category: "订单", orderLevel: "子单", event: "已成交", level: "success", icon: "✓", title: "子单全部成交", summary: "600000.SH 子单已全部成交。", body: "该子单已全部成交，成交结果已同步至对应母单与委托列表。", time: "09:52", unread: false, order: "C-ORD-DEMO-04", parentOrder: "P-ORD-DEMO-04", childOrder: "C-ORD-DEMO-04", account: "DEMO-04502" },
  { id: 5, category: "市场", market: "沪深", event: "休市提醒", level: "info", icon: "休", title: "沪深市场休市提醒", summary: "请关注下一休市日的下单与成交安排。", body: "沪深市场下一休市日全天暂停交易，请提前安排委托；实际日历以交易所发布为准。", time: "09:40", unread: true, closedAt: "下一休市日 全天", resumeAt: "下一交易日 09:30", timezone: "北京时间" },
  { id: 6, category: "市场", market: "港股", event: "休市提醒", level: "info", icon: "休", title: "港股市场休市提醒", summary: "请关注下一休市日及恢复交易时间。", body: "港股市场下一休市日全天暂停交易，请提前安排委托；实际日历以交易所发布为准。", time: "09:35", unread: false, closedAt: "下一休市日 全天", resumeAt: "下一交易日 09:30", timezone: "北京时间" },
  { id: 7, category: "市场", market: "美股", event: "休市提醒", level: "info", icon: "休", title: "美股市场休市提醒", summary: "请关注当地休市安排与时区差异。", body: "美股市场下一休市日全天暂停交易，请关注当地时区与夏令时变化；实际日历以交易所发布为准。", time: "09:30", unread: false, closedAt: "下一休市日 全天", resumeAt: "下一交易日 09:30", timezone: "市场当地时间" },
  { id: 8, category: "风控", event: "预警", level: "warning", icon: "!", title: "账户可用资金较低", summary: "当前可用资金接近预警阈值。", body: "当前账户可用资金已接近预警阈值，请关注后续委托占用。", time: "09:20", unread: false, order: "--", account: "DEMO-04501" },
  { id: 9, category: "系统", event: "安全", level: "info", icon: "i", title: "新设备登录提醒", summary: "账号于 09:12 在新设备登录。", body: "检测到当前账号在新设备登录。如非本人操作，请及时联系系统管理员。", time: "09:12", unread: false, order: "--", account: "Custom Demo" },
];


const priceInput = document.querySelector("#priceInput");
const quantityInput = document.querySelector("#quantityInput");
const amountValue = document.querySelector("#amountValue");
const quantitySettingsButton = document.querySelector("#quantitySettingsButton");
const quantityModeMenu = document.querySelector("#quantityModeMenu");
const commonQuantityMenuValues = document.querySelector("#commonQuantityMenuValues");
const commonAmountMenuValues = document.querySelector("#commonAmountMenuValues");
const customSettingsButton = document.querySelector("#customSettingsButton");
const customSettingsDialog = document.querySelector("#customSettingsDialog");
const customSettingsTabs = document.querySelector("#customSettingsTabs");
const quickQuantityInputs = document.querySelector("#quickQuantityInputs");
const quickAmountInputs = document.querySelector("#quickAmountInputs");
const allowPriceWheelInput = document.querySelector("#allowPriceWheel");
const allowQuantityWheelInput = document.querySelector("#allowQuantityWheel");
const submitOrder = document.querySelector("#submitOrder");
const orderRows = document.querySelector("#orderRows");
const allCount = document.querySelector("#allCount");
const pendingCount = document.querySelector("#pendingCount");
const toast = document.querySelector("#toast");
const notificationBell = document.querySelector("#notificationBell");
const notificationBadge = document.querySelector("#notificationBadge");
const notificationPopover = document.querySelector("#notificationPopover");
const notificationTabs = document.querySelector("#notificationTabs");
const notificationSubFilters = document.querySelector("#notificationSubFilters");
const notificationList = document.querySelector("#notificationList");
const notificationDetail = document.querySelector("#notificationDetail");
notificationBell.addEventListener("click", event => {
  event.stopPropagation();
  state.notificationOpen = !state.notificationOpen;
  renderNotifications();
});

notificationPopover.addEventListener("click", event => event.stopPropagation());
document.addEventListener("click", () => {
  if (!state.notificationOpen) return;
  state.notificationOpen = false;
  renderNotifications();
});
document.addEventListener("keydown", event => {
  if (event.key !== "Escape" || !state.notificationOpen) return;
  state.notificationOpen = false;
  renderNotifications();
  notificationBell.focus();
});

document.querySelector("#markAllNotificationsRead").addEventListener("click", () => {
  notifications.forEach(message => { message.unread = false; });
  renderNotifications();
});

notificationTabs.addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  state.notificationFilter = button.dataset.filter;
  state.notificationSubFilter = "全部";
  const first = filteredNotifications()[0];
  state.selectedNotification = first?.id ?? null;
  renderNotifications();
});

notificationSubFilters.addEventListener("click", event => {
  const button = event.target.closest("[data-sub-filter]");
  if (!button) return;
  state.notificationSubFilter = button.dataset.subFilter;
  const first = filteredNotifications()[0];
  state.selectedNotification = first?.id ?? null;
  renderNotifications();
});

notificationList.addEventListener("click", event => {
  const item = event.target.closest("[data-message-id]");
  if (!item) return;
  const message = notifications.find(row => row.id === Number(item.dataset.messageId));
  if (!message) return;
  message.unread = false;
  state.selectedNotification = message.id;
  renderNotifications();
});

notificationDetail.addEventListener("click", event => {
  if (!event.target.closest("[data-order-link]")) return;
  const current = notifications.find(row => row.id === state.selectedNotification);
  state.notificationOpen = false;
  renderNotifications();
  notify(current?.order === "--" ? "该消息暂无关联订单" : `已定位关联订单 ${current.order}`);
});

const dataWorkspace = document.querySelector("#dataWorkspace");

const holdingColumns = {
  "对客": ["客户名称", "客户名", "交易账户", "交易对手号", "交易对手名称", "交易对手简称", "资金账户号", "资金账号", "资金账号名称", "框架名称", "证券代码", "证券名称", "合约代码", "合约名称", "上市状态", "可用数量", "持仓数量", "成本价", "持仓均价", "最新价", "持仓盈亏", "持仓盈亏率", "持仓市值", "期初数量", "交易冻结数量", "日内开仓成交数量", "日内平仓成交数量", "持仓类型", "业务类型"],
  "对冲": ["交易对手号", "交易对手名称", "客户名称", "客户名", "交易账户", "交易对手简称", "资金账户号", "资金账号", "资金账号名称", "框架名称", "证券代码", "证券名称", "合约代码", "合约名称", "上市状态", "对冲渠道", "对冲方资金账号", "可用数量", "持仓数量", "持仓均价", "最新价", "持仓市值", "期初数量", "日间开仓数量", "日间平仓数量", "交易冻结数量", "持仓类型", "业务类型"],
  "明细": ["客户名称", "客户名", "交易账户", "交易对手号", "交易对手名称", "交易对手简称", "资金账户号", "资金账号", "资金账号名称", "框架名称", "证券代码", "证券名称", "合约代码", "合约名称", "上市状态", "开仓日期", "开仓均价", "期初数量", "持仓数量", "初保比例", "期初汇率", "平仓盈亏", "开仓费率", "平仓费率", "单位待实现利率收益", "持仓类型", "业务类型"],
};

function makePositionRecord(marketType, symbol, name, contractCode, contractName, quantity, available, freeze, value, pnl, board = null) {
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
    board,
    client: { ...common, "成本价": "10.10", "持仓盈亏": pnl, "持仓盈亏率": "5.94%", "日内开仓成交数量": "20,000", "日内平仓成交数量": "0" },
    hedge: { ...common, "对冲渠道": "DEMO-CHANNEL", "对冲方资金账号": "DEMO-HEDGE-01", "日间开仓数量": "20,000", "日间平仓数量": "0" },
    detail: { ...common, "开仓日期": "2026-10-22", "开仓均价": "10.20", "初保比例": "25.00%", "期初汇率": "1.000000", "平仓盈亏": "0.00", "开仓费率": "0.03%", "平仓费率": "0.03%", "单位待实现利率收益": "0.00" },
  };
}

const positionRecords = [
  // Prototype-only explicit category fixtures; categories are not derived from symbol formatting.
  makePositionRecord("证券", "000001.SZ", "演示证券A", "—", "—", "120,000", "110,000", "2,000", "1,296,000.00", "72,000.00", "主板"),
  makePositionRecord("证券", "DEMO-STAR", "演示科创板证券", "—", "—", "8,000", "7,000", "0", "86,400.00", "6,400.00", "科创板"),
  makePositionRecord("证券", "DEMO-GEM", "演示创业板证券", "—", "—", "8,000", "7,000", "0", "86,400.00", "6,400.00", "创业板"),
  makePositionRecord("证券", "DEMO-HK", "演示港股证券", "—", "—", "8,000", "7,000", "0", "86,400.00", "6,400.00", "港股"),
  makePositionRecord("证券", "DEMO-US", "演示美股证券", "—", "—", "8,000", "7,000", "0", "86,400.00", "6,400.00", "美股"),
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
      setQuantityMode("specified");
    }
    updateEstimate();
  });
});

priceInput.addEventListener("input", () => {
  state.price = Number(priceInput.value) || 0;
  updateEstimate();
});

priceInput.addEventListener("wheel", event => {
  if (document.activeElement !== priceInput || event.ctrlKey || event.deltaY === 0) return;
  event.preventDefault();
  if (!state.allowPriceWheel) return;
  state.price = Math.max(0, Number((state.price + (event.deltaY < 0 ? 0.01 : -0.01)).toFixed(2)));
  priceInput.value = state.price.toFixed(2);
  updateEstimate();
}, { passive: false });

quantityInput.addEventListener("input", () => {
  state.quantity = Math.max(0, Number.parseInt(quantityInput.value || "0", 10));
  setQuantityMode("specified");
  updateEstimate();
});

quantityInput.addEventListener("wheel", event => {
  if (document.activeElement !== quantityInput || event.ctrlKey || event.deltaY === 0) return;
  event.preventDefault();
  if (!state.allowQuantityWheel) return;
  state.quantity = Math.max(0, state.quantity + (event.deltaY < 0 ? state.tradeUnit : -state.tradeUnit));
  quantityInput.value = state.quantity;
  setQuantityMode("specified");
  updateEstimate();
}, { passive: false });

quantitySettingsButton.addEventListener("click", event => {
  event.stopPropagation();
  setCustomSettingsDialog(false);
  setQuantityModeMenu(quantityModeMenu.hidden);
});

quantityModeMenu.addEventListener("click", event => {
  event.stopPropagation();
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.ratio) applyRatio(button.dataset.ratio);
  if (button.dataset.commonQuantity) applyCommonQuantity(Number(button.dataset.commonQuantity));
  if (button.dataset.commonAmount) applyCommonAmount(Number(button.dataset.commonAmount));
  setQuantityModeMenu(false);
});

customSettingsButton.addEventListener("click", event => {
  event.stopPropagation();
  setQuantityModeMenu(false);
  setCustomSettingsDialog(customSettingsDialog.hidden);
});

customSettingsDialog.addEventListener("click", event => event.stopPropagation());

customSettingsTabs.addEventListener("click", event => {
  const button = event.target.closest("[data-settings-tab]");
  if (button) setSettingsTab(button.dataset.settingsTab);
});

document.querySelector("#closeCustomSettings").addEventListener("click", () => setCustomSettingsDialog(false));
document.querySelector("#cancelCustomSettings").addEventListener("click", () => setCustomSettingsDialog(false));

document.querySelector("#saveCustomSettings").addEventListener("click", () => {
  const quantities = readPresetValues(quickQuantityInputs);
  const amounts = readPresetValues(quickAmountInputs);
  if (quantities.some(Number.isNaN)) {
    notify("请输入有效的常用数量");
    return;
  }
  if (amounts.some(Number.isNaN)) {
    notify("请输入有效的常用金额");
    return;
  }
  state.quickQuantities = quantities;
  state.quickAmounts = amounts;
  state.allowPriceWheel = allowPriceWheelInput.checked;
  state.allowQuantityWheel = allowQuantityWheelInput.checked;
  localStorage.setItem("customQuickQuantities", JSON.stringify(quantities));
  localStorage.setItem("customQuickAmounts", JSON.stringify(amounts));
  localStorage.setItem("customAllowPriceWheel", String(state.allowPriceWheel));
  localStorage.setItem("customAllowQuantityWheel", String(state.allowQuantityWheel));
  renderShortcutValues();
  setCustomSettingsDialog(false);
  notify("设置已保存");
});

document.addEventListener("click", () => {
  setCustomSettingsDialog(false);
  setQuantityModeMenu(false);
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  setCustomSettingsDialog(false);
  setQuantityModeMenu(false);
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
  const boardOptions = ["全部", "主板", "科创板", "创业板", "港股", "美股"].map(board => "<option value=\"" + board + "\"" + (state.positionBoard === board ? " selected" : "") + ">" + board + "</option>").join("");
  const boardFilter = state.positionMarket === "证券" ? "<select aria-label=\"板块\" data-position-board>" + boardOptions + "</select>" : "";
  const rows = positionRecords.filter(row => row.marketType === state.positionMarket && (state.positionMarket !== "证券" || state.positionBoard === "全部" || row.board === state.positionBoard)).map(row => columns.map(column => row[state.positionMode === "对客" ? "client" : state.positionMode === "对冲" ? "hedge" : "detail"][column] ?? "—"));
  dataWorkspace.innerHTML = `<header class="data-page-heading"><div><span>数据查询</span><strong>持仓信息</strong></div><small>当前视图：${state.positionMode}</small></header>
    <div class="holdings-filters">
      <div class="holdings-filter-row"><input aria-label="客户名称" placeholder="客户名称"><input aria-label="客户名" placeholder="客户名"><input aria-label="交易账户" placeholder="交易账户"><input aria-label="交易对手名称" placeholder="交易对手名称"><input aria-label="交易对手简称" placeholder="交易对手简称"></div>
      <div class="holdings-filter-row"><input aria-label="资金账号" placeholder="资金账号"><input aria-label="资金账号名称" placeholder="资金账号名称"><input aria-label="证券代码 / 合约代码" placeholder="证券代码 / 合约代码">${boardFilter}<button class="custom-query-button" type="button" data-query-holdings>查询</button><button class="custom-export-button" type="button" data-export-holdings>导出</button></div>
    </div>
    <div class="holdings-controls"><div class="holdings-market-tabs" role="group" aria-label="市场类别">${["证券", "期货", "债券"].map(x=>`<button type="button" data-position-market="${x}" class="${state.positionMarket===x?"active":""}" aria-pressed="${state.positionMarket===x}">${x}</button>`).join("")}</div><div class="holdings-mode-switch" role="radiogroup" aria-label="持仓类型">${["对客", "对冲", "明细"].map(x=>`<button type="button" role="radio" aria-checked="${state.positionMode===x}" data-position-mode="${x}" class="${state.positionMode===x?"active":""}"><span class="radio-dot"></span>${x}</button>`).join("")}</div></div>
    <div class="holdings-grid-wrap"><table class="data-table holdings-table"><thead><tr><th>序号</th>${columns.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map((row,i)=>`<tr class="${i===0?"selected":""}"><td>${i+1}</td>${row.map(v=>`<td>${v}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  dataWorkspace.querySelectorAll("[data-position-mode]").forEach(button => button.addEventListener("click", () => { state.positionMode = button.dataset.positionMode; renderHoldingsPage(); }));
  dataWorkspace.querySelectorAll("[data-position-market]").forEach(button => button.addEventListener("click", () => { state.positionMarket = button.dataset.positionMarket; renderHoldingsPage(); }));
  dataWorkspace.querySelector("[data-position-board]")?.addEventListener("change", event => {
    const filterValues = [...dataWorkspace.querySelectorAll(".holdings-filter-row input")].map(input => input.value);
    state.positionBoard = event.currentTarget.value;
    renderHoldingsPage();
    dataWorkspace.querySelectorAll(".holdings-filter-row input").forEach((input, index) => { input.value = filterValues[index] ?? ""; });
  });
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
  amountValue.textContent = (state.price * state.quantity).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function applyRatio(ratio) {
  setQuantityMode(`ratio:${ratio}`);
  state.quantity = Math.floor((state.availableQuantity * Number(ratio)) / state.tradeUnit) * state.tradeUnit;
  quantityInput.value = state.quantity;
  updateEstimate();
}

function applyCommonQuantity(quantity) {
  setQuantityMode(`quantity:${quantity}`);
  state.quantity = quantity;
  quantityInput.value = quantity;
  updateEstimate();
}

function applyCommonAmount(amount) {
  if (!state.price) {
    notify("请输入有效的委托价格");
    return;
  }
  const quantity = Math.floor(amount / state.price / state.tradeUnit) * state.tradeUnit;
  if (!quantity) {
    notify("当前金额不足一个交易单位");
    return;
  }
  setQuantityMode(`amount:${amount}`);
  state.quantity = quantity;
  quantityInput.value = quantity;
  updateEstimate();
}

function setQuantityMode(mode) {
  state.quantityMode = mode;
  quantityModeMenu.querySelectorAll("button").forEach(button => {
    const buttonMode = button.dataset.ratio
      ? `ratio:${button.dataset.ratio}`
      : button.dataset.commonQuantity
        ? `quantity:${button.dataset.commonQuantity}`
        : button.dataset.commonAmount
          ? `amount:${button.dataset.commonAmount}`
          : "";
    button.classList.toggle("active", buttonMode === mode);
  });
}

function setQuantityModeMenu(open) {
  if (open) renderShortcutValues();
  quantityModeMenu.hidden = !open;
  quantitySettingsButton.classList.toggle("active", open);
  quantitySettingsButton.setAttribute("aria-expanded", String(open));
}

function loadPresetValues(key, defaults) {
  try {
    const values = JSON.parse(localStorage.getItem(key));
    return Array.isArray(values) && values.length === 4 && values.every(value => value === null || Number.isSafeInteger(value) && value > 0)
      ? values
      : defaults;
  } catch {
    return defaults;
  }
}

function setCustomSettingsDialog(open) {
  customSettingsDialog.hidden = !open;
  customSettingsButton.classList.toggle("active", open);
  customSettingsButton.setAttribute("aria-expanded", String(open));
  if (!open) return;
  setSettingsTab("retained");
  quickQuantityInputs.innerHTML = renderPresetInputs(state.quickQuantities, "常用数量");
  quickAmountInputs.innerHTML = renderPresetInputs(state.quickAmounts, "常用金额", true);
  allowPriceWheelInput.checked = state.allowPriceWheel;
  allowQuantityWheelInput.checked = state.allowQuantityWheel;
}

function setSettingsTab(tab) {
  state.settingsTab = tab;
  customSettingsTabs.querySelectorAll("[data-settings-tab]").forEach(button => button.classList.toggle("active", button.dataset.settingsTab === tab));
  customSettingsDialog.querySelectorAll("[data-settings-panel]").forEach(panel => { panel.hidden = panel.dataset.settingsPanel !== tab; });
}

function renderPresetInputs(values, ariaLabel, amount = false) {
  return values.map((value, index) => `
    <label><span>常用 ${index + 1}</span><span class="number-field"><input type="number" min="1" step="1" value="${value ?? ""}" aria-label="${ariaLabel} ${index + 1}">${amount ? "<i>CNY</i>" : ""}</span></label>`).join("");
}

function readPresetValues(container) {
  return [...container.querySelectorAll("input")].map(input => {
    if (!input.value.trim()) return null;
    const value = Number(input.value);
    return Number.isSafeInteger(value) && value > 0 ? value : Number.NaN;
  });
}

function renderShortcutValues() {
  commonQuantityMenuValues.innerHTML = renderShortcutButtons(state.quickQuantities, "commonQuantity");
  commonAmountMenuValues.innerHTML = renderShortcutButtons(state.quickAmounts, "commonAmount");
  setQuantityMode(state.quantityMode);
}

function renderShortcutButtons(values, type) {
  const availableValues = values.filter(value => value !== null);
  if (!availableValues.length) return '<span class="quick-order-empty">未设置</span>';
  return availableValues.map(value => `<button data-${type === "commonQuantity" ? "common-quantity" : "common-amount"}="${value}" type="button">${value.toLocaleString("zh-CN")}</button>`).join("");
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

function filteredNotifications() {
  let rows = state.notificationFilter === "全部" ? notifications : notifications.filter(message => message.category === state.notificationFilter);
  if (state.notificationFilter === "订单" && state.notificationSubFilter !== "全部") {
    rows = state.notificationSubFilter === "拒单"
      ? rows.filter(message => message.event === "拒单")
      : rows.filter(message => message.orderLevel === state.notificationSubFilter);
  }
  if (state.notificationFilter === "市场" && state.notificationSubFilter !== "全部") {
    rows = rows.filter(message => message.market === state.notificationSubFilter);
  }
  return rows;
}

function notificationMeta(message) {
  if (message.category === "订单") {
    const rows = ["订单层级", message.orderLevel, "资金账号", message.account, "母单号", message.parentOrder, "子单号", message.childOrder];
    if (message.event === "拒单") rows.push("拒单环节", message.rejectStage, "拒单原因", message.rejectReason);
    return rows;
  }
  if (message.category === "市场") return ["市场", message.market, "休市时间", message.closedAt, "恢复时间", message.resumeAt, "时区", message.timezone];
  return ["资金账号", message.account, "相关订单", message.order];
}

function renderNotifications() {
  const unread = notifications.filter(message => message.unread).length;
  notificationBadge.textContent = unread ? String(unread) : "";
  document.querySelector("#notificationUnreadText").textContent = `${unread} 条未读`;
  notificationBell.classList.toggle("open", state.notificationOpen);
  notificationBell.setAttribute("aria-expanded", String(state.notificationOpen));
  notificationPopover.hidden = !state.notificationOpen;

  const categories = ["全部", "订单", "市场", "风控", "系统"];
  notificationTabs.innerHTML = categories.map(category => {
    const count = category === "全部" ? notifications.length : notifications.filter(message => message.category === category).length;
    return `<button class="${state.notificationFilter === category ? "active" : ""}" data-filter="${category}" type="button">${category} ${count}</button>`;
  }).join("");

  const subFilters = state.notificationFilter === "订单"
    ? [["全部", "全部订单"], ["母单", "母单"], ["子单", "子单"], ["拒单", "全部拒单"]]
    : state.notificationFilter === "市场"
      ? [["全部", "全部市场"], ["沪深", "沪深"], ["港股", "港股"], ["美股", "美股"]]
      : [];
  notificationSubFilters.innerHTML = subFilters.map(([value, label]) => `<button class="${state.notificationSubFilter === value ? "active" : ""}" data-sub-filter="${value}" type="button">${label}</button>`).join("");
  notificationPopover.classList.toggle("has-subfilters", subFilters.length > 0);

  const rows = filteredNotifications();
  if (!rows.some(message => message.id === state.selectedNotification)) state.selectedNotification = rows[0]?.id ?? null;
  notificationList.innerHTML = rows.length ? rows.map(message => `
    <button class="notification-item ${message.unread ? "unread" : ""} ${state.selectedNotification === message.id ? "selected" : ""}" data-message-id="${message.id}" type="button">
      <span class="message-icon ${message.level}">${message.icon}</span>
      <span class="message-copy"><span class="message-title">${message.title}<i class="message-status">${message.category === "订单" ? `${message.orderLevel} · ${message.event}` : message.category === "市场" ? `${message.market} · ${message.event}` : message.event}</i></span><span class="message-summary">${message.summary}</span></span>
      <span class="message-time">${message.time}</span>
    </button>`).join("") : '<div class="notification-empty">暂无消息</div>';

  const current = notifications.find(message => message.id === state.selectedNotification);
  const meta = current ? notificationMeta(current) : [];
  notificationDetail.innerHTML = current ? `
    <header><strong>${current.title}</strong><span>今天 ${current.time}</span></header>
    <p>${current.body}</p>
    <div class="message-meta">${meta.map(value => `<span>${value ?? "--"}</span>`).join("")}</div>
    <div class="message-actions"><button type="button" data-collapse>收起</button>${current.category === "订单" ? '<button class="primary" type="button" data-order-link>查看相关订单</button>' : ""}</div>` : "";
  const collapse = notificationDetail.querySelector("[data-collapse]");
  if (collapse) collapse.addEventListener("click", () => {
    state.notificationOpen = false;
    renderNotifications();
  });
}


let toastTimer;
function notify(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

updateEstimate();
renderShortcutValues();
renderOrders();
renderNotifications();

