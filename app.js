import { clienteSupabase } from './conexion.js';

// --- NAVEGACIÓN ENTRE TABS ---
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// --- 1. ARMADOR DE PC ---
const selectPlataforma = document.getElementById('selectPlataforma');
const pasosHardware = document.getElementById('pasosHardware');
const selectCpu = document.getElementById('selectCpu');
const selectMother = document.getElementById('selectMother');
const selectRam = document.getElementById('selectRam');
const selectGpu = document.getElementById('selectGpu');
const selectFuente = document.getElementById('selectFuente');
const selectGabinete = document.getElementById('selectGabinete');
const previewContainer = document.getElementById('previewContainer');
const alertaCompatibilidad = document.getElementById('alertaCompatibilidad');
const btnGuardarArmado = document.getElementById('btnGuardarArmado');
const mensajeArmador = document.getElementById('mensajeArmador');

let armadoActual = { plataforma: '', cpu: null, mother: null, ram: null, gpu: null, fuente: null, gabinete: null };

selectPlataforma.addEventListener('change', async (e) => {
  const plataforma = e.target.value;
  armadoActual.plataforma = plataforma;
  resetearArmador();
  if (plataforma) {
    pasosHardware.classList.add('enabled');
    selectCpu.disabled = false;
    alertaCompatibilidad.className = "alert-box success";
    alertaCompatibilidad.textContent = `Plataforma ${plataforma.toUpperCase()} activa. Elegí procesador.`;
    await cargarSelectSupabase('cpu', plataforma, selectCpu);
  } else {
    pasosHardware.classList.remove('enabled');
    alertaCompatibilidad.style.display = 'none';
  }
  actualizarPreview();
  validarArmado();
});

selectCpu.addEventListener('change', async (e) => {
  armadoActual.cpu = await obtenerObjetoSeleccionado(e.target.value);
  if (armadoActual.cpu) { selectMother.disabled = false; await cargarSelectSupabase('mother', armadoActual.plataforma, selectMother); }
  else { deshabilitarDesde('mother'); }
  actualizarPreview(); validarArmado();
});

selectMother.addEventListener('change', async (e) => {
  armadoActual.mother = await obtenerObjetoSeleccionado(e.target.value);
  if (armadoActual.mother) { 
    selectRam.disabled = false; 
    // CORRECCIÓN: Cargamos las RAMs de manera general (filtrando luego por DDR4/DDR5 si se desea)
    await cargarSelectGeneral('ram', selectRam); 
  }
  else { deshabilitarDesde('ram'); }
  actualizarPreview(); validarArmado();
});

selectRam.addEventListener('change', async (e) => {
  armadoActual.ram = await obtenerObjetoSeleccionado(e.target.value);
  if (armadoActual.ram) { selectGpu.disabled = false; await cargarSelectGeneral('gpu', selectGpu); }
  else { deshabilitarDesde('gpu'); }
  actualizarPreview(); validarArmado();
});

selectGpu.addEventListener('change', async (e) => {
  armadoActual.gpu = await obtenerObjetoSeleccionado(e.target.value);
  if (armadoActual.gpu) { selectFuente.disabled = false; await cargarSelectGeneral('fuente', selectFuente); }
  else { deshabilitarDesde('fuente'); }
  actualizarPreview(); validarArmado();
});

selectFuente.addEventListener('change', async (e) => {
  armadoActual.fuente = await obtenerObjetoSeleccionado(e.target.value);
  if (armadoActual.fuente) { selectGabinete.disabled = false; await cargarSelectGeneral('gabinete', selectGabinete); }
  else { deshabilitarDesde('gabinete'); }
  actualizarPreview(); validarArmado();
});

selectGabinete.addEventListener('change', async (e) => {
  armadoActual.gabinete = await obtenerObjetoSeleccionado(e.target.value);
  actualizarPreview(); validarArmado();
});

async function cargarSelectSupabase(tipo, marca, selectElem) {
  const { data } = await clienteSupabase.from('componentes').select('*').eq('tipo', tipo).eq('marca', marca);
  selectElem.innerHTML = '<option value="">-- Seleccioná --</option>';
  data?.forEach(i => selectElem.innerHTML += `<option value="${i.id}">${i.nombre} (Socket: ${i.socket || 'N/A'}, Tipo: ${i.memoria_tipo || 'N/A'})</option>`);
}

async function cargarSelectGeneral(tipo, selectElem) {
  const { data } = await clienteSupabase.from('componentes').select('*').eq('tipo', tipo);
  selectElem.innerHTML = '<option value="">-- Seleccioná --</option>';
  data?.forEach(i => {
    let extra = '';
    if (tipo === 'fuente') extra = `${i.wataje}W`;
    else if (tipo === 'ram') extra = `${i.memoria_tipo} - ${i.gama}`;
    else extra = i.gama;
    selectElem.innerHTML += `<option value="${i.id}">${i.nombre} (${extra})</option>`;
  });
}

async function obtenerObjetoSeleccionado(id) {
  if (!id) return null;
  const { data } = await clienteSupabase.from('componentes').select('*').eq('id', id).single();
  return data;
}

function resetearArmador() {
  armadoActual.cpu = null; selectCpu.innerHTML = ''; selectCpu.disabled = true;
  deshabilitarDesde('mother');
}

function deshabilitarDesde(nivel) {
  if (['mother', 'cpu'].includes(nivel)) { armadoActual.mother = null; selectMother.innerHTML = ''; selectMother.disabled = true; }
  if (['mother', 'cpu', 'ram'].includes(nivel)) { armadoActual.ram = null; selectRam.innerHTML = ''; selectRam.disabled = true; }
  armadoActual.gpu = null; selectGpu.innerHTML = ''; selectGpu.disabled = true;
  armadoActual.fuente = null; selectFuente.innerHTML = ''; selectFuente.disabled = true;
  armadoActual.gabinete = null; selectGabinete.innerHTML = ''; selectGabinete.disabled = true;
}

function actualizarPreview() {
  previewContainer.innerHTML = '';
  ['cpu', 'mother', 'ram', 'gpu', 'fuente', 'gabinete'].forEach(k => {
    if (armadoActual[k]) {
      const item = armadoActual[k];
      previewContainer.innerHTML += `
        <div class="preview-card">
          <img src="${item.imagen_url}" alt="${item.nombre}">
          <p>${item.nombre}</p>
          <span>${k.toUpperCase()}</span>
        </div>`;
    }
  });
}

function validarArmado() {
  let errores = [];
  if (armadoActual.cpu && armadoActual.mother && armadoActual.cpu.socket !== armadoActual.mother.socket) {
    errores.push(`⚠️ Socket Incompatible: CPU (${armadoActual.cpu.socket}) no coincide con Mother (${armadoActual.mother.socket}).`);
  }
  if (armadoActual.mother && armadoActual.ram && armadoActual.mother.memoria_tipo !== armadoActual.ram.memoria_tipo) {
    errores.push(`⚠️ Memoria Incompatible: Mother soporta ${armadoActual.mother.memoria_tipo} y elegiste RAM ${armadoActual.ram.memoria_tipo}.`);
  }
  if (armadoActual.fuente && (armadoActual.cpu || armadoActual.gpu)) {
    let consumo = (armadoActual.cpu?.wataje || 0) + (armadoActual.gpu?.wataje || 0) + 50;
    if (armadoActual.fuente.wataje < consumo) {
      errores.push(`⚠️ Energía Insuficiente: El sistema consume ~${consumo}W y la fuente otorga ${armadoActual.fuente.wataje}W.`);
    }
  }

  const completo = Object.values(armadoActual).every(v => v !== null && v !== '');
  if (errores.length > 0) {
    alertaCompatibilidad.className = "alert-box error";
    alertaCompatibilidad.innerHTML = errores.join('<br>');
    btnGuardarArmado.disabled = true;
  } else if (completo) {
    alertaCompatibilidad.className = "alert-box success";
    alertaCompatibilidad.textContent = "¡Configuración 100% compatible y optimizada!";
    btnGuardarArmado.disabled = false;
  } else {
    alertaCompatibilidad.className = "alert-box success";
    alertaCompatibilidad.textContent = "Armado en curso...";
    alertaCompatibilidad.style.display = 'block';
    btnGuardarArmado.disabled = true;
  }
}

btnGuardarArmado.addEventListener('click', async () => {
  btnGuardarArmado.disabled = true;
  mensajeArmador.style.color = "#38bdf8";
  mensajeArmador.textContent = "Guardando en Supabase...";
  try {
    const detalle = `Build -> CPU: ${armadoActual.cpu.nombre} | Mother: ${armadoActual.mother.nombre} | RAM: ${armadoActual.ram.nombre} | GPU: ${armadoActual.gpu.nombre} | Fuente: ${armadoActual.fuente.nombre} | Gabinete: ${armadoActual.gabinete.nombre}`;
    await clienteSupabase.from('registros').insert([{ origen: detalle }]);
    mensajeArmador.style.color = "#4ade80";
    mensajeArmador.textContent = "¡PC guardada con éxito!";
  } catch (err) {
    mensajeArmador.style.color = "#f87171";
    mensajeArmador.textContent = `Error: ${err.message}`;
  } finally {
    btnGuardarArmado.disabled = false;
  }
});

// --- 2. ASISTENTE TU PC ---
const asistenteProposito = document.getElementById('asistenteProposito');
const asistenteGama = document.getElementById('asistenteGama');
const btnGenerarAsistente = document.getElementById('btnGenerarAsistente');
const resultadoAsistente = document.getElementById('resultadoAsistente');
const detalleAsistente = document.getElementById('detalleAsistente');

btnGenerarAsistente.addEventListener('click', () => {
  const proposito = asistenteProposito.value;
  const gama = asistenteGama.value;
  resultadoAsistente.style.display = 'block';
  
  let recomendacion = "";
  if (proposito === 'oficina') {
    recomendacion = `<p><b>Perfil:</b> Oficina / Productividad</p><p><b>Sugerencia:</b> Procesador con gráficos integrados (Intel Core i3 o Ryzen 5 5600G), 16GB de RAM DDR4, SSD NVMe rápido y fuente certificada de 500W.</p><p><b>Argumento:</b> Solución económica, de bajo consumo energético, ideal para multitarea de oficina, paquetería Office y navegación fluida.</p>`;
  } else if (proposito === 'gaming') {
    recomendacion = `<p><b>Perfil:</b> Gaming Gama ${gama}</p><p><b>Sugerencia:</b> Procesador Ryzen 5 o Core i5, Placa de Video dedicada RTX 3060 / RX 7800 XT, 16GB/32GB RAM y fuente de 650W+</p><p><b>Argumento:</b> Diseñado para correr títulos actuales en 1080p o 1440p con altas tasas de refresco estables y excelente relación precio-rendimiento.</p>`;
  } else {
    recomendacion = `<p><b>Perfil:</b> Creador de Contenido / Render Xtreme</p><p><b>Sugerencia:</b> Procesador multinúcleo de alta gama (Ryzen 7 7800X3D o Core i7), 32GB/64GB DDR5 y GPU RTX 4070 / 4090.</p><p><b>Argumento:</b> Máxima potencia para renderizado 3D, edición en 4K y streaming simultáneo sin pérdida de cuadros.</p>`;
  }
  detalleAsistente.innerHTML = recomendacion;
});

// --- 3. PERIFÉRICOS ---
const perifericoPerfil = document.getElementById('perifericoPerfil');
const panelXtreme = document.getElementById('panelXtreme');
const btnSugerirPerifericos = document.getElementById('btnSugerirPerifericos');
const resultadoPerifericos = document.getElementById('resultadoPerifericos');
const detallePerifericos = document.getElementById('detallePerifericos');
const xtremeJuego = document.getElementById('xtremeJuego');
const xtremeDpi = document.getElementById('xtremeDpi');

perifericoPerfil.addEventListener('change', (e) => {
  if (e.target.value === 'xtreme') {
    panelXtreme.style.display = 'block';
    resultadoPerifericos.className = "resultado-box font-xtreme";
  } else {
    panelXtreme.style.display = 'none';
    resultadoPerifericos.className = "resultado-box font-oficina";
  }
});

btnSugerirPerifericos.addEventListener('click', () => {
  const perfil = perifericoPerfil.value;
  resultadoPerifericos.style.display = 'block';

  if (perfil === 'oficina') {
    detallePerifericos.innerHTML = `
      <p><b>Teclado:</b> Logitech K120 Ergo (Silencioso, recorrido cómodo).</p>
      <p><b>Mouse:</b> Logitech B100 (Diseño ambidextro y precisión estandar).</p>
      <p><b>Monitor:</b> Samsung 24" IPS 75Hz (Cuidado visual, sin parpadeo para largas jornadas laborales).</p>
      <p><b>Argumento:</b> Enfoque en ergonomía, durabilidad y reducción de fatiga visual durante largas horas de trabajo de oficina.</p>
    `;
  } else {
    const juego = xtremeJuego.value || "competitivo de alta velocidad";
    const dpi = xtremeDpi.value;
    detallePerifericos.innerHTML = `
      <p><b>Juego Principal:</b> ${juego.toUpperCase()}</p>
      <p><b>Configuración DPI Óptima:</b> ${dpi} DPI (Calibrado para control milimétrico en ${juego}).</p>
      <p><b>Teclado Recomendado:</b> Razer Huntsman V3 Pro (Switches ópticos analógicos de respuesta instantánea).</p>
      <p><b>Mouse Recomendado:</b> Logitech G Pro X Superlight 2 (Ultraliviano, 0 delay).</p>
      <p><b>Monitor Recomendado:</b> Alienware 360Hz OLED (Taza de refresco extrema para eliminar ghosting).</p>
      <p><b>Justificación Xtreme:</b> Configuración orientada a esports profesionales, priorizando latencia ultra baja, switches ópticos y precisión absoluta de DPI.</p>
    `;
  }
});