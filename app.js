import { clienteSupabase } from './conexion.js';

// Manejo de Pestañas (Tabs)
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));
    
    btn.classList.add('active');
    const targetTab = document.getElementById(`tab-${btn.dataset.tab}`);
    targetTab.classList.add('active');
  });
});

// Elementos del Armador
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
const mensaje = document.getElementById('mensaje');

// Estado del armado actual
let armadoActual = {
  plataforma: '',
  cpu: null,
  mother: null,
  ram: null,
  gpu: null,
  fuente: null,
  gabinete: null
};

// 1. Cambio de Plataforma (AMD / INTEL)
selectPlataforma.addEventListener('change', async (e) => {
  const plataforma = e.target.value;
  armadoActual.plataforma = plataforma;
  
  resetearArmadoDesde('cpu');

  if (plataforma) {
    pasosHardware.classList.add('enabled');
    selectCpu.disabled = false;
    alertaCompatibilidad.className = "alert-box success";
    alertaCompatibilidad.textContent = `Plataforma ${plataforma.toUpperCase()} seleccionada. Elegí tu procesador.`;
    await cargarComponentes('cpu', plataforma, selectCpu);
  } else {
    pasosHardware.classList.remove('enabled');
    deshabilitarSelectsDesde('cpu');
    alertaCompatibilidad.style.display = 'none';
  }
  actualizarPreview();
  validarTodo();
});

// 2. Selección de CPU
selectCpu.addEventListener('change', async (e) => {
  const id = e.target.value;
  if (id) {
    const { data } = await clienteSupabase.from('componentes').select('*').eq('id', id).single();
    armadoActual.cpu = data;
    selectMother.disabled = false;
    await cargarComponentes('mother', armadoActual.plataforma, selectMother);
  } else {
    armadoActual.cpu = null;
    deshabilitarSelectsDesde('mother');
  }
  actualizarPreview();
  validarTodo();
});

// 3. Selección de Motherboard
selectMother.addEventListener('change', async (e) => {
  const id = e.target.value;
  if (id) {
    const { data } = await clienteSupabase.from('componentes').select('*').eq('id', id).single();
    armadoActual.mother = data;
    selectRam.disabled = false;
    await cargarComponentes('ram', armadoActual.plataforma, selectRam);
  } else {
    armadoActual.mother = null;
    deshabilitarSelectsDesde('ram');
  }
  actualizarPreview();
  validarTodo();
});

// 4. Selección de RAM
selectRam.addEventListener('change', async (e) => {
  const id = e.target.value;
  if (id) {
    const { data } = await clienteSupabase.from('componentes').select('*').eq('id', id).single();
    armadoActual.ram = data;
    selectGpu.disabled = false;
    await cargarComponentesGenerales('gpu', selectGpu);
  } else {
    armadoActual.ram = null;
    deshabilitarSelectsDesde('gpu');
  }
  actualizarPreview();
  validarTodo();
});

// 5. Selección de GPU
selectGpu.addEventListener('change', async (e) => {
  const id = e.target.value;
  if (id) {
    const { data } = await clienteSupabase.from('componentes').select('*').eq('id', id).single();
    armadoActual.gpu = data;
    selectFuente.disabled = false;
    await cargarComponentesGenerales('fuente', selectFuente);
  } else {
    armadoActual.gpu = null;
    deshabilitarSelectsDesde('fuente');
  }
  actualizarPreview();
  validarTodo();
});

// 6. Selección de Fuente
selectFuente.addEventListener('change', async (e) => {
  const id = e.target.value;
  if (id) {
    const { data } = await clienteSupabase.from('componentes').select('*').eq('id', id).single();
    armadoActual.fuente = data;
    selectGabinete.disabled = false;
    await cargarComponentesGenerales('gabinete', selectGabinete);
  } else {
    armadoActual.fuente = null;
    deshabilitarSelectsDesde('gabinete');
  }
  actualizarPreview();
  validarTodo();
});

// 7. Selección de Gabinete
selectGabinete.addEventListener('change', async (e) => {
  const id = e.target.value;
  if (id) {
    const { data } = await clienteSupabase.from('componentes').select('*').eq('id', id).single();
    armadoActual.gabinete = data;
  } else {
    armadoActual.gabinete = null;
  }
  actualizarPreview();
  validarTodo();
});

// Funciones auxiliares de carga desde Supabase
async function cargarComponentes(tipo, marca, elementoSelect) {
  try {
    const { data } = await clienteSupabase.from('componentes').select('*').eq('tipo', tipo).eq('marca', marca);
    elementoSelect.innerHTML = '<option value="">-- Seleccioná una opción --</option>';
    data.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = `${item.nombre} (Socket: ${item.socket || 'N/A'}, Tipo: ${item.memoria_tipo || 'N/A'})`;
      elementoSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Error cargando componentes:", err);
  }
}

async function cargarComponentesGenerales(tipo, elementoSelect) {
  try {
    const { data } = await clienteSupabase.from('componentes').select('*').eq('tipo', tipo);
    elementoSelect.innerHTML = '<option value="">-- Seleccioná una opción --</option>';
    data.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = `${item.nombre} (${tipo === 'fuente' ? item.wataje + 'W' : item.gama})`;
      elementoSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Error cargando generales:", err);
  }
}

function resetearArmadoDesde() {
  armadoActual.cpu = null; selectCpu.innerHTML = ''; selectCpu.disabled = true;
  deshabilitarSelectsDesde('mother');
}

function deshabilitarSelectsDesde(nivel) {
  if (nivel === 'mother' || nivel === 'cpu') {
    armadoActual.mother = null; selectMother.innerHTML = ''; selectMother.disabled = true;
  }
  if (nivel === 'mother' || nivel === 'cpu' || nivel === 'ram') {
    armadoActual.ram = null; selectRam.innerHTML = ''; selectRam.disabled = true;
  }
  if (nivel !== 'gabinete' && nivel !== 'fuente' && nivel !== 'gpu') {
    armadoActual.gpu = null; selectGpu.innerHTML = ''; selectGpu.disabled = true;
    armadoActual.fuente = null; selectFuente.innerHTML = ''; selectFuente.disabled = true;
    armadoActual.gabinete = null; selectGabinete.innerHTML = ''; selectGabinete.disabled = true;
  }
}

// Renderizado visual de la PC armada con imágenes
function actualizarPreview() {
  previewContainer.innerHTML = '';
  const keys = ['cpu', 'mother', 'ram', 'gpu', 'fuente', 'gabinete'];
  
  keys.forEach(k => {
    if (armadoActual[k]) {
      const item = armadoActual[k];
      const card = document.createElement('div');
      card.className = 'preview-card';
      card.innerHTML = `
        <img src="${item.imagen_url || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300'}" alt="${item.nombre}">
        <p>${item.nombre}</p>
        <span>${k}</span>
      `;
      previewContainer.appendChild(card);
    }
  });
}

// Validador en vivo de Sockets, Memorias y Watts
function validarTodo() {
  let errores = [];

  if (armadoActual.cpu && armadoActual.mother) {
    if (armadoActual.cpu.socket !== armadoActual.mother.socket) {
      errores.push(`⚠️ Socket Incompatible: CPU (${armadoActual.cpu.socket}) no coincide con Motherboard (${armadoActual.mother.socket}).`);
    }
  }

  if (armadoActual.mother && armadoActual.ram) {
    if (armadoActual.mother.memoria_tipo !== armadoActual.ram.memoria_tipo) {
      errores.push(`⚠️ Memoria Incompatible: Motherboard soporta ${armadoActual.mother.memoria_tipo} y elegiste RAM ${armadoActual.ram.memoria_tipo}.`);
    }
  }

  if (armadoActual.fuente && (armadoActual.cpu || armadoActual.gpu)) {
    let consumoTotal = (armadoActual.cpu ? armadoActual.cpu.wataje : 0) + 
                       (armadoActual.gpu ? armadoActual.gpu.wataje : 0) + 50; 
    if (armadoActual.fuente.wataje < consumoTotal) {
      errores.push(`⚠️ Energía Insuficiente: Tu equipo consume aprox. ${consumoTotal}W y la fuente es de ${armadoActual.fuente.wataje}W.`);
    }
  }

  const completo = armadoActual.cpu && armadoActual.mother && armadoActual.ram && armadoActual.gpu && armadoActual.fuente && armadoActual.gabinete;

  if (errores.length > 0) {
    alertaCompatibilidad.className = "alert-box error";
    alertaCompatibilidad.innerHTML = errores.join('<br>');
    btnGuardarArmado.disabled = true;
  } else if (completo) {
    alertaCompatibilidad.className = "alert-box success";
    alertaCompatibilidad.textContent = "¡Configuración perfecta! Todos los componentes son compatibles y la fuente cubre el consumo.";
    btnGuardarArmado.disabled = false;
  } else {
    alertaCompatibilidad.className = "alert-box success";
    alertaCompatibilidad.textContent = "Armado en curso. Seleccioná todos los componentes para habilitar el guardado.";
    alertaCompatibilidad.style.display = 'block';
    btnGuardarArmado.disabled = true;
  }
}

// Guardar armado en Supabase
btnGuardarArmado.addEventListener('click', async () => {
  btnGuardarArmado.disabled = true;
  mensaje.style.color = "#38bdf8";
  mensaje.textContent = "Guardando tu configuración...";

  try {
    const detalle = `PC Armada -> CPU: ${armadoActual.cpu.nombre} | Mother: ${armadoActual.mother.nombre} | RAM: ${armadoActual.ram.nombre} | GPU: ${armadoActual.gpu.nombre} | Fuente: ${armadoActual.fuente.nombre} | Gabinete: ${armadoActual.gabinete.nombre}`;
    
    const { data, error } = await clienteSupabase
      .from('registros')
      .insert([{ origen: detalle }])
      .select();

    if (error) throw error;

    mensaje.style.color = "#4ade80";
    mensaje.textContent = "¡PC guardada con éxito en Supabase!";
    console.log("Guardado:", data);
  } catch (error) {
    mensaje.style.color = "#f87171";
    mensaje.textContent = `Error: ${error.message}`;
  } finally {
    btnGuardarArmado.disabled = false;
  }
});