(() => {
  const categories = ["全部", "订单", "市场", "风控", "系统"];
  const pending = "HighTouch 待确认订单";
  const escape = value => String(value ?? "--").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;",
  })[char]);
  const today = () => new Date().toLocaleDateString("sv-SE");

  function filters(category, trader, expanded = false) {
    const groups = {
      订单: [["全部","全部订单"],["母单","母单"],["子单","子单"],["拒单","拒单提示"]],
      市场: [["全部","全部市场"],["沪深","沪深"],["港股","港股"],["美股","美股"]],
      风控: [["全部","全部风控"],["预警","风控预警"]],
      系统: [["全部","全部系统"],["登录成功","登录成功"],["新设备登录","新设备登录"]],
    };
    const options = groups[category] || [];
    if (trader && category === "订单") {
      options.push([pending,pending]);
      if (expanded) options.push(["异常反馈","异常反馈"]);
    }
    return options;
  }

  function list(rows, category, sub) {
    return rows.filter(item => {
      if (category === "全部") return true;
      if (item.category !== category) return false;
      if (sub === "全部") return true;
      if (category === "订单") {
        if (sub === "拒单") return item.event === "拒单";
        if (sub === pending) return item.mode === "HighTouch" && item.orderRef?.[1] === "待确认";
        return item.orderLevel === sub;
      }
      if (category === "市场") return item.market === sub;
      if (category === "风控") return item.event === sub;
      return item.title.startsWith(sub);
    });
  }

  function create({rows, meta, onRead, orderAction, goToOrder, pendingRows, archiveRows}) {
    const trader = Boolean(pendingRows);
    const win = document.createElement("section");
    win.className = "notice-window";
    win.hidden = true;
    win.setAttribute("role","dialog");
    win.setAttribute("aria-label","全部消息");
    document.body.append(win);
    const emptyQuery = () => ({date:"",level:"全部",keyword:""});
    let category, sub, query, selected;
    const showLevel = () => category === "订单" && ["全部","拒单","异常反馈"].includes(sub);
    const dated = item => item.date || today();
    const labels = {全部:"标题 / 内容",订单:"账号 / 订单号 / 标的 / 内容",市场:"市场 / 标题 / 内容",风控:"账号 / 标题 / 内容",系统:"标题 / 内容"};
    const searchable = item => [item.title,item.summary,item.body,item.rejectReason,item.account,
      item.order,item.parentOrder,item.childOrder,item.market,item.orderRef?.[5],item.orderRef?.symbol];
    function result() {
      const base = trader && category === "订单" && sub === pending ? pendingRows()
        : trader && category === "订单" && sub === "异常反馈" ? archiveRows()
        : list(rows,category,sub);
      return base.filter(item => (!query.date || dated(item) === query.date)
        && (!showLevel() || query.level === "全部" || item.orderLevel === query.level)
        && (!query.keyword || searchable(item).some(value => String(value ?? "").toLowerCase().includes(query.keyword.toLowerCase()))));
    }
    function action(item, id) {
      const label = orderAction(item);
      return label ? `<button type="button" data-action-row="${id}">${escape(label)}</button>` : "";
    }
    function detail(item) {
      return `<div class="notice-detail-head"><button type="button" data-back>‹ 返回列表</button><strong>消息详情</strong></div>
        <div class="notice-detail-wrap"><div><h2>${escape(item.title)}</h2><p class="notice-detail-sub">${escape(item.category)} · ${escape(item.event)}　${escape(dated(item))} ${escape(item.time)}</p>
        <p>${escape(item.body)}</p><div class="notice-detail-grid">${meta(item).map(value => `<span>${escape(value)}</span>`).join("")}</div>
        <div class="notice-query">${action(item,-1)}</div></div></div>`;
    }
    function table(items) {
      const order = category === "订单";
      const scope = order ? "订单层级" : category === "市场" ? "市场" : "分类";
      return `<div class="notice-table-wrap"><table class="notice-table">
        <thead><tr><th>时间</th><th>${scope}</th><th>类型</th><th>标题</th><th>内容</th><th>操作</th></tr></thead>
        <tbody>${items.length ? items.map((item,i) => `<tr>
          <td>${escape(dated(item))} ${escape(item.time)}</td>
          <td>${escape(order ? item.orderLevel : category === "市场" ? item.market : item.category)}</td>
          <td>${escape(item.event)}</td><td>${escape(item.title)}</td>
          <td class="notice-reason-cell">${escape(item.rejectReason || item.summary)}</td>
          <td><button type="button" data-detail-row="${i}">查看详情</button> ${action(item,i)}</td></tr>`).join("")
          : '<tr><td class="notice-empty" colspan="6">暂无符合条件的消息</td></tr>'}</tbody></table></div>
        <div class="notice-count">共 ${items.length} 条</div>`;
    }
    function render() {
      if (win.hidden) return;
      const items = result();
      const options = filters(category,trader,true);
      const unread = rows.filter(item => item.unread).length;
      win.innerHTML = `<header class="notice-window-head"><div><strong>全部消息</strong><span>${unread} 条未读</span></div><button type="button" data-close aria-label="关闭">×</button></header>
        <div class="notice-window-body"><nav class="notice-sidebar" aria-label="消息分类">${categories.map(label => `<button type="button" data-category="${label}" class="${category === label ? "active" : ""}">${label}</button>`).join("")}</nav>
        <div class="notice-main">${selected ? detail(selected) : `
          <div class="notice-title"><h2>${category}消息</h2><button type="button" data-read>全部已读</button></div>
          ${options.length ? `<div class="notice-tabs">${options.map(([value,label]) => `<button type="button" data-sub="${value}" aria-pressed="${sub === value}" class="${sub === value ? "active" : ""}">${label}</button>`).join("")}</div>` : ""}
          <form class="notice-query"><input type="date" name="date" aria-label="消息日期" value="${escape(query.date)}">
          ${showLevel() ? `<select name="level" aria-label="订单层级">${[["全部","全部层级"],["母单","母单"],["子单","子单"]].map(([value,label]) => `<option value="${value}" ${value === query.level ? "selected" : ""}>${label}</option>`).join("")}</select>` : ""}
          <input name="keyword" aria-label="关键词" placeholder="${labels[category]}" value="${escape(query.keyword)}">
          <button type="submit">查询</button><button type="button" data-reset>重置</button>
          ${trader ? '<button type="button" class="notice-export" data-export>导出</button>' : ""}</form>${table(items)}`}</div></div>`;
      win.querySelector("form")?.addEventListener("submit", event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        query = {date:form.get("date"),level:form.get("level") || "全部",keyword:form.get("keyword").trim()};
        render();
      });
    }
    function close() { win.hidden = true; }
    win.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button) return;
      const data = button.dataset;
      if (data.close !== undefined) return close();
      if (data.category) { category = data.category; sub = "全部"; query = emptyQuery(); selected = null; }
      if (data.sub) { sub = data.sub; query = emptyQuery(); selected = null; }
      if (data.reset !== undefined) query = emptyQuery();
      if (data.back !== undefined) selected = null;
      if (data.read !== undefined) { rows.forEach(item => { item.unread = false; }); onRead(); }
      if (data.detailRow !== undefined) {
        selected = result()[Number(data.detailRow)];
        if (selected && rows.includes(selected)) { selected.unread = false; onRead(); }
      }
      if (data.actionRow !== undefined) {
        const item = data.actionRow === "-1" ? selected : result()[Number(data.actionRow)];
        if (item && goToOrder(item)) close();
        return;
      }
      if (data.export !== undefined) {
        const lines = [["时间","分类","类型","标题","内容"], ...result().map(item => [
          `${dated(item)} ${item.time}`, item.category, item.event, item.title, item.rejectReason || item.summary,
        ])];
        const csv = "\ufeff" + lines.map(row => row.map(value => '"' + String(value ?? "").replaceAll('"','""') + '"').join(",")).join("\r\n");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
        link.download = "消息通知.csv"; link.click(); URL.revokeObjectURL(link.href);
      }
      if (button.type !== "submit") render();
    });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !win.hidden) close(); });
    return {open(nextCategory = "全部", nextSub = "全部") {
      category = nextCategory; sub = nextSub; query = emptyQuery(); selected = null; win.hidden = false; render();
    }, refresh:render, close};
  }
  window.MessageCenter = {filters,list,create,pending};
})();
