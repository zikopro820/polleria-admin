/* =========================================================
   CONFIGURACIÓN — Panel de Pollería El Pollón
   Si apiKey empieza con "PEGA", el panel funciona en MODO DEMO.
   ========================================================= */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyA_8kzGwf-WdNHHM1IfC9Ccp2fpmx2fwIs",
  authDomain: "polleria-7bac5.firebaseapp.com",
  projectId: "polleria-7bac5",
  storageBucket: "polleria-7bac5.firebasestorage.app",
  messagingSenderId: "947995956530",
  appId: "1:947995956530:web:e458ed169cc4efc4a9f32b"
};

window.APP = {
  web: "https://zikopro820.github.io/polleria",   // dirección de la web pública (enlaces de seguimiento)

  /* EQUIPO Y PERMISOS — cada persona entra con su correo (créalos en Firebase → Authentication).
     Administración → todo · Caja → pedidos, venta en local, carta, caja · Cocina → pedidos · Reparto → pedidos
     Usa los MISMOS correos en firestore.rules. */
  equipo: [
    { email: "admin@elpollon.pe", nombre: "Administración", rol: "Administración" },
    { email: "caja@elpollon.pe", nombre: "Caja", rol: "Caja" },
    { email: "cocina@elpollon.pe", nombre: "Cocina", rol: "Cocina" },
    { email: "reparto@elpollon.pe", nombre: "Reparto", rol: "Reparto" }
  ]
};
