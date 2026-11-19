/* =========================================================
   POLLERÍA EL POLLÓN — Panel · Vistas
   ========================================================= */
const VIEWS = {}; let VISTA = "inicio";
const ADM = ["Administración"], CAJA = ["Administración", "Caja"], TODOS = ["Administración", "Caja", "Cocina", "Reparto"];
const NAV = [
  ["inicio", "home", "Inicio", CAJA], ["pedidos", "bell", "Pedidos", TODOS], ["venta", "pos", "Venta en local", CAJA],
  ["carta", "fire", "Carta y precios", CAJA], ["categorias", "grid", "Categorías", ADM], ["zonas", "map", "Zonas de delivery", ADM],
  ["caja", "cash", "Caja", CAJA], ["clientes", "users", "Clientes", ADM], ["reportes", "chart", "Reportes", ADM], ["ajustes", "gear", "Ajustes", ADM]
];
const puede = v => (NAV.find(n => n[0] === v) || [, , , []])[3].includes(YO().rol);
const pedTxt = p => (p.items || []).map(i => `${i.cant}× ${i.n}`).join(", ");
const EMOJIS = ["🍗", "🎉", "🥩", "🍖", "🍟", "🥤", "🍮", "🥗", "🍚", "🌶️", "🍺", "☕", "🍔", "🌭", "🥪", "🍰", "🧃", "⭐"];
const minDesde = iso => Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));

/* ================= Sesión ================= */
function pantallaLogin() {
  document.body.innerHTML = `<main class="login"><form class="l-box" id="lf"><div class="l-logo">${ico("fire")}</div><h1>Panel · ${esc(window.PL_AJUSTES.nombre)}</h1><p>Entra con el correo de tu equipo.</p>
    ${DEMO ? `<div class="demo-n"><b>MODO DEMO</b> · elige con qué rol probar:</div>${fld("rol", "Entrar como", APP.equipo[0].email, { opts: APP.equipo.map(p => [p.email, `${p.nombre} · ${p.rol}`]) })}`
      : `${fld("email", "Correo", "", { type: "email", req: true, extra: 'autocomplete="username"' })}${fld("pass", "Contraseña", "", { type: "password", req: true, extra: 'autocomplete="current-password"' })}`}
    <p class="l-err" id="lErr" role="alert"></p><button class="btn btn-pri btn-lg">Entrar</button></form></main>`;
  $("#lf").addEventListener("submit", async e => {
    e.preventDefault(); const d = datosForm(e.currentTarget), err = $("#lErr");
    if (DEMO) { sessionStorage.setItem("pl_admin", d.rol); return iniciar(perfil(d.rol)); }
    try { const { au, auth } = await fb(); await au.signInWithEmailAndPassword(auth, d.email, d.pass); }
    catch (er) { err.textContent = /invalid|wrong|user-not-found/i.test(er.code || "") ? "Correo o contraseña incorrectos." : "No se pudo entrar: " + (er.code || er.message); }
  });
}
async function salir() { if (DEMO) sessionStorage.removeItem("pl_admin"); else { const { au, auth } = await fb(); await au.signOut(auth); } location.reload(); }
async function arrancar() {
  if (DEMO) { const e = sessionStorage.getItem("pl_admin"); return e && perfil(e) ? iniciar(perfil(e)) : pantallaLogin(); }
  const { au, auth } = await fb();
  au.onAuthStateChanged(auth, u => { if (!u) return pantallaLogin(); const p = perfil(u.email); if (!p) { document.body.innerHTML = `<main class="login"><div class="l-box"><h1>Sin permiso</h1><p>${esc(u.email)} no está en el equipo (firebase-config.js → equipo).</p><button class="btn btn-pri" onclick="salir()">Salir</button></div></main>`; return; } iniciar(p); });
}
async function iniciar(p) {
  USER = p; await cargarCatalogo();
  if (!CAT.prods.length && esAdm() && !DEMO) VISTA = "ajustes";
  const nav = NAV.filter(n => n[3].includes(p.rol));
  document.body.innerHTML = `<div class="shell"><aside class="side" id="side"><div class="s-brand">${ico("fire")}<div><b></b><small>Panel</small></div></div>
      <nav class="s-nav">${nav.map(([k, i, t]) => `<button data-v="${k}">${ico(i)}<span>${t}</span><b class="cnt" id="cnt-${k}" hidden></b></button>`).join("")}</nav>
      <div class="s-user"><small>Sesión</small><b>${esc(p.nombre)}</b><span class="st mute">${esc(p.rol)}</span>${DEMO ? `<span class="st warn">MODO DEMO</span>` : ""}<button class="btn btn-light btn-sm" id="salir">${ico("logout")} Salir</button></div></aside>
    <div class="main"><header class="tb"><button class="tb-m" id="menuB" aria-label="Menú">${ico("menu")}</button><span class="tb-f">${fmtF(HOY(), { weekday: "long", day: "numeric", month: "long" })}</span>
      ${esAdm() || p.rol === "Caja" ? `<button class="btn btn-sm tb-ab" id="abierto"></button><button class="btn btn-pri btn-sm" data-go="venta">${ico("pos")} <span>Nueva venta</span></button>` : ""}</header>
      <main id="view" class="view" tabindex="-1"></main></div></div>`;
  marcaPanel(); pintarAbierto();
  $(".s-nav").addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b) go(b.dataset.v); });
  $("#salir").addEventListener("click", salir); $("#menuB").addEventListener("click", () => $("#side").classList.toggle("open"));
  $("#abierto")?.addEventListener("click", cambiarAbierto);
  document.addEventListener("click", e => { const g = e.target.closest("[data-go]"); if (g) go(g.dataset.go); });
  go(puede(VISTA) ? VISTA : nav[0][0]); vigilar(); setInterval(vigilar, 15000);
}
function pintarAbierto() { const b = $("#abierto"); if (!b) return; const ab = estaAbierto(), m = CAT.aj.estadoManual || "auto";
  b.className = "btn btn-sm tb-ab " + (ab ? "on" : "off"); b.innerHTML = `<i></i>${ab ? "Abierto" : "Cerrado"}${m === "auto" ? " · por horario" : " · manual"}`; }
function cambiarAbierto() {
  const m = CAT.aj.estadoManual || "auto";
  modal("¿Recibir pedidos por la web?", `<p class="muted">Ahora: <b>${estaAbierto() ? "Abierto" : "Cerrado"}</b>. Con «Según horario» abre y cierra solo (${esc(CAT.aj.abre)} a ${esc(CAT.aj.cierra)}).</p>
    <div class="radios">${[["auto", "🕑 Según horario"], ["abierto", "🟢 Abierto ahora (aunque esté fuera de horario)"], ["cerrado", "🔴 Cerrado ahora (ej. se acabó el pollo, mucha demanda)"]].map(([v, t]) => `<label class="rd"><input type="radio" name="estadoManual" value="${v}" ${m === v ? "checked" : ""}><span>${t}</span></label>`).join("")}</div>`,
    async d => { await DB.set("ajustes", "general", { estadoManual: d.estadoManual }); CAT.aj.estadoManual = d.estadoManual; pintarAbierto(); toast("Listo · la web ya lo muestra"); if (VISTA === "inicio") VIEWS.inicio(); });
}
async function go(v) {
  VISTA = v; $$(".s-nav button").forEach(b => b.setAttribute("aria-current", b.dataset.v === v ? "page" : "false")); $("#side")?.classList.remove("open");
  $("#view").innerHTML = `<div class="loading"><span class="spin"></span></div>`;
  try { await VIEWS[v](); if (!CAT.prods.length && esAdm() && v !== "ajustes") $("#view").insertAdjacentHTML("afterbegin", `<div class="alert warn">${ico("alert")} <span><b>Tu carta aún no está guardada en Firebase.</b> Ve a Ajustes y pulsa «Cargar carta de ejemplo» para empezar a editarla.</span><button class="btn btn-pri btn-sm" data-go="ajustes">Ir a Ajustes</button></div>`); }
  catch (e) { console.error(e); $("#view").innerHTML = `<div class="empty">${ico("alert")}<p>No se pudo cargar: ${esc(e.message)}</p></div>`; }
}
const refrescar = () => go(VISTA);
let ULT = null, TITULO = document.title;
async function vigilar() {
  try {
    const peds = await DB.list("pedidos", ["estado", "in", ["por-validar", "nuevo"]]), n = peds.length, b = $("#cnt-pedidos");
    if (b) { b.textContent = n; b.hidden = !n; } document.title = n ? `(${n}) ${TITULO}` : TITULO;
    if (ULT !== null && n > ULT) { beep(3); toast(`🔔 ¡${n - ULT} pedido(s) nuevo(s)!`); if (["pedidos", "inicio"].includes(VISTA) && !$("#modal.open")) VIEWS[VISTA](); }
    else if (VISTA === "pedidos" && !$("#modal.open")) VIEWS.pedidos(true);
    ULT = n; pintarAbierto();
  } catch (e) { console.warn("vigilar:", e.message); }
}
function movimiento(m) { return { op: "set", col: "movimientos", id: codigo("MV"), data: { fecha: HOY(), hora: new Date().toISOString(), usuario: YO().nombre, ...m, monto: r2(m.monto) } }; }

/* ================= INICIO ================= */
VIEWS.inicio = async () => {
  await cargarCatalogo();
  const hoy = HOY(), [peds, movs] = await Promise.all([DB.list("pedidos", ["creado", ">=", hoy]), DB.list("movimientos", ["fecha", "==", hoy])]);
  const act = peds.filter(p => ["por-validar", "nuevo", "cocina", "listo", "camino"].includes(p.estado)), ok = peds.filter(p => !["anulado", "rechazado"].includes(p.estado));
  const caja = movs.reduce((a, m) => a + m.monto, 0), agot = CAT.prods.filter(p => p.agotado && p.activo !== false);
  const K = [["Caja de hoy", S(caja), `${movs.length} movimiento(s)`], ["Pedidos de hoy", ok.length, `${ok.filter(p => p.origen === "web").length} web · ${ok.filter(p => p.origen === "local").length} local`],
    ["Por atender", act.filter(p => ["por-validar", "nuevo"].includes(p.estado)).length, `${act.filter(p => p.estado === "por-validar").length} pago(s) por validar`], ["En cocina", act.filter(p => p.estado === "cocina").length, "preparándose"],
    ["En camino", act.filter(p => p.estado === "camino").length, "con el repartidor"], ["Ticket promedio", S(ok.length ? ok.reduce((a, p) => a + (+p.total || 0), 0) / ok.length : 0), "por pedido"]];
  $("#view").innerHTML = topBar(`Hola, ${esc(YO().nombre)}`, "Así va tu pollería hoy.") + `
    <div class="kpis neon">${K.map(([a, b, c]) => `<div class="kpi"><span>${a}</span><b>${b}</b><small>${c}</small></div>`).join("")}</div>
    <div class="two"><section class="card"><div class="card-h"><h2>${ico("bell")} Pedidos en curso</h2><button class="btn btn-light btn-sm" data-go="pedidos">Ver tablero</button></div>
      <ul class="lst">${act.sort((a, b) => String(a.creado).localeCompare(b.creado)).slice(0, 10).map(p => `<li><div><b>${(ENTREGA[p.entrega] || [""])[0]} ${esc(p.nombre || "Cliente")} · ${S(p.total)}</b><small>${esc(p.codigo || p.id)} · ${hace(p.creado)} · ${esc(pedTxt(p)).slice(0, 70)}</small></div>${estP(p.estado, p)}</li>`).join("") || `<li class="muted">No hay pedidos en curso.</li>`}</ul></section>
    <section class="card"><div class="card-h"><h2>${ico("alert")} Agotados hoy</h2><button class="btn btn-light btn-sm" data-go="carta">Carta</button></div>
      <ul class="lst">${agot.map(p => `<li><div><b>${esc(p.nombre)}</b><small>${esc(catDe(p.cat).nombre || "")}</small></div><button class="btn btn-light btn-sm" data-hay="${esc(p.id)}">Ya hay</button></li>`).join("") || `<li class="muted">Todo disponible. 👍</li>`}</ul></section></div>`;
  $("#view").onclick = async e => { const h = e.target.closest("[data-hay]"); if (!h) return; await DB.set("productos", h.dataset.hay, { agotado: false }); toast("Disponible otra vez en la web"); VIEWS.inicio(); };
};

/* ================= PEDIDOS (tablero) ================= */
let PT = "activos", PF_E = "";
VIEWS.pedidos = async (silencioso) => {
  const desde = addD(HOY(), PT === "hist" ? -6 : -1);
  const todos = (await DB.list("pedidos", ["creado", ">=", desde])).sort((a, b) => String(a.creado).localeCompare(b.creado));
  const filtro = p => !PF_E || p.entrega === PF_E;
  const ops = {}; todos.forEach(p => { if (p.operacion) ops[p.operacion] = (ops[p.operacion] || 0) + 1; });
  const COLS = [["Por atender", p => ["por-validar", "nuevo"].includes(p.estado)], ["En cocina", p => p.estado === "cocina"], ["Listos", p => p.estado === "listo"], ["En camino", p => p.estado === "camino"]];
  const tarjeta = p => { const al = [], m = minDesde(p.creado), [ic, ent] = ENTREGA[p.entrega] || ["", p.entrega];
    if (p.estado === "por-validar") { if (p.montoLeido == null) al.push(["warn", "No se pudo leer el monto de la captura."]); else if (p.coincide === false) al.push(["bad", `La captura dice ${S(p.montoLeido)} y el total es ${S(p.total)}.`]); if (p.fechaOk === false) al.push(["bad", "La fecha de la captura no es de hoy."]); if (p.operacion && ops[p.operacion] > 1) al.push(["bad", "Número de operación repetido en otro pedido."]); }
    const tarde = ["nuevo", "cocina", "listo", "camino"].includes(p.estado) && m >= (p.tiempo ? +p.tiempo + 10 : 40);
    return `<article class="card ped ${esc(p.estado)} ${tarde ? "tarde" : ""}"><div class="ped-b">
      <div class="ped-h"><span class="ent">${ic} ${ent}${p.mesa ? " · Mesa " + esc(p.mesa) : ""}</span><span class="mono">${esc(p.codigo || p.id)}</span>${PT === "hist" ? estP(p.estado, p) : `<span class="reloj ${tarde ? "neg" : ""}" title="Desde que llegó">${ico("clock")} ${m} min</span>`}</div>
      <b class="ped-n">${esc(p.nombre || "Cliente")}</b>
      <ul class="ped-it">${(p.items || []).map(i => `<li><b>${i.cant}×</b> ${esc(i.n)}${detItem(i).map(d => `<small>${esc(d)}</small>`).join("")}</li>`).join("")}</ul>
      ${p.nota ? `<p class="ped-nota">📝 ${esc(p.nota)}</p>` : ""}
      <p><b>${S(p.total)}</b>${p.envio ? ` <span class="muted">(delivery ${S(p.envio)})</span>` : ""} · ${esc(p.pagoReal || p.pago || "")}${p.pagaCon ? ` · paga con ${S(p.pagaCon)} → <b>vuelto ${S(p.pagaCon - p.total)}</b>` : ""}${p.pagado ? ` <span class="st ok">Pagado</span>` : ""}</p>
      ${p.entrega === "delivery" ? `<p class="muted">📍 ${esc(p.zona || "")} · ${esc(p.direccion || "")}${p.referencia ? " · " + esc(p.referencia) : ""}${p.ubic ? ` · <a href="https://maps.google.com/?q=${p.ubic.lat},${p.ubic.lng}" target="_blank" rel="noopener">Ver mapa</a>` : ""}</p>` : ""}
      ${p.celular ? `<p class="muted">📱 ${esc(p.celular)}${p.repartidor ? ` · 🛵 ${esc(p.repartidor)}` : ""}${p.tiempo && p.estado === "cocina" ? ` · ⏱ ${esc(p.tiempo)} min` : ""}</p>` : ""}
      ${al.map(([c, t]) => `<div class="alert ${c} sm">${ico("alert")} ${t}</div>`).join("")}
      <div class="acts-g">${accionesPedido(p)}<button class="btn btn-light btn-sm" data-pa="comanda|${esc(p.id)}" title="Comanda para cocina">${ico("chef")}</button><button class="btn btn-light btn-sm" data-pa="ticket|${esc(p.id)}" title="Ticket">${ico("print")}</button>${p.celular ? `<button class="btn btn-wa btn-sm" data-pa="wa|${esc(p.id)}" title="WhatsApp">${ico("wa")}</button>` : ""}</div></div></article>`; };
  const act = todos.filter(p => ["por-validar", "nuevo", "cocina", "listo", "camino"].includes(p.estado)), hist = todos.filter(p => ["entregado", "anulado", "rechazado"].includes(p.estado)).reverse();
  const html = topBar("Pedidos", "Web, local y delivery en un solo tablero. Suena cuando llega uno nuevo.", `<div class="seg"><button class="${PT === "activos" ? "on" : ""}" data-pt="activos">En curso (${act.length})</button><button class="${PT === "hist" ? "on" : ""}" data-pt="hist">Historial 7 días</button></div>`)
    + `<div class="chips">${[["", "Todos"], ["delivery", "🛵 Delivery"], ["recojo", "🏪 Recojo"], ["local", "🍽️ En local"], ["llevar", "🥡 Para llevar"]].map(([k, t]) => `<button class="chip ${PF_E === k ? "on" : ""}" data-pe="${k}">${t}</button>`).join("")}</div>`
    + (PT === "activos" ? (act.some(p => p.estado === "por-validar") ? `<div class="alert warn">${ico("alert")} <span>Antes de validar un pago, <b>confirma en tu app de Yape/Plin que el dinero llegó</b>. Una captura se puede editar.</span></div>` : "")
      + `<div class="board">${COLS.map(([t, f]) => { const l = act.filter(f).filter(filtro); return `<section class="col"><h3>${t} <b>${l.length}</b></h3>${l.map(tarjeta).join("") || `<p class="muted sm col-v">—</p>`}</section>`; }).join("")}</div>`
      : `<div class="peds">${hist.filter(filtro).slice(0, 150).map(tarjeta).join("") || vacio("Sin pedidos en los últimos 7 días.")}</div>`);
  if (silencioso && $("#view").dataset.h === html) return; $("#view").innerHTML = html; $("#view").dataset.h = html;
  $("#view").onclick = async e => {
    const t = e.target.closest("[data-pt]"); if (t) { PT = t.dataset.pt; return VIEWS.pedidos(); }
    const pe = e.target.closest("[data-pe]"); if (pe) { PF_E = pe.dataset.pe; return VIEWS.pedidos(); }
    const b = e.target.closest("[data-pa]"); if (!b) return; const [a, id] = b.dataset.pa.split("|"), p = todos.find(x => x.id === id); if (p) accionPedido(a, p);
  };
};
function accionesPedido(p) {
  const B = (a, t, c = "btn-light") => `<button class="btn ${c} btn-sm" data-pa="${a}|${esc(p.id)}">${t}</button>`, R = YO().rol;
  if (R === "Reparto") return p.estado === "camino" ? B("entregar", `${ico("check")} Entregado`, "btn-pri") : "";
  if (R === "Cocina") return { nuevo: B("aceptar", `${ico("fire")} A cocina`, "btn-pri"), cocina: B("listo", `${ico("check")} Listo`, "btn-pri") }[p.estado] || "";
  return { "por-validar": B("validar", `${ico("check")} Ver captura y validar`, "btn-pri") + B("rechazar", "Rechazar"),
    nuevo: B("aceptar", `${ico("fire")} Aceptar y mandar a cocina`, "btn-pri") + B("anular", "Anular"),
    cocina: B("listo", `${ico("check")} Listo`, "btn-pri") + B("anular", "Anular"),
    listo: (p.entrega === "delivery" ? B("despachar", `${ico("bike")} Despachar`, "btn-pri") : B("entregar", `${ico("check")} ${p.entrega === "recojo" ? "Recogido" : "Entregado"}${p.pagado ? "" : " y cobrar"}`, "btn-pri")) + B("anular", "Anular"),
    camino: B("entregar", `${ico("check")} Entregado${p.pagado ? "" : " y cobrado"}`, "btn-pri") + B("anular", "Anular") }[p.estado] || "";
}
const msgCliente = (p, t) => `Hola ${String(p.nombre || "").split(" ")[0]} 👋 te escribe *${NOMBRE()}*.\n\n${t}\n\n🧾 Pedido *${p.codigo || p.id}* · ${S(p.total)}${p.origen === "web" ? `\nSigue tu pedido aquí: ${linkPedido(p.codigo || p.id)}` : ""}`;
const repartidores = () => String(CAT.aj.repartidores || "").split("\n").map(l => { const [n, c] = l.split("|").map(x => (x || "").trim()); return { n, c }; }).filter(r => r.n);
async function accionPedido(a, p) {
  const id = p.id, upd = data => ({ op: "set", col: "pedidos", id, data: { ...data, actualizado: new Date().toISOString(), por: YO().nombre } }),
    fin = async (ops, msg, wa) => { await DB.batch(ops); toast(msg); if (wa && p.celular) abrirWA(p.celular, wa); vigilar(); VIEWS[VISTA] && VISTA === "pedidos" ? VIEWS.pedidos() : refrescar(); };
  if (a === "ticket") return pdfTicket(p, "ticket");
  if (a === "comanda") return pdfTicket(p, "comanda");
  if (a === "wa") return abrirWA(p.celular, msgCliente(p, "Te escribimos sobre tu pedido."));
  if (a === "validar") { const c = await DB.get("capturas", id);
    return modal(`Validar pago · ${p.codigo || id}`, `${c && c.captura ? `<img class="zoom" src="${esc(c.captura)}" alt="Captura del pago">` : `<p class="muted">Sin imagen de captura.</p>`}
      <p>Confirma que llegaron <b>${S(p.total)}</b> por ${esc(p.pago)}${p.operacion ? ` (op. ${esc(p.operacion)})` : ""}.</p><div class="g2">${fld("monto", "Monto recibido (S/)", p.total, { type: "number", req: true, extra: 'min="0.1" step="0.1"' })}${fld("tiempo", "Listo en (min)", 25, { opts: [15, 20, 25, 30, 40, 50] })}${fld("enviar", "Avisar al cliente por WhatsApp", true, { type: "checkbox", full: true })}</div>`, async d => {
      const ops = [upd({ estado: "cocina", pagado: r2(d.monto), validado: new Date().toISOString(), tiempo: +d.tiempo }), movimiento({ concepto: `Pedido ${p.codigo || id} · ${p.nombre}`, monto: d.monto, metodo: p.pago, pedido: id }), { op: "set", col: "capturas", id, data: { captura: "", revisado: true } }];
      await fin(ops, "Pago validado · pedido en cocina", d.enviar ? msgCliente(p, `✅ Recibimos tu pago de ${S(d.monto)}. Tu pedido ya está en cocina 🔥 (aprox. ${d.tiempo} min).`) : null); }, "Validar y mandar a cocina"); }
  if (a === "rechazar") return modal("Rechazar pago", `${fld("motivo", "Motivo", "No llegó el pago", { full: true, opts: ["No llegó el pago", "El monto no coincide", "La captura no se lee", "La captura es de otro pago"] })}${fld("enviar", "Avisar por WhatsApp", true, { type: "checkbox" })}`, async d =>
    fin([upd({ estado: "rechazado", motivo: d.motivo })], "Pedido rechazado", d.enviar ? msgCliente(p, `No pudimos validar tu pago: ${d.motivo}. Escríbenos por aquí para ayudarte a completarlo.`) : null), "Rechazar");
  if (a === "aceptar") return modal(`Aceptar · ${p.codigo || id}`, `<p>¿En cuántos minutos estará listo? El cliente lo ve en su seguimiento.</p><div class="tiempos">${[15, 20, 25, 30, 40, 50].map(t => `<label class="rd"><input type="radio" name="tiempo" value="${t}" ${t === 25 ? "checked" : ""}><span>${t} min</span></label>`).join("")}</div>
      ${p.celular && YO().rol !== "Cocina" ? fld("enviar", "Avisar al cliente por WhatsApp", p.origen === "web", { type: "checkbox", full: true }) : ""}${fld("imprimir", "Imprimir comanda para cocina", true, { type: "checkbox", full: true })}`, async d => {
      if (d.imprimir) pdfTicket(p, "comanda");
      await fin([upd({ estado: "cocina", tiempo: +d.tiempo, aceptado: new Date().toISOString() })], "Pedido en cocina 🔥", d.enviar ? msgCliente(p, `🔥 Tu pedido ya está en cocina. Estará listo en aprox. *${d.tiempo} min*.`) : null); }, "Mandar a cocina");
  if (a === "listo") return fin([upd({ estado: "listo", listo: new Date().toISOString() })], p.entrega === "delivery" ? "Listo · falta despachar" : "Pedido listo",
    p.entrega === "recojo" && YO().rol !== "Cocina" ? msgCliente(p, `🛍️ Tu pedido está *listo para recoger* en ${CAT.aj.direccion || "el local"}.`) : null);
  if (a === "despachar") { const rs = repartidores();
    return modal(`Despachar · ${p.codigo || id}`, `<div class="g2">${rs.length ? fld("rep", "Repartidor", rs[0].n, { opts: rs.map(r => r.n), full: true }) : fld("rep", "Repartidor", "", { req: true, full: true, help: "Agrega tus repartidores en Ajustes para elegirlos de una lista." })}
      ${fld("enviar", "Avisar al cliente por WhatsApp", true, { type: "checkbox", full: true })}${fld("waRep", "Enviar la dirección al repartidor por WhatsApp", !!rs.length, { type: "checkbox", full: true })}</div>
      ${!p.pagado ? `<div class="alert warn sm">${ico("cash")} <span>Cobrar al entregar: <b>${S(p.total)}</b>${p.pagaCon ? ` · lleva vuelto de <b>${S(p.pagaCon - p.total)}</b> (paga con ${S(p.pagaCon)})` : ""}</span></div>` : ""}`, async d => {
      const r = rs.find(x => x.n === d.rep);
      if (d.waRep && r && r.c) abrirWA(r.c, `🛵 *Pedido ${p.codigo || id}*\n👤 ${p.nombre} · 📱 ${p.celular}\n📍 ${p.direccion || ""}${p.referencia ? " (" + p.referencia + ")" : ""}${p.ubic ? `\n🗺️ https://maps.google.com/?q=${p.ubic.lat},${p.ubic.lng}` : ""}\n💵 ${p.pagado ? "YA PAGADO" : `COBRAR ${S(p.total)} (${p.pago})${p.pagaCon ? ` · paga con ${S(p.pagaCon)}, vuelto ${S(p.pagaCon - p.total)}` : ""}`}\n\n${(p.items || []).map(i => `• ${i.cant}× ${i.n}`).join("\n")}`);
      await fin([upd({ estado: "camino", repartidor: d.rep, despachado: new Date().toISOString() })], "Pedido en camino 🛵", d.enviar ? msgCliente(p, `🛵 Tu pedido ya *va en camino* con ${d.rep}. ¡Pronto llega!`) : null); }, "Despachar"); }
  if (a === "entregar") {
    if (p.pagado) return fin([upd({ estado: "entregado", entregado: new Date().toISOString() })], "Pedido entregado");
    return modal(`Cobrar · ${p.codigo || id}`, `<p>Total a cobrar <b>${S(p.total)}</b>.</p><div class="g2">${fld("metodo", "¿Cómo pagó?", METODOS.includes(p.pago) ? p.pago : "Efectivo", { opts: METODOS })}${fld("recibido", "Recibido en efectivo (S/)", p.pagaCon || "", { type: "number", extra: 'min="0" step="0.1"' })}</div><p class="muted" id="cVu"></p>`, async d => {
      if (d.metodo === "Efectivo" && +d.recibido && +d.recibido < p.total) { toast("Lo recibido es menos que el total", true); return false; }
      await fin([upd({ estado: "entregado", pagado: p.total, pagoReal: d.metodo, entregado: new Date().toISOString(), ...(+d.recibido ? { recibido: +d.recibido, vuelto: r2(+d.recibido - p.total) } : {}) }), movimiento({ concepto: `Pedido ${p.codigo || id} · ${p.nombre || ""}`, monto: p.total, metodo: d.metodo, pedido: id })], "Entregado y cobrado"); }, "Entregado y cobrado",
      { alAbrir: F => { const f = () => { const r = +$("[name=recibido]", F).value || 0; $("#cVu").innerHTML = r > p.total ? `Vuelto: <b>${S(r - p.total)}</b>` : ""; }; F.oninput = f; f(); } }); }
  if (a === "anular") return modal(`Anular ${p.codigo || id}`, `${fld("motivo", "Motivo", "", { full: true, ph: "Ej. el cliente canceló" })}${p.pagado ? fld("devolver", `Registrar devolución de ${S(p.pagado)} en caja`, true, { type: "checkbox", full: true }) : ""}${p.celular ? fld("enviar", "Avisar por WhatsApp", p.origen === "web", { type: "checkbox" }) : ""}`, async d =>
    fin([upd({ estado: "anulado", motivo: d.motivo }), ...(d.devolver ? [movimiento({ concepto: `Devolución pedido ${p.codigo || id}`, monto: -p.pagado, metodo: p.pagoReal || p.pago, pedido: id })] : [])], "Pedido anulado", d.enviar ? msgCliente(p, `Tu pedido fue anulado${d.motivo ? ": " + d.motivo : ""}.`) : null), "Anular pedido");
}

/* ================= Elegir opciones de un plato (venta en local) ================= */
function elegirOpciones(p, alListo) {
  const grupos = p.opciones || [], cremas = p.cremas ? (CAT.aj.cremas || []) : [];
  if (!grupos.length && !cremas.length) return alListo({ precio: +p.precio, opts: "", cremas: "", nota: "" });
  modal(p.nombre, `${grupos.map((g, gi) => `<fieldset class="og"><legend>${esc(g.titulo)}${g.req ? " *" : ""}</legend><div class="og-l">${(g.items || []).map((it, ii) => `<label class="rd"><input type="${g.tipo === "varios" ? "checkbox" : "radio"}" name="g${gi}_${g.tipo === "varios" ? ii : "x"}" value="${ii}" ${g.tipo !== "varios" && g.req && !ii ? "checked" : ""}><span>${esc(it.n)}${+it.p ? ` <small>+${S(it.p)}</small>` : ""}</span></label>`).join("")}</div></fieldset>`).join("")}
    ${cremas.length ? `<fieldset class="og"><legend>Cremas</legend><div class="og-l">${cremas.map((c, k) => `<label class="rd"><input type="checkbox" name="cr_${k}" value="${esc(c)}"><span>${esc(c)}</span></label>`).join("")}</div></fieldset>` : ""}
    ${fld("nota", "Indicación para cocina", "", { full: true, ph: "Ej. sin sal, bien dorado" })}`, async (d, F) => {
    let precio = +p.precio; const sel = [];
    for (const [gi, g] of grupos.entries()) { const ch = $$(`[name^="g${gi}_"]:checked`, F).map(i => g.items[+i.value]); if (g.req && !ch.length) { toast("Elige: " + g.titulo, true); return false; } ch.forEach(x => precio += +(x.p || 0)); if (ch.length) sel.push(ch.map(x => x.n).join(", ")); }
    alListo({ precio: r2(precio), opts: sel.join(" · "), cremas: $$('[name^="cr_"]:checked', F).map(i => i.value).join(", "), nota: d.nota || "" });
  }, "Agregar");
}

/* ================= VENTA EN LOCAL ================= */
let VT = { items: [], cat: "", q: "", tipo: "llevar" };
VIEWS.venta = async () => {
  await cargarCatalogo(); if (!VT.cat && CAT.cats[0]) VT.cat = CAT.cats[0].id;
  $("#view").innerHTML = topBar("Venta en local", "Para llevar, en mesa o delivery por teléfono. La venta va a cocina y a Caja.") + `<div class="pos">
    <section class="card"><div class="pos-f"><input class="q" id="vq" placeholder="Buscar plato…" value="${esc(VT.q)}" autocomplete="off"></div>
      <div class="chips">${CAT.cats.map(c => `<button class="chip ${VT.cat === c.id && !VT.q ? "on" : ""}" data-vc="${esc(c.id)}">${esc(c.icono || "")} ${esc(c.nombre)}</button>`).join("")}</div><div class="pos-g" id="vg"></div></section>
    <aside class="card pos-c" id="vcart"></aside></div>`;
  const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const grid = () => { const l = CAT.prods.filter(p => p.activo !== false && (VT.q ? norm(p.nombre).includes(norm(VT.q)) : p.cat === VT.cat)).slice(0, 80);
    $("#vg").innerHTML = l.map(p => `<button class="pos-p ${p.agotado ? "off" : ""}" data-add="${esc(p.id)}" ${p.agotado ? "disabled" : ""}>${p.foto ? `<span class="pos-i" style="background-image:url('${esc(IMG(p.foto, 200))}')"></span>` : `<span class="pos-i em">${esc(catDe(p.cat).icono || "🍗")}</span>`}<b>${esc(p.nombre)}</b><span>${S(p.precio)}</span><small>${p.agotado ? "Agotado" : (p.opciones || []).length ? "con opciones" : ""}</small></button>`).join("") || `<p class="muted">Sin resultados.</p>`; };
  const carro = () => { const sub = r2(VT.items.reduce((a, i) => a + i.precio * i.cant, 0)), zs = CAT.zonas.filter(z => z.activo !== false);
    $("#vcart").innerHTML = `<h2>${ico("cart")} Venta actual</h2><div class="seg seg-f">${[["llevar", "🥡 Llevar"], ["local", "🍽️ Mesa"], ["delivery", "🛵 Delivery"]].map(([k, t]) => `<button type="button" class="${VT.tipo === k ? "on" : ""}" data-vt="${k}">${t}</button>`).join("")}</div>
      ${VT.items.length ? `<ul class="pos-l">${VT.items.map((i, k) => `<li><div><b>${esc(i.n)}</b>${detItem(i).map(d => `<small>${esc(d)}</small>`).join("")}<small>${S(i.precio)} c/u</small></div><span class="qty-b"><button data-vm="${k}" aria-label="Menos">${ico("minus")}</button><b>${i.cant}</b><button data-vp="${k}" aria-label="Más">${ico("plus")}</button></span><b>${S(i.precio * i.cant)}</b></li>`).join("")}</ul>
      <form id="vf" class="g2">${VT.tipo === "local" ? fld("mesa", "N° de mesa", "", { req: true, extra: 'inputmode="numeric" maxlength="4"' }) + fld("nombre", "Cliente (opcional)", "") : VT.tipo === "delivery" ? fld("nombre", "Cliente", "", { req: true }) + fld("celular", "Celular", "", { type: "tel", req: true }) + fld("zona", "Zona", zs[0]?.id || "", { opts: zs.map(z => [z.id, `${z.nombre} · ${S(z.costo)}`]) }) + fld("direccion", "Dirección", "", { req: true }) + fld("referencia", "Referencia", "", { full: true }) : fld("nombre", "Cliente (opcional)", "") + fld("celular", "Celular (opcional)", "", { type: "tel" })}
        ${fld("nota", "Nota para cocina", "", { full: true })}${fld("descuento", "Descuento (S/)", "", { type: "number", extra: 'min="0" step="0.1"' })}${fld("metodo", "Método de pago", "Efectivo", { opts: [...METODOS, ...(VT.tipo !== "llevar" ? [["despues", VT.tipo === "local" ? "Cobrar al final (cuenta de mesa)" : "Cobra el repartidor"]] : [])] })}
        ${fld("recibido", "Recibido (efectivo)", "", { type: "number", extra: 'min="0" step="0.1"' })}<div class="fld"><span>Vuelto</span><b id="vVuelto" class="vuelto">—</b></div>
        <div class="full pos-t"><span>Total</span><b id="vTot">${S(sub)}</b></div><button class="btn btn-pri btn-lg full">${ico("check")} Registrar y mandar a cocina</button></form>
      <button class="btn btn-light btn-sm" id="vClear">Vaciar</button>` : `<p class="muted">Toca un plato para agregarlo.</p>`}`;
    const F = $("#vf"); if (!F) return;
    const envio = () => VT.tipo === "delivery" ? +((CAT.zonas.find(z => z.id === $("[name=zona]", F)?.value) || {}).costo || 0) : 0;
    const calc = () => { const d = +$("[name=descuento]", F).value || 0, t = Math.max(0, r2(sub + envio() - d)), rc = +$("[name=recibido]", F).value || 0; $("#vTot").textContent = S(t) + (envio() ? ` (incl. delivery ${S(envio())})` : ""); $("#vVuelto").textContent = rc ? S(Math.max(0, rc - t)) : "—"; return { t, d, rc }; };
    F.oninput = calc; F.onchange = calc; calc();
    F.onsubmit = async e => { e.preventDefault(); const req = $$("[required]", F).find(x => !x.value.trim()); if (req) { req.focus(); return toast("Completa: " + req.closest("label").querySelector("span").textContent, true); }
      const { t, d, rc } = calc(), v = datosForm(F), mt = v.metodo, despues = mt === "despues";
      if (mt === "Efectivo" && rc && rc < t) return toast("El monto recibido es menor que el total", true);
      const cod = codigo("LC"), z = CAT.zonas.find(x => x.id === v.zona) || {};
      const ped = { codigo: cod, items: VT.items.map(i => ({ id: i.id, n: i.n, precio: i.precio, cant: i.cant, opts: i.opts, cremas: i.cremas, nota: i.nota })), subtotal: sub, descuento: r2(d), envio: envio(), total: t, entrega: VT.tipo,
        nombre: v.nombre || (VT.tipo === "local" ? `Mesa ${v.mesa}` : "Cliente"), celular: String(v.celular || "").replace(/\D/g, ""), mesa: v.mesa || "", nota: v.nota, ...(VT.tipo === "delivery" ? { zona: z.nombre || "", direccion: v.direccion, referencia: v.referencia } : {}),
        pago: despues ? (VT.tipo === "delivery" ? "Efectivo" : "Por cobrar") : mt, ...(despues ? {} : { pagado: t, pagoReal: mt }), recibido: rc || null, vuelto: rc ? r2(rc - t) : null, estado: "cocina", tiempo: 20, origen: "local", creado: new Date().toISOString(), por: YO().nombre };
      $("button.btn-pri", F).disabled = true;
      await DB.batch([{ op: "set", col: "pedidos", id: cod, data: ped, merge: false }, ...(despues ? [] : [movimiento({ concepto: `Venta local ${cod} · ${ENTREGA[VT.tipo][1]}${ped.mesa ? " mesa " + ped.mesa : ""}`, monto: t, metodo: mt, pedido: cod })])]);
      VT.items = []; toast(`Venta ${cod} registrada · ${S(t)}`); grid(); carro(); vigilar();
      modal("Venta registrada", `<p class="pin-big">Total<br><b>${S(t)}</b></p>${rc ? `<p style="text-align:center">Vuelto: <b>${S(rc - t)}</b></p>` : ""}<div class="acts-g" style="justify-content:center"><button type="button" class="btn btn-pri" id="cm">${ico("chef")} Comanda cocina</button><button type="button" class="btn btn-light" id="tk">${ico("print")} Ticket</button>${ped.celular ? `<button type="button" class="btn btn-wa" id="vw">${ico("wa")} Enviar</button>` : ""}</div>`, null);
      $("#cm").onclick = () => pdfTicket(ped, "comanda"); $("#tk").onclick = () => pdfTicket(ped, "ticket");
      $("#vw")?.addEventListener("click", () => abrirWA(ped.celular, `Gracias por tu pedido en *${NOMBRE()}* 🍗\n\n${ped.items.map(i => `• ${i.cant}× ${i.n} = ${S(i.precio * i.cant)}`).join("\n")}\n\nTOTAL: ${S(t)}`)); };
    $("#vClear").onclick = () => { VT.items = []; carro(); };
  };
  grid(); carro();
  $("#vq").addEventListener("input", e => { VT.q = e.target.value; grid(); });
  $("#view").onclick = e => {
    const c = e.target.closest("[data-vc]"); if (c) { VT.cat = c.dataset.vc; VT.q = ""; $("#vq").value = ""; $$("[data-vc]").forEach(b => b.classList.toggle("on", b === c)); return grid(); }
    const vt = e.target.closest("[data-vt]"); if (vt) { VT.tipo = vt.dataset.vt; return carro(); }
    const a = e.target.closest("[data-add]"), m = e.target.closest("[data-vm]"), pl = e.target.closest("[data-vp]");
    if (a) { const p = prodDe(a.dataset.add); elegirOpciones(p, o => { const key = [p.id, o.opts, o.cremas, o.nota].join("|"), it = VT.items.find(i => i.key === key); if (it) it.cant++; else VT.items.push({ key, id: p.id, n: p.nombre, cant: 1, ...o }); carro(); }); }
    if (m) { const i = VT.items[+m.dataset.vm]; i.cant--; if (i.cant < 1) VT.items.splice(+m.dataset.vm, 1); carro(); }
    if (pl) { VT.items[+pl.dataset.vp].cant++; carro(); }
  };
};

/* ================= CARTA Y PRECIOS ================= */
let PF = { q: "", cat: "" };
VIEWS.carta = async () => {
  await cargarCatalogo();
  const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const l = CAT.prods.filter(p => (!PF.cat || p.cat === PF.cat) && norm(p.nombre).includes(norm(PF.q)));
  $("#view").innerHTML = topBar("Carta y precios", "Lo que cambies aquí se ve al instante en la web y en la app.", esAdm() ? `<button class="btn btn-pri btn-sm" id="np">${ico("plus")} Plato</button>` : "") + `
    <div class="kpis"><div class="kpi"><span>Platos</span><b>${CAT.prods.length}</b><small>${CAT.prods.filter(p => p.activo === false).length} oculto(s)</small></div><div class="kpi"><span>Agotados</span><b class="${CAT.prods.some(p => p.agotado) ? "neg" : ""}">${CAT.prods.filter(p => p.agotado).length}</b><small>se ven pero no se pueden pedir</small></div>
      <div class="kpi"><span>Favoritos</span><b>${CAT.prods.filter(p => p.destacado).length}</b><small>arriba en la web</small></div><div class="kpi"><span>Con opciones</span><b>${CAT.prods.filter(p => (p.opciones || []).length).length}</b><small>parte, papas, término…</small></div></div>
    <section class="card"><div class="card-h"><div class="pos-f"><input class="q" id="pq" placeholder="Buscar plato…" value="${esc(PF.q)}"><select class="q" id="pc"><option value="">Todas las categorías</option>${CAT.cats.map(c => `<option value="${esc(c.id)}" ${PF.cat === c.id ? "selected" : ""}>${esc(c.icono || "")} ${esc(c.nombre)}</option>`).join("")}</select></div><span class="muted sm">${l.length} plato(s)</span></div>
      <div class="tbl-w"><table class="tbl"><thead><tr><th></th><th>Plato</th><th>Categoría</th><th class="r">Precio</th><th>Hay hoy</th><th>En la web</th><th></th></tr></thead><tbody>
      ${l.map(p => `<tr class="${p.activo === false ? "off" : ""}"><td>${p.foto ? `<span class="p-th" style="background-image:url('${esc(IMG(p.foto, 120))}')"></span>` : `<span class="p-th em">${esc(catDe(p.cat).icono || "🍗")}</span>`}</td>
        <td><b>${esc(p.nombre)}</b><small>${p.destacado ? "⭐ Favorito · " : ""}${(p.opciones || []).map(g => esc(g.titulo)).join(" · ") || "sin opciones"}</small></td><td>${esc(catDe(p.cat).nombre || p.cat)}</td>
        <td class="r">${esAdm() ? `<input class="q precio" type="number" min="0" step="0.1" value="${p.precio}" data-pr="${esc(p.id)}" aria-label="Precio de ${esc(p.nombre)}">` : `<b>${S(p.precio)}</b>`}</td>
        <td><label class="sw"><input type="checkbox" data-hay="${esc(p.id)}" ${p.agotado ? "" : "checked"}><i></i><span>${p.agotado ? "Agotado" : "Sí"}</span></label></td>
        <td><label class="sw"><input type="checkbox" data-vis="${esc(p.id)}" ${p.activo === false ? "" : "checked"} ${esAdm() ? "" : "disabled"}><i></i></label></td>
        <td>${esAdm() ? `<button class="btn btn-light btn-sm" data-ep="${esc(p.id)}" aria-label="Editar">${ico("edit")}</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="7" class="muted">Sin platos.</td></tr>`}</tbody></table></div></section>`;
  $("#pq").addEventListener("change", e => { PF.q = e.target.value; VIEWS.carta(); }); $("#pc").addEventListener("change", e => { PF.cat = e.target.value; VIEWS.carta(); });
  $("#np")?.addEventListener("click", () => formPlato());
  $("#view").onclick = e => { const ep = e.target.closest("[data-ep]"); if (ep) formPlato(prodDe(ep.dataset.ep)); };
  $("#view").onchange = async e => { const t = e.target, p = prodDe(t.dataset.hay || t.dataset.vis || t.dataset.pr); if (!p) return;
    if (t.dataset.hay) { await DB.set("productos", p.id, { agotado: !t.checked }); p.agotado = !t.checked; t.nextElementSibling.nextElementSibling.textContent = t.checked ? "Sí" : "Agotado"; toast(t.checked ? `${p.nombre}: disponible` : `${p.nombre}: agotado en la web`); }
    if (t.dataset.vis) { await DB.set("productos", p.id, { activo: t.checked }); t.closest("tr").classList.toggle("off", !t.checked); toast(t.checked ? "Visible en la web" : "Oculto en la web"); }
    if (t.dataset.pr) { const v = r2(t.value); if (!(v > 0)) { t.value = p.precio; return toast("Precio no válido", true); } await DB.set("productos", p.id, { precio: v }); p.precio = v; toast(`${p.nombre}: ${S(v)}`); } };
};
// Grupos de opciones: se editan como texto simple, una opción por línea («Nombre | precio extra»)
const gruposTxt = g => (g.items || []).map(i => i.n + (+i.p ? ` | ${i.p}` : "")).join("\n");
function formPlato(p) {
  let G = JSON.parse(JSON.stringify(p?.opciones || [])), FOTO = p?.foto || "", leerG = () => {};
  const plantillas = {}; CAT.prods.forEach(x => (x.opciones || []).forEach(g => { const k = g.titulo + "|" + gruposTxt(g); if (!plantillas[k]) plantillas[k] = g; }));
  modal(p ? "Editar plato" : "Nuevo plato", `<div class="g2">
    <div class="full"><span class="lbl">Foto (cuadrada o horizontal; se achica sola)</span><div class="foto-up"><span id="fPrev" style="background-image:url('${esc(IMG(FOTO, 300))}')"></span><label class="btn btn-light btn-sm">${ico("camera")} Subir foto<input type="file" accept="image/*" id="fFile" hidden></label><button type="button" class="btn btn-light btn-sm" id="fX">Quitar</button><input class="q" id="fUrl" placeholder="…o pega un enlace https://" style="flex:1;min-width:180px"></div></div>
    ${fld("nombre", "Nombre", p?.nombre || "", { req: true, full: true })}${fld("cat", "Categoría", p?.cat || CAT.cats[0]?.id, { opts: CAT.cats.map(c => [c.id, `${c.icono || ""} ${c.nombre}`]) })}${fld("precio", "Precio base (S/)", p?.precio ?? "", { type: "number", req: true, extra: 'min="0" step="0.1"' })}
    ${fld("desc", "Descripción corta", p?.desc || "", { type: "textarea", full: true, rows: 2, ph: "Ej. Con papas fritas y ensalada fresca." })}
    ${fld("destacado", "⭐ Favorito (sale arriba en la web)", !!p?.destacado, { type: "checkbox" })}${fld("cremas", "Ofrecer cremas gratis", p ? !!p.cremas : true, { type: "checkbox" })}
    ${fld("sugerirBebida", "Ofrecer bebida al agregarlo", p ? !!p.sugerirBebida : true, { type: "checkbox" })}${fld("agotado", "Agotado hoy", !!p?.agotado, { type: "checkbox" })}${fld("activo", "Visible en la web", p ? p.activo !== false : true, { type: "checkbox" })}
    <div class="full"><span class="lbl">Opciones que elige el cliente (parte del pollo, papas, término, tamaño…)</span><div id="grps"></div>
      <div class="acts-g"><button type="button" class="btn btn-light btn-sm" id="gAdd">${ico("plus")} Nuevo grupo</button>${Object.keys(plantillas).length ? `<select class="q" id="gPl"><option value="">+ Copiar un grupo que ya usas…</option>${Object.entries(plantillas).map(([k, g]) => `<option value="${esc(k)}">${esc(g.titulo)} (${(g.items || []).length} opciones)</option>`).join("")}</select>` : ""}</div></div>
  </div>${p ? `<button type="button" class="btn btn-light danger btn-sm" id="delP">${ico("trash")} Eliminar plato</button>` : ""}`, async (d, F) => {
    leerG(); const u = $("#fUrl").value.trim(); if (/^https:\/\//.test(u)) FOTO = u;
    const malo = G.find(g => !g.titulo || !g.items.length); if (malo) { toast("Cada grupo necesita un título y al menos una opción", true); return false; }
    const id = p?.id || "p" + Date.now().toString(36);
    const data = { nombre: d.nombre, cat: d.cat, precio: r2(d.precio), desc: d.desc, destacado: d.destacado, cremas: d.cremas, sugerirBebida: d.sugerirBebida, agotado: d.agotado, activo: d.activo, foto: FOTO, opciones: G, orden: p?.orden ?? CAT.prods.length, actualizado: new Date().toISOString() };
    if (JSON.stringify(data).length > 600000) { toast("La foto pesa demasiado", true); return false; }
    await DB.set("productos", id, data, false); toast("Plato guardado · ya se ve en la web"); VIEWS.carta(); }, "Guardar", { wide: true, alAbrir: F => {
    const pintarG = () => { $("#grps").innerHTML = G.map((g, k) => `<div class="grp" data-g="${k}"><div class="grp-h"><input class="q" data-gt value="${esc(g.titulo)}" placeholder="Título (ej. Parte del pollo)" aria-label="Título del grupo">
        <select class="q" data-gk><option value="uno" ${g.tipo !== "varios" ? "selected" : ""}>Elige 1</option><option value="varios" ${g.tipo === "varios" ? "selected" : ""}>Elige varios</option></select>
        <label class="chk"><input type="checkbox" data-gr ${g.req ? "checked" : ""}><span>Obligatorio</span></label><button type="button" class="btn btn-light btn-xs" data-gx="${k}" aria-label="Quitar grupo">${ico("trash")}</button></div>
        <textarea class="q" data-gi rows="${Math.max(3, (g.items || []).length)}" placeholder="Una opción por línea. Si cuesta más: Nombre | 3">${esc(gruposTxt(g))}</textarea></div>`).join("") || `<p class="muted sm">Sin opciones: el cliente lo agrega directo.</p>`; };
    leerG = () => { $$(".grp", F).forEach(el => { const g = G[+el.dataset.g]; g.titulo = $("[data-gt]", el).value.trim(); g.tipo = $("[data-gk]", el).value; g.req = $("[data-gr]", el).checked;
      g.items = $("[data-gi]", el).value.split("\n").map(l => { const [n, pr] = l.split("|").map(x => (x || "").trim()); return n ? { n, ...(+pr ? { p: r2(pr) } : {}) } : null; }).filter(Boolean); g.id = g.id || g.titulo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\W+/g, "-"); }); };
    pintarG();
    $("#gAdd").onclick = () => { leerG(); G.push({ titulo: "", tipo: "uno", req: true, items: [] }); pintarG(); $$("[data-gt]", F).pop().focus(); };
    $("#gPl")?.addEventListener("change", e => { const g = plantillas[e.target.value]; if (!g) return; leerG(); G.push(JSON.parse(JSON.stringify(g))); e.target.value = ""; pintarG(); });
    $("#grps").onclick = e => { const x = e.target.closest("[data-gx]"); if (x) { leerG(); G.splice(+x.dataset.gx, 1); pintarG(); } };
    $("#fFile").onchange = async e => { const f = e.target.files[0]; if (!f) return; FOTO = await redimensionar(f, 800, .72); $("#fPrev").style.backgroundImage = `url('${FOTO}')`; };
    $("#fX").onclick = () => { FOTO = ""; $("#fPrev").style.backgroundImage = "none"; };
    $("#delP")?.addEventListener("click", async () => { if (!confirm(`¿Eliminar «${p.nombre}»?`)) return; await DB.del("productos", p.id); cerrarModal(); toast("Plato eliminado"); VIEWS.carta(); }); } });
}

/* ================= CATEGORÍAS ================= */
VIEWS.categorias = async () => {
  await cargarCatalogo();
  $("#view").innerHTML = topBar("Categorías", "Las pestañas de la carta en la web, en este orden.", `<button class="btn btn-pri btn-sm" id="nc">${ico("plus")} Categoría</button>`) +
    `<section class="card"><ul class="lst cats">${CAT.cats.map((c, i) => `<li><span class="cat-em">${esc(c.icono || "🍗")}</span><div><b>${esc(c.nombre)}</b><small>${CAT.prods.filter(p => p.cat === c.id).length} plato(s)</small></div>
      <button class="btn btn-light btn-xs" data-up="${i}" ${i ? "" : "disabled"} aria-label="Subir">▲</button><button class="btn btn-light btn-xs" data-dn="${i}" ${i < CAT.cats.length - 1 ? "" : "disabled"} aria-label="Bajar">▼</button><button class="btn btn-light btn-sm" data-ec="${esc(c.id)}">${ico("edit")}</button></li>`).join("") || `<li class="muted">Sin categorías.</li>`}</ul></section>`;
  const form = c => modal(c ? c.nombre : "Nueva categoría", `<div class="g2">${fld("nombre", "Nombre", c?.nombre || "", { req: true, full: true })}
    <div class="full"><span class="lbl">Ícono</span><div class="em-pick">${EMOJIS.map(k => `<label><input type="radio" name="icono" value="${k}" ${(c?.icono || "🍗") === k ? "checked" : ""}><span>${k}</span></label>`).join("")}</div></div></div>
    ${c ? `<button type="button" class="btn btn-light danger btn-sm" id="delC">${ico("trash")} Eliminar categoría</button>` : ""}`, async d => {
    const id = c?.id || d.nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\W+/g, "-").replace(/^-|-$/g, "") || "cat-" + Date.now().toString(36);
    if (!c && CAT.cats.find(x => x.id === id)) { toast("Ya existe esa categoría", true); return false; }
    await DB.set("categorias", id, { nombre: d.nombre, icono: d.icono || "🍗", orden: c?.orden ?? CAT.cats.length }); toast("Categoría guardada"); VIEWS.categorias(); }, "Guardar", { alAbrir: () => {
    $("#delC")?.addEventListener("click", async () => { const n = CAT.prods.filter(p => p.cat === c.id).length; if (n) return toast(`Tiene ${n} plato(s). Muévelos a otra categoría primero.`, true); if (!confirm(`¿Eliminar «${c.nombre}»?`)) return; await DB.del("categorias", c.id); cerrarModal(); VIEWS.categorias(); }); } });
  $("#nc").addEventListener("click", () => form());
  $("#view").onclick = async e => { const ec = e.target.closest("[data-ec]"), up = e.target.closest("[data-up]"), dn = e.target.closest("[data-dn]");
    if (ec) return form(catDe(ec.dataset.ec));
    if (up || dn) { const i = +(up || dn).dataset[up ? "up" : "dn"], j = up ? i - 1 : i + 1, l = CAT.cats.slice(); [l[i], l[j]] = [l[j], l[i]]; await DB.batch(l.map((c, k) => ({ op: "set", col: "categorias", id: c.id, data: { orden: k } }))); VIEWS.categorias(); } };
};

/* ================= ZONAS DE DELIVERY ================= */
VIEWS.zonas = async () => {
  await cargarCatalogo();
  $("#view").innerHTML = topBar("Zonas de delivery", "El cliente elige su zona y se suma el costo del delivery.", `<button class="btn btn-pri btn-sm" id="nz">${ico("plus")} Zona</button>`) +
    `<section class="card"><div class="tbl-w"><table class="tbl"><thead><tr><th>Zona</th><th class="r">Costo</th><th>Activa</th><th></th></tr></thead><tbody>
    ${CAT.zonas.map(z => `<tr class="${z.activo === false ? "off" : ""}"><td><b>${esc(z.nombre)}</b></td><td class="r">${S(z.costo)}</td><td>${z.activo === false ? `<span class="st mute">No</span>` : `<span class="st ok">Sí</span>`}</td><td><button class="btn btn-light btn-sm" data-ez="${esc(z.id)}">${ico("edit")}</button></td></tr>`).join("") || `<tr><td colspan="4" class="muted">Sin zonas. Agrega al menos una para recibir delivery.</td></tr>`}</tbody></table></div>
    <p class="muted sm">Pedido mínimo para delivery: <b>${S(CAT.aj.pedidoMinimo || 0)}</b> (se cambia en Ajustes).</p></section>`;
  const form = z => modal(z ? z.nombre : "Nueva zona", `<div class="g2">${fld("nombre", "Nombre de la zona", z?.nombre || "", { req: true, full: true, ph: "Ej. Cercado (hasta 2 km)" })}${fld("costo", "Costo del delivery (S/)", z?.costo ?? "", { type: "number", req: true, extra: 'min="0" step="0.5"' })}${fld("activo", "Activa", z ? z.activo !== false : true, { type: "checkbox" })}</div>
    ${z ? `<button type="button" class="btn btn-light danger btn-sm" id="delZ">${ico("trash")} Eliminar zona</button>` : ""}`, async d => {
    await DB.set("zonas", z?.id || "z" + Date.now().toString(36), { nombre: d.nombre, costo: r2(d.costo), activo: d.activo, orden: z?.orden ?? CAT.zonas.length }); toast("Zona guardada"); VIEWS.zonas(); }, "Guardar", { alAbrir: () => {
    $("#delZ")?.addEventListener("click", async () => { if (!confirm(`¿Eliminar «${z.nombre}»?`)) return; await DB.del("zonas", z.id); cerrarModal(); VIEWS.zonas(); }); } });
  $("#nz").addEventListener("click", () => form());
  $("#view").onclick = e => { const b = e.target.closest("[data-ez]"); if (b) form(CAT.zonas.find(z => z.id === b.dataset.ez)); };
};

/* ================= CAJA ================= */
let CAJA_F = null;
VIEWS.caja = async () => {
  CAJA_F = CAJA_F || HOY(); const l = (await DB.list("movimientos", ["fecha", "==", CAJA_F])).sort((a, b) => String(a.hora).localeCompare(String(b.hora)));
  const ing = l.filter(m => m.monto > 0).reduce((a, m) => a + m.monto, 0), egr = l.filter(m => m.monto < 0).reduce((a, m) => a + m.monto, 0), por = {}; l.forEach(m => por[m.metodo] = (por[m.metodo] || 0) + m.monto);
  $("#view").innerHTML = topBar("Caja", "Ventas del local, pedidos web cobrados, compras y gastos.", `<input type="date" id="cf" value="${CAJA_F}" class="q"><button class="btn btn-light btn-sm" id="mov">${ico("plus")} Ingreso / gasto</button><button class="btn btn-light btn-sm" id="csv">${ico("download")} Excel (CSV)</button>`) + `
    <div class="kpis neon"><div class="kpi"><span>Saldo del día</span><b>${S(ing + egr)}</b><small>${l.length} movimiento(s)</small></div><div class="kpi"><span>Ingresos</span><b>${S(ing)}</b></div><div class="kpi"><span>Gastos y compras</span><b>${S(egr)}</b></div>${METODOS.map(k => `<div class="kpi"><span>${k}</span><b>${S(por[k] || 0)}</b></div>`).join("")}</div>
    <section class="card"><div class="tbl-w"><table class="tbl"><thead><tr><th>Hora</th><th>Concepto</th><th>Método</th><th>Usuario</th><th class="r">Monto</th></tr></thead><tbody>
      ${l.map(m => `<tr><td>${fmtH(m.hora)}</td><td>${esc(m.concepto)}</td><td>${esc(m.metodo)}</td><td>${esc(m.usuario || "")}</td><td class="r ${m.monto < 0 ? "neg" : ""}">${S(m.monto)}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">Sin movimientos este día.</td></tr>`}</tbody></table></div></section>`;
  $("#cf").addEventListener("change", e => { CAJA_F = e.target.value; VIEWS.caja(); });
  $("#csv").addEventListener("click", () => { const rows = [["Fecha", "Hora", "Concepto", "Método", "Usuario", "Monto"], ...l.map(m => [m.fecha, fmtH(m.hora), m.concepto, m.metodo, m.usuario || "", m.monto])];
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(";")).join("\n")], { type: "text/csv" })); a.download = `caja-${CAJA_F}.csv`; a.click(); });
  $("#mov").addEventListener("click", () => modal("Ingreso o gasto", `<div class="g2">${fld("tipo", "Tipo", "egreso", { opts: [["ingreso", "Ingreso"], ["egreso", "Gasto / compra"]] })}${fld("monto", "Monto (S/)", "", { type: "number", req: true, extra: 'min="0.1" step="0.1"' })}
    ${fld("concepto", "Concepto", "", { req: true, full: true, ph: "Ej. compra de pollos, carbón, gas, pago a repartidor" })}${fld("metodo", "Método", "Efectivo", { opts: METODOS })}</div>`, async d => {
    await DB.batch([movimiento({ concepto: d.concepto, monto: d.tipo === "egreso" ? -d.monto : d.monto, metodo: d.metodo, fecha: CAJA_F })]); toast("Registrado"); VIEWS.caja(); }));
};

/* ================= CLIENTES ================= */
let CQ = "";
VIEWS.clientes = async () => {
  const peds = (await DB.list("pedidos")).filter(p => p.celular && !["anulado", "rechazado"].includes(p.estado)), M = {}, kc = cel => String(cel).replace(/\D/g, "").slice(-9);
  peds.forEach(p => { const k = kc(p.celular); const c = M[k] || (M[k] = { k, nombre: p.nombre, celular: p.celular, dir: "", n: 0, total: 0, ult: "" }); c.n++; c.total += +p.total || 0; if (String(p.creado) > c.ult) { c.ult = p.creado; c.nombre = p.nombre; c.dir = p.direccion || c.dir; } });
  const q = CQ.toLowerCase(), l = Object.values(M).filter(c => !q || [c.nombre, c.celular, c.dir].join(" ").toLowerCase().includes(q)).sort((a, b) => b.total - a.total);
  $("#view").innerHTML = topBar("Clientes", "Quienes pidieron por la web, por teléfono o dejaron su celular. Ordenados por lo que más compran.", `<input class="q" id="cq" placeholder="Buscar nombre, celular o dirección" value="${esc(CQ)}">`) +
    `<section class="card"><div class="tbl-w"><table class="tbl"><thead><tr><th>Cliente</th><th>Celular</th><th>Última dirección</th><th>Pedidos</th><th class="r">Total</th><th>Último</th><th></th></tr></thead><tbody>
    ${l.slice(0, 300).map(c => `<tr><td><b>${esc(c.nombre)}</b>${c.n > 2 ? ` <span class="st ok">Frecuente</span>` : ""}</td><td>${esc(c.celular)}</td><td>${esc(c.dir || "—")}</td><td>${c.n}</td><td class="r">${S(c.total)}</td><td>${fmtF(c.ult)}</td><td><button class="btn btn-wa btn-sm" data-wa="${esc(c.celular)}|${esc(c.nombre)}">${ico("wa")}</button></td></tr>`).join("") || `<tr><td colspan="7" class="muted">Aún no hay clientes.</td></tr>`}</tbody></table></div></section>`;
  $("#cq").addEventListener("change", e => { CQ = e.target.value; VIEWS.clientes(); });
  $("#view").onclick = e => { const b = e.target.closest("[data-wa]"); if (b) { const [cel, n] = b.dataset.wa.split("|"); abrirWA(cel, `Hola ${n.split(" ")[0]} 👋 Te saluda *${NOMBRE()}*. `); } };
};

/* ================= REPORTES ================= */
VIEWS.reportes = async () => {
  await cargarCatalogo(); const d0 = addD(HOY(), -29), peds = (await DB.list("pedidos", ["creado", ">=", d0])).filter(p => p.pagado || p.estado === "entregado"), movs = await DB.list("movimientos", ["fecha", ">=", d0]);
  const dias = [...Array(30)].map((_, i) => addD(d0, i)), porDia = dias.map(f => movs.filter(m => m.fecha === f && m.monto > 0).reduce((a, m) => a + m.monto, 0)), max = Math.max(1, ...porDia);
  const top = {}, porEnt = {}, porHora = Array(24).fill(0); peds.forEach(p => { (p.items || []).forEach(i => { top[i.n] = top[i.n] || { c: 0, m: 0 }; top[i.n].c += i.cant; top[i.n].m += i.cant * i.precio; }); porEnt[p.entrega] = (porEnt[p.entrega] || 0) + (+p.total || 0); porHora[new Date(new Date(p.creado) - 5 * 3600e3).getUTCHours()]++; });
  const tot = porDia.reduce((a, b) => a + b, 0), maxE = Math.max(1, ...Object.values(porEnt)), maxH = Math.max(1, ...porHora);
  $("#view").innerHTML = topBar("Reportes", "Últimos 30 días.") + `
    <div class="kpis neon"><div class="kpi"><span>Ingresos</span><b>${S(tot)}</b><small>promedio ${S(tot / 30)} por día</small></div><div class="kpi"><span>Pedidos</span><b>${peds.length}</b><small>${peds.filter(p => p.origen === "web").length} web · ${peds.filter(p => p.origen === "local").length} local</small></div>
      <div class="kpi"><span>Ticket promedio</span><b>${S(peds.length ? peds.reduce((a, p) => a + (+p.total || 0), 0) / peds.length : 0)}</b></div><div class="kpi"><span>Delivery</span><b>${S(porEnt.delivery || 0)}</b><small>${peds.filter(p => p.entrega === "delivery").length} pedidos</small></div></div>
    <section class="card"><div class="card-h"><h2>Ingresos por día</h2></div><div class="dias">${porDia.map((v, i) => `<div title="${fmtF(dias[i])}: ${S(v)}"><i style="height:${Math.max(2, v / max * 100)}%"></i><small>${+dias[i].slice(8) % 5 === 0 || i === 29 ? +dias[i].slice(8) : ""}</small></div>`).join("")}</div></section>
    <div class="two"><section class="card"><div class="card-h"><h2>Lo más pedido</h2></div><table class="tbl"><tbody>${Object.entries(top).sort((a, b) => b[1].c - a[1].c).slice(0, 12).map(([n, v]) => `<tr><td>${esc(n)}</td><td>${v.c} u.</td><td class="r">${S(v.m)}</td></tr>`).join("") || `<tr><td class="muted">Aún no hay ventas.</td></tr>`}</tbody></table></section>
      <section class="card"><div class="card-h"><h2>Por tipo de pedido</h2></div><div class="bars">${Object.entries(porEnt).sort((a, b) => b[1] - a[1]).map(([c, v]) => `<div class="bar-r"><span>${(ENTREGA[c] || ["", c]).join(" ")}</span><div class="bar"><i style="width:${v / maxE * 100}%"></i></div><b>${S(v)}</b></div>`).join("") || `<p class="muted">Aún no hay ventas.</p>`}</div>
        <div class="card-h" style="margin-top:18px"><h2>Horas con más pedidos</h2></div><div class="dias horas">${porHora.map((v, h) => `<div title="${h}:00 · ${v} pedido(s)"><i style="height:${Math.max(2, v / maxH * 100)}%"></i><small>${h % 3 === 0 ? h : ""}</small></div>`).join("")}</div></section></div>`;
};

/* ================= AJUSTES ================= */
VIEWS.ajustes = async () => {
  await cargarCatalogo(); const a = CAT.aj, DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  $("#view").innerHTML = topBar("Ajustes", "Todo lo que se ve en la web y en la app. Se guarda en Firebase y se ve al instante.") + `
    ${!CAT.prods.length || DEMO ? `<section class="card hi"><h2>${ico("download")} Cargar carta de ejemplo</h2><p>Crea las categorías, los 24 platos con sus opciones y 3 zonas de delivery para empezar a editarlos. ${!CAT.prods.length ? "<b>Tu carta aún no está guardada.</b>" : ""}</p><button class="btn btn-pri" id="seed">Cargar carta de ejemplo</button></section>` : ""}
    <form class="card" id="ajF">
      <h2>${ico("star")} Marca</h2><div class="g2">
        <div class="full"><span class="lbl">Logo (cuadrado, PNG)</span><div class="foto-up"><span id="prev_logo" class="logo-prev">${a.logo ? `<img src="${esc(a.logo)}" alt="">` : ico("fire")}</span><label class="btn btn-light btn-sm">${ico("camera")} Subir logo<input type="file" accept="image/*" id="logoFile" hidden></label>${a.logo ? `<button type="button" class="btn btn-light btn-sm" id="logoX">Quitar</button>` : ""}<input type="hidden" name="logo" value="${esc(a.logo || "")}"></div></div>
        ${fld("nombre", "Nombre del negocio", a.nombre, { req: true })}${fld("slogan", "Frase corta", a.slogan)}${fld("ruc", "RUC (sale en los tickets)", a.ruc || "")}</div>
      <h2>${ico("clock")} Horario</h2><div class="g2">${fld("abre", "Abre", a.abre, { type: "time" })}${fld("cierra", "Cierra", a.cierra, { type: "time", help: "Si cierra pasada la medianoche (ej. 01:00) también funciona." })}
        <div class="full"><span class="lbl">Días de atención</span><div class="dias-ck">${DIAS.map((t, i) => `<label class="chk"><input type="checkbox" name="dia${i}" ${(a.dias || []).includes(i) ? "checked" : ""}><span>${t}</span></label>`).join("")}</div></div></div>
      <h2>${ico("phone")} Contacto</h2><div class="g2">${fld("whatsapp", "WhatsApp de pedidos (51 + número)", a.whatsapp, { req: true })}${fld("telefono", "Teléfono que se muestra", a.telefono)}${fld("email", "Correo", a.email)}
        ${fld("direccion", "Dirección del local", a.direccion, { full: true })}${fld("referencia", "Referencia del local", a.referencia || "", { full: true })}
        ${fld("facebook", "Facebook", (a.redes || {}).facebook || "", { type: "url", ph: "https://facebook.com/…" })}${fld("instagram", "Instagram", (a.redes || {}).instagram || "", { type: "url" })}${fld("tiktok", "TikTok", (a.redes || {}).tiktok || "", { type: "url" })}</div>
      <h2>${ico("bike")} Delivery y recojo</h2><div class="g2">${fld("delivery", "Hacer delivery", a.delivery !== false, { type: "checkbox" })}${fld("recojo", "Permitir recojo en el local", a.recojo !== false, { type: "checkbox" })}
        ${fld("tiempoDelivery", "Tiempo de delivery que se muestra", a.tiempoDelivery)}${fld("tiempoRecojo", "Tiempo de recojo que se muestra", a.tiempoRecojo)}${fld("pedidoMinimo", "Pedido mínimo para delivery (S/)", a.pedidoMinimo ?? 0, { type: "number", extra: 'min="0"' })}
        ${fld("repartidores", "Repartidores (uno por línea: Nombre | celular)", a.repartidores || "", { type: "textarea", full: true, rows: 3, ph: "Luis | 987654321" })}</div>
      <h2>${ico("fire")} Cremas</h2><div class="g2">${fld("cremas", "Cremas que ofreces gratis (una por línea)", (a.cremas || []).join("\n"), { type: "textarea", full: true, rows: 4 })}</div>
      <h2>${ico("cash")} Pagos</h2><div class="g2">${fld("contraEntrega", "Aceptar efectivo al recibir (con vuelto)", a.contraEntrega !== false, { type: "checkbox", full: true })}
        ${["yape", "plin"].map(k => { const N = k[0].toUpperCase() + k.slice(1); return `${fld("pago" + N, `Aceptar ${N}`, a["pago" + N] !== false, { type: "checkbox", full: true })}<div class="full qr-up"><span id="prev_${k}QR">${a[k + "QR"] ? `<img src="${esc(a[k + "QR"])}" alt="">` : ico("qr")}</span><label class="btn btn-light btn-sm">${ico("camera")} QR de ${N}<input type="file" accept="image/*" data-qr="${k}" hidden></label><input type="hidden" name="${k}QR" value="${esc(a[k + "QR"] || "")}">${fld(k + "Num", "Número", a[k + "Num"] || "")}${fld(k + "Titular", "A nombre de", a[k + "Titular"] || "")}</div>`; }).join("")}
        ${fld("pagoTransf", "Aceptar transferencias", a.pagoTransf === true, { type: "checkbox" })}${fld("pagoOCR", "Leer las capturas automáticamente", a.pagoOCR !== false, { type: "checkbox" })}
        ${fld("cuentas", "Cuentas (banco | número | CCI | titular)", (a.cuentas || []).map(c => `${c.banco} | ${c.num} | ${c.cci} | ${c.titular}`).join("\n"), { type: "textarea", full: true, help: "Bancos con su color: BCP, Interbank, BBVA, Scotiabank, BanBif, Pichincha." })}</div>
      <div class="f-end"><button class="btn btn-pri">${ico("check")} Guardar ajustes</button></div></form>`;
  const F = $("#ajF");
  $$("[data-qr]", F).forEach(i => i.addEventListener("change", async e => { const f = e.target.files[0], k = e.target.dataset.qr; if (!f) return; const u = await redimensionar(f, 600, .92, "image/png"); $(`[name=${k}QR]`, F).value = u; $(`#prev_${k}QR`).innerHTML = `<img src="${u}" alt="">`; }));
  $("#logoFile").addEventListener("change", async e => { const f = e.target.files[0]; if (!f) return; const u = await redimensionar(f, 320, .92, "image/png"); $("[name=logo]", F).value = u; $("#prev_logo").innerHTML = `<img src="${u}" alt="">`; });
  $("#logoX")?.addEventListener("click", e => { $("[name=logo]", F).value = ""; $("#prev_logo").innerHTML = ico("fire"); e.target.remove(); });
  F.addEventListener("submit", async e => { e.preventDefault(); const d = datosForm(F), sp = t => String(t || "").split("\n").map(x => x.trim()).filter(Boolean);
    const URL_B = { BCP: "https://www.viabcp.com", Interbank: "https://interbank.pe", BBVA: "https://www.bbva.pe", Scotiabank: "https://www.scotiabank.com.pe", BanBif: "https://www.banbif.com.pe", Pichincha: "https://www.pichincha.pe" };
    const x = { ...d, redes: { facebook: d.facebook, instagram: d.instagram, tiktok: d.tiktok }, dias: [0, 1, 2, 3, 4, 5, 6].filter(i => d["dia" + i]), cremas: sp(d.cremas), pedidoMinimo: +d.pedidoMinimo || 0,
      cuentas: sp(d.cuentas).map((l, i) => { const [banco, num, cci, titular] = l.split("|").map(y => (y || "").trim()); return { id: (banco || "banco").toLowerCase().replace(/\W/g, "") + i, banco, num, cci, titular, url: URL_B[banco] || "" }; }),
      whatsapp: String(d.whatsapp).replace(/\D/g, "") };
    ["facebook", "instagram", "tiktok", 0, 1, 2, 3, 4, 5, 6].forEach(k => delete x[typeof k === "number" ? "dia" + k : k]);
    if (!x.dias.length) return toast("Marca al menos un día de atención", true);
    if (JSON.stringify(x).length > 950000) return toast("Las imágenes pesan demasiado. Usa fotos más livianas.", true);
    await DB.set("ajustes", "general", x); Object.assign(CAT.aj, x); marcaPanel(); pintarAbierto(); toast("Ajustes guardados · ya se ven en la web"); });
  $("#seed")?.addEventListener("click", async () => {
    if (!confirm(DEMO ? "En modo demo esto reinicia TODOS los datos de prueba. ¿Continuar?" : "Se crearán las categorías, platos y zonas de ejemplo. ¿Continuar?")) return;
    if (DEMO) { localStorage.removeItem("pl_db"); LDB.get(); toast("Datos demo reiniciados"); await cargarCatalogo(); return go("inicio"); }
    window.PL_DEMO_DATOS = false; const d = window.PL_SEMILLA(), ops = [];
    if (!(await DB.get("ajustes", "general"))) ops.push({ op: "set", col: "ajustes", id: "general", data: window.PL_AJUSTES });
    ["categorias", "productos", "zonas"].forEach(col => Object.entries(d[col]).forEach(([id, v]) => ops.push({ op: "set", col, id, data: v })));
    await DB.batch(ops); toast("Carta de ejemplo cargada"); await cargarCatalogo(); go("carta");
  });
};

arrancar();
