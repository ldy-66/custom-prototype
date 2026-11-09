/* Local interaction samples only. No order is sent to a trading system. */
const cfContracts = [
  {code:"rb2701.SHF",name:"螺纹钢2701",exchange:"上期所",split:true,price:3128,tick:1,multiplier:10,margin:.12},
  {code:"sc2701.INE",name:"原油2701",exchange:"上期能源",split:true,price:456.6,tick:.1,multiplier:1000,margin:.15},
  {code:"a2701.DCE",name:"连豆一2701",exchange:"大商所",split:false,price:4218,tick:1,multiplier:10,margin:.12},
  {code:"TA2701.CZC",name:"PTA2701",exchange:"郑商所",split:false,price:4986,tick:2,multiplier:5,margin:.12},
  {code:"IF2612.CFE",name:"沪深2612",exchange:"中金所",split:false,price:4216.8,tick:.2,multiplier:300,margin:.15},
  {code:"lc2701.GFE",name:"碳酸锂2701",exchange:"广期所",split:false,price:78200,tick:20,multiplier:1,margin:.15},
];
const cf = {
  market:"期货交易",account:"交易账户01",customer:"演示交易对手01",fund:"DEMO-F01",frame:"期货框架01",
  contract:0,direction:"buy",offset:"open",price:3128,qty:1,mode:"LowTouch",expanded:false,error:"",modal:null,
  orders:[],reservations:new Map(),selected:new Set(),filter:"全部",nextId:1,
};
const cfSettingsKey = "custom-futures-ticket-settings";
let cfSettings = TicketSettings.load(cfSettingsKey, {
  priority: localStorage.getItem("custom-futures-priority") === "yesterday" ? "yesterday" : "today",
  keep: ["交易账户", "合约代码", "委托价格"], priceWheel: false, quantityWheel: false, quantities: [1, 5, 10, null],
});
const cfWorkspace = document.querySelector(".workspace");
const cfSecurities = document.createElement("div");
cfSecurities.className = "cf-securities";
cfWorkspace.querySelectorAll(":scope > .top-grid, :scope > .order-list-panel").forEach(panel => cfSecurities.append(panel));
cfWorkspace.classList.add("cf-shell");
cfWorkspace.appendChild(cfSecurities);
const cfTabs = document.createElement("div");
cfTabs.className = "cf-market-tabs";
cfTabs.innerHTML = ["证券交易","期货交易","债券交易","篮子交易"].map(label=>`<button type="button" data-cf-market="${label}">${label}</button>`).join("");
cfWorkspace.prepend(cfTabs);
const cfRoot = document.createElement("div");
cfRoot.className = "cf-workspace";
cfWorkspace.appendChild(cfRoot);
const cfEscape = value => String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const cfMoney = value => Number(value).toLocaleString("zh-CN",{minimumFractionDigits:2,maximumFractionDigits:2});
const cfContract = () => cfContracts[cf.contract];
const cfOffset = (offset,contract=cfContract()) => ({open:"开仓",today:"平今",close:contract.split ? "平昨" : "平仓",auto:`自动（优先平${cfSettings.priority === "today" ? "今" : "昨"}）`}[offset]);
const cfFunds = () => cf.account === "交易账户01" ? 100000 : 65000;

function cfPosition(side) {
  const small = cf.frame === "期货框架02";
  const base = small ? {today:1,yesterday:2,frozenToday:0,frozenYesterday:0} : side === "多头" ? {today:3,yesterday:5,frozenToday:1,frozenYesterday:0} : {today:2,yesterday:4,frozenToday:0,frozenYesterday:1};
  const key = [cf.account,cf.customer,cf.fund,cf.frame,cfContract().code,side].join("|");
  const reserved = cf.reservations.get(key) || {today:0,yesterday:0};
  return {...base,key,side,frozenToday:base.frozenToday+reserved.today,frozenYesterday:base.frozenYesterday+reserved.yesterday,
    availableToday:Math.max(0,base.today-base.frozenToday-reserved.today),availableYesterday:Math.max(0,base.yesterday-base.frozenYesterday-reserved.yesterday)};
}
function cfOpenLimit() { return Math.max(0,Math.min(25,Math.floor(cfFunds()/(Math.max(1,cf.price)*cfContract().multiplier*cfContract().margin)))); }
function cfAvailable() {
  const p = cfPosition(cf.direction === "buy" ? "空头" : "多头");
  if (cf.offset === "open") return cfOpenLimit();
  if (cf.offset === "auto") return p.availableToday+p.availableYesterday+cfOpenLimit();
  if (!cfContract().split) return p.availableToday+p.availableYesterday;
  return cf.offset === "today" ? p.availableToday : p.availableYesterday;
}
function cfPlan() {
  if (cf.offset !== "auto") return [{offset:cf.offset,qty:cf.qty}];
  const p=cfPosition(cf.direction === "buy" ? "空头" : "多头");
  let remaining=cf.qty;
  const plan=[];
  for (const bucket of cfSettings.priority === "today" ? ["today","yesterday"] : ["yesterday","today"]) {
    const qty=Math.min(remaining,p[bucket === "today" ? "availableToday" : "availableYesterday"]);
    if (qty) plan.push({offset:bucket === "today" ? "today" : "close",qty});
    remaining-=qty;
  }
  if (remaining) plan.push({offset:"open",qty:remaining});
  return plan;
}
function cfSelect(label,key,options,value) {
  return `<label class="cf-field"><span>${label}</span><select aria-label="${label}" data-cf-select="${key}">${options.map(item=>{const o=typeof item === "object" ? item : {value:item,label:item};return `<option value="${o.value}" ${String(value) === String(o.value) ? "selected" : ""}>${cfEscape(o.label)}</option>`;}).join("")}</select></label>`;
}
function cfStepper(label,key,value,step) {
  return `<label class="cf-field"><span>${label}</span><div class="cf-stepper"><button type="button" data-cf-step="${key}" data-delta="-${step}" aria-label="减少${label}">−</button><input type="number" min="${key === "qty" ? 1 : step}" step="${step}" data-cf-number="${key}" aria-label="${label}" value="${value}"><button type="button" data-cf-step="${key}" data-delta="${step}" aria-label="增加${label}">＋</button></div></label>`;
}
function cfAssets() {
  const metrics=[["净资产","100,000.00","blue"],["可用购买力","600,000.00",""],["可用资金",cfMoney(cfFunds()),"orange"],["期初资金","100,000.00",""],["累计总盈亏","0.00","green"],["冻结资金","0.00",""],["持仓市值","0.00",""],["持仓盈亏","0.00","green"],["实现盈亏","0.00","green"],["浮动盈亏","0.00","green"],["保证金占用","0.00","green"],["保证金冻结","0.00","green"],["平仓盈亏","0.00","green"],["T+0平仓盈亏","0.00","green"],["T+1平仓盈亏","0.00","green"],["风险度","0%",""],["剩余流动性比例","100.00%","cf-safe"]];
  const contract = cfContract();
  const headers = ["序列", "资金账号", "框架名称", "合约代码", "合约名称", "币种", "持仓类型", "今仓", "昨仓", "今仓冻结", "昨仓冻结", "可用数量"];
  const holdings = ["多头", "空头"].map((side, index) => {
    const position = cfPosition(side);
    return [
      index + 1, cf.fund, cf.frame, contract.code, contract.name, "CNY", side,
      position.today, position.yesterday, position.frozenToday, position.frozenYesterday,
      position.availableToday + position.availableYesterday,
    ];
  });
  return `<article class="panel cf-assets"><header class="panel-title">账户资产</header>
    <div class="cf-account-line">
      <div>交易账户：<b>${cfEscape(cf.account)}</b>　交易对手名称：<b>${cfEscape(cf.customer)}</b>　资金账号：<b>${cfEscape(cf.fund)}</b></div>
      <span>CNY</span>
    </div>
    <div class="cf-asset-metrics">${metrics.map(([label,value,color])=>`<div><span>${label}</span><strong class="${color}">${value}${color === "cf-safe" ? '<small>安全</small>' : ""}</strong></div>`).join("")}</div>
    <div class="cf-asset-holdings"><table class="data-table"><thead><tr>${headers.map(label => `<th>${label}</th>`).join("")}</tr></thead>
    <tbody>${holdings.map(row => `<tr>${row.map(value => `<td>${cfEscape(value)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></article>`;
}
function cfQuote() {
  const c=cfContract();
  return `<article class="panel quote-panel cf-quote"><header class="panel-title">五档行情</header><div class="quote-symbol"><span>${c.name}</span><b>${c.code}</b><span class="cf-exchange">${c.exchange}</span></div><div class="quote-main"><strong>${cfMoney(c.price)}</strong><span>+0.19%<br>14:59:58</span></div><div class="quote-stats"><span>今开</span><b>${cfMoney(c.price-c.tick*2)}</b><span>昨结</span><b>${cfMoney(c.price-c.tick*6)}</b><span>最高</span><b>${cfMoney(c.price+c.tick*9)}</b><span>最低</span><b>${cfMoney(c.price-c.tick*8)}</b><span>总手</span><b>128,640</b><span>交易日</span><b>2026-11-06</b></div><div class="order-book">${["bid","ask"].map(side=>`<div class="book-side ${side}"><header>${side === "bid" ? "买盘" : "卖盘"}</header>${Array.from({length:5},(_,i)=>`<button type="button" data-cf-book="${c.price+(side === "bid" ? -i : i+1)*c.tick}"><em>${i+1}</em><b>${cfMoney(c.price+(side === "bid" ? -i : i+1)*c.tick)}</b><span>${[186,324,95,208,172][i]}</span></button>`).join("")}</div>`).join("")}</div></article>`;
}
function cfTicket() {
  const c=cfContract(),buy=cf.direction === "buy",p=cfPosition(buy ? "空头" : "多头");
  const offsets=c.split ? ["auto","open","today","close"] : ["open","close"];
  const availableLabel=cf.offset === "auto" ? (buy ? "可买数量" : "可卖数量") : `${buy ? "可买" : "可卖"}${cf.offset === "open" ? "开" : c.split ? cf.offset === "today" ? "平今" : "平昨" : "平"}`;
  return `<article class="panel cf-ticket"><header class="panel-title">交易下单</header><div class="cf-ticket-tabs"><button type="button" class="active">期货交易</button><button type="button" disabled>自设套利</button><button type="button" disabled>标准套利</button></div><div class="cf-ticket-scroll">
    ${cfSelect("交易账户","account",["交易账户01","交易账户02"],cf.account)}
    ${cfSelect("交易对手名称","customer",["演示交易对手01","演示交易对手02"],cf.customer)}
    ${cfSelect("资金账号","fund",["DEMO-F01","DEMO-F02"],cf.fund)}
    ${cfSelect("框架名称","frame",["期货框架01","期货框架02"],cf.frame)}
    ${cfSelect("订单类型","orderType",["限价单"],"限价单")}
    ${cfSelect("合约代码","contract",cfContracts.map((item,index)=>({value:index,label:`${item.code} ${item.name}`})),cf.contract)}
    <div class="cf-field"><span>买卖方向</span><div class="cf-direction"><button type="button" class="${buy ? "active" : ""}" data-cf-direction="buy" aria-pressed="${buy}">买入</button><button type="button" class="${buy ? "" : "active sell"}" data-cf-direction="sell" aria-pressed="${!buy}">卖出</button></div></div>
    <div class="cf-field"><span>开平标识</span><div class="cf-offsets count-${offsets.length}" role="group" aria-label="开平标识">${offsets.map(value=>`<button type="button" data-cf-offset="${value}" class="${cf.offset === value ? "active" : ""}" aria-pressed="${cf.offset === value}">${cfOffset(value)}</button>`).join("")}</div></div>
    <div class="cf-availability"><span>${availableLabel} <b id="cfAvailable">${cfAvailable()}</b></span><span>${p.side}</span>${c.split ? `<span>可平今 <b>${p.availableToday}</b></span><span>可平昨 <b>${p.availableYesterday}</b></span>` : `<span>可平 <b>${p.availableToday+p.availableYesterday}</b> 手</span>`}</div>
    ${cfStepper("订单价格","price",cf.price,c.tick)}${cfStepper("委托数量","qty",cf.qty,1)}
    <div class="cf-fractions">${[[.25,"1/4"],[1/3,"1/3"],[.5,"1/2"],[1,"全仓"]].map(([value,label])=>`<button type="button" data-cf-fraction="${value}">${label}</button>`).join("")}</div>
    <details class="ticket-preset"><summary>常用数量</summary>${TicketSettings.quantityButtons(cfSettings.quantities, "data-cf-preset")}</details>
    ${cfSelect("订单模式","mode",["LowTouch","HighTouch"],cf.mode)}
    ${cf.error ? `<div class="cf-error" role="alert">${cfEscape(cf.error)}</div>` : ""}
  </div><div class="cf-order-actions"><button type="button" class="cf-icon" data-cf-settings aria-label="期货下单自定义设置">⚙</button><button type="button" class="cf-icon" data-cf-reset aria-label="重置期货下单">↻</button><button type="button" class="cf-submit ${buy ? "" : "sell"}" data-cf-submit>${buy ? "买入" : "卖出"}${cfOffset(cf.offset)}</button></div></article>`;
}
function cfOrders() {
  const live=row=>row.status !== "已撤";
  const rows=cf.orders.filter(row=>cf.filter === "全部" || live(row));
  const headers=["序列","选择","资金账号名称","框架名称","订单类型","合约代码","合约名称","买卖方向","开平标识","委托价格","委托数量","订单模式","订单费用","订单状态","操作"];
  return `<section class="panel order-list-panel cf-orders"><div class="cf-order-tabs"><button type="button" class="active">委托列表</button><button type="button" disabled>组合委托列表</button></div><div class="list-toolbar"><div class="list-tabs">${["全部","未完成"].map(label=>`<button type="button" data-cf-list="${label}" class="${cf.filter === label ? "active" : ""}">${label}(${label === "全部" ? cf.orders.length : cf.orders.filter(live).length})</button>`).join("")}<button type="button" class="add-tab" disabled>＋</button></div><div class="list-actions"><button type="button" data-cf-cancel-selected ${cf.selected.size ? "" : "disabled"}>撤单</button><button type="button" class="primary" data-cf-batch>批量下单</button></div></div><div class="orders-wrap"><table class="data-table cf-orders-table"><thead><tr>${headers.map(label=>`<th>${label}</th>`).join("")}</tr></thead><tbody>${rows.map((row,index)=>`<tr><td>${index+1}</td><td><input type="checkbox" aria-label="选择委托 ${row.id}" data-cf-order-select="${row.id}" ${cf.selected.has(row.id) ? "checked" : ""} ${live(row) ? "" : "disabled"}></td>${[row.fund,row.frame,"限价单",row.contract.code,row.contract.name,row.direction === "buy" ? "买入" : "卖出",cfOffset(row.offset,row.contract),cfMoney(row.price),row.qty,row.mode,"—",row.status].map(value=>`<td>${cfEscape(value)}</td>`).join("")}<td>${live(row) ? `<button type="button" class="cf-table-action" data-cf-cancel="${row.id}">撤单</button>` : "—"}</td></tr>`).join("")}</tbody></table></div></section>`;
}
function cfModal() {
  if (!cf.modal) return "";
  let title="",body="",action="";
  {
    title="期货订单确认";
    body=`<dl class="cf-confirm"><dt>交易账户</dt><dd>${cf.account}</dd><dt>交易对手名称</dt><dd>${cf.customer}</dd><dt>资金账号</dt><dd>${cf.fund}</dd><dt>框架名称</dt><dd>${cf.frame}</dd><dt>合约代码</dt><dd>${cfContract().code}</dd><dt>买卖方向</dt><dd>${cf.direction === "buy" ? "买入" : "卖出"}</dd><dt>开平标识</dt><dd>${cfOffset(cf.offset)}</dd><dt>订单价格</dt><dd>${cfMoney(cf.price)}</dd><dt>委托数量</dt><dd>${cf.qty} 手</dd><dt>交易日</dt><dd>2026-11-06</dd></dl><table class="data-table cf-plan"><thead><tr><th>报送开平</th><th>数量（手）</th></tr></thead><tbody>${cfPlan().map(row=>`<tr><td>${cfOffset(row.offset)}</td><td>${row.qty}</td></tr>`).join("")}</tbody></table>`;
    action='<button type="button" class="cf-secondary" data-cf-close-modal>返回修改</button><button type="button" class="cf-primary" data-cf-confirm>确认提交</button>';
  }
  return `<div class="cf-modal-mask" role="dialog" aria-modal="true" aria-labelledby="cfModalTitle"><section class="cf-dialog"><header><h3 id="cfModalTitle">${title}</h3><button type="button" data-cf-close-modal aria-label="关闭">×</button></header><div class="cf-dialog-body">${body}</div><footer>${action}</footer></section></div>`;
}
function cfRenderVisibility() {
  cfTabs.hidden = state.view !== "trade";
  cfSecurities.hidden = state.view !== "trade" || cf.market !== "证券交易";
  cfRoot.hidden = state.view !== "trade" || cf.market !== "期货交易";
}
function cfRender() {
  cfRenderVisibility();
  cfTabs.querySelectorAll("button").forEach(button=>button.classList.toggle("active",button.dataset.cfMarket === cf.market));
  cfRoot.innerHTML=`<section class="cf-top">${cfAssets()}${cfQuote()}${cfTicket()}</section>${cfOrders()}${cfModal()}`;
  cfBind();
}
function cfValidate() {
  if (!Number.isSafeInteger(cf.qty) || cf.qty < 1) return "委托数量须为大于 0 的整数手。";
  if (!Number.isFinite(cf.price) || cf.price <= 0) return "请输入有效的订单价格。";
  if (Math.abs(cf.price/cfContract().tick-Math.round(cf.price/cfContract().tick)) > 1e-6) return `订单价格须为最小变动价位 ${cfContract().tick} 的整数倍。`;
  if (cf.qty > cfAvailable()) return `可用数量不足，当前最多可委托 ${cfAvailable()} 手。`;
  return "";
}
function cfConfirm() {
  cf.error=cfValidate();
  if (cf.error) {cf.modal=null;cfRender();return;}
  const p=cfPosition(cf.direction === "buy" ? "空头" : "多头"),plan=cfPlan();
  const reserve={...(cf.reservations.get(p.key) || {today:0,yesterday:0})};
  let remainingToday=p.availableToday;
  for (const item of plan) {
    let today=0,yesterday=0;
    if (item.offset !== "open") {
      if (cfContract().split) {today=item.offset === "today" ? item.qty : 0;yesterday=item.qty-today;}
      else {today=Math.min(item.qty,remainingToday);yesterday=item.qty-today;remainingToday-=today;}
    }
    reserve.today+=today;reserve.yesterday+=yesterday;
    cf.orders.unshift({id:`CF${String(cf.nextId++).padStart(5,"0")}`,contract:{...cfContract()},fund:cf.fund,frame:cf.frame,direction:cf.direction,offset:item.offset,price:cf.price,qty:item.qty,mode:cf.mode,status:cf.mode === "HighTouch" ? "待确认" : "已报",reservation:{key:p.key,today,yesterday}});
  }
  cf.reservations.set(p.key,reserve);cf.modal=null;cf.filter="全部";
  if (!cfSettings.keep.includes("交易账户")) cf.account="交易账户01";
  if (!cfSettings.keep.includes("交易对手名称")) cf.customer="演示交易对手01";
  if (!cfSettings.keep.includes("资金账号")) cf.fund="DEMO-F01";
  if (!cfSettings.keep.includes("框架名称")) cf.frame="期货框架01";
  if (!cfSettings.keep.includes("合约代码")) cf.contract=0;
  if (!cfSettings.keep.includes("买卖方向")) cf.direction="buy";
  if (!cfSettings.keep.includes("开平标识")) cf.offset="open";
  if (!cfSettings.keep.includes("委托价格")) cf.price=cfContract().price;
  if (!cfSettings.keep.includes("委托数量")) cf.qty=1;
  if (!cfSettings.keep.includes("订单模式")) cf.mode="LowTouch";
  cfRender();notify("委托已加入演示列表");
}
function cfCancel(id) {
  const row=cf.orders.find(item=>item.id === id);
  if (!row || row.status === "已撤") return;
  const reserve=cf.reservations.get(row.reservation.key);
  if (reserve) {reserve.today-=row.reservation.today;reserve.yesterday-=row.reservation.yesterday;}
  row.status="已撤";cf.selected.delete(id);
}
function cfBind() {
  cfRoot.querySelectorAll("[data-cf-select]").forEach(select=>select.addEventListener("change",()=>{
    const key=select.dataset.cfSelect;cf[key]=key === "contract" ? Number(select.value) : select.value;
    if(key === "contract"){cf.price=cfContract().price;if(!cfContract().split && ["auto","today"].includes(cf.offset))cf.offset="close";}
    cf.error="";cfRender();
  }));
  cfRoot.querySelectorAll("[data-cf-direction]").forEach(button=>button.addEventListener("click",()=>{cf.direction=button.dataset.cfDirection;cf.error="";cfRender();}));
  cfRoot.querySelectorAll("[data-cf-offset]").forEach(button=>button.addEventListener("click",()=>{cf.offset=button.dataset.cfOffset;cf.error="";cfRender();}));
  cfRoot.querySelectorAll("[data-cf-number]").forEach(input=>input.addEventListener("input",()=>{cf[input.dataset.cfNumber]=Number(input.value);cf.error="";cfRoot.querySelector(".cf-error")?.remove();cfRoot.querySelector("#cfAvailable").textContent=cfAvailable();}));
  cfRoot.querySelectorAll("[data-cf-step]").forEach(button=>button.addEventListener("click",()=>{const key=button.dataset.cfStep;cf[key]=Math.max(key === "qty" ? 1 : cfContract().tick,Number((cf[key]+Number(button.dataset.delta)).toFixed(6)));cf.error="";cfRender();}));
  cfRoot.querySelectorAll("[data-cf-fraction]").forEach(button=>button.addEventListener("click",()=>{cf.qty=Math.floor(cfAvailable()*Number(button.dataset.cfFraction));cf.error="";cfRender();}));
  cfRoot.querySelectorAll("[data-cf-book]").forEach(button=>button.addEventListener("click",()=>{cf.price=Number(button.dataset.cfBook);cfRender();}));
  cfRoot.querySelectorAll("[data-cf-modal]").forEach(button=>button.addEventListener("click",()=>{cf.modal=button.dataset.cfModal;cfRender();}));
  cfRoot.querySelectorAll("[data-cf-close-modal]").forEach(button=>button.addEventListener("click",()=>{cf.modal=null;cfRender();}));
  cfRoot.querySelector("[data-cf-settings]")?.addEventListener("click", () => TicketSettings.open({
    key: cfSettingsKey, values: cfSettings,
    fields: ["交易账户","交易对手名称","资金账号","框架名称","订单类型","合约代码","买卖方向","开平标识","委托价格","委托数量","订单模式"],
    onSave: values => { cfSettings = values; cfRender(); notify("设置已保存"); },
  }));
  TicketSettings.bindWheel(cfRoot.querySelector('[data-cf-number="price"]'), cfSettings.priceWheel, cfContract().tick, value => {
    cf.price = value;
    cfRoot.querySelector("#cfAvailable").textContent = cfAvailable();
  });
  TicketSettings.bindWheel(cfRoot.querySelector('[data-cf-number="qty"]'), cfSettings.quantityWheel, 1, value => { cf.qty = value; });
  cfRoot.querySelectorAll("[data-cf-preset]").forEach(button => button.addEventListener("click", () => {
    cf.qty = Number(button.dataset.cfPreset);
    cf.error = "";
    cfRender();
  }));
  cfRoot.querySelector("[data-cf-reset]")?.addEventListener("click",()=>{Object.assign(cf,{direction:"buy",offset:"open",qty:1,price:cfContract().price,error:""});cfRender();});
  cfRoot.querySelector("[data-cf-submit]")?.addEventListener("click",()=>{cf.error=cfValidate();cf.modal=cf.error ? null : "confirm";cfRender();});
  cfRoot.querySelector("[data-cf-confirm]")?.addEventListener("click",cfConfirm);
  cfRoot.querySelectorAll("[data-cf-list]").forEach(button=>button.addEventListener("click",()=>{cf.filter=button.dataset.cfList;cfRender();}));
  cfRoot.querySelectorAll("[data-cf-cancel]").forEach(button=>button.addEventListener("click",()=>{cfCancel(button.dataset.cfCancel);cfRender();notify("演示委托已撤销");}));
  cfRoot.querySelectorAll("[data-cf-order-select]").forEach(input=>input.addEventListener("change",()=>{if(input.checked)cf.selected.add(input.dataset.cfOrderSelect);else cf.selected.delete(input.dataset.cfOrderSelect);cfRender();}));
  cfRoot.querySelector("[data-cf-cancel-selected]")?.addEventListener("click",()=>{for(const id of cf.selected)cfCancel(id);cfRender();notify("已撤销所选演示委托");});
  cfRoot.querySelector("[data-cf-batch]")?.addEventListener("click",()=>notify("请选择待批量下单的委托"));
}
cfTabs.addEventListener("click",event=>{const button=event.target.closest("[data-cf-market]");if(!button)return;if(!["证券交易","期货交易"].includes(button.dataset.cfMarket))return;cf.market=button.dataset.cfMarket;cf.modal=null;cfRender();});
document.addEventListener("keydown",event=>{if(event.key === "Escape" && cf.modal){cf.modal=null;cfRender();}});
cfRender();
