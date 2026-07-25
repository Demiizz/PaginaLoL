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
   TEAM_COUNT — cantidad total de equipos del torneo.
   Tiene que ser un número par (se reparte en 2 grupos iguales).
   Todo lo demás (sorteo, calendario, validaciones) se adapta
   solo a partir de este número.
   ========================================================= */
const TEAM_COUNT = 22;
