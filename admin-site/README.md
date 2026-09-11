# Health & Spa — Panel de Administración (GitHub Pages + Apps Script API)

Panel visual hosteado en GitHub Pages. Habla con tu Google Sheet a través del
mismo Apps Script de siempre (`Admin.gs`), que ahora funciona como una API
(devuelve JSON) en vez de servir la página HTML.

No reemplaza `Codigo_Spa.gs` (el que publica la carta pública) — eso sigue
exactamente igual, en el mismo proyecto de Apps Script, sin tocar nada.

## 1) Actualizar el Apps Script

En el mismo proyecto de siempre (el de tu Google Sheet ▸ Extensiones ▸ Apps Script):

1. Reemplazá el contenido de `Admin.gs` por la versión nueva que te pasé (ahora
   tiene `doGet`/`doPost` devolviendo JSON en vez de servir HTML).
2. Podés borrar el archivo HTML `AdminUI` — ya no se usa.
3. **Configurá la clave de edición** (nunca va en el código, para que no quede
   expuesta en GitHub): Configuración del proyecto (ícono de engranaje) ▸
   Propiedades del script ▸ Agregar propiedad del script:
   - Propiedad: `CLAVE_ADMIN`
   - Valor: la clave que quieras (algo largo y no obvio, ej. una frase)
4. Implementar ▸ Gestionar implementaciones ▸ ✏️ editar ▸ Versión: Nueva
   versión ▸ Implementar. **Importante**: en "Quién tiene acceso" tiene que
   decir **Cualquier usuario** (Anyone) — si dice "Solo yo" o restringido a
   cuentas específicas, el sitio en GitHub no va a poder llamarlo.
5. Copiá la URL que termina en `/exec` — la vas a necesitar en el paso 3.

Las **lecturas** (ver productos, categorías, stats, historial) quedan abiertas
sin clave — son los mismos datos que ya son públicos en la carta. Las
**escrituras** (guardar precio, crear/eliminar producto, etc.) piden la clave
de `CLAVE_ADMIN` en cada pedido.

## 2) Crear el repo nuevo en GitHub

Creá un repo nuevo (ej. `spa-admin`), separado del repo de la carta pública.
Subí el contenido de esta carpeta tal cual (`index.html`, `assets/`) a la raíz.

Settings ▸ Pages ▸ Deploy from branch ▸ rama y carpeta `/root`.

## 3) Conectar el panel con tu Apps Script

Abrí `assets/js/admin.js` y en la primera línea útil reemplazá:

```js
var API_URL = 'PEGA_ACA_LA_URL_DE_TU_APPS_SCRIPT/exec';
```

por la URL que copiaste en el paso 1.5. Subí ese cambio al repo.

## 4) Usar el panel

Entrá a `https://<tu-usuario>.github.io/spa-admin/`. La primera vez que
intentes guardar algo, te va a pedir la clave — la que pusiste en
`CLAVE_ADMIN`. Se guarda en el navegador (no hace falta escribirla de nuevo
cada vez), y podés cambiarla con el botón "🔑 Clave de edición" de la barra
lateral.

## Notas de seguridad

- El repo puede ser público o privado — no cambia mucho: la URL de GitHub
  Pages siempre es pública una vez publicada, así que cualquiera que la
  encuentre puede *ver* el panel y los datos de lectura. Lo que protege la
  clave es la posibilidad de **escribir** (cambiar precios, borrar productos).
- Si sospechás que la clave se filtró, cambiala en Propiedades del script
  (Apps Script) — no hace falta redeployar nada, se aplica al toque.
- Como siempre: los cambios en el panel no salen solos a la carta pública —
  seguís necesitando correr **Cartas ▸ Publicar** en el Sheet.
