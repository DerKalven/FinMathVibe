// =============================================================================
// FIXED INCOME RISK ANALYZER — Módulo 1: Time Value Engine
// =============================================================================
// Autor: Tu nombre aquí
// Propósito: Herramienta interactiva para cálculos de matemática financiera
//            alineada al syllabus del examen FM (SOA/CAS).
// Stack: React (hooks), CSS-in-JS (styles como string), sin dependencias externas.
// Estilo: Institucional tipo McKinsey — blanco, negro, azul marino, tipografía
//         editorial seria (Libre Baskerville + IBM Plex Mono).
// =============================================================================

import { useState } from "react";

// =============================================================================
// SECCIÓN 1: ESTILOS GLOBALES
// =============================================================================
// Todos los estilos están definidos aquí como una cadena CSS que se inyecta
// en un tag <style>. Esto permite que el componente sea completamente
// autocontenido (un solo archivo .jsx).
//
// Variables CSS (--var): definen la paleta de colores institucional.
//   --navy:   azul marino McKinsey — color dominante, transmite autoridad
//   --white:  fondo limpio, máxima legibilidad
//   --ink:    negro puro para texto principal
//   --gray-*: escala de grises para jerarquía visual
//   --rule:   línea divisoria sutil
// =============================================================================

const STYLES = `
  /* ── Importación de fuentes ── */
  /* Libre Baskerville: serif editorial para títulos (seriedad académica)   */
  /* IBM Plex Mono: monoespaciada para números y código (precisión técnica) */
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@300;400;500&display=swap');

  /* ── Reset y variables globales ── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:       #002244;
    --navy-light: #003366;
    --blue-mid:   #0a4d8c;
    --white:      #ffffff;
    --off-white:  #f7f8fa;
    --ink:        #0d0d0d;
    --gray-dark:  #333333;
    --gray-mid:   #666666;
    --gray-light: #999999;
    --rule:       #e0e3e8;
    --result-bg:  #001833;
    --gold:       #b8960c;
  }

  body { background: var(--white); }

  .app {
    font-family: 'IBM Plex Mono', monospace;
    background: var(--white);
    min-height: 100vh;
    color: var(--ink);
  }

  /* ── HEADER ── */
  .header {
    background: var(--navy);
    color: var(--white);
    padding: 0 48px;
    height: 64px;
    display: flex;
    align-items: center;
    border-bottom: 3px solid var(--gold);
  }

  .header-logo {
    font-family: 'Libre Baskerville', serif;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--white);
    padding-right: 32px;
    border-right: 1px solid rgba(255,255,255,0.2);
  }

  .header-module {
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.55);
    padding-left: 32px;
  }

  .header-badge {
    margin-left: auto;
    font-size: 9px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--gold);
    border: 1px solid var(--gold);
    padding: 4px 12px;
  }

  /* ── LAYOUT PRINCIPAL ── */
  .layout {
    display: grid;
    grid-template-columns: 240px 1fr;
    min-height: calc(100vh - 64px);
  }

  /* ── SIDEBAR ── */
  .sidebar {
    background: var(--navy);
    color: var(--white);
    padding: 40px 0;
    position: sticky;
    top: 0;
    height: calc(100vh - 64px);
    overflow-y: auto;
  }

  .sidebar-label {
    font-size: 8px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
    padding: 0 28px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    margin-bottom: 8px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 28px;
    font-size: 11px;
    letter-spacing: 0.06em;
    color: rgba(255,255,255,0.55);
    cursor: pointer;
    transition: all 0.15s ease;
    border-left: 3px solid transparent;
  }

  .nav-item:hover { color: var(--white); background: var(--navy-light); }

  /* Estado activo: borde dorado + fondo resaltado */
  .nav-item.active {
    color: var(--white);
    border-left-color: var(--gold);
    background: rgba(184,150,12,0.1);
    font-weight: 500;
  }

  .nav-bullet {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    flex-shrink: 0;
  }
  .nav-item.active .nav-bullet { background: var(--gold); }

  .sidebar-divider {
    border: none;
    border-top: 1px solid rgba(255,255,255,0.08);
    margin: 20px 0;
  }

  /* ── ÁREA DE CONTENIDO ── */
  .main {
    background: var(--off-white);
    padding: 48px 56px;
    max-width: 1000px;
  }

  .page-eyebrow {
    font-family: 'Libre Baskerville', serif;
    font-style: italic;
    font-size: 14px;
    color: var(--gray-light);
    margin-bottom: 6px;
  }

  .page-title {
    font-family: 'Libre Baskerville', serif;
    font-size: 32px;
    font-weight: 700;
    color: var(--navy);
    letter-spacing: -0.5px;
    line-height: 1.15;
    margin-bottom: 12px;
  }

  .page-desc {
    font-size: 11px;
    color: var(--gray-mid);
    line-height: 1.8;
    max-width: 520px;
    margin-bottom: 8px;
  }

  /* Etiqueta de referencia al syllabus FM */
  .fm-tag {
    display: inline-block;
    background: var(--navy);
    color: var(--white);
    font-size: 8px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 3px 10px;
    margin-bottom: 32px;
  }

  /* ── GRIDS ── */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }

  /* ── TARJETA ── */
  /* Franja azul superior = detalle visual característico del estilo McKinsey */
  .card {
    background: var(--white);
    border: 1px solid var(--rule);
    border-top: 3px solid var(--navy);
    padding: 28px;
  }

  .card-title {
    font-size: 8px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gray-light);
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--rule);
  }

  /* ── FÓRMULA MATEMÁTICA ── */
  /* Borde izquierdo dorado = indica contenido técnico FM */
  .formula {
    background: var(--navy);
    color: rgba(255,255,255,0.85);
    padding: 12px 20px;
    font-size: 12px;
    font-style: italic;
    margin-bottom: 24px;
    border-left: 3px solid var(--gold);
    letter-spacing: 0.02em;
  }

  /* ── CAMPOS DE FORMULARIO ── */
  .field { margin-bottom: 16px; }

  .field label {
    display: block;
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--gray-mid);
    margin-bottom: 7px;
  }

  /* Subrayado azul marino = detalle de identidad institucional */
  .field input, .field select {
    width: 100%;
    background: var(--off-white);
    border: 1px solid var(--rule);
    border-bottom: 2px solid var(--navy);
    padding: 10px 12px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    color: var(--ink);
    outline: none;
    transition: border-color 0.15s;
    border-radius: 0;
    appearance: none;
  }

  /* Al enfocar: el subrayado cambia a dorado */
  .field input:focus, .field select:focus {
    border-bottom-color: var(--gold);
    background: var(--white);
  }

  /* ── BOTÓN DE ACCIÓN ── */
  .btn {
    width: 100%;
    background: var(--navy);
    color: var(--white);
    border: none;
    padding: 13px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.15s;
    margin-top: 8px;
  }

  .btn:hover { background: var(--blue-mid); }

  /* ── CAJA DE RESULTADO ── */
  .result-box {
    background: var(--result-bg);
    color: var(--white);
    padding: 28px;
    border-top: 3px solid var(--gold);
  }

  .result-label {
    font-size: 8px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.4);
    margin-bottom: 8px;
  }

  /* Número grande en serif = máximo impacto visual */
  .result-value {
    font-family: 'Libre Baskerville', serif;
    font-size: 40px;
    font-weight: 700;
    color: var(--white);
    letter-spacing: -1.5px;
    line-height: 1;
    margin-bottom: 16px;
  }

  .result-divider {
    border: none;
    border-top: 1px solid rgba(255,255,255,0.1);
    margin: 14px 0;
  }

  .result-detail {
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    line-height: 1.9;
  }

  /* Valor dorado = dato clave a destacar */
  .result-hl { color: var(--gold); font-weight: 500; }

  /* ── PESTAÑAS ── */
  .tabs {
    display: flex;
    border-bottom: 2px solid var(--rule);
    margin-bottom: 28px;
  }

  .tab {
    padding: 10px 24px;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    color: var(--gray-light);
    border-bottom: 3px solid transparent;
    margin-bottom: -2px;
    transition: all 0.15s;
  }

  .tab:hover { color: var(--navy); }
  .tab.active { color: var(--navy); border-bottom-color: var(--navy); font-weight: 500; }

  /* ── TABLA ── */
  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }

  .table th {
    text-align: left;
    font-size: 8px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--gray-light);
    padding: 8px 12px;
    border-bottom: 2px solid var(--navy);
    background: var(--off-white);
  }

  .table td {
    padding: 9px 12px;
    border-bottom: 1px solid var(--rule);
    font-variant-numeric: tabular-nums;
  }

  .table tr:hover td { background: #f0f4ff; }
  .table tr:last-child td { border-bottom: none; }

  .td-right { text-align: right; }
  .td-navy  { color: var(--navy); font-weight: 500; }
  .td-green { color: #1a5c3a; }

  /* ── FILA CLAVE:VALOR ── */
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 10px 0;
    border-bottom: 1px solid var(--rule);
    font-size: 12px;
  }
  .info-row:last-child { border-bottom: none; }
  .info-key { color: var(--gray-mid); font-size: 10px; letter-spacing: 0.05em; }

  /* ── ESTADO VACÍO ── */
  .empty-state {
    height: 100%;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--gray-light);
    font-size: 11px;
    gap: 10px;
    border: 1px dashed var(--rule);
  }

  .empty-icon { font-size: 28px; opacity: 0.3; }
`;

// =============================================================================
// SECCIÓN 2: UTILIDADES MATEMÁTICAS
// =============================================================================
// Funciones puras (no tienen side effects ni estado React).
// Se mantienen separadas de los componentes visuales para facilitar:
//   1. Pruebas unitarias
//   2. Reutilización en otros módulos
//   3. Lectura del código (separa "qué calcula" de "cómo se ve")
// =============================================================================

/**
 * fmt — Formatea número con separador de miles y decimales fijos.
 * Ejemplo: fmt(1234.5) → "1,234.50"
 * Retorna "—" si el valor no es un número válido.
 */
const fmt = (n, d = 2) =>
  n == null || isNaN(n)
    ? "—"
    : n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

/**
 * fmtPct — Convierte decimal a string de porcentaje con 4 decimales.
 * Ejemplo: fmtPct(0.0512) → "5.1200%"
 */
const fmtPct = (n, d = 4) =>
  n == null || isNaN(n) ? "—" : (n * 100).toFixed(d) + "%";

/**
 * effectiveRate — Convierte cualquier convención de tasa a tasa efectiva anual.
 *
 * El FM define tres formas de expresar una tasa:
 *
 *   Nominal i^(m): se capitaliza m veces/año
 *     → i_eff = (1 + i^(m)/m)^m − 1
 *
 *   Efectiva anual i: directamente la tasa efectiva
 *     → i_eff = i  (sin transformación)
 *
 *   Fuerza de interés δ (tasa instantánea / continua):
 *     → i_eff = e^δ − 1
 *
 * @param {number} rate  - Tasa en decimal (ej: 0.06 para 6%)
 * @param {number} m     - Frecuencia de capitalización (solo si conv="nominal")
 * @param {string} conv  - "nominal" | "effective" | "continuous"
 * @returns {number}     - Tasa efectiva anual equivalente
 */
function effectiveRate(rate, m, conv = "nominal") {
  if (conv === "continuous") return Math.exp(rate) - 1;        // e^δ − 1
  if (conv === "effective")  return rate;                       // ya es efectiva
  return Math.pow(1 + rate / m, m) - 1;                        // (1 + i/m)^m − 1
}

/**
 * calcFV — Future Value de un capital único.
 *
 * Fórmula FM: FV = PV · (1 + i)^n
 * Factor de acumulación: a(n) = (1+i)^n
 *
 * @param {number} pv  - Valor presente
 * @param {number} i   - Tasa efectiva por período
 * @param {number} n   - Número de períodos
 * @returns {number}
 */
function calcFV(pv, i, n) {
  return pv * Math.pow(1 + i, n);
}

/**
 * calcPV — Present Value de un capital único.
 *
 * Fórmula FM: PV = FV · v^n   donde v = 1/(1+i) = factor de descuento
 * Es la operación inversa de calcFV.
 *
 * @param {number} fv  - Valor futuro
 * @param {number} i   - Tasa efectiva por período
 * @param {number} n   - Número de períodos
 * @returns {number}
 */
function calcPV(fv, i, n) {
  return fv / Math.pow(1 + i, n);
}

/**
 * annuityImmediate — PV de anualidad-vencida (pagos al FINAL del período).
 *
 * Notación FM: a⌐n|i  (se lee "a-angle-n at i")
 * Fórmula:     PV = PMT · (1 − v^n) / i
 *
 * Derivación: es la suma de n valores presentes individuales:
 *   PV = PMT·v + PMT·v² + ... + PMT·vⁿ = PMT · v(1 − vⁿ)/(1−v)
 *      = PMT · (1 − vⁿ) / i
 *
 * Caso especial i=0: no hay descuento → PV = PMT × n
 *
 * @param {number} pmt - Pago periódico constante
 * @param {number} i   - Tasa efectiva por período
 * @param {number} n   - Número de pagos
 * @returns {number}
 */
function annuityImmediate(pmt, i, n) {
  if (i === 0) return pmt * n;
  return pmt * (1 - Math.pow(1 + i, -n)) / i;
}

/**
 * annuityDue — PV de anualidad-anticipada (pagos al INICIO del período).
 *
 * Notación FM: ä⌐n|i
 * Relación clave: ä⌐n|i = (1+i) · a⌐n|i
 *
 * Intuición: en una anualidad-anticipada, cada pago ocurre un período
 * antes que en la vencida → cada pago vale más por el factor (1+i).
 *
 * @param {number} pmt - Pago periódico
 * @param {number} i   - Tasa efectiva por período
 * @param {number} n   - Número de pagos
 * @returns {number}
 */
function annuityDue(pmt, i, n) {
  return annuityImmediate(pmt, i, n) * (1 + i);
}

/**
 * annuityDeferred — PV de anualidad diferida d períodos.
 *
 * La anualidad comienza a pagar en el período d+1 (no hoy).
 * Fórmula: d|a⌐n|i = v^d · a⌐n|i
 *
 * Intuición: es como comprar hoy una anualidad que alguien más va a cobrar
 * en d períodos → hay que descontar ese valor adicional por v^d.
 *
 * @param {number} pmt - Pago periódico
 * @param {number} i   - Tasa efectiva por período
 * @param {number} n   - Número de pagos
 * @param {number} d   - Períodos de espera antes del primer pago
 * @returns {number}
 */
function annuityDeferred(pmt, i, n, d) {
  return annuityImmediate(pmt, i, n) * Math.pow(1 + i, -d);
}

/**
 * amortizationSchedule — Tabla de amortización con soporte para abonos extraordinarios.
 *
 * ── Lógica de abonos extraordinarios:
 *    Un abono extraordinario (extra payment) es un pago adicional a la cuota
 *    ordinaria que se aplica DIRECTAMENTE al saldo de capital, sin tocar interés.
 *    Efectos:
 *      1. El saldo cae más rápido → períodos futuros pagan menos interés
 *      2. El préstamo se cancela antes de lo planeado (menos períodos totales)
 *      3. El interés total pagado disminuye significativamente
 *
 *    En el sistema francés (el más común), después de un abono extraordinario
 *    el algoritmo recalcula la cuota constante sobre el nuevo saldo residual
 *    y los períodos restantes. Esto mantiene la fecha de vencimiento original
 *    pero reduce la cuota. Otra opción sería mantener la cuota y reducir n,
 *    pero la reducción de cuota es más fácil de visualizar.
 *
 * ── Tres esquemas base (sin abonos):
 *
 *    "french" (cuota constante / sistema francés):
 *      PMT = PV · i / (1 − (1+i)^−n)
 *      Interés = Saldo × i  |  Capital = PMT − Interés
 *
 *    "german" (capital constante / sistema alemán):
 *      Capital fijo = PV / n
 *      Cuota = Capital + Interés sobre saldo (decrece cada período)
 *
 *    "american" (bullet / bala):
 *      Solo interés cada período. Capital completo al vencimiento.
 *
 * @param {number} pv          - Monto del préstamo
 * @param {number} i           - Tasa efectiva por período
 * @param {number} n           - Número de períodos original
 * @param {string} type        - "french" | "german" | "american"
 * @param {Object} extraMap    - Mapa { período: monto_abono } ej: { 3: 500, 7: 1000 }
 * @returns {Array<{t, pmt, interest, principal, extra, totalPaid, balance, isCancelled}>}
 */
function amortizationSchedule(pv, i, n, type = "french", extraMap = {}) {
  const rows = [];

  if (type === "french") {
    // Cuota inicial para el plazo original
    let pmt     = (pv * i) / (1 - Math.pow(1 + i, -n));
    let balance = pv;
    let t       = 1;
    let remaining = n;   // períodos que quedan por pagar

    while (balance > 0.005 && t <= n + Object.keys(extraMap).length + 1) {
      const interest  = balance * i;
      const principal = Math.min(pmt - interest, balance);   // no exceder saldo
      const extra     = Math.min(extraMap[t] || 0, balance - principal);  // abono extra

      balance -= (principal + extra);
      balance  = Math.max(0, balance);

      rows.push({
        t, pmt: principal + interest, interest, principal,
        extra,                          // abono extraordinario de este período
        totalPaid: principal + interest + extra,
        balance,
        isCancelled: balance === 0,     // flag: préstamo saldado en este período
      });

      // Después de un abono extraordinario, recalcular la cuota sobre
      // el nuevo saldo y los períodos restantes para mantener el plazo
      remaining--;
      if (extra > 0 && balance > 0 && remaining > 0) {
        pmt = (balance * i) / (1 - Math.pow(1 + i, -remaining));
      }

      if (balance === 0) break;   // préstamo cancelado anticipadamente
      t++;
    }

  } else if (type === "german") {
    const basePrincipal = pv / n;   // capital base constante
    let balance = pv;

    for (let t = 1; t <= n && balance > 0.005; t++) {
      const interest  = balance * i;
      const principal = Math.min(basePrincipal, balance);
      const extra     = Math.min(extraMap[t] || 0, balance - principal);

      balance -= (principal + extra);
      balance  = Math.max(0, balance);

      rows.push({
        t, pmt: principal + interest, interest, principal,
        extra, totalPaid: principal + interest + extra,
        balance, isCancelled: balance === 0,
      });

      if (balance === 0) break;
    }

  } else {
    // Americano: abonos extraordinarios reducen el capital sobre el que se
    // calculan los intereses de los siguientes períodos
    let balance = pv;

    for (let t = 1; t <= n && balance > 0.005; t++) {
      const interest  = balance * i;
      const principal = t === n ? balance : 0;
      const extra     = t < n ? Math.min(extraMap[t] || 0, balance) : 0;

      balance -= (principal + extra);
      balance  = Math.max(0, balance);

      rows.push({
        t, pmt: principal + interest, interest, principal,
        extra, totalPaid: principal + interest + extra,
        balance, isCancelled: balance === 0,
      });

      if (balance === 0) break;
    }
  }

  return rows;
}

// =============================================================================
// SECCIÓN 3: COMPONENTES DE INTERFAZ
// =============================================================================
// Cada calculadora es un componente React funcional independiente.
// Patrón común en todos:
//   1. useState para inputs del usuario
//   2. useState para el resultado calculado
//   3. función calculate() que ejecuta las matemáticas y actualiza el resultado
//   4. JSX que renderiza el formulario + resultado
// =============================================================================

// -----------------------------------------------------------------------------
// 3.1 TVMPanel — Valor del Dinero en el Tiempo
// -----------------------------------------------------------------------------
// Calcula FV dado PV, o PV dado FV.
// Soporta tasas nominales, efectivas y fuerza de interés.
// Muestra automáticamente las tasas equivalentes al resultado.
// -----------------------------------------------------------------------------
function TVMPanel() {

  // Estado del formulario — valores iniciales razonables para demostración
  const [inputs, setInputs] = useState({
    mode: "fv",         // "fv" = calcular FV | "pv" = calcular PV
    pv:   1000,         // valor presente inicial
    fv:   "",           // valor futuro (vacío: el usuario lo llena si mode="pv")
    i:    5,            // tasa en porcentaje (ej: 5 = 5%)
    n:    10,           // períodos
    conv: "nominal",    // convención de la tasa
    m:    12,           // capitalización mensual por defecto
  });

  const [result, setResult] = useState(null);  // null = sin calcular aún

  // Actualiza un campo sin pisar los demás (spread operator)
  const set = (k, v) => setInputs(prev => ({ ...prev, [k]: v }));

  const calculate = () => {
    // Paso 1: convertir la tasa ingresada a efectiva anual
    const i_eff = effectiveRate(
      parseFloat(inputs.i) / 100,   // de % a decimal
      parseInt(inputs.m),
      inputs.conv
    );
    const n = parseFloat(inputs.n);

    // Paso 2: calcular según modo
    let res = {};
    if (inputs.mode === "fv") {
      const pv   = parseFloat(inputs.pv);
      res.value  = calcFV(pv, i_eff, n);
      res.label  = "Future Value";
      res.detail = `PV $${fmt(pv)} crece durante ${n} períodos`;
    } else {
      const fv   = parseFloat(inputs.fv) || 0;
      res.value  = calcPV(fv, i_eff, n);
      res.label  = "Present Value";
      res.detail = `FV $${fmt(fv)} descontado ${n} períodos`;
    }

    // Paso 3: guardar tasas equivalentes para mostrar en el resultado
    res.i_eff = i_eff;
    res.i_nom = parseFloat(inputs.i) / 100;
    res.delta = Math.log(1 + i_eff);          // δ = ln(1 + i_eff)

    setResult(res);
  };

  return (
    <div>
      {/* Fórmula FM activa según el modo seleccionado */}
      <div className="formula">
        {inputs.mode === "fv"
          ? "FV = PV · (1 + i)ⁿ"
          : "PV = FV · (1 + i)⁻ⁿ  =  FV · vⁿ"}
      </div>

      <div className="grid-2">
        {/* Columna izquierda: formulario */}
        <div className="card">
          <div className="card-title">Parámetros</div>

          {/* Modo: qué variable calcular */}
          <div className="field">
            <label>Calcular</label>
            <select value={inputs.mode} onChange={e => set("mode", e.target.value)}>
              <option value="fv">Future Value (dado PV)</option>
              <option value="pv">Present Value (dado FV)</option>
            </select>
          </div>

          {/* Input dinámico: cambia según el modo */}
          {inputs.mode === "fv" ? (
            <div className="field">
              <label>Present Value ($)</label>
              <input type="number" value={inputs.pv}
                onChange={e => set("pv", e.target.value)} />
            </div>
          ) : (
            <div className="field">
              <label>Future Value ($)</label>
              <input type="number" value={inputs.fv}
                onChange={e => set("fv", e.target.value)} />
            </div>
          )}

          <div className="field">
            <label>Tasa (%)</label>
            <input type="number" step="0.01" value={inputs.i}
              onChange={e => set("i", e.target.value)} />
          </div>

          <div className="field">
            <label>Convención de tasa</label>
            <select value={inputs.conv} onChange={e => set("conv", e.target.value)}>
              <option value="nominal">Nominal i^(m) — capitalización m veces</option>
              <option value="effective">Efectiva anual i</option>
              <option value="continuous">Fuerza de interés δ (continua)</option>
            </select>
          </div>

          {/* Selector de m — solo visible cuando la tasa es nominal */}
          {inputs.conv === "nominal" && (
            <div className="field">
              <label>Capitalización (m)</label>
              <select value={inputs.m} onChange={e => set("m", e.target.value)}>
                <option value="1">Anual (m = 1)</option>
                <option value="2">Semestral (m = 2)</option>
                <option value="4">Trimestral (m = 4)</option>
                <option value="12">Mensual (m = 12)</option>
                <option value="365">Diaria (m = 365)</option>
              </select>
            </div>
          )}

          <div className="field">
            <label>Períodos (n)</label>
            <input type="number" value={inputs.n}
              onChange={e => set("n", e.target.value)} />
          </div>

          <button className="btn" onClick={calculate}>Calcular</button>
        </div>

        {/* Columna derecha: resultado o estado vacío */}
        <div>
          {result ? (
            <div className="result-box">
              <div className="result-label">{result.label}</div>
              <div className="result-value">${fmt(result.value)}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                {result.detail}
              </div>
              <hr className="result-divider" />
              {/* Tasas equivalentes calculadas automáticamente */}
              <div className="result-detail">
                <span className="result-hl">i efectiva anual</span>  = {fmtPct(result.i_eff)}<br />
                <span className="result-hl">i nominal ingresada</span> = {fmtPct(result.i_nom)}<br />
                <span className="result-hl">Fuerza de interés δ</span> = {fmtPct(result.delta)}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">◎</div>
              Ingresa parámetros y presiona Calcular
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3.2 AnnuityPanel — Valuación de Anualidades
// -----------------------------------------------------------------------------
// Tres tipos con pestañas: Immediate / Due / Deferred.
// Muestra PV, valor acumulado y desglose interés/capital.
// -----------------------------------------------------------------------------
function AnnuityPanel() {

  const [type,   setType]   = useState("immediate");   // tipo activo (pestañas)
  const [inputs, setInputs] = useState({
    pmt: 100,    // pago periódico
    i:   5,      // tasa efectiva anual (%)
    n:   20,     // número de pagos
    d:   5,      // períodos de diferimiento (solo para "deferred")
  });
  const [result, setResult] = useState(null);

  const set = (k, v) => setInputs(prev => ({ ...prev, [k]: v }));

  const calculate = () => {
    const i   = parseFloat(inputs.i) / 100;
    const n   = parseFloat(inputs.n);
    const pmt = parseFloat(inputs.pmt);
    const d   = parseFloat(inputs.d);

    let pv, label, formula;

    if (type === "immediate") {
      pv      = annuityImmediate(pmt, i, n);
      label   = "Anualidad Vencida — a⌐n|i";
      formula = "PV = PMT · a⌐n|i = PMT · (1 − vⁿ) / i";
    } else if (type === "due") {
      pv      = annuityDue(pmt, i, n);
      label   = "Anualidad Anticipada — ä⌐n|i";
      formula = "PV = PMT · ä⌐n|i = PMT · (1+i) · a⌐n|i";
    } else {
      pv      = annuityDeferred(pmt, i, n, d);
      label   = `Anualidad Diferida ${d} períodos`;
      formula = `PV = v^${d} · PMT · a⌐${n}|i`;
    }

    // Valor acumulado al final de todos los pagos
    const fv = calcFV(pv, i, type === "deferred" ? n + d : n);

    const totalPmts     = pmt * n;
    const totalInterest = fv - totalPmts;    // interés = valor acumulado − pagos

    setResult({ pv, fv, label, formula, totalPmts, totalInterest });
  };

  return (
    <div>
      {/* Pestañas para cambiar tipo de anualidad */}
      <div className="tabs">
        {[
          ["immediate", "Vencida (Immediate)"],
          ["due",       "Anticipada (Due)"],
          ["deferred",  "Diferida (Deferred)"],
        ].map(([k, v]) => (
          <div
            key={k}
            className={`tab ${type === k ? "active" : ""}`}
            onClick={() => { setType(k); setResult(null); }}  // resetear resultado al cambiar tipo
          >
            {v}
          </div>
        ))}
      </div>

      {/* Fórmula del tipo activo — aparece cuando hay resultado */}
      {result && <div className="formula">{result.formula}</div>}

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Parámetros de la Anualidad</div>

          <div className="field">
            <label>Pago periódico PMT ($)</label>
            <input type="number" value={inputs.pmt}
              onChange={e => set("pmt", e.target.value)} />
          </div>

          <div className="field">
            <label>Tasa efectiva anual i (%)</label>
            <input type="number" step="0.01" value={inputs.i}
              onChange={e => set("i", e.target.value)} />
          </div>

          <div className="field">
            <label>Número de pagos n</label>
            <input type="number" value={inputs.n}
              onChange={e => set("n", e.target.value)} />
          </div>

          {/* Campo de diferimiento — solo visible en modo "deferred" */}
          {type === "deferred" && (
            <div className="field">
              <label>Períodos de diferimiento d</label>
              <input type="number" value={inputs.d}
                onChange={e => set("d", e.target.value)} />
            </div>
          )}

          <button className="btn" onClick={calculate}>Calcular</button>
        </div>

        <div>
          {result ? (
            <div className="result-box">
              <div className="result-label">{result.label}</div>
              <div className="result-value">${fmt(result.pv)}</div>
              <hr className="result-divider" />
              <div className="result-detail">
                <span className="result-hl">Valor acumulado (AV)</span>   = ${fmt(result.fv)}<br />
                <span className="result-hl">Suma de pagos</span>           = ${fmt(result.totalPmts)}<br />
                <span className="result-hl">Interés total generado</span>  = ${fmt(result.totalInterest)}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">◎</div>
              Ingresa parámetros y presiona Calcular
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3.3 AmortPanel — Tablas de Amortización con Abonos Extraordinarios
// -----------------------------------------------------------------------------
// Genera la tabla completa período a período.
// Una vez generada, el usuario puede agregar abonos extraordinarios
// en cualquier período. La tabla se recalcula automáticamente mostrando:
//   - El impacto período a período del abono
//   - Cuánto interés se ahorró vs el escenario sin abonos
//   - Cuántos períodos se acortó el préstamo
// -----------------------------------------------------------------------------
function AmortPanel() {

  // ── Estado: parámetros base del préstamo ──
  const [inputs, setInputs] = useState({
    pv:   10000,      // monto del préstamo
    i:    6,          // tasa efectiva anual (%)
    n:    12,         // número de períodos
    type: "french",   // esquema de amortización
  });

  // ── Estado: tabla base (sin abonos) ──
  const [baseRows,    setBaseRows]    = useState([]);
  const [baseSummary, setBaseSummary] = useState(null);

  // ── Estado: mapa de abonos extraordinarios { período: monto } ──
  // Ejemplo: { 3: 500, 7: 1000 } = $500 en período 3, $1000 en período 7
  const [extraMap, setExtraMap] = useState({});

  // ── Estado: tabla con abonos aplicados ──
  // Solo existe cuando hay al menos un abono registrado
  const [extraRows,    setExtraRows]    = useState([]);
  const [extraSummary, setExtraSummary] = useState(null);

  // ── Estado: input temporal para agregar un abono ──
  // El usuario escribe en la tabla y aquí se guarda antes de confirmar
  const [pendingExtra, setPendingExtra] = useState({ t: "", amount: "" });

  // ── Estado: mensaje de confirmación al agregar un abono ──
  const [addedMsg, setAddedMsg] = useState("");

  const set = (k, v) => setInputs(prev => ({ ...prev, [k]: v }));

  // ── Función: generar tabla base (sin abonos) ──
  const calculate = () => {
    const i  = parseFloat(inputs.i) / 100;
    const n  = parseInt(inputs.n);
    const pv = parseFloat(inputs.pv);

    // Tabla sin ningún abono extraordinario → extraMap vacío {}
    const schedule = amortizationSchedule(pv, i, n, inputs.type, {});
    setBaseRows(schedule);

    const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
    const totalPmt      = schedule.reduce((s, r) => s + r.pmt, 0);
    setBaseSummary({ totalInterest, totalPmt, pv, periods: schedule.length });

    // Resetear abonos previos al generar una tabla nueva
    setExtraMap({});
    setExtraRows([]);
    setExtraSummary(null);
    setPendingExtra({ t: "", amount: "" });
    setAddedMsg("");
  };

  // ── Función: agregar un abono extraordinario ──
  // Valida el input, actualiza el mapa de abonos y recalcula la tabla
  const addExtra = () => {
    const t      = parseInt(pendingExtra.t);
    const amount = parseFloat(pendingExtra.amount);

    // Validaciones básicas
    if (isNaN(t) || isNaN(amount) || amount <= 0) return;
    if (t < 1 || t > parseInt(inputs.n))          return;

    // Actualizar el mapa acumulando el abono (si ya había uno en ese período, sumar)
    const newMap = { ...extraMap, [t]: (extraMap[t] || 0) + amount };
    setExtraMap(newMap);

    // Recalcular la tabla completa con todos los abonos registrados
    const i  = parseFloat(inputs.i) / 100;
    const n  = parseInt(inputs.n);
    const pv = parseFloat(inputs.pv);

    const schedule = amortizationSchedule(pv, i, n, inputs.type, newMap);
    setExtraRows(schedule);

    const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
    const totalPmt      = schedule.reduce((s, r) => s + r.pmt + r.extra, 0);
    setExtraSummary({
      totalInterest,
      totalPmt,
      pv,
      periods: schedule.length,
      // Ahorro vs tabla base: cuánto interés se dejó de pagar
      interestSaved: baseSummary.totalInterest - totalInterest,
      // Períodos ahorrados: cuánto se acortó el préstamo
      periodsSaved: baseSummary.periods - schedule.length,
    });

    // Feedback visual y resetear inputs del formulario de abono
    setAddedMsg(`✓ Abono de $${fmt(amount)} registrado en período ${t}`);
    setPendingExtra({ t: "", amount: "" });
    setTimeout(() => setAddedMsg(""), 3000);   // ocultar mensaje después de 3s
  };

  // ── Función: eliminar un abono extraordinario ──
  const removeExtra = (t) => {
    const newMap = { ...extraMap };
    delete newMap[t];   // eliminar el abono de ese período
    setExtraMap(newMap);

    // Si no quedan abonos, mostrar solo la tabla base
    if (Object.keys(newMap).length === 0) {
      setExtraRows([]);
      setExtraSummary(null);
      return;
    }

    // Recalcular con los abonos restantes
    const i  = parseFloat(inputs.i) / 100;
    const n  = parseInt(inputs.n);
    const pv = parseFloat(inputs.pv);

    const schedule = amortizationSchedule(pv, i, n, inputs.type, newMap);
    setExtraRows(schedule);

    const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
    const totalPmt      = schedule.reduce((s, r) => s + r.pmt + r.extra, 0);
    setExtraSummary({
      totalInterest, totalPmt, pv,
      periods: schedule.length,
      interestSaved: baseSummary.totalInterest - totalInterest,
      periodsSaved:  baseSummary.periods - schedule.length,
    });
  };

  // Decidir qué tabla mostrar: con abonos (si existen) o base
  const displayRows    = extraRows.length > 0 ? extraRows    : baseRows;
  const hasExtras      = Object.keys(extraMap).length > 0;
  const totalExtrasPaid = Object.values(extraMap).reduce((s, v) => s + v, 0);

  return (
    <div>
      <div className="formula">
        Francés: PMT = PV·i / (1−(1+i)⁻ⁿ) &nbsp;|&nbsp;
        Alemán: K = PV/n &nbsp;|&nbsp;
        Abono extraordinario → reduce saldo capital directo
      </div>

      {/* ── Fila 1: formulario base + resumen comparativo ── */}
      <div className="grid-2" style={{ marginBottom: 24 }}>

        {/* Parámetros del préstamo */}
        <div className="card">
          <div className="card-title">Parámetros del Préstamo</div>

          <div className="field">
            <label>Monto del préstamo ($)</label>
            <input type="number" value={inputs.pv}
              onChange={e => set("pv", e.target.value)} />
          </div>
          <div className="field">
            <label>Tasa efectiva anual (%)</label>
            <input type="number" step="0.01" value={inputs.i}
              onChange={e => set("i", e.target.value)} />
          </div>
          <div className="field">
            <label>Número de períodos</label>
            <input type="number" value={inputs.n}
              onChange={e => set("n", e.target.value)} />
          </div>
          <div className="field">
            <label>Esquema de amortización</label>
            <select value={inputs.type} onChange={e => set("type", e.target.value)}>
              <option value="french">Francés — cuota constante</option>
              <option value="german">Alemán — capital constante</option>
              <option value="american">Americano — bullet (bala)</option>
            </select>
          </div>
          <button className="btn" onClick={calculate}>Generar Tabla</button>
        </div>

        {/* Resumen comparativo: aparece cuando hay tabla base */}
        {baseSummary && (
          <div className="card">
            <div className="card-title">
              {hasExtras ? "Comparativo: Base vs Con Abonos" : "Resumen Base"}
            </div>

            {/* Fila: Capital */}
            <div className="info-row">
              <span className="info-key">Capital prestado</span>
              <span>${fmt(baseSummary.pv)}</span>
            </div>

            {/* Fila: Períodos — muestra ahorro si hay abonos */}
            <div className="info-row">
              <span className="info-key">Períodos totales</span>
              <span>
                {hasExtras && extraSummary ? (
                  <>
                    <span style={{ textDecoration: "line-through", color: "var(--gray-light)", marginRight: 8 }}>
                      {baseSummary.periods}
                    </span>
                    <span style={{ color: "#1a5c3a", fontWeight: 600 }}>
                      {extraSummary.periods}
                      {extraSummary.periodsSaved > 0 &&
                        <span style={{ fontSize: 10, marginLeft: 6, color: "#1a5c3a" }}>
                          (−{extraSummary.periodsSaved})
                        </span>
                      }
                    </span>
                  </>
                ) : baseSummary.periods}
              </span>
            </div>

            {/* Fila: Interés total — muestra ahorro en verde */}
            <div className="info-row">
              <span className="info-key">Total intereses</span>
              <span>
                {hasExtras && extraSummary ? (
                  <>
                    <span style={{ textDecoration: "line-through", color: "var(--gray-light)", marginRight: 8 }}>
                      ${fmt(baseSummary.totalInterest)}
                    </span>
                    <span className="td-navy">${fmt(extraSummary.totalInterest)}</span>
                  </>
                ) : <span className="td-navy">${fmt(baseSummary.totalInterest)}</span>}
              </span>
            </div>

            {/* Fila: Ahorro de interés — solo si hay abonos */}
            {hasExtras && extraSummary && extraSummary.interestSaved > 0 && (
              <div className="info-row" style={{ background: "#f0fff4", margin: "0 -28px", padding: "10px 28px" }}>
                <span className="info-key" style={{ color: "#1a5c3a" }}>💰 Interés ahorrado</span>
                <span style={{ color: "#1a5c3a", fontWeight: 600 }}>
                  ${fmt(extraSummary.interestSaved)}
                </span>
              </div>
            )}

            {/* Fila: Total abonos extraordinarios */}
            {hasExtras && (
              <div className="info-row">
                <span className="info-key">Total abonos extra</span>
                <span style={{ color: "#b8960c", fontWeight: 600 }}>${fmt(totalExtrasPaid)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Panel de abonos extraordinarios ── */}
      {/* Solo visible cuando ya existe una tabla generada */}
      {baseRows.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Abonos Extraordinarios</div>

          {/* Formulario para agregar un abono */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 16 }}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Período</label>
              <input
                type="number"
                min="1" max={inputs.n}
                placeholder={`1 – ${inputs.n}`}
                value={pendingExtra.t}
                onChange={e => setPendingExtra(p => ({ ...p, t: e.target.value }))}
              />
            </div>
            <div className="field" style={{ flex: 2, marginBottom: 0 }}>
              <label>Monto del abono ($)</label>
              <input
                type="number"
                min="1"
                placeholder="ej: 500"
                value={pendingExtra.amount}
                onChange={e => setPendingExtra(p => ({ ...p, amount: e.target.value }))}
              />
            </div>
            <button
              className="btn"
              style={{ width: "auto", padding: "10px 20px", marginTop: 0, flex: "0 0 auto" }}
              onClick={addExtra}
            >
              + Agregar
            </button>
          </div>

          {/* Mensaje de confirmación (desaparece después de 3s) */}
          {addedMsg && (
            <div style={{
              fontSize: 11, color: "#1a5c3a", background: "#f0fff4",
              border: "1px solid #c3e6cb", padding: "8px 12px", marginBottom: 12,
            }}>
              {addedMsg}
            </div>
          )}

          {/* Lista de abonos registrados con botón para eliminar */}
          {hasExtras && (
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gray-light)", marginBottom: 8 }}>
                Abonos registrados
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(extraMap)
                  .sort(([a], [b]) => a - b)    // ordenar por período
                  .map(([t, amount]) => (
                    <div key={t} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: "var(--off-white)", border: "1px solid var(--rule)",
                      borderLeft: "3px solid var(--gold)",
                      padding: "6px 12px", fontSize: 11,
                    }}>
                      <span style={{ color: "var(--gray-mid)" }}>Período {t}</span>
                      <span style={{ color: "var(--gold)", fontWeight: 600 }}>${fmt(amount)}</span>
                      {/* Botón X para eliminar este abono */}
                      <span
                        onClick={() => removeExtra(parseInt(t))}
                        style={{ cursor: "pointer", color: "var(--gray-light)", fontSize: 13, lineHeight: 1 }}
                        title="Eliminar este abono"
                      >
                        ×
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Instrucción cuando no hay abonos aún */}
          {!hasExtras && (
            <div style={{ fontSize: 11, color: "var(--gray-light)", fontStyle: "italic" }}>
              Ingresa un período y monto para simular un abono extraordinario.
              La tabla se recalculará automáticamente.
            </div>
          )}
        </div>
      )}

      {/* ── Tabla de amortización ── */}
      {displayRows.length > 0 && (
        <div className="card">
          <div className="card-title">
            Tabla de Amortización — {displayRows.length} períodos
            {hasExtras && (
              <span style={{ marginLeft: 12, color: "var(--gold)" }}>
                ★ Con {Object.keys(extraMap).length} abono(s) extraordinario(s)
              </span>
            )}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Período</th>
                  <th className="td-right">Cuota</th>
                  <th className="td-right">Interés</th>
                  <th className="td-right">Capital</th>
                  {/* Columna de abono extra — solo visible si hay abonos */}
                  {hasExtras && <th className="td-right" style={{ color: "var(--gold)" }}>Abono Extra</th>}
                  <th className="td-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map(r => (
                  <tr
                    key={r.t}
                    style={{
                      // Filas con abono extraordinario: fondo dorado suave
                      background: r.extra > 0 ? "rgba(184,150,12,0.06)" : undefined,
                      // Fila de cancelación anticipada: fondo verde suave
                      ...(r.isCancelled && r.t < parseInt(inputs.n)
                        ? { background: "rgba(26,92,58,0.07)" }
                        : {}),
                    }}
                  >
                    <td>
                      {r.t}
                      {/* Badge "cancelado" en el último período si fue anticipado */}
                      {r.isCancelled && r.t < parseInt(inputs.n) && (
                        <span style={{
                          marginLeft: 6, fontSize: 8, background: "#1a5c3a",
                          color: "white", padding: "1px 5px", letterSpacing: "0.1em"
                        }}>
                          CANCELADO
                        </span>
                      )}
                    </td>
                    <td className="td-right">${fmt(r.pmt)}</td>
                    <td className="td-right td-navy">${fmt(r.interest)}</td>
                    <td className="td-right td-green">${fmt(r.principal)}</td>
                    {/* Celda de abono extra: dorado si hay valor, vacía si no */}
                    {hasExtras && (
                      <td className="td-right" style={{ color: r.extra > 0 ? "var(--gold)" : "var(--gray-light)", fontWeight: r.extra > 0 ? 600 : 400 }}>
                        {r.extra > 0 ? `$${fmt(r.extra)}` : "—"}
                      </td>
                    )}
                    <td className="td-right">${fmt(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3.4 RateConvPanel — Conversión de Tasas
// -----------------------------------------------------------------------------
// Conversión en tiempo real: al cambiar el input, la tabla se actualiza
// instantáneamente (sin necesidad de botón Calcular).
// Muestra todas las tasas equivalentes simultáneamente.
// -----------------------------------------------------------------------------
function RateConvPanel() {

  // Solo dos inputs: la tasa y su frecuencia de capitalización
  const [r, setR] = useState(6);    // tasa nominal en %
  const [m, setM] = useState(12);   // períodos de capitalización

  // Calcular directamente en el render (sin useState para el resultado)
  // Esto funciona porque las conversiones son instantáneas (sin async)
  const i_eff = effectiveRate(parseFloat(r) / 100, parseInt(m), "nominal");
  const delta  = Math.log(1 + i_eff);   // fuerza de interés: δ = ln(1 + i)

  // Tabla de equivalencias — fórmula inversa: i^(m) = m · [(1+i)^(1/m) − 1]
  const equivalentRates = [
    { label: "Efectiva anual (m = 1)",     val: Math.pow(1 + i_eff, 1/1)   - 1 },
    { label: "Nominal semestral (m = 2)",  val: 2   * (Math.pow(1 + i_eff, 1/2)   - 1) },
    { label: "Nominal trimestral (m = 4)", val: 4   * (Math.pow(1 + i_eff, 1/4)   - 1) },
    { label: "Nominal mensual (m = 12)",   val: 12  * (Math.pow(1 + i_eff, 1/12)  - 1) },
    { label: "Nominal diaria (m = 365)",   val: 365 * (Math.pow(1 + i_eff, 1/365) - 1) },
    { label: "Fuerza de interés δ",        val: delta },
  ];

  return (
    <div>
      <div className="formula">
        i^(m) = m · [(1+i)^(1/m) − 1] &nbsp;|&nbsp; δ = ln(1 + i) &nbsp;|&nbsp; i = e^δ − 1
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Tasa de Entrada</div>

          <div className="field">
            <label>Tasa nominal i^(m) (%)</label>
            <input type="number" step="0.01" value={r}
              onChange={e => setR(e.target.value)} />
          </div>

          <div className="field">
            <label>Capitalización m</label>
            <select value={m} onChange={e => setM(e.target.value)}>
              <option value="1">Anual</option>
              <option value="2">Semestral</option>
              <option value="4">Trimestral</option>
              <option value="12">Mensual</option>
              <option value="365">Diaria</option>
            </select>
          </div>

          {/* El resultado se actualiza en tiempo real — no necesita botón */}
          <div className="result-box" style={{ marginTop: 20 }}>
            <div className="result-label">Tasa Efectiva Anual Equivalente</div>
            <div className="result-value">{fmtPct(i_eff)}</div>
            <div className="result-detail">
              Fuerza de interés δ = <span className="result-hl">{fmtPct(delta)}</span>
            </div>
          </div>
        </div>

        {/* Todas las equivalencias en una tabla */}
        <div className="card">
          <div className="card-title">
            Tasas equivalentes — misma acumulación en 1 año
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Convención</th>
                <th className="td-right">Tasa</th>
              </tr>
            </thead>
            <tbody>
              {equivalentRates.map(row => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  {/* Los valores se recalculan automáticamente al cambiar el input */}
                  <td className="td-right td-green">{fmtPct(row.val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SECCIÓN 4: CONFIGURACIÓN DE NAVEGACIÓN
// =============================================================================
// Centraliza la estructura de la app:
//   - NAV_ITEMS: ítem activos del sidebar (Módulo 1)
//   - COMING_SOON: ítem deshabilitados (Módulos 2 y 3)
//   - PAGE_META: metadatos de cada panel (título, descripción, referencia FM)
//   - PANEL_COMPONENTS: mapeo id → componente React
// =============================================================================

// Ítems del sidebar — Módulo 1 activo
const NAV_ITEMS = [
  { id: "tvm",     label: "Valor del Dinero en el Tiempo" },
  { id: "annuity", label: "Anualidades"                   },
  { id: "amort",   label: "Amortización"                  },
  { id: "rates",   label: "Conversión de Tasas"           },
];

// Herramientas de los próximos módulos — deshabilitadas visualmente
const COMING_SOON = [
  "Bond Pricer",
  "Yield Curve",
  "Duration & Convexity",
  "Immunización de Pasivos",
];

// Metadatos de cada panel para el encabezado dinámico
const PAGE_META = {
  tvm: {
    eyebrow: "Sección 1 & 2 — FM",
    title:   "Valor del Dinero\nen el Tiempo",
    desc:    "Calcula valores presentes y futuros para un capital único bajo cualquier convención de tasa: nominal, efectiva anual o fuerza de interés continua.",
    fm:      "FM Sections 1–2: Interest Measurement",
  },
  annuity: {
    eyebrow: "Sección 2 — FM",
    title:   "Valuación de\nAnualidades",
    desc:    "Anualidades-vencidas, anticipadas y diferidas con notación estándar FM. Calcula PV, valor acumulado y desglose de interés total.",
    fm:      "FM Section 2: Annuities",
  },
  amort: {
    eyebrow: "Sección 2 — FM",
    title:   "Tablas de\nAmortización",
    desc:    "Tabla período a período para préstamos franceses, alemanes y americanos. Base conceptual para la valuación de bonos (Módulo 2).",
    fm:      "FM Section 2: Loan Repayment",
  },
  rates: {
    eyebrow: "Sección 1 — FM",
    title:   "Conversión de\nTasas de Interés",
    desc:    "Dado i^(m) y m, calcula instantáneamente todas las tasas equivalentes y la fuerza de interés δ. Conversión en tiempo real sin botón.",
    fm:      "FM Section 1: Interest Rate Measurement",
  },
};

// Mapeo panel_id → componente React instanciado
const PANEL_COMPONENTS = {
  tvm:     <TVMPanel />,
  annuity: <AnnuityPanel />,
  amort:   <AmortPanel />,
  rates:   <RateConvPanel />,
};

// =============================================================================
// SECCIÓN 5: COMPONENTE RAÍZ — App
// =============================================================================
// Punto de entrada de la aplicación.
// Gestiona qué panel está activo y renderiza el layout completo.
// Es el export default que Vercel busca para renderizar la página.
// =============================================================================
export default function App() {

  // Panel activo — "tvm" por defecto al cargar
  const [active, setActive] = useState("tvm");

  const meta  = PAGE_META[active];           // metadatos del panel activo
  const panel = PANEL_COMPONENTS[active];    // componente del panel activo

  return (
    <div className="app">

      {/* Inyectar estilos globales al DOM */}
      <style>{STYLES}</style>

      {/* ── HEADER INSTITUCIONAL ── */}
      <header className="header">
        <span className="header-logo">Fixed Income Risk Analyzer</span>
        <span className="header-module">Módulo 1 — Time Value Engine</span>
        <span className="header-badge">SOA · FM Exam Prep</span>
      </header>

      {/* ── LAYOUT: sidebar izquierdo + contenido derecho ── */}
      <div className="layout">

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">

          {/* Módulo 1: ítems activos y clickeables */}
          <div className="sidebar-label">Módulo 1 — Activo</div>
          {NAV_ITEMS.map(item => (
            <div
              key={item.id}
              className={`nav-item ${active === item.id ? "active" : ""}`}
              onClick={() => setActive(item.id)}   // cambiar panel al hacer click
            >
              <div className="nav-bullet" />
              {item.label}
            </div>
          ))}

          <hr className="sidebar-divider" />

          {/* Módulos 2 & 3: deshabilitados — indican el roadmap del proyecto */}
          <div className="sidebar-label">Módulos 2 & 3 — En construcción</div>
          {COMING_SOON.map(label => (
            <div
              key={label}
              className="nav-item"
              style={{ opacity: 0.35, cursor: "not-allowed", fontSize: 10 }}
            >
              <div className="nav-bullet" />
              {label}
            </div>
          ))}
        </aside>

        {/* ── CONTENIDO PRINCIPAL ── */}
        <main className="main">

          {/* Encabezado dinámico: cambia según el panel activo */}
          <div className="page-eyebrow">{meta.eyebrow}</div>
          <div className="page-title">
            {/* Dividir en dos líneas usando \n como separador */}
            {meta.title.split("\n").map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </div>
          <div className="fm-tag">▸ {meta.fm}</div>
          <div className="page-desc">{meta.desc}</div>

          {/* El componente del panel activo se renderiza aquí */}
          {panel}

        </main>
      </div>
    </div>
  );
}
