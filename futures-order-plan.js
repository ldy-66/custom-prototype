/* Simulated order planning for the ordinary futures tickets. */
const FuturesOrderPlan = (() => {
  function plan({ qty, offset, split, priority, availableToday, availableYesterday }) {
    if (offset !== "auto") return [{ offset, qty }];

    if (!split) {
      const close = Math.min(qty, availableToday + availableYesterday);
      return [{ offset: "close", qty: close }, { offset: "open", qty: qty - close }]
        .filter(row => row.qty > 0);
    }

    const firstIsYesterday = priority === "yesterday";
    const first = Math.min(qty, firstIsYesterday ? availableYesterday : availableToday);
    const second = Math.min(qty - first, firstIsYesterday ? availableToday : availableYesterday);
    return [
      { offset: firstIsYesterday ? "close" : "today", qty: first },
      { offset: firstIsYesterday ? "today" : "close", qty: second },
      { offset: "open", qty: qty - first - second },
    ].filter(row => row.qty > 0);
  }

  function available({ offset, split, availableToday, availableYesterday, openLimit }) {
    if (offset === "open") return openLimit;
    if (offset === "auto") return availableToday + availableYesterday + openLimit;
    if (!split) return availableToday + availableYesterday;
    return offset === "today" ? availableToday : availableYesterday;
  }

  function rejection(order) {
    const { qty, offset, split, openLimit } = order;
    if (qty <= available(order)) return "";
    if (offset === "auto") {
      const opening = plan(order).find(row => row.offset === "open").qty;
      return `开仓余量额度不足，需开仓 ${opening} 手，当前可开 ${openLimit} 手。`;
    }
    const label = offset === "open" ? "可开" : !split ? "可平" : offset === "today" ? "可平今" : "可平昨";
    return `${label}数量不足，当前${label} ${available(order)} 手。`;
  }

  return { plan, available, rejection };
})();

/* Shared state for the Custom and Trader futures demonstrations on the same origin. */
const FuturesExecution = (() => {
  const key = "oms-demo-futures-execution-v12";
  const defaults = () => ({ parents: [], executions: [] });
  function read() {
    try { return JSON.parse(localStorage.getItem(key)) || defaults(); }
    catch { return defaults(); }
  }
  function update(apply) {
    const state = read();
    const value = apply(state);
    localStorage.setItem(key, JSON.stringify(state));
    return value;
  }
  const newId = prefix => prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  const parents = () => read().parents;
  const children = id => read().executions.filter(row => row.parentId === id);
  const orders = origin => read().executions.filter(row => !row.parentId && row.origin === origin).reverse();
  function create(order) {
    return update(state => {
      const parent = { ...order, id: newId("HT"), status: "待确认", remaining: order.qty };
      state.parents.unshift(parent);
      return parent;
    });
  }
  function cancelParent(id) {
    return update(state => {
      const parent = state.parents.find(row => row.id === id);
      if (!parent || parent.status !== "待确认" || parent.remaining !== parent.qty) return false;
      parent.status = "已撤";
      return true;
    });
  }
  function usage(positionKey) {
    return read().executions.reduce((total, row) => {
      if (row.status === "已撤") return total;
      const item = row.reservations.find(item => item.key === positionKey);
      if (item) { total.today += item.today; total.yesterday += item.yesterday; }
      return total;
    }, { today: 0, yesterday: 0 });
  }
  function clientKey({ account, customer, fund, frame, channel = "渠道A", code, side }) {
    return ["client", account, customer, fund, frame, channel, code, side].join("|");
  }
  function hedgePosition({ code, channel = "渠道A", side }) {
    const secondChannel = channel === "渠道B";
    const long = side === "多头";
    const today = secondChannel ? 1 : 2;
    const yesterday = secondChannel ? 2 : long ? 5 : 4;
    const positionKey = ["hedge", channel, code, side].join("|");
    const used = usage(positionKey);
    const frozenToday = (long ? 1 : 0) + used.today;
    const frozenYesterday = (long || secondChannel ? 0 : 1) + used.yesterday;
    return { key: positionKey, side, today, yesterday, frozenToday, frozenYesterday,
      availableToday: today - frozenToday, availableYesterday: yesterday - frozenYesterday };
  }
  function allocations(rows, position, split) {
    let todayLeft = position.availableToday;
    return rows.map(row => {
      let today = 0;
      let yesterday = 0;
      if (row.offset === "today") today = row.qty;
      if (row.offset === "close") {
        today = split ? 0 : Math.min(row.qty, todayLeft);
        yesterday = row.qty - today;
      }
      todayLeft -= today;
      return { key: position.key, today, yesterday };
    });
  }
  function rejection(rows, position, hedge, split, openLimit) {
    const qty = offset => rows.filter(row => row.offset === offset).reduce((sum, row) => sum + row.qty, 0);
    for (const [label, bucket] of [["对客仓", position], ["对冲仓", hedge]]) {
      const checks = split
        ? [["可平今", qty("today"), bucket.availableToday], ["可平昨", qty("close"), bucket.availableYesterday]]
        : [["可平", qty("close"), bucket.availableToday + bucket.availableYesterday]];
      for (const [name, requested, available] of checks) {
        if (requested > available) return `${label}${name}数量不足，当前${name} ${available} 手。`;
      }
    }
    return qty("open") > openLimit ? `开仓余量额度不足，需开仓 ${qty("open")} 手，当前可开 ${openLimit} 手。` : "";
  }
  function record(rows, position, hedge, split, parentId, context = {}) {
    const client = allocations(rows, position, split);
    const hedged = allocations(rows, hedge, split);
    return update(state => {
      const parent = state.parents.find(row => row.id === parentId);
      const total = rows.reduce((sum, row) => sum + row.qty, 0);
      if (parentId && (!parent || parent.status !== "待确认" || total > parent.remaining)) return [];
      const items = rows.map((row, index) => ({ ...context, ...row, status: "已报", id: newId("F"), parentId,
        reservations: [client[index], hedged[index]] }));
      state.executions.push(...items);
      if (parent) {
        parent.remaining -= total;
        if (parent.remaining === 0) parent.status = "已报";
      }
      return items;
    });
  }
  function release(id) {
    update(state => {
      const row = state.executions.find(row => row.id === id && !row.parentId);
      if (row) row.status = "已撤";
    });
  }
  return { key, parents, children, orders, create, cancelParent, usage, clientKey, hedgePosition, rejection, record, release };
})();
