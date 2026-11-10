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
