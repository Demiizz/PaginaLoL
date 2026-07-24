# Torneo de LoL — Sitio + Panel de administrador

Sitio 100% estático (HTML + CSS + JS puro), sin backend ni base de datos, listo para **GitHub Pages**.

## Estructura

```
/
├── index.html          → sitio público (solo lectura)
├── admin.html           → panel de administrador (privado)
├── data.json             → "base de datos" publicada que lee el sitio público
├── css/
│   ├── style.css         → diseño del sitio público (y base compartida)
│   └── admin.css         → estilos exclusivos del panel admin
├── js/
│   ├── data.js           → guardado/carga (localStorage + data.json), export/import
│   ├── draw.js            → motor del sorteo (animación y sonido)
│   ├── schedule.js       → generación del calendario todos-contra-todos
│   ├── standings.js       → cálculo automático de la clasificación
│   ├── bracket.js         → lógica del bracket (Top 8 automático)
│   ├── app.js             → pinta el sitio público (solo lectura)
│   └── admin.js           → controla todo el panel de administrador
└── assets/
    ├── logos/, sounds/, images/
```

## Cómo funciona sin backend (con nube gratis)

`admin.html` guarda todo tu progreso en el `localStorage` de tu navegador
(por las dudas, como respaldo offline) y además sincroniza cada cambio a un
**bin gratuito de [jsonbin.io](https://jsonbin.io)**. `index.html` lee ese
mismo bin, así que el público ve tus cambios apenas los guardás — sin pasos manuales.

### Configurar JSONBin (una sola vez)

1. Creá una cuenta gratis en https://jsonbin.io (plan Free: 10.000 requests/mes, sin tarjeta).
2. Creá un **Bin** nuevo con este contenido inicial:
   ```json
   {"version":1,"updatedAt":null,"teams":[],"groups":null,"schedule":null,"results":{},"bracket":null}
   ```
3. En la configuración del bin, marcalo como **"Public"** (para que `index.html`
   pueda leerlo sin ninguna key).
4. Copiá el **Bin ID** y pegalo en `js/config.js`:
   ```js
   const JSONBIN_ID = "tu-bin-id-acá";
   ```
   Este archivo sí se sube al repo — el Bin ID no es secreto, solo permite leer.
5. Copiá tu **Master Key** (Account → API Keys) y pegala en el panel
   "☁️ Conexión con la nube" dentro de `admin.html`, apretá "Guardar key".
   Esa key queda solo en el localStorage de tu navegador — **no la subas nunca al repo**.

Listo: a partir de ahí, todo lo que hagas en `admin.html` (sorteo, resultados,
bracket) se sincroniza solo. Si abrís `admin.html` en otra compu, con solo
pegar la Master Key en esa también, sigue donde quedó.

### Si preferís no usar ninguna cuenta

El sistema sigue funcionando sin JSONBin configurado: `admin.html` guarda todo
en localStorage igual, y tenés un botón **"Exportar data.json"** para bajar el
archivo y reemplazarlo a mano en el repo (con `"Importar data.json"` para
retomarlo en otro navegador). Es más manual, pero cero configuración.

## Publicar en GitHub Pages

1. Subí toda esta carpeta a un repositorio de GitHub.
2. Activá GitHub Pages (Settings → Pages → rama `main`, carpeta `/root`).
3. Compartí la URL de `index.html` con los jugadores/espectadores.
4. Guardá la URL de `admin.html` para vos (no está protegida con contraseña:
   cualquiera que sepa la URL exacta podría editar. Si te importa, lo más simple
   es no publicar el link de `admin.html`, o restringirlo con una regla de acceso
   del lado de tu hosting).

## Notas de diseño

- El torneo no admite empates (LoL siempre tiene ganador), así que el
  formulario de resultados rechaza marcadores iguales.
- Puntaje: 3 puntos por victoria. Desempate: puntos → diferencia de juegos → PG.
- El bracket cruza así: A1 vs B4, A2 vs B3, B1 vs A4, B2 vs A3.
- El bracket se puede generar en cualquier momento con el Top 4 actual de cada
  grupo (no espera a que termine la fase de grupos), y "Rehacer bracket" lo
  vuelve a armar si cambiaron los resultados.
