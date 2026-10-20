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

// Elementos del Armador de PC
const selectPlataforma = document.getElementById('selectPlataforma');
const pasosHardware = document.getElementById('pasosHardware');
const selectCpu = document.getElementById('selectCpu');
const selectMother = document.getElementById('selectMother');
const selectRam = document.getElementById('selectRam');
const alertaCompatibilidad = document.getElementById('alertaCompatibilidad');
const btnGuardarArmado = document.getElementById('btnGuardarArmado');
const mensaje = document.getElementById('mensaje');

// Estado actual del armado
let armadoActual = {
  plataforma: '',
  cpu: null,
  mother: null,
  ram: null
};

// 1. Cambio de Plataforma (AMD / INTEL)
selectPlataforma.addEventListener('change', async (e) => {
  const plataforma = e.target.value;
  armadoActual.plataforma = plataforma;
  
  // Resetear selecciones
  selectCpu.innerHTML = '<option value="">-- Seleccioná un CPU --</option>';
  selectMother.innerHTML = '<option value="">-- Seleccioná un Motherboard --</option>';
  selectRam.innerHTML = '<option value="">-- Seleccioná Memoria RAM --</option>';
  selectMother.disabled = true;
  selectRam.disabled = true;
  alertaCompatibilidad.style.display = 'none';

  if (plataforma) {
    pasosHardware.classList.add('enabled');
    selectCpu.disabled = false;
    alertaCompatibilidad.className = "alert-box success";
    alertaCompatibilidad.textContent = `Plataforma ${plataforma.toUpperCase()} seleccionada. Elegí tu procesador.`;

    await cargarComponentes('cpu', plataforma, selectCpu);
  } else {
    pasosHardware.classList.remove('enabled');
    selectCpu.disabled = true;
  }
  validarArmadoCompleto();
});

// 2. Selección de CPU
selectCpu.addEventListener('change', async (e) => {
  const cpuId = e.target.value;
  if (cpuId) {
    const { data } = await clienteSupabase.from('componentes').select('*').eq('id', cpuId).single();
    armadoActual.cpu = data;
    
    selectMother.disabled = false;
    await cargarComponentes('mother', armadoActual.plataforma, selectMother);
  } else {
    armadoActual.cpu = null;
    selectMother.disabled = true;
    selectMother.innerHTML = '<option value="">-- Seleccioná un Motherboard --</option>';
  }
  validarCompatibilidadEnVivo();
  validarArmadoCompleto();
});

// 3. Selección de Motherboard
selectMother.addEventListener('change', async (e) => {
  const motherId = e.target.value;
  if (motherId) {
    const { data } = await clienteSupabase.from('componentes').select('*').eq('id', motherId).single();
    armadoActual.mother = data;
    
    selectRam.disabled = false;
    await cargarComponentes('ram', armadoActual.plataforma, selectRam);
  } else {
    armadoActual.mother = null;
    selectRam.disabled = true;
    selectRam.innerHTML = '<option value="">-- Seleccioná Memoria RAM --</option>';
  }
  validarCompatibilidadEnVivo();
  validarArmadoCompleto();
});

// 4. Selección de Memoria RAM
selectRam.addEventListener('change', async (e) => {
  const ramId = e.target.value;
  if (ramId) {
    const { data } = await clienteSupabase.from('componentes').select('*').eq('id', ramId).single();
    armadoActual.ram = data;
  } else {
    armadoActual.ram = null;
  }
  validarCompatibilidadEnVivo();
  validarArmadoCompleto();
});

// Función auxiliar para cargar componentes en los select
async function cargarComponentes(tipo, marca, elementoSelect) {
  try {
    const { data, error } = await clienteSupabase
      .from('componentes')
      .select('*')
      .eq('tipo', tipo)
      .eq('marca', marca);

    if (error) throw error;

    elementoSelect.innerHTML = '<option value="">-- Seleccioná una opción --</option>';
    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `${item.nombre} (Socket: ${item.socket || 'N/A'}, Tipo: ${item.memoria_tipo || 'N/A'})`;
      elementoSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar componentes:", error);
  }
}

// ⚠️ SISTEMA DE VALIDACIÓN DE COMPATIBILIDAD EN VIVO (¡El fuerte del proyecto!)
function validarCompatibilidadEnVivo() {
  let errores = [];

  // Validar Socket entre CPU y Motherboard
  if (armadoActual.cpu && armadoActual.mother) {
    if (armadoActual.cpu.socket !== armadoActual.mother.socket) {
      errores.push(`⚠️ Incompatibilidad de Socket: El procesador usa socket ${armadoActual.cpu.socket} pero el motherboard es ${armadoActual.mother.socket}.`);
    }
  }

  // Validar Tipo de Memoria RAM con el Motherboard
  if (armadoActual.mother && armadoActual.ram) {
    if (armadoActual.mother.memoria_tipo !== armadoActual.ram.memoria_tipo) {
      errores.push(`⚠️ Incompatibilidad de Memoria: El motherboard soporta memorias ${armadoActual.mother.memoria_tipo} y elegiste una RAM tipo ${armadoActual.ram.memoria_tipo}.`);
    }
  }

  // Mostrar resultados de la validación
  if (errores.length > 0) {
    alertaCompatibilidad.className = "alert-box error";
    alertaCompatibilidad.innerHTML = errores.join('<br>');
    btnGuardarArmado.disabled = true;
  } else if (armadoActual.cpu && armadoActual.mother && armadoActual.ram) {
    alertaCompatibilidad.className = "alert-box success";
    alertaCompatibilidad.textContent = "¡Excelente! Todos los componentes seleccionados son compatibles entre sí.";
    btnGuardarArmado.disabled = false;
  } else {
    alertaCompatibilidad.className = "alert-box success";
    alertaCompatibilidad.textContent = "Configuración en curso. Seleccioná todos los componentes para validar.";
    alertaCompatibilidad.style.display = 'block';
    btnGuardarArmado.disabled = true;
  }
}

function validarArmadoCompleto() {
  if (armadoActual.cpu && armadoActual.mother && armadoActual.ram && alertaCompatibilidad.classList.contains('success')) {
    btnGuardarArmado.disabled = false;
  } else {
    btnGuardarArmado.disabled = true;
  }
}

// Guardar el armado en Supabase
btnGuardarArmado.addEventListener('click', async () => {
  btnGuardarArmado.disabled = true;
  mensaje.style.color = "#333";
  mensaje.textContent = "Guardando tu PC en la base de datos...";

  try {
    const { data, error } = await clienteSupabase
      .from('registros')
      .insert([
        { origen: `PC Armada: ${armadoActual.cpu.nombre} + ${armadoActual.mother.nombre} + ${armadoActual.ram.nombre}` }
      ])
      .select();

    if (error) throw error;

    mensaje.style.color = "green";
    mensaje.textContent = "¡PC guardada con éxito en Supabase!";
    console.log("Armado guardado:", data);
  } catch (error) {
    mensaje.style.color = "red";
    mensaje.textContent = `Error al guardar: ${error.message}`;
  } finally {
    btnGuardarArmado.disabled = false;
  }
});