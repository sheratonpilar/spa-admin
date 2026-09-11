(function () {
  'use strict';

  // ⚠️ Completá esto con la URL de tu implementación de Apps Script (termina en /exec).
  var API_URL = 'https://script.google.com/macros/s/AKfycbxHHrSJO9ZhYkY0qkFamg5pujlEYoKm0qWNlt-t_ZXIyMpowv-nBsaWIbm9-0Ons8Mf/exec/exec';

  var productos = [];
  var secciones = [];
  var trProductoActual = null;

  // ---------------- Clave de edición ----------------
  function getClave() {
    var k = localStorage.getItem('spa_admin_key');
    if (!k) {
      k = prompt('Ingresá la clave de edición del panel:');
      if (k) localStorage.setItem('spa_admin_key', k);
    }
    return k || '';
  }
  document.getElementById('btnClave').addEventListener('click', function () {
    localStorage.removeItem('spa_admin_key');
    var k = prompt('Nueva clave de edición del panel:');
    if (k) { localStorage.setItem('spa_admin_key', k); toast('Clave guardada.'); }
  });

  // ---------------- Helpers de API ----------------
  async function apiGet(action, params) {
    var url = new URL(API_URL);
    url.searchParams.set('action', action);
    Object.keys(params || {}).forEach(function (k) { url.searchParams.set(k, params[k]); });
    var res = await fetch(url.toString());
    var json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Error desconocido');
    return json.data;
  }

  async function apiPost(action, datos) {
    var payload = Object.assign({ action: action, clave: getClave() }, datos);
    var res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita el preflight CORS que Apps Script no responde
      body: JSON.stringify(payload)
    });
    var json = await res.json();
    if (!json.ok) {
      if (json.error === 'Clave incorrecta.') localStorage.removeItem('spa_admin_key');
      throw new Error(json.error || 'Error desconocido');
    }
    return json.data;
  }

  function toast(msg, esError) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show' + (esError ? ' err' : '');
    setTimeout(function () { t.className = 'toast'; }, 2600);
  }

  function abrir(id) { document.getElementById(id).classList.add('open'); }
  function cerrar(id) { document.getElementById(id).classList.remove('open'); }
  document.querySelectorAll('[data-cerrar]').forEach(function (b) {
    b.addEventListener('click', function () { cerrar(b.getAttribute('data-cerrar')); });
  });

  // ---------------- Carga inicial ----------------
  async function cargarTodo() {
    try {
      productos = await apiGet('productos');
      renderTabla(); llenarFiltro();
    } catch (e) { toast('Error cargando productos: ' + e.message, true); }

    try {
      secciones = await apiGet('secciones');
      llenarSelectCategoria();
    } catch (e) { toast('Error cargando categorías: ' + e.message, true); }

    try {
      var s = await apiGet('stats');
      document.getElementById('statActivos').textContent = s.activos;
      document.getElementById('statCategorias').textContent = s.categorias;
      document.getElementById('statActualizado').textContent = s.actualizado;
    } catch (e) { /* no bloqueante */ }
  }

  function llenarFiltro() {
    var sel = document.getElementById('filtroCategoria');
    var actuales = {};
    productos.forEach(function (p) { actuales[p.seccion_id] = p.seccion_nombre; });
    sel.innerHTML = '<option value="">Todas las categorías</option>';
    Object.keys(actuales).sort().forEach(function (id) {
      var o = document.createElement('option'); o.value = id; o.textContent = actuales[id];
      sel.appendChild(o);
    });
  }

  function llenarSelectCategoria() {
    var sel = document.getElementById('npCategoria');
    sel.innerHTML = '';
    secciones.forEach(function (s) {
      var o = document.createElement('option'); o.value = s.seccion_id; o.textContent = s.nombre;
      sel.appendChild(o);
    });
  }

  function normalizar(s) { return (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }

  // ---------------- Tabla ----------------
  function renderTabla() {
    var tbody = document.getElementById('tbody');
    tbody.innerHTML = '';
    productos.forEach(function (p) {
      var tr = document.createElement('tr');
      tr.dataset.buscar = normalizar(p.nombre + ' ' + p.seccion_nombre);
      tr.dataset.categoria = p.seccion_id;

      var tdCat = document.createElement('td'); tdCat.className = 'cat-badge'; tdCat.textContent = p.seccion_nombre;
      var tdNombre = document.createElement('td'); tdNombre.textContent = p.nombre;

      var tdPrecio = document.createElement('td');
      var inputPrecio = document.createElement('input');
      inputPrecio.className = 'precio-input'; inputPrecio.type = 'text';
      inputPrecio.value = p.precio !== '' ? p.precio : (p.precio_anterior || '');
      tdPrecio.appendChild(inputPrecio);

      var tdDisp = document.createElement('td');
      var label = document.createElement('label'); label.className = 'toggle';
      var chk = document.createElement('input'); chk.type = 'checkbox'; chk.checked = p.disponible;
      var track = document.createElement('span'); track.className = 'track';
      label.appendChild(chk); label.appendChild(track);
      tdDisp.appendChild(label);

      var tdAcc = document.createElement('td');
      var acc = document.createElement('div'); acc.className = 'row-actions';
      var btnGuardar = document.createElement('button'); btnGuardar.className = 'btn'; btnGuardar.textContent = 'Guardar';
      var estado = document.createElement('span'); estado.className = 'status';
      acc.appendChild(btnGuardar); acc.appendChild(estado);

      var menuWrap = document.createElement('div'); menuWrap.className = 'row-menu';
      var menuBtn = document.createElement('button'); menuBtn.type = 'button'; menuBtn.className = 'row-menu-btn'; menuBtn.textContent = '⋮';
      var dropdown = document.createElement('div'); dropdown.className = 'row-menu-dropdown';
      var optTrad = document.createElement('button'); optTrad.type = 'button'; optTrad.textContent = 'Editar traducciones';
      var optDesc = document.createElement('button'); optDesc.type = 'button'; optDesc.textContent = 'Editar descripción';
      var optDel = document.createElement('button'); optDel.type = 'button'; optDel.className = 'danger'; optDel.textContent = 'Eliminar producto';
      dropdown.appendChild(optTrad); dropdown.appendChild(optDesc); dropdown.appendChild(optDel);
      menuWrap.appendChild(menuBtn); menuWrap.appendChild(dropdown);
      acc.appendChild(menuWrap);
      tdAcc.appendChild(acc);

      btnGuardar.addEventListener('click', async function () {
        estado.textContent = 'Guardando…'; estado.className = 'status';
        try {
          await apiPost('guardar_precio', { producto_id: p.producto_id, precio: inputPrecio.value });
          estado.textContent = 'Guardado ✓'; estado.className = 'status ok';
          p.precio = inputPrecio.value; p.disponible = true;
          setTimeout(function () { estado.textContent = ''; }, 2000);
        } catch (e) {
          estado.textContent = 'Error'; estado.className = 'status err';
          toast(e.message, true);
        }
      });

      chk.addEventListener('change', async function () {
        var nuevoValor = chk.checked;
        estado.textContent = 'Guardando…'; estado.className = 'status';
        try {
          await apiPost('guardar_disponible', { producto_id: p.producto_id, disponible: nuevoValor });
          p.disponible = nuevoValor;
          estado.textContent = 'Guardado ✓'; estado.className = 'status ok';
          setTimeout(function () { estado.textContent = ''; }, 2000);
        } catch (e) {
          chk.checked = !nuevoValor; estado.textContent = 'Error'; estado.className = 'status err';
          toast(e.message, true);
        }
      });

      menuBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        document.querySelectorAll('.row-menu-dropdown.open').forEach(function (d) { if (d !== dropdown) d.classList.remove('open'); });
        dropdown.classList.toggle('open');
      });
      optTrad.addEventListener('click', function () { dropdown.classList.remove('open'); abrirTraducciones(p); });
      optDesc.addEventListener('click', function () { dropdown.classList.remove('open'); abrirEspanol(p); });
      optDel.addEventListener('click', function () { dropdown.classList.remove('open'); eliminarProductoUI(p); });

      tr.appendChild(tdCat); tr.appendChild(tdNombre); tr.appendChild(tdPrecio); tr.appendChild(tdDisp); tr.appendChild(tdAcc);
      tbody.appendChild(tr);
    });
    aplicarFiltros();
  }

  document.addEventListener('click', function () {
    document.querySelectorAll('.row-menu-dropdown.open').forEach(function (d) { d.classList.remove('open'); });
  });

  function aplicarFiltros() {
    var q = normalizar(document.getElementById('buscar').value.trim());
    var cat = document.getElementById('filtroCategoria').value;
    document.querySelectorAll('#tbody tr').forEach(function (tr) {
      var matchTexto = !q || tr.dataset.buscar.indexOf(q) >= 0;
      var matchCat = !cat || tr.dataset.categoria === cat;
      tr.classList.toggle('is-hidden', !(matchTexto && matchCat));
    });
  }
  document.getElementById('buscar').addEventListener('input', aplicarFiltros);
  document.getElementById('filtroCategoria').addEventListener('change', aplicarFiltros);

  // ---------------- Nuevo producto ----------------
  document.getElementById('btnNuevoProducto').addEventListener('click', function () {
    document.getElementById('npNombre').value = '';
    document.getElementById('npDescripcion').value = '';
    document.getElementById('npPrecio').value = '';
    document.getElementById('npError').textContent = '';
    abrir('modalProducto');
  });
  document.getElementById('npGuardar').addEventListener('click', async function () {
    var datos = {
      seccion_id: document.getElementById('npCategoria').value,
      nombre: document.getElementById('npNombre').value.trim(),
      descripcion: document.getElementById('npDescripcion').value.trim(),
      precio: document.getElementById('npPrecio').value.trim()
    };
    if (!datos.nombre || !datos.precio) {
      document.getElementById('npError').textContent = 'Completá nombre y precio.'; return;
    }
    try {
      await apiPost('crear_producto', { datos: datos });
      cerrar('modalProducto'); toast('Producto creado.'); cargarTodo();
    } catch (e) { document.getElementById('npError').textContent = e.message; }
  });

  // ---------------- Nueva categoría ----------------
  document.getElementById('btnNuevaCategoria').addEventListener('click', function () {
    document.getElementById('ncNombre').value = '';
    document.getElementById('ncNota').value = '';
    document.getElementById('ncError').textContent = '';
    abrir('modalCategoria');
  });
  document.getElementById('ncGuardar').addEventListener('click', async function () {
    var datos = { nombre: document.getElementById('ncNombre').value.trim(), nota: document.getElementById('ncNota').value.trim() };
    if (!datos.nombre) { document.getElementById('ncError').textContent = 'Completá el nombre.'; return; }
    try {
      await apiPost('crear_seccion', { datos: datos });
      cerrar('modalCategoria'); toast('Categoría creada.'); cargarTodo();
    } catch (e) { document.getElementById('ncError').textContent = e.message; }
  });

  // ---------------- Traducciones ----------------
  async function abrirTraducciones(p) {
    trProductoActual = p.producto_id;
    document.getElementById('trNombreProducto').textContent = p.nombre;
    document.getElementById('trError').textContent = '';
    document.getElementById('trNombreEn').value = '';
    document.getElementById('trDescEn').value = '';
    document.getElementById('trNombrePt').value = '';
    document.getElementById('trDescPt').value = '';
    abrir('modalTraducciones');
    try {
      var datos = await apiGet('traducciones', { producto_id: p.producto_id });
      document.getElementById('trNombreEn').value = datos.nombre_en || '';
      document.getElementById('trDescEn').value = datos.descripcion_en || '';
      document.getElementById('trNombrePt').value = datos.nombre_pt || '';
      document.getElementById('trDescPt').value = datos.descripcion_pt || '';
    } catch (e) { toast(e.message, true); cerrar('modalTraducciones'); }
  }
  document.getElementById('trGuardar').addEventListener('click', async function () {
    var datos = {
      nombre_en: document.getElementById('trNombreEn').value.trim(),
      descripcion_en: document.getElementById('trDescEn').value.trim(),
      nombre_pt: document.getElementById('trNombrePt').value.trim(),
      descripcion_pt: document.getElementById('trDescPt').value.trim()
    };
    try {
      await apiPost('guardar_traducciones', { producto_id: trProductoActual, datos: datos });
      cerrar('modalTraducciones'); toast('Traducciones guardadas.');
    } catch (e) { document.getElementById('trError').textContent = e.message; }
  });

  // ---------------- Editar descripción (español) ----------------
  async function abrirEspanol(p) {
    trProductoActual = p.producto_id;
    document.getElementById('esError').textContent = '';
    document.getElementById('esNombre').value = p.nombre || '';
    document.getElementById('esDescripcion').value = '';
    abrir('modalEspanol');
    try {
      var datos = await apiGet('info_espanol', { producto_id: p.producto_id });
      document.getElementById('esNombre').value = datos.nombre || '';
      document.getElementById('esDescripcion').value = datos.descripcion || '';
    } catch (e) { toast(e.message, true); cerrar('modalEspanol'); }
  }
  document.getElementById('esGuardar').addEventListener('click', async function () {
    var datos = {
      nombre: document.getElementById('esNombre').value.trim(),
      descripcion: document.getElementById('esDescripcion').value.trim()
    };
    if (!datos.nombre) { document.getElementById('esError').textContent = 'El nombre no puede quedar vacío.'; return; }
    try {
      await apiPost('guardar_info_espanol', { producto_id: trProductoActual, datos: datos });
      cerrar('modalEspanol'); toast('Guardado.'); cargarTodo();
    } catch (e) { document.getElementById('esError').textContent = e.message; }
  });

  // ---------------- Eliminar producto ----------------
  async function eliminarProductoUI(p) {
    if (!confirm('¿Eliminar "' + p.nombre + '"? Esta acción no se puede deshacer.')) return;
    try {
      await apiPost('eliminar_producto', { producto_id: p.producto_id });
      toast('Producto eliminado.'); cargarTodo();
    } catch (e) { toast(e.message, true); }
  }

  // ---------------- Historial ----------------
  document.getElementById('btnHistorial').addEventListener('click', async function () {
    var tbody = document.getElementById('tbodyHistorial');
    tbody.innerHTML = '<tr><td colspan="5">Cargando…</td></tr>';
    abrir('modalHistorial');
    try {
      var filas = await apiGet('historial', { limite: 100 });
      tbody.innerHTML = '';
      if (!filas.length) { tbody.innerHTML = '<tr><td colspan="5">Todavía no hay cambios registrados.</td></tr>'; return; }
      filas.forEach(function (f) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + f.fecha + '</td><td>' + f.producto_nombre + '</td><td>' + f.precio_anterior +
          '</td><td>' + f.precio_nuevo + '</td><td>' + (f.usuario || '—') + '</td>';
        tbody.appendChild(tr);
      });
    } catch (e) { tbody.innerHTML = '<tr><td colspan="5">Error: ' + e.message + '</td></tr>'; }
  });

  // ---------------- Exportar / Importar Excel ----------------
  document.getElementById('btnExportar').addEventListener('click', function () {
    var filas = productos.map(function (p) {
      return { producto_id: p.producto_id, categoria: p.seccion_nombre, producto: p.nombre, precio_actual: p.precio || '', precio_nuevo: '' };
    });
    var ws = XLSX.utils.json_to_sheet(filas);
    ws['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 40 }, { wch: 14 }, { wch: 14 }];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'precios');
    XLSX.writeFile(wb, 'precios_spa_' + new Date().toISOString().slice(0, 10) + '.xlsx');
    toast('Completá "precio_nuevo" (o escribí BAJA) y volvé a importarlo.');
  });

  document.getElementById('inputImportar').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = async function (evt) {
      var wb = XLSX.read(new Uint8Array(evt.target.result), { type: 'array' });
      var hoja = wb.Sheets[wb.SheetNames[0]];
      var filas = XLSX.utils.sheet_to_json(hoja, { defval: '' });
      var cambios = filas
        .filter(function (f) { return f.producto_id && String(f.precio_nuevo).trim() !== ''; })
        .map(function (f) { return { producto_id: f.producto_id, precio: f.precio_nuevo }; });
      if (!cambios.length) { toast('No encontramos filas con "precio_nuevo" completo.', true); return; }
      try {
        var r = await apiPost('actualizar_masivo', { cambios: cambios });
        toast(r.aplicados + ' precio(s) actualizados' + (r.errores.length ? ', ' + r.errores.length + ' con error' : '') + '.', r.errores.length > 0);
        if (r.errores.length) console.warn(r.errores);
        cargarTodo();
      } catch (err) { toast('Error importando: ' + err.message, true); }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  });

  cargarTodo();
})();
