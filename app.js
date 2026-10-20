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

// Lógica del Armador de PC
const selectPlataforma = document.getElementById('selectPlataforma');
const pasosHardware = document.getElementById('pasosHardware');
const selectCpu = document.getElementById('selectCpu');
const selectMother = document.getElementById('selectMother');
const selectRam = document.getElementById('selectRam');
const alertaCompatibilidad = document.getElementById('alertaCompatibilidad');

selectPlataforma.addEventListener('change', async (e) => {
  const plataforma = e.target.value;
  
  if (plataforma) {
    pasosHardware.classList.add('enabled');
    selectCpu.disabled = false;
    
    // Ejemplo de validación visual de advertencia/información
    alertaCompatibilidad.className = "alert-box success";
    alertaCompatibilidad.textContent = `Plataforma ${plataforma.toUpperCase()} seleccionada. Ahora elegí tu procesador.`;

    // Aquí haremos la consulta a Supabase para filtrar los CPUs por marca (amd/intel)
    await cargarComponentesPorTipo('cpu', plataforma);
  } else {
    pasosHardware.classList.remove('enabled');
    selectCpu.disabled = true;
    selectMother.disabled = true;
    selectRam.disabled = true;
    alertaCompatibilidad.style.display = 'none';
  }
});

async function cargarComponentesPorTipo(tipo, marca) {
  try {
    const { data, error } = await clienteSupabase
      .from('componentes')
      .select('*')
      .eq('tipo', tipo)
      .eq('marca', marca);

    if (error) throw error;

    console.log(`Componentes de tipo ${tipo}:`, data);
    // Lógica para rellenar los <select> con los datos obtenidos de Supabase
  } catch (error) {
    console.error("Error al cargar componentes:", error);
  }
}