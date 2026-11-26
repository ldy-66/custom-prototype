(() => {
  const categories = ["全部", "订单", "市场", "风控", "融券", "系统"];
  const pending = "HighTouch 待确认订单";
  const archive = "异常反馈";
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

  function examples(trader) {
    const data = [
      [101, "订单", "撤单失败", "撤单失败", "委托状态已变化，本次撤单未成功。"],
      [102, "订单", "未完全委托", "未完全委托", "本次委托仅部分提交，请查看委托结果。"],
      [103, "风控", "预警", "触发风控线", "账户指标已达到风控预警线。"],
      [104, "风控", "强制撤单", "强制撤卖", "卖出方向的强制撤单已完成。"],
      [105, "风控", "预警", "超额敞口", "账户敞口达到预警条件。"],
      [106, "融券", "召回", "仅召回", "收到券源召回通知，请查看相关业务记录。"],
      [107, "融券", "召回", "已用召回", "收到已用券源召回通知。"],
      [108, "融券", "召回", "强制买券召回", "收到强制买券召回通知。"],
      [112, "风控", "强制撤单", "强制撤买", "买入方向的强制撤单已完成。"],
      [114, "订单", "确认失败", "HighTouch 确认失败", "本次委托确认未成功，请查看订单结果。"],
    ];
    if (trader) data.push(
      [115, "订单", "改单待确认", "HighTouch 改单待确认", "收到修改待确认订单。"],
      [116, "订单", "撤单待确认", "手工单确认撤单", "收到需要确认的撤单请求。"],
      [117, "订单", "待审批", "待审批订单", "收到待审批订单通知。"]
    );
    if (!trader) data.push(
      [109, "融券", "操作失败", "锁券失败", "本次锁券未成功，请查看原操作结果。"],
      [110, "融券", "操作失败", "还券失败", "本次还券未成功，请查看原操作结果。"],
      [111, "订单", "撤单", "子单改单期间母单撤单", "子单改单期间收到母单撤单结果。"],
      [113, "订单", "成交", "单笔成交", "000001.SZ 收到一笔成交回报。"]
    );
    return data.map(([id, category, event, title, summary]) => ({
      id, category, event, title, summary, body: summary, time: "09:" + (id - 60),
      unread: false, icon: "i", level: "info",
      ...(category === "订单" ? {orderLevel: [111,113].includes(id) ? "母单" : id === 116 ? "子单" : "—"} : {}),
      ...(id === 114 || id === 115 ? {mode:"HighTouch"} : {}),
      ...(id === 101 ? {order:"DEMO-CANCEL-01", account:trader ? "DEMO-1001" : "DEMO-04501",
        symbol:"000001.SZ", rejectReason:"委托状态已变化"} : {})
    }));
  }
  const escape = value => String(value ?? "--").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;",
  })[char]);
  const sessionDate = new Date().toLocaleDateString("sv-SE");
  const dated = item => item.date || sessionDate;
  const byNewest = (first, second) =>
    (dated(second) + " " + second.time).localeCompare(dated(first) + " " + first.time);

  const orderGroups = ["母单","子单","订单通用","审批"];
  function channelsForCategory(category, channels) {
    const groups = NoticeChannels.messageGroups(channels.side);
    return groups.filter(([group]) => category === "订单" ? orderGroups.includes(group) : group === category)
      .flatMap(([, entries]) => entries.map(([, path]) => path));
  }
  function categoriesFor(channels) {
    return categories.filter(category => ["全部","系统"].includes(category)
      || channelsForCategory(category,channels).some(channels.allowsMessage)
      || category === "订单" && channels.side === "Trader");
  }
  function filters(category, trader, channels) {
    const groups = {
      订单: [["全部","全部订单"],["母单","母单"],["子单","子单"],["拒单","拒单提示"],["撤单失败","撤单失败"],["未完全委托","未完全委托"]],
      市场: [["全部","全部市场"],["沪深","沪深"],["港股","港股"],["美股","美股"]],
      风控: [["全部","全部风控"],["预警","风控预警"],["强制撤单","强制撤单"]],
      融券: [["全部","全部融券"],["召回","召回"],["操作失败","操作失败"]],
      系统: [["全部","全部系统"],["登录成功","登录成功"],["新设备登录","新设备登录"]],
    };
    const options = groups[category] || [];
    if (trader && category === "订单") {
      options.push([pending,pending]);
    }
    return options.filter(([value]) => {
      const map = {
        订单: {
          母单: NoticeChannels.messageGroups(channels.side).find(([group]) => group === "母单")[1].map(([, path]) => path),
          子单: channels.side === "Trader" ? ["order.childReject","order.htCancel"] : ["order.childReject"], 拒单:["order.parentReject","order.childReject"],
          撤单失败:["order.cancelFailure"], 未完全委托:["order.partial"],
        },
        市场: {沪深:["market.cn"],港股:["market.hk"],美股:["market.us"]},
        风控: {预警:["risk.existing","risk.exposure"],强制撤单:["risk.forcedCancel"]},
        融券: {召回:["lending.recall"],操作失败:channels.side === "Custom" ? ["lending.failure"] : []},
      };
      const paths = map[category]?.[value];
      if (paths && !paths.some(channels.allowsMessage)) return false;
      if (category === "订单" && ["撤单失败","未完全委托"].includes(value)) {
        const index = NoticeChannels.dialogEvents[channels.side].indexOf(value);
        return channels.settings()?.dialogs?.items?.["event"+index] !== false;
      }
      return true;
    });
  }

  function list(rows, category, sub, handling = "全部") {
    return rows.filter(item => {
      if (!matchesHandling(item, handling)) return false;
      if (category === "全部") return true;
      if (item.category !== category) return false;
      if (sub === "全部") return true;
      if (category === "订单") {
        if (sub === "拒单") return item.event === "拒单";
        if (sub === "撤单失败" || sub === "未完全委托") return item.event === sub;
        if (sub === pending) return needsHandling(item);
        return item.orderLevel === sub;
      }
      if (category === "市场") return item.market === sub;
      if (category === "风控" || category === "融券") return item.event === sub;
      return item.title.startsWith(sub);
    }).sort(byNewest);
  }

  function create({rows, meta, onRead, orderAction, goToOrder, pendingRows, archiveRows, channels}) {
    const trader = Boolean(pendingRows);
    const win = document.createElement("section");
    win.className = "notice-window";
    win.hidden = true;
    win.setAttribute("role","dialog");
    win.setAttribute("aria-label","全部消息");
    document.body.append(win);
    const emptyQuery = () => ({date:"",level:"全部",keyword:""});
    let category, sub, query, selected, handling;
    const showLevel = () => category === archive || category === "订单" && ["全部", "拒单"].includes(sub);
    const labels = {全部:"标题 / 内容",订单:"账号 / 订单号 / 标的 / 内容",市场:"市场 / 标题 / 内容",风控:"账号 / 标题 / 内容",融券:"标题 / 内容",系统:"标题 / 内容", [archive]:"账号 / 订单号 / 标的 / 原因"};
    const searchable = item => [item.title,item.summary,item.body,item.rejectReason,item.account,
      item.order,item.parentOrder,item.childOrder,item.market,item.symbol,item.orderRef?.[5],item.orderRef?.symbol];
    function result() {
      let base = rows;
      if (category === archive) base = archiveRows();
      else if (trader && (handling === "待处理" || sub === pending)) base = list(pendingRows(), category, sub);
      else base = list(rows, category, sub);
      return base.filter(item => matchesHandling(item, handling) && (!query.date || dated(item) === query.date)
        && (!showLevel() || query.level === "全部" || item.orderLevel === query.level)
        && (!query.keyword || searchable(item).some(value => String(value ?? "").toLowerCase().includes(query.keyword.toLowerCase()))))
        .sort(byNewest);
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
      const isArchive = category === archive;
      const order = category === "订单" || isArchive;
      const scope = order ? "订单层级" : category === "市场" ? "市场" : "分类";
      return `<div class="notice-table-wrap"><table class="notice-table">
        <thead><tr><th>时间</th><th>${scope}</th><th>类型</th><th>${isArchive ? "订单号" : "标题"}</th><th>${isArchive ? "资金账号" : "处理状态"}</th><th>${isArchive ? "反馈原因" : "内容"}</th><th>操作</th></tr></thead>
        <tbody>${items.length ? items.map((item,i) => `<tr>
          <td>${escape(dated(item))} ${escape(item.time)}</td>
          <td>${escape(order ? item.orderLevel : category === "市场" ? item.market : item.category)}</td>
          <td>${escape(item.event)}</td><td>${escape(isArchive ? item.order : item.title)}</td>
          <td>${isArchive ? escape(item.account) : `<span class="notice-state ${needsHandling(item) ? "is-pending" : ""}">${handlingOf(item)}</span>`}</td>
          <td class="notice-reason-cell">${escape(item.rejectReason || (isArchive ? "暂无原因" : item.summary))}</td>
          <td><button type="button" data-detail-row="${i}">查看详情</button> ${action(item,i)}</td></tr>`).join("")
          : '<tr><td class="notice-empty" colspan="7">暂无符合条件的消息</td></tr>'}</tbody></table></div>
        <div class="notice-count">共 ${items.length} 条</div>`;
    }
    function render() {
      if (win.hidden) return;
      const shown = categoriesFor(channels);
      const nav = trader ? [...shown, archive] : shown;
      if (!nav.includes(category)) {
        category = "全部"; sub = "全部"; query = emptyQuery(); selected = null;
      }
      const options = filters(category,trader,channels);
      if (sub !== "全部" && !options.some(([value]) => value === sub)) {
        sub = "全部"; query = emptyQuery(); selected = null;
      }
      const items = result();
      const unread = rows.filter(item => item.unread).length;
      win.innerHTML = `<header class="notice-window-head"><div><strong>全部消息</strong><span>${unread} 条未读</span></div><button type="button" data-close aria-label="关闭">×</button></header>
        <div class="notice-window-body"><nav class="notice-sidebar" aria-label="消息分类">${nav.map(label => `<button type="button" data-category="${label}" class="${category === label ? "active" : ""}">${label}</button>`).join("")}</nav>
        <div class="notice-main">${selected ? detail(selected) : `
          <div class="notice-title"><h2>${category === archive ? archive : category + "消息"}</h2>${category === archive ? "" : '<button type="button" data-read>全部已读</button>'}</div>
          ${options.length ? `<div class="notice-tabs">${options.map(([value,label]) => `<button type="button" data-sub="${value}" aria-pressed="${sub === value}" class="${sub === value ? "active" : ""}">${label}</button>`).join("")}</div>` : ""}
          ${category === archive || sub === pending ? "" : handlingButtons(handling)}
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
      if (data.category) {
        if (category === archive || data.category === archive) handling = "全部";
        category = data.category; sub = "全部"; query = emptyQuery(); selected = null;
      }
      if (data.sub) {
        if (data.sub === pending) handling = "全部";
        sub = data.sub; query = emptyQuery(); selected = null;
      }
      if (data.handling) handling = data.handling;
      if (data.reset !== undefined) { query = emptyQuery(); handling = "全部"; }
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
        const isArchive = category === archive;
        const headers = isArchive ? ["时间","订单层级","类型","订单号","资金账号","反馈原因"]
          : ["时间","分类","类型","标题","处理状态","内容"];
        const lines = [headers, ...result().map(item => [
          `${dated(item)} ${item.time}`, isArchive ? item.orderLevel : item.category, item.event,
          isArchive ? item.order : item.title, isArchive ? item.account : handlingOf(item),
          item.rejectReason || (isArchive ? "暂无原因" : item.summary),
        ])];
        const csv = "\ufeff" + lines.map(row => row.map(value => '"' + String(value ?? "").replaceAll('"','""') + '"').join(",")).join("\r\n");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
        link.download = "消息通知.csv"; link.click(); URL.revokeObjectURL(link.href);
      }
      if (button.type !== "submit") render();
    });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !win.hidden) close(); });
    return {open(nextCategory = "全部", nextSub = "全部", nextHandling = "全部") {
      category = nextCategory; sub = nextSub; query = emptyQuery(); selected = null; handling = nextHandling; win.hidden = false; render();
    }, refresh:render, close};
  }
  window.MessageCenter = {categoriesFor,filters,list,create,pending,archive,needsHandling,handlingButtons,examples};
})();
