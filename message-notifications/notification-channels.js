(() => {
  const key = side => "oms.notice.settings." + side;
  const load = side => {
    try { return JSON.parse(localStorage.getItem(key(side))); }
    catch { return null; }
  };
  const save = (side, payload) => localStorage.setItem(key(side), JSON.stringify(payload));
  const dialogEvents = {
    Trader: ["手工单成交价格校验","HT订单确认","手工单确认撤单","HT改单确认","单笔成交","未完全委托","待审批订单","子单拒单","撤单失败","触发风控线"],
    Custom: ["单笔成交","未完全委托","撤单失败"],
  };

  const messageCatalog = [
    ["订单", [
      ["母单", [
        ["HT下单待确认", "order.htPending", "Trader"],
        ["HT改单待确认", "order.htAmend", "Trader"],
        ["母单撤单", "order.cancel", "Custom"],
        ["单笔成交", "order.execution", "Custom"],
      ]],
      ["子单", [
        ["手工单撤单待确认", "order.htCancel", "Trader"],
        ["子单拒单", "order.childReject", "Custom"],
      ]],
      ["订单结果", [
        ["撤单失败", "order.cancelFailure"],
        ["HT确认失败", "order.confirmFailure"],
        ["未完全委托", "order.partial"],
      ]],
      ["审批", [["待审批订单", "order.approval", "Trader"]]],
    ]],
    ["风控", [
      ["触发风控线", [["触发风控线", "risk.existing"]]],
      ["强制撤单", [["强制撤单", "risk.forcedCancel"]]],
    ]],
    ["融券", [
      ["召回", [["召回", "lending.recall"]]],
      ["超额敞口", [["超额敞口", "risk.exposure"]]],
      ["锁券及还券失败", [["锁券及还券失败", "lending.failure", "Custom"]]],
    ]],
  ];

  function messageGroups(side) {
    return messageCatalog.map(([category, groups]) => ({
      label: category,
      groups: groups.map(([group, entries]) => ({
        label: group,
        types: entries.filter(([, , onlySide]) => !onlySide || onlySide === side)
          .map(([label, key]) => ({label, key, category, group})),
      })).filter(group => group.types.length),
    }));
  }

  function messageTypes(side) {
    return messageGroups(side).flatMap(category => category.groups.flatMap(group => group.types));
  }

  const popupGroups = {
    Trader: [["母单",["HT订单确认","HT改单确认","单笔成交"]],["子单",["手工单确认撤单","子单拒单"]],
      ["订单结果",["未完全委托","撤单失败"]],["手工成交校验",["手工单成交价格校验"]],
      ["审批",["待审批订单"]],["风控",["触发风控线"]]],
    Custom: [["母单",["单笔成交"]],["订单结果",["未完全委托","撤单失败"]]],
  };

  const soundDefaults = { orderSuccess: "默认提示音", orderExecution: "清脆提示音" };
  const eventSetting = (channel, path) => path.split(".").reduce((value, field) => value?.[field], channel);

  function withMessageDefaults(settings, side) {
    const channel = settings.notification;
    const notification = {enabled: channel?.enabled !== false};
    for (const {key} of messageTypes(side)) {
      const [group, event] = key.split(".");
      notification[group] ??= {};
      notification[group][event] = eventSetting(channel, key) !== false;
    }
    return {...settings, notification};
  }

  function connect(side, workspace) {
    const supported = new Set(messageTypes(side).map(type => type.key));
    let current = load(side);
    let frame;
    const settings = () => current?.settings;
    window.addEventListener("message", event => {
      if (event.origin !== location.origin || event.source !== frame?.contentWindow || event.data?.type !== "notice-settings-save") return;
      try {
        const payload = event.data.payload;
        save(side, payload);
        current = payload;
        window.dispatchEvent(new Event("notice-settings-changed"));
        event.source.postMessage({type: "notice-settings-result", ok: true}, location.origin);
      } catch {
        event.source.postMessage({type: "notice-settings-result", ok: false}, location.origin);
      }
    });

    function open() {
      if (!frame || !frame.isConnected) {
        frame = document.createElement("iframe");
        frame.title = "系统设置";
        frame.src = "prototypes/system-settings-notifications.html?embedded";
        frame.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff;z-index:9";
        frame.addEventListener("load", () => {
          frame.contentWindow.postMessage({type: "notice-settings-load", payload: current}, location.origin);
        });
        workspace.append(frame);
      }
      frame.hidden = false;
    }

    function allowsMessage(path) {
      const channel = settings()?.notification;
      return supported.has(path) && channel?.enabled !== false && eventSetting(channel, path) !== false;
    }

    function allowsDialog(dialog) {
      const dialogChannel = settings()?.dialogs;
      const index = dialogEvents[side].indexOf(dialog);
      if (side === "Trader" && ["手工单成交价格校验","待审批订单","单笔成交","子单拒单"].includes(dialog)) return false;
      return index >= 0 && (dialogChannel
        ? dialogChannel.enabled && dialogChannel.items["event" + index]
        : index < 2 || dialog === "触发风控线");
    }

    function dispatch({message, dialog, sound, addMessage, showDialog}) {
      if (message && allowsMessage(message)) addMessage?.();
      if (dialog && allowsDialog(dialog)) showDialog();
      const soundChannel = settings()?.sounds;
      const item = soundChannel?.items[sound];
      const name = soundChannel ? (soundChannel.enabled && item?.enabled && item.file) : soundDefaults[sound];
      if (name) play(name, current?.files);
    }

    return { open, close: () => { if (frame) frame.hidden = true; }, dispatch, allowsMessage, allowsDialog, side, settings };
  }

  function play(name, files = []) {
    const custom = files.find(file => file.name === name);
    if (custom) {
      new Audio(custom.url).play().catch(() => {});
      return;
    }
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    try {
      const context = new Context();
      const tone = context.createOscillator();
      const volume = context.createGain();
      tone.frequency.value = {"默认提示音":550,"清脆提示音":660,"柔和提示音":440,"强提醒音":880}[name] || 550;
      volume.gain.value = .08;
      tone.connect(volume).connect(context.destination);
      tone.onended = () => context.close();
      tone.start();
      tone.stop(context.currentTime + .22);
    } catch {}
  }

  const popupExamples = {
    1: {dialog:"撤单失败"},
    3: {dialog:"未完全委托"},
    9: {dialog:"HT订单确认"},
    10: {dialog:"HT改单确认"},
    11: {dialog:"手工单确认撤单"},
    22: {dialog:"触发风控线"},
    24: {dialog:"子单拒单"},
    25: {dialog:"单笔成交", sound:"orderExecution"},
  };

  function bindSamples(channels, rows, refresh) {
    const examples = new Map(rows.map(item => [item.title, item]));
    window.addEventListener("message", event => {
      if (event.origin !== location.origin || window.parent === window || event.source !== window.parent || event.data?.type !== "oms-notice-sample") return;
      const original = examples.get(event.data.title);
      if (!original) return;
      const item = {...original, id:nextMessageId(), unread:true,
        date:new Date().toLocaleDateString("sv-SE"),
        time:new Date().toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"})};
      channels.dispatch({...popupExamples[original.id], message:item.noticeKey,
        addMessage: () => rows.unshift(item),
        showDialog: () => showPopup(item.title, item.summary),
      });
      refresh();
    });
  }

  let lastMessageId = 0;
  function nextMessageId() {
    lastMessageId = Math.max(Date.now(), lastMessageId + 1);
    return lastMessageId;
  }

  function showPopup(title, summary) {
    const shell = document.querySelector(".app-shell") || document.body;
    shell.querySelector(".business-notice-popup")?.remove();
    const popup = document.createElement("aside");
    popup.className = "business-notice-popup";
    popup.setAttribute("role", "status");
    const text = document.createElement("div");
    const heading = document.createElement("strong");
    heading.textContent = title;
    const detail = document.createElement("div");
    detail.textContent = summary;
    text.append(heading, detail);
    const close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "关闭提醒");
    close.textContent = "×";
    close.onclick = () => popup.remove();
    popup.append(text, close);
    shell.append(popup);
    setTimeout(() => popup.remove(), 6500);
  }

  window.NoticeChannels = {connect, load, save, bindSamples, showPopup, withMessageDefaults, messageGroups, messageTypes, nextMessageId, popupGroups, dialogEvents};
})();
