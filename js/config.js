/* =========================================================
   config.js — Configuración pública del almacenamiento en la nube
   ---------------------------------------------------------
   JSONBIN_ID identifica tu "base de datos" en jsonbin.io.
   NO es secreto: solo permite LEER (si el bin está marcado
   como público). Para escribir hace falta la Master Key,
   que se carga aparte solo en admin.html y nunca va acá.

   Cómo conseguir el JSONBIN_ID:
   1. Entrá a https://jsonbin.io y creá una cuenta gratis.
   2. Creá un "Bin" nuevo con este contenido inicial:
        {"version":1,"updatedAt":null,"teams":[],"groups":null,
         "schedule":null,"results":{},"bracket":null}
   3. En la configuración del bin, marcalo como "Public" (para que
      index.html pueda leerlo sin key).
   4. Copiá el "Bin ID" y pegalo abajo, entre las comillas.
   ========================================================= */

const JSONBIN_ID = "6a633304da38895dfe8923ac"; // ej: "6620abcf1234567890abcd12"

/* =========================================================
   Twitch — embed en vivo del stream
   ---------------------------------------------------------
   100% del lado del cliente: es un <iframe> que apunta a los
   servidores de Twitch. NO usa JSONBin ni consume nada de esa
   cuota gratis — son sistemas totalmente separados.

   TWITCH_CHANNEL: tu usuario de Twitch (el de twitch.tv/usuario).

   TWITCH_PARENT_DOMAINS: Twitch EXIGE declarar acá el dominio
   exacto donde se va a mostrar el embed, si no, no carga.
   Agregá el/los dominios donde publiques el sitio (sin "https://"
   ni "/" al final). Dejamos "localhost" y "127.0.0.1" para que
   funcione también mientras probás el sitio en tu compu.

   Ejemplos según cómo publiques en GitHub Pages:
     - Pages de usuario/organización (repo llamado usuario.github.io):
         "tuusuario.github.io"
     - Pages de un repo cualquiera (usuario.github.io/nombre-repo):
         seguí usando "tuusuario.github.io" (el path no cuenta,
         Twitch solo mira el dominio)
     - Dominio propio conectado a GitHub Pages: ese dominio, ej
         "mitorneo.com"
   ========================================================= */
const TWITCH_CHANNEL = "notjorgew";
const TWITCH_PARENT_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "demiizz.github.io", // 👈 reemplazá esto por tu dominio real de GitHub Pages
];

/* =========================================================
   Discord — link de invitación al servidor
   ========================================================= */
const DISCORD_INVITE = "https://discord.gg/CpDXJxTp8W";
