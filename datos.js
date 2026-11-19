/* =========================================================
   POLLERÍA EL POLLÓN — Ajustes iniciales y carta de ejemplo
   (este archivo es IGUAL en la web y en el panel)
   Lo que cambies en el PANEL reemplaza estos valores.
   ========================================================= */
window.PL_AJUSTES = {
  nombre: "Pollería El Pollón", slogan: "Pollo a la brasa y parrillas al carbón",
  whatsapp: "51999999999", telefono: "+51 999 999 999", email: "pedidos@elpollon.pe",
  direccion: "Av. Principal 123, Lima", referencia: "Frente al parque", ruc: "", logo: "",
  // Horario (hora de Lima). dias: 0 = domingo … 6 = sábado
  abre: "12:00", cierra: "23:00", dias: [0, 1, 2, 3, 4, 5, 6], estadoManual: "auto",   // auto · abierto · cerrado
  delivery: true, recojo: true, tiempoDelivery: "35 a 50 min", tiempoRecojo: "20 a 30 min", pedidoMinimo: 20,
  cremas: ["Mayonesa", "Ají de la casa", "Golf", "Huancaína", "Mostaza", "Ketchup"],
  // Pagos
  pagoYape: true, yapeQR: "", yapeNum: "999 999 999", yapeTitular: "Pollería El Pollón",
  pagoPlin: true, plinQR: "", plinNum: "999 999 999", plinTitular: "Pollería El Pollón",
  pagoTransf: false, cuentas: [], contraEntrega: true, pagoOCR: true,
  redes: { facebook: "", instagram: "", tiktok: "" }
};

/* ---------- Fotos reales de ejemplo (Wikimedia Commons, licencias libres CC BY / CC BY-SA) ----------
   Se ven al instante. Cuando tengas tus propias fotos, súbelas desde el panel (Carta y precios). */
window.PL_FOTO = (f, w = 640) => "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(f) + "?width=" + w;
window.PL_FOTOS = {
  productos: {
    "p-14": "Un_cuarto_de_Pollo_a_la_Brasa.JPG", "p-12": "Pollo_a_la_brasa_pierna_con_papas.JPG", "p-1": "Pollo_a_la_brasa_peruano.jpg",
    "c-fam": "Pollo_a_la_brasa_para_llevar.JPG", "c-duo": "Pollo_a_la_brasa_Lima_Peru.jpg", "c-parri": "Parrillada.jpg",
    "pa-bife": "Bife_de_chorizo_a_punto_02.jpg", "pa-mix": "Parrilla_Mixta.JPG", "pa-anti": "Anticucho_del_Perú.JPG", "pa-chuleta": "Lomo_de_cerdo_a_la_brasa.jpg",
    "b-broaster": "Fried-Chicken-Set.jpg", "b-alitas": "BBQ_chicken_wing.jpg",
    "g-papas": "Papas_fritas_(plato).jpg", "g-chaufa": "Arroz_chaufa.JPG", "g-ensalada": "Ensalada-mixta-lechuga-huevo-tomates-cebolla-maiz-remolacha-restaurante-chipiona.JPG", "g-platano": "Platano_frito.JPG",
    "be-inca": "IncaKolaBottleGlass.jpg", "be-coca": "Coca-Cola_Bottle.jpeg", "be-chicha": "Chicha_Morada_2017.jpg", "be-limonada": "Glass_of_lemonade.jpg", "be-agua": "Glass_of_cold_mineral_water.jpg",
    "po-mazamorra": "Mazamorra_morada.JPG", "po-arroz": "Arroz_con_leche_estilo_peruano.jpg", "po-combinado": "Vasos_de_mazamorra_morada_y_arroz_con_leche.jpg"
  },
  categorias: { pollos: "Pollo_a_la_brasa_peruano.jpg", combos: "Pollo_a_la_brasa_para_llevar.JPG", parrillas: "Parrillada.jpg", broaster: "Fried-Chicken-Set.jpg",
    guarniciones: "Papas_fritas_(plato).jpg", bebidas: "IncaKolaBottleGlass.jpg", postres: "Vasos_de_mazamorra_morada_y_arroz_con_leche.jpg" }
};

window.PL_SEMILLA = function () {
  const db = { ajustes: { general: JSON.parse(JSON.stringify(window.PL_AJUSTES)) }, categorias: {}, productos: {}, zonas: {}, pedidos: {}, capturas: {}, movimientos: {}, clientes: {} };
  const C = [["pollos", "Pollos a la brasa", "🍗"], ["combos", "Combos familiares", "🎉"], ["parrillas", "Parrillas", "🥩"], ["broaster", "Broaster y alitas", "🍖"],
    ["guarniciones", "Guarniciones", "🍟"], ["bebidas", "Bebidas", "🥤"], ["postres", "Postres", "🍮"]];
  C.forEach(([id, nombre, icono], i) => db.categorias[id] = { nombre, icono, orden: i, foto: window.PL_FOTO(window.PL_FOTOS.categorias[id], 300) });
  // Opciones reutilizables
  const parte = { id: "parte", titulo: "Parte del pollo", tipo: "uno", req: true, items: [{ n: "Pierna" }, { n: "Pecho" }, { n: "Ala" }] };
  const papas = { id: "papas", titulo: "Acompañamiento", tipo: "uno", req: true, items: [{ n: "Papas fritas" }, { n: "Papas al hilo" }, { n: "Mitad papas, mitad ensalada" }, { n: "Cambiar por chaufa", p: 3 }] };
  const ensalada = { id: "ensalada", titulo: "Ensalada", tipo: "uno", req: false, items: [{ n: "Ensalada clásica" }, { n: "Ensalada de la casa", p: 2 }, { n: "Sin ensalada" }] };
  const termino = { id: "termino", titulo: "Término de la carne", tipo: "uno", req: true, items: [{ n: "Jugoso" }, { n: "A punto" }, { n: "Bien cocido" }] };
  const extras = { id: "extras", titulo: "Agrega", tipo: "varios", req: false, items: [{ n: "Porción extra de papas", p: 6 }, { n: "Huevo frito", p: 2 }, { n: "Plátano frito", p: 4 }, { n: "Chorizo", p: 6 }] };
  const tamBeb = { id: "tam", titulo: "Tamaño", tipo: "uno", req: true, items: [{ n: "Personal 500 ml" }, { n: "1 litro", p: 3 }, { n: "1.5 litros", p: 5.5 }] };
  const P = [
    ["p-14", "1/4 de pollo a la brasa", "pollos", 18.9, "Con papas fritas y ensalada fresca. Incluye cremas.", [parte, papas, ensalada, extras], 1],
    ["p-12", "1/2 pollo a la brasa", "pollos", 35.9, "Medio pollo jugoso al carbón con papas y ensalada.", [papas, ensalada, extras], 1],
    ["p-1", "1 pollo a la brasa", "pollos", 64.9, "Pollo entero para compartir, con papas familiares y ensalada.", [papas, ensalada, extras], 1],
    ["c-fam", "Combo familiar El Pollón", "combos", 79.9, "1 pollo + papas familiares + ensalada + chaufa + gaseosa 1.5 L.", [ensalada], 1],
    ["c-duo", "Combo dúo", "combos", 42.9, "1/2 pollo + papas + ensalada + 2 gaseosas personales.", [ensalada], 0],
    ["c-parri", "Parrilla familiar para 4", "combos", 129.9, "Bife, pollo, chorizo, anticucho, papas, ensalada y 4 bebidas.", [termino], 1],
    ["pa-bife", "Bife a la parrilla", "parrillas", 39.9, "Bife de 300 g al carbón con papas y ensalada.", [termino, papas, extras], 1],
    ["pa-mix", "Parrilla mixta personal", "parrillas", 44.9, "Carne, pollo, chorizo y anticucho con papas y ensalada.", [termino, papas], 0],
    ["pa-anti", "Anticuchos (2 palitos)", "parrillas", 19.9, "Anticuchos de corazón con papa dorada y choclo.", [], 0],
    ["pa-chuleta", "Chuleta de cerdo", "parrillas", 29.9, "Chuleta a la parrilla con papas y ensalada.", [papas], 0],
    ["b-broaster", "Pollo broaster (2 piezas)", "broaster", 19.9, "Crocante por fuera, jugoso por dentro, con papas.", [parte, papas], 0],
    ["b-alitas", "Alitas BBQ (8 unid.)", "broaster", 24.9, "Bañadas en salsa BBQ, acevichadas o picantes.", [{ id: "salsa", titulo: "Salsa", tipo: "uno", req: true, items: [{ n: "BBQ" }, { n: "Acevichada" }, { n: "Picante" }] }, papas], 1],
    ["g-papas", "Papas fritas familiares", "guarniciones", 12, "Para compartir.", [], 0],
    ["g-chaufa", "Arroz chaufa", "guarniciones", 10, "Porción para 2.", [], 0],
    ["g-ensalada", "Ensalada de la casa", "guarniciones", 9, "Lechuga, tomate, pepino, palta y choclo.", [], 0],
    ["g-platano", "Plátano frito", "guarniciones", 6, "Porción.", [], 0],
    ["be-inca", "Inca Kola", "bebidas", 4, "Bien helada.", [tamBeb], 0],
    ["be-coca", "Coca-Cola", "bebidas", 4, "Bien helada.", [tamBeb], 0],
    ["be-chicha", "Chicha morada", "bebidas", 6, "Natural, hecha en casa.", [{ id: "tam", titulo: "Tamaño", tipo: "uno", req: true, items: [{ n: "Vaso" }, { n: "Jarra 1 L", p: 8 }] }], 0],
    ["be-limonada", "Limonada", "bebidas", 6, "Natural o frozen.", [{ id: "tipo", titulo: "Tipo", tipo: "uno", req: true, items: [{ n: "Natural" }, { n: "Frozen", p: 2 }] }, { id: "tam", titulo: "Tamaño", tipo: "uno", req: true, items: [{ n: "Vaso" }, { n: "Jarra 1 L", p: 8 }] }], 0],
    ["be-agua", "Agua mineral", "bebidas", 3, "Sin gas o con gas.", [{ id: "gas", titulo: "Tipo", tipo: "uno", req: true, items: [{ n: "Sin gas" }, { n: "Con gas" }] }], 0],
    ["po-mazamorra", "Mazamorra morada", "postres", 6, "Casera.", [], 0],
    ["po-arroz", "Arroz con leche", "postres", 6, "Casero.", [], 0],
    ["po-combinado", "Clásico combinado", "postres", 8, "Mazamorra + arroz con leche.", [], 0]
  ];
  P.forEach(([id, nombre, cat, precio, desc, opciones, destacado], i) => {
    db.productos[id] = { nombre, cat, precio, desc, opciones, destacado: !!destacado, activo: true, agotado: false, foto: window.PL_FOTOS.productos[id] ? window.PL_FOTO(window.PL_FOTOS.productos[id]) : "", orden: i,
      sugerirBebida: !["bebidas", "postres"].includes(cat), cremas: ["pollos", "combos", "parrillas", "broaster"].includes(cat) };
  });
  [["z1", "Cercado (hasta 2 km)", 5], ["z2", "Zona 2 (2 a 4 km)", 8], ["z3", "Zona 3 (4 a 6 km)", 12]].forEach(([id, nombre, costo], i) => db.zonas[id] = { nombre, costo, activo: true, orden: i });
  if (window.PL_DEMO_DATOS !== false) {
    const h = n => new Date(Date.now() - n * 60e3).toISOString();
    db.pedidos["PL-DEMO1"] = { codigo: "PL-DEMO1", items: [{ id: "p-12", n: "1/2 pollo a la brasa", cant: 1, precio: 35.9, opts: "Papas fritas · Ensalada clásica", cremas: "Mayonesa, Ají de la casa" }, { id: "be-inca", n: "Inca Kola", cant: 1, precio: 7, opts: "1 litro" }],
      subtotal: 42.9, envio: 5, total: 47.9, entrega: "delivery", zona: "Cercado (hasta 2 km)", direccion: "Jr. Las Flores 456", referencia: "Puerta verde", nombre: "Carla Díaz", celular: "987111222",
      pago: "Efectivo", pagaCon: 50, nota: "", estado: "nuevo", origen: "web", creado: h(3) };
    db.pedidos["PL-DEMO2"] = { codigo: "PL-DEMO2", items: [{ id: "c-fam", n: "Combo familiar El Pollón", cant: 1, precio: 79.9, opts: "Ensalada de la casa", cremas: "Mayonesa, Huancaína" }],
      subtotal: 79.9, envio: 0, total: 79.9, entrega: "recojo", nombre: "Pedro Ruiz", celular: "987333444", pago: "Yape", operacion: "12345678", montoLeido: 79.9, coincide: true, estado: "por-validar", origen: "web", creado: h(6) };
    db.capturas["PL-DEMO2"] = { pedido: "PL-DEMO2", captura: "" };
  }
  return db;
};
