(() => {
  const handlingOptions = ["全部", "待处理", "无需处理"];
  const needsHandling = item => item.mode === "HighTouch"
    && item.orderRef?.[1] === "待确认" && item.canProcess !== false;
  const handlingOf = item => needsHandling(item) ? "待处理" : "无需处理";
  const matchesHandling = (item, value) => value === "全部" || handlingOf(item) === value;

  function handlingButtons(value) {
    return '<div class="notice-handling" role="group" aria-label="处理状态"><span>处理状态</span>'
      + handlingOptions.map(option => '<button type="button" data-handling="' + option
        + '" aria-pressed="' + (value === option) + '">' + option + '</button>').join("") + '</div>';
  }

  function examples(side) {
    const events = [
      [1, "order.cancelFailure", "撤单失败", "委托状态已变化，本次撤单未成功。"],
      [2, "order.confirmFailure", "HT确认失败", "本次委托确认未成功。"],
      [3, "order.partial", "未完全委托", "本次委托仅部分提交，请查看委托结果。"],
      [10, "order.htAmend", "HT改单待确认", "收到修改待确认订单。"],
      [11, "order.htCancel", "手工单撤单待确认", "收到需确认撤单的手工单。"],
      [12, "order.approval", "待审批订单", "收到待审批订单通知。"],
      [22, "risk.existing", "触发风控线", "账户指标已达到风控预警线。"],
      [23, "order.cancel", "母单撤单", "子单改单期间收到母单撤单结果。"],
      [24, "order.childReject", "子单拒单", "600000.SH 子单报送被拒。"],
      [25, "order.execution", "单笔成交", "000001.SZ 收到一笔成交回报。"],
      [26, "risk.forcedCancel", "强制撤卖", "收到卖出方向的强制撤单回报。"],
      [27, "risk.forcedCancel", "强制撤买", "收到买入方向的强制撤单回报。"],
      [28, "lending.recall", "仅召回", "收到券源仅召回通知。"],
      [29, "lending.recall", "已用召回", "收到已用券源召回通知。"],
      [30, "lending.recall", "强制买券召回", "收到强制买券召回通知。"],
      [31, "risk.exposure", "超额敞口", "收到融券超额敞口分配通知。"],
      [32, "lending.failure", "锁券失败", "本次锁券未成功。"],
      [33, "lending.failure", "还券失败", "本次还券未成功。"],
    ];
    const supported = new Map(NoticeChannels.messageTypes(side).map(type => [type.key, type]));
    return events.filter(([, key]) => supported.has(key)).map(([id, key, title, summary]) => {
      const {category, group} = supported.get(key);
      const details = {
        1: {account:"DEMO-04501", order:"DEMO-CANCEL-01", rejectReason:"委托状态已变化"},
        24: {account:"DEMO-04502", order:"C-ORD-DEMO-02", parentOrder:"P-ORD-DEMO-02",
          childOrder:"C-ORD-DEMO-02", rejectStage:"柜台报送", rejectReason:"申报数量不符合要求"},
      };
      return {id, noticeKey:key, category, group, event:title, title, summary, body:summary,
        time:"09:" + String(60 - id).padStart(2, "0"), unread:[1, 22, 24, 28].includes(id),
        icon:"i", level:"info", orderLevel:["母单","子单"].includes(group) ? group : "—", ...details[id]};
    });
  }
  const escape = value => String(value ?? "--").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;",
  })[char]);
  const sessionDate = new Date().toLocaleDateString("sv-SE");
  const dated = item => item.date || sessionDate;
  const byNewest = (first, second) =>
    (dated(second) + " " + second.time).localeCompare(dated(first) + " " + first.time);

  function selection(channels, category = "全部", group = "全部", type = "全部") {
    const tree = NoticeChannels.messageGroups(channels.side).map(node => ({
      ...node,
      groups: node.groups.map(entry => ({
        ...entry, showTypes: entry.types.some(item => item.label !== entry.label),
        types: entry.types.filter(item => channels.allowsMessage(item.key)),
      })).filter(entry => entry.types.length),
    })).filter(node => node.groups.length);
    const currentCategory = tree.find(node => node.label === category);
    const groupOptions = currentCategory ? [["全部", "全部" + category],
      ...currentCategory.groups.map(entry => [entry.label, entry.label])] : [];
    const currentGroup = currentCategory?.groups.find(entry => entry.label === group);
    const typeOptions = currentGroup?.showTypes
      ? [["全部", "全部类型"], ...currentGroup.types.map(item => [item.key, item.label])] : [];
    return {
      categories: ["全部", ...tree.map(node => node.label)],
      category: currentCategory?.label || "全部",
      group: currentGroup?.label || "全部",
      type: typeOptions.some(([key]) => key === type) ? type : "全部",
      groupOptions,
      typeOptions,
    };
  }

  function filterButtons(options, active, attribute, className) {
    return options.map(([value, label]) =>
      `<button type="button" ${attribute}="${escape(value)}" aria-pressed="${active === value}" class="${className} ${active === value ? "active" : ""}">${escape(label)}</button>`
    ).join("");
  }

  const visibleRows = (rows, channels) => rows.filter(item => channels.allowsMessage(item.noticeKey));

  function list(rows, {category, group, type}, handling = "全部") {
    return rows.filter(item => matchesHandling(item, handling)
      && (category === "全部" || item.category === category)
      && (group === "全部" || item.group === group)
      && (type === "全部" || item.noticeKey === type)).sort(byNewest);
  }

  function create({rows, meta, onRead, orderAction, goToOrder, channels, exportEnabled = false}) {
    const win = document.createElement("section");
    win.className = "notice-window";
    win.hidden = true;
    win.setAttribute("role","dialog");
    win.setAttribute("aria-label","全部消息");
    document.body.append(win);
    const emptyQuery = () => ({date:"", keyword:""});
    let current, query, selected, handling;
    const labels = {全部:"标题 / 内容", 订单:"账号 / 订单号 / 标的 / 内容", 风控:"账号 / 标题 / 内容", 融券:"标题 / 内容"};
    const searchable = item => [item.title, item.summary, item.body, item.rejectReason, item.account,
      item.order, item.parentOrder, item.childOrder, item.symbol, item.orderRef?.[5]];
    function result() {
      return list(visibleRows(rows, channels), current, handling).filter(item =>
        (!query.date || dated(item) === query.date)
        && (!query.keyword || searchable(item).some(value => String(value ?? "").toLowerCase().includes(query.keyword))));
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
      return `<div class="notice-table-wrap"><table class="notice-table">
        <thead><tr><th>时间</th><th>分类</th><th>栏目</th><th>标题</th><th>处理状态</th><th>内容</th><th>操作</th></tr></thead>
        <tbody>${items.length ? items.map((item,i) => `<tr>
          <td>${escape(dated(item))} ${escape(item.time)}</td>
          <td>${escape(item.category)}</td><td>${escape(item.group)}</td><td>${escape(item.title)}</td>
          <td><span class="notice-state ${needsHandling(item) ? "is-pending" : ""}">${handlingOf(item)}</span></td>
          <td class="notice-reason-cell">${escape(item.rejectReason || item.summary)}</td>
          <td><button type="button" data-detail-row="${i}">查看详情</button> ${action(item,i)}</td></tr>`).join("")
          : '<tr><td class="notice-empty" colspan="7">暂无符合条件的消息</td></tr>'}</tbody></table></div>
        <div class="notice-count">共 ${items.length} 条</div>`;
    }
    function render() {
      if (win.hidden) return;
      current = selection(channels, current.category, current.group, current.type);
      const {category, group, type, categories, groupOptions, typeOptions} = current;
      if (selected && !channels.allowsMessage(selected.noticeKey)) selected = null;
      const items = result();
      const unread = visibleRows(rows, channels).filter(item => item.unread).length;
      win.innerHTML = `<header class="notice-window-head"><div><strong>全部消息</strong><span>${unread} 条未读</span></div><button type="button" data-close aria-label="关闭">×</button></header>
        <div class="notice-window-body"><nav class="notice-sidebar" aria-label="消息分类">${categories.map(label => `<button type="button" data-category="${label}" class="${category === label ? "active" : ""}">${label}</button>`).join("")}</nav>
        <div class="notice-main">${selected ? detail(selected) : `
          <div class="notice-title"><h2>${category}消息</h2><button type="button" data-read>全部已读</button></div>
          ${groupOptions.length ? `<div class="notice-tabs" aria-label="栏目">${filterButtons(groupOptions, group, "data-sub", "")}</div>` : ""}
          ${typeOptions.length ? `<div class="notification-subfilters notice-type-filters" aria-label="消息类型">${filterButtons(typeOptions, type, "data-type", "notification-subfilter")}</div>` : ""}
          ${handlingButtons(handling)}
          <form class="notice-query"><input type="date" name="date" aria-label="消息日期" value="${escape(query.date)}">
          <input name="keyword" aria-label="关键词" placeholder="${labels[category]}" value="${escape(query.keyword)}">
          <button type="submit">查询</button><button type="button" data-reset>重置</button>
          ${exportEnabled ? '<button type="button" class="notice-export" data-export>导出</button>' : ""}</form>${table(items)}`}</div></div>`;
      win.querySelector("form")?.addEventListener("submit", event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        query = {date:form.get("date"), keyword:form.get("keyword").trim().toLowerCase()};
        render();
      });
    }
    function close() { win.hidden = true; }
    win.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button) return;
      const data = button.dataset;
      if (data.close !== undefined) return close();
      if (data.category || data.sub || data.type) {
        current = selection(channels, data.category || current.category,
          data.category ? "全部" : data.sub || current.group, data.type || "全部");
        query = emptyQuery();
        selected = null;
      }
      if (data.handling) handling = data.handling;
      if (data.reset !== undefined) { query = emptyQuery(); handling = "全部"; }
      if (data.back !== undefined) selected = null;
      if (data.read !== undefined) { visibleRows(rows, channels).forEach(item => { item.unread = false; }); onRead(); }
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
        const headers = ["时间","分类","栏目","标题","处理状态","内容"];
        const lines = [headers, ...result().map(item => [
          `${dated(item)} ${item.time}`, item.category, item.group, item.title, handlingOf(item),
          item.rejectReason || item.summary,
        ])];
        const csv = "\ufeff" + lines.map(row => row.map(value => '"' + String(value ?? "").replaceAll('"','""') + '"').join(",")).join("\r\n");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
        link.download = "消息通知.csv"; link.click(); URL.revokeObjectURL(link.href);
      }
      if (button.type !== "submit") render();
    });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !win.hidden) close(); });
    return {open(next = {}, nextHandling = "全部") {
      current = selection(channels, next.category, next.group, next.type);
      query = emptyQuery(); selected = null; handling = nextHandling; win.hidden = false; render();
    }, refresh:render, close};
  }
  window.MessageCenter = {selection,filterButtons,visibleRows,list,create,needsHandling,handlingButtons,examples};
})();
