const state = {
  direction: "buy",
  price: 10.8,
  quantity: 100,
  orders: [],
  notificationOpen: false,
  notificationFilter: "全部",
  selectedNotification: 1,
};

const notifications = [
  { id: 1, category: "交易", level: "success", icon: "✓", status: "已提交", title: "订单提交成功", summary: "000001.SZ 买入委托已提交。", body: "您的买入委托已成功提交，后续处理结果可在委托列表中查看。", time: "10:21", unread: true, order: "ORD-DEMO-01", account: "DEMO-04501" },
  { id: 2, category: "风险", level: "danger", icon: "!", status: "已拒绝", title: "订单未通过风控校验", summary: "委托价格偏离触发当前风控规则。", body: "该笔委托未通过当前账户适用的风控规则，订单未进入报单流程。请调整委托信息后重新提交。", time: "10:18", unread: true, order: "ORD-DEMO-02", account: "DEMO-04501" },
  { id: 3, category: "交易", level: "success", icon: "✓", status: "已成交", title: "订单已全部成交", summary: "600000.SH 卖出委托已全部成交。", body: "该笔卖出委托已全部成交，成交结果已同步至委托列表。", time: "09:52", unread: true, order: "ORD-DEMO-03", account: "DEMO-04502" },
  { id: 4, category: "风险", level: "warning", icon: "!", status: "提醒", title: "账户可用资金较低", summary: "当前可用资金接近预警阈值。", body: "当前账户可用资金已接近预警阈值，请关注后续委托占用。", time: "09:36", unread: false, order: "--", account: "DEMO-04501" },
  { id: 5, category: "系统", level: "info", icon: "i", status: "安全", title: "新设备登录提醒", summary: "账号于 09:12 在新设备登录。", body: "检测到当前账号在新设备登录。如非本人操作，请及时联系系统管理员。", time: "09:12", unread: false, order: "--", account: "Custom Demo" },
];

const priceInput = document.querySelector("#priceInput");
const quantityInput = document.querySelector("#quantityInput");
const estimateValue = document.querySelector("#estimateValue");
const submitOrder = document.querySelector("#submitOrder");
const orderRows = document.querySelector("#orderRows");
const allCount = document.querySelector("#allCount");
const pendingCount = document.querySelector("#pendingCount");
const toast = document.querySelector("#toast");
const notificationBell = document.querySelector("#notificationBell");
const notificationBadge = document.querySelector("#notificationBadge");
const notificationPopover = document.querySelector("#notificationPopover");
const notificationTabs = document.querySelector("#notificationTabs");
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

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.view !== "trade") {
      notify(`${button.textContent.trim()}模块将在对应需求分支继续复刻`);
      return;
    }
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
  });
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

function filteredNotifications() {
  return state.notificationFilter === "全部" ? notifications : notifications.filter(message => message.category === state.notificationFilter);
}

function renderNotifications() {
  const unread = notifications.filter(message => message.unread).length;
  notificationBadge.textContent = unread ? String(unread) : "";
  document.querySelector("#notificationUnreadText").textContent = `${unread} 条未读`;
  notificationBell.classList.toggle("open", state.notificationOpen);
  notificationBell.setAttribute("aria-expanded", String(state.notificationOpen));
  notificationPopover.hidden = !state.notificationOpen;

  const categories = ["全部", "交易", "风险", "系统"];
  notificationTabs.innerHTML = categories.map(category => {
    const count = category === "全部" ? notifications.length : notifications.filter(message => message.category === category).length;
    return `<button class="${state.notificationFilter === category ? "active" : ""}" data-filter="${category}" type="button">${category} ${count}</button>`;
  }).join("");

  const rows = filteredNotifications();
  if (!rows.some(message => message.id === state.selectedNotification)) state.selectedNotification = rows[0]?.id ?? null;
  notificationList.innerHTML = rows.length ? rows.map(message => `
    <button class="notification-item ${message.unread ? "unread" : ""} ${state.selectedNotification === message.id ? "selected" : ""}" data-message-id="${message.id}" type="button">
      <span class="message-icon ${message.level}">${message.icon}</span>
      <span class="message-copy"><span class="message-title">${message.title}<i class="message-status">${message.status}</i></span><span class="message-summary">${message.summary}</span></span>
      <span class="message-time">${message.time}</span>
    </button>`).join("") : '<div class="notification-empty">暂无消息</div>';

  const current = notifications.find(message => message.id === state.selectedNotification);
  notificationDetail.innerHTML = current ? `
    <header><strong>${current.title}</strong><span>今天 ${current.time}</span></header>
    <p>${current.body}</p>
    <div class="message-meta"><span>资金账号</span><span>${current.account}</span><span>相关订单</span><span>${current.order}</span></div>
    <div class="message-actions"><button type="button" data-collapse>收起</button><button class="primary" type="button" data-order-link>查看相关订单</button></div>` : "";
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
renderOrders();
renderNotifications();
