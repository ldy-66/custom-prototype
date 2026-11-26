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

  const commonOrder = [
    ["订单通用", [["未完全委托","order.partial"],["撤单失败","order.cancelFailure"],
      ["HighTouch 确认失败","order.confirmFailure"],["激活通知","order.activation"]]],
  ];
  function messageGroups(side) {
    const trader = side === "Trader";
    return [
      ["母单", [["下单通知","order.submit"],["母单撤单","order.cancel"],["改单通知","order.amend"],
        ["母单拒单","order.parentReject"], ...(trader
          ? [["HighTouch 下单待确认","order.htPending"]]
          : [["单笔成交","order.execution"]])]],
      ["子单", [["子单拒单","order.childReject"], ...(trader ? [["手工单撤单待确认","order.htCancel"]] : [])]],
      ...commonOrder.map(([group, entries]) => [group, [...entries, ...(trader ? [["HighTouch 改单待确认","order.htAmend"]] : [])]]),
      ...(trader ? [["审批",[["待审批订单","order.approval"]]]] : []),
      ["市场", [["沪深休市","market.cn"],["港股休市","market.hk"],["美股休市","market.us"]]],
      ["风控", [["触发风控线","risk.existing"],["强制撤单（撤买、撤卖）","risk.forcedCancel"],["超额敞口","risk.exposure"]]],
      ["融券", [["券源召回","lending.recall"], ...(trader ? [] : [["锁券及还券失败","lending.failure"]])]],
    ];
  }
  const popupGroups = {
    Trader: [["母单",["HT订单确认","单笔成交"]],["子单",["手工单确认撤单","子单拒单"]],
      ["订单通用",["HT改单确认","手工单成交价格校验","未完全委托","撤单失败"]],
      ["审批",["待审批订单"]],["风控",["触发风控线"]]],
    Custom: [["母单",["单笔成交"]],["订单通用",["未完全委托","撤单失败"]]],
  };

  const soundDefaults = { orderSuccess: "默认提示音", orderExecution: "清脆提示音" };
  const newMessageDefaults = {
    order: { cancelFailure: true, partial: true, confirmFailure: true, htPending: true, htAmend: true, htCancel: true },
    risk: { forcedCancel: true, exposure: true },
    lending: { recall: true, failure: true },
  };
  const eventSetting = (channel, path) => path.split(".").reduce((value, field) => value?.[field], channel);

  function withMessageDefaults(settings) {
    const notification = {...settings.notification};
    for (const [group, values] of Object.entries(newMessageDefaults)) {
      notification[group] = {...values, ...notification[group]};
    }
    return {...settings, notification};
  }

  function connect(side, workspace) {
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
      return channel ? channel.enabled && (eventSetting(channel, path) ?? eventSetting(newMessageDefaults, path)) === true
        : !path.startsWith("system.");
    }

    function allowsDialog(dialog) {
      const dialogChannel = settings()?.dialogs;
      const index = dialogEvents[side].indexOf(dialog);
      if (side === "Trader" && ["手工单成交价格校验","待审批订单","单笔成交"].includes(dialog)) return false;
      return index >= 0 && (dialogChannel
        ? dialogChannel.enabled && dialogChannel.items["event" + index]
        : index < 2 || dialog === "触发风控线");
    }

    function dispatch({message, dialog, sound, addMessage, showDialog}) {
      if (message && allowsMessage(message)) addMessage();
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

  const samples = {
    "HighTouch 确认失败": {id:114, message:"order.confirmFailure"},
    "HighTouch 改单待确认": {id:115, message:"order.htAmend", dialog:"HT改单确认"},
    "手工单确认撤单": {id:116, message:"order.htCancel", dialog:"手工单确认撤单"},
    "待审批订单": {id:117, message:"order.approval"},
    "母单拒单": {id:1, message:"order.parentReject"},
    "子单拒单": {id:2, message:"order.childReject", dialog:"子单拒单"},
    "撤单失败": {id:101, message:"order.cancelFailure", dialog:"撤单失败"},
    "未完全委托": {id:102, message:"order.partial", dialog:"未完全委托"},
    "沪深休市": {id:5, message:"market.cn"},
    "港股休市": {id:6, message:"market.hk"},
    "美股休市": {id:7, message:"market.us"},
    "触发风控线": {id:103, message:"risk.existing", dialog:"触发风控线"},
    "强制撤卖": {id:104, message:"risk.forcedCancel"},
    "强制撤买": {id:112, message:"risk.forcedCancel"},
    "超额敞口": {id:105, message:"risk.exposure"},
    "仅召回": {id:106, message:"lending.recall"},
    "已用召回": {id:107, message:"lending.recall"},
    "强制买券召回": {id:108, message:"lending.recall"},
    "锁券失败": {id:109, message:"lending.failure"},
    "还券失败": {id:110, message:"lending.failure"},
    "单笔成交": {id:113, message:"order.execution", dialog:"单笔成交", sound:"orderExecution"},
  };

  function bindSamples(channels, rows, refresh, archive = () => {}) {
    window.addEventListener("message", event => {
      if (event.origin !== location.origin || window.parent === window || event.source !== window.parent || event.data?.type !== "oms-notice-sample") return;
      const sample = Object.hasOwn(samples, event.data.title) && samples[event.data.title];
      const original = sample && rows.find(row => row.id === sample.id);
      if (!original) return;
      const item = {...original, id:Date.now(), unread:true,
        date:new Date().toLocaleDateString("sv-SE"),
        time:new Date().toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"})};
      if (item.event === "拒单" || item.event === "撤单失败") archive({...item, unread:false});
      channels.dispatch({...sample,
        addMessage: () => rows.unshift(item),
        showDialog: () => showPopup(item.title, item.summary),
      });
      refresh();
    });
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

  window.NoticeChannels = {connect, load, save, bindSamples, showPopup, withMessageDefaults, messageGroups, popupGroups, dialogEvents};
})();
