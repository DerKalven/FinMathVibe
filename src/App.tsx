// =============================================================================
// FIXED INCOME RISK ANALYZER — Módulo 1: Time Value Engine
// =============================================================================
// Stack: React + TypeScript, CSS-in-JS, sin dependencias externas.
// Estilo: Institucional McKinsey — azul marino, blanco, dorado.
// =============================================================================

import React, { useState } from "react";

// =============================================================================
// SECCIÓN 1: TIPOS TypeScript
// =============================================================================
// Definimos interfaces para que TypeScript entienda la forma de cada objeto.
// Esto elimina todos los errores "property does not exist" del build.
// =============================================================================

interface TVMResult {
  value: number;
  label: string;
  detail: string;
  i_eff: number;
  i_nom: number;
  delta: number;
}

interface AnnuityResult {
  pv: number;
  fv: number;
  label: string;
  formula: string;
  totalPmts: number;
  totalInterest: number;
}

interface AmortRow {
  t: number;
  pmt: number;
  interest: number;
  principal: number;
  extra: number;
  totalPaid: number;
  balance: number;
  isCancelled: boolean;
}

interface AmortSummary {
  totalInterest: number;
  totalPmt: number;
  pv: number;
  periods: number;
  interestSaved?: number;
  periodsSaved?: number;
}

// Tipo para el mapa de abonos extraordinarios { período: monto }
type ExtraMap = Record<number, number>;

// =============================================================================
// SECCIÓN 2: ESTILOS GLOBALES
// =============================================================================

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:       #002244;
    --navy-light: #003366;
    --blue-mid:   #0a4d8c;
    --white:      #ffffff;
    --off-white:  #f7f8fa;
    --ink:        #0d0d0d;
    --gray-mid:   #666666;
    --gray-light: #999999;
    --rule:       #e0e3e8;
    --result-bg:  #001833;
    --gold:       #b8960c;
  }

  body { background: var(--white); }

  .app { font-family: 'IBM Plex Mono', monospace; background: var(--white); min-height: 100vh; color: var(--ink); }

  .header { background: var(--navy); color: var(--white); padding: 0 48px; height: 64px; display: flex; align-items: center; border-bottom: 3px solid var(--gold); }
  .header-logo { font-family: 'Libre Baskerville', serif; font-size: 16px; font-weight: 700; color: var(--white); padding-right: 32px; border-right: 1px solid rgba(255,255,255,0.2); }
  .header-module { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.55); padding-left: 32px; }
  .header-badge { margin-left: auto; font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); border: 1px solid var(--gold); padding: 4px 12px; }

  .layout { display: grid; grid-template-columns: 240px 1fr; min-height: calc(100vh - 64px); }

  .sidebar { background: var(--navy); color: var(--white); padding: 40px 0; position: sticky; top: 0; height: calc(100vh - 64px); overflow-y: auto; }
  .sidebar-label { font-size: 8px; letter-spacing: 0.25em; text-transform: uppercase; color: rgba(255,255,255,0.35); padding: 0 28px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 8px; }
  .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 28px; font-size: 11px; letter-spacing: 0.06em; color: rgba(255,255,255,0.55); cursor: pointer; transition: all 0.15s ease; border-left: 3px solid transparent; }
  .nav-item:hover { color: var(--white); background: var(--navy-light); }
  .nav-item.active { color: var(--white); border-left-color: var(--gold); background: rgba(184,150,12,0.1); font-weight: 500; }
  .nav-bullet { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.2); flex-shrink: 0; }
  .nav-item.active .nav-bullet { background: var(--gold); }
  .sidebar-divider { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 20px 0; }

  .main { background: var(--off-white); padding: 48px 56px; max-width: 1000px; }
  .page-eyebrow { font-family: 'Libre Baskerville', serif; font-style: italic; font-size: 14px; color: var(--gray-light); margin-bottom: 6px; }
  .page-title { font-family: 'Libre Baskerville', serif; font-size: 32px; font-weight: 700; color: var(--navy); letter-spacing: -0.5px; line-height: 1.15; margin-bottom: 12px; }
  .page-desc { font-size: 11px; color: var(--gray-mid); line-height: 1.8; max-width: 520px; margin-bottom: 8px; }
  .fm-tag { display: inline-block; background: var(--navy); color: var(--white); font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; padding: 3px 10px; margin-bottom: 32px; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  .card { background: var(--white); border: 1px solid var(--rule); border-top: 3px solid var(--navy); padding: 28px; }
  .card-title { font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gray-light); margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--rule); }

  .formula { background: var(--navy); color: rgba(255,255,255,0.85); padding: 12px 20px; font-size: 12px; font-style: italic; margin-bottom: 24px; border-left: 3px solid var(--gold); letter-spacing: 0.02em; }

  .field { margin-bottom: 16px; }
  .field label { display: block; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gray-mid); margin-bottom: 7px; }
  .field input, .field select { width: 100%; background: var(--off-white); border: 1px solid var(--rule); border-bottom: 2px solid var(--navy); padding: 10px 12px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: var(--ink); outline: none; transition: border-color 0.15s; border-radius: 0; appearance: none; }
  .field input:focus, .field select:focus { border-bottom-color: var(--gold); background: var(--white); }

  .btn { width: 100%; background: var(--navy); color: var(--white); border: none; padding: 13px; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer; transition: background 0.15s; margin-top: 8px; }
  .btn:hover { background: var(--blue-mid); }

  .result-box { background: var(--result-bg); color: var(--white); padding: 28px; border-top: 3px solid var(--gold); }
  .result-label { font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 8px; }
  .result-value { font-family: 'Libre Baskerville', serif; font-size: 40px; font-weight: 700; color: var(--white); letter-spacing: -1.5px; line-height: 1; margin-bottom: 16px; }
  .result-divider { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 14px 0; }
  .result-detail { font-size: 11px; color: rgba(255,255,255,0.5); line-height: 1.9; }
  .result-hl { color: var(--gold); font-weight: 500; }

  .tabs { display: flex; border-bottom: 2px solid var(--rule); margin-bottom: 28px; }
  .tab { padding: 10px 24px; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; color: var(--gray-light); border-bottom: 3px solid transparent; margin-bottom: -2px; transition: all 0.15s; }
  .tab:hover { color: var(--navy); }
  .tab.active { color: var(--navy); border-bottom-color: var(--navy); font-weight: 500; }

  .table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .table th { text-align: left; font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gray-light); padding: 8px 12px; border-bottom: 2px solid var(--navy); background: var(--off-white); }
  .table td { padding: 9px 12px; border-bottom: 1px solid var(--rule); font-variant-numeric: tabular-nums; }
  .table tr:hover td { background: #f0f4ff; }
  .table tr:last-child td { border-bottom: none; }
  .td-right { text-align: right; }
  .td-navy { color: var(--navy); font-weight: 500; }
  .td-green { color: #1a5c3a; }

  .info-row { display: flex; justify-content: space-between; align-items: baseline; padding: 10px 0; border-bottom: 1px solid var(--rule); font-size: 12px; }
  .info-row:last-child { border-bottom: none; }
  .info-key { color: var(--gray-mid); font-size: 10px; letter-spacing: 0.05em; }

  .empty-state { height: 100%; min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--gray-light); font-size: 11px; gap: 10px; border: 1px dashed var(--rule); }
  .empty-icon { font-size: 28px; opacity: 0.3; }
`;

// =============================================================================
// SECCIÓN 3: FUNCIONES MATEMÁTICAS
// =============================================================================

/** Formatea número con separador de miles. Retorna "—" si no es válido. */
const fmt = (n: number, d = 2): string =>
  isNaN(n) ? "—" : n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Convierte decimal a string de porcentaje con 4 decimales. */
const fmtPct = (n: number, d = 4): string =>
  isNaN(n) ? "—" : (n * 100).toFixed(d) + "%";

/**
 * effectiveRate — Convierte cualquier convención de tasa a tasa efectiva anual.
 * - "nominal":    (1 + rate/m)^m − 1
 * - "effective":  rate (sin transformación)
 * - "continuous": e^rate − 1
 */
function effectiveRate(rate: number, m: number, conv = "nominal"): number {
  if (conv === "continuous") return Math.exp(rate) - 1;
  if (conv === "effective")  return rate;
  return Math.pow(1 + rate / m, m) - 1;
}

/** FV = PV · (1 + i)^n */
function calcFV(pv: number, i: number, n: number): number {
  return pv * Math.pow(1 + i, n);
}

/** PV = FV · v^n   donde v = 1/(1+i) */
function calcPV(fv: number, i: number, n: number): number {
  return fv / Math.pow(1 + i, n);
}

/** PV de anualidad-vencida: PMT · (1 − v^n) / i */
function annuityImmediate(pmt: number, i: number, n: number): number {
  if (i === 0) return pmt * n;
  return pmt * (1 - Math.pow(1 + i, -n)) / i;
}

/** PV de anualidad-anticipada: (1+i) · a⌐n|i */
function annuityDue(pmt: number, i: number, n: number): number {
  return annuityImmediate(pmt, i, n) * (1 + i);
}

/** PV de anualidad diferida: v^d · a⌐n|i */
function annuityDeferred(pmt: number, i: number, n: number, d: number): number {
  return annuityImmediate(pmt, i, n) * Math.pow(1 + i, -d);
}

/**
 * amortizationSchedule — Tabla período a período con soporte para abonos extraordinarios.
 *
 * Esquemas:
 *   "french"   → cuota constante PMT = PV·i / (1−(1+i)^−n)
 *   "german"   → capital constante K = PV/n
 *   "american" → solo interés hasta vencimiento (bullet)
 *
 * extraMap: { período: monto_abono } — se aplica directo al capital
 */
function amortizationSchedule(
  pv: number,
  i: number,
  n: number,
  type = "french",
  extraMap: ExtraMap = {}
): AmortRow[] {
  const rows: AmortRow[] = [];

  if (type === "french") {
    let pmt       = (pv * i) / (1 - Math.pow(1 + i, -n));
    let balance   = pv;
    let remaining = n;
    let t         = 1;

    while (balance > 0.005 && t <= n + Object.keys(extraMap).length + 1) {
      const interest  = balance * i;
      const principal = Math.min(pmt - interest, balance);
      const extra     = Math.min(extraMap[t] ?? 0, Math.max(0, balance - principal));

      balance = Math.max(0, balance - principal - extra);

      rows.push({ t, pmt: principal + interest, interest, principal, extra, totalPaid: principal + interest + extra, balance, isCancelled: balance === 0 });

      remaining--;
      if (extra > 0 && balance > 0 && remaining > 0) {
        pmt = (balance * i) / (1 - Math.pow(1 + i, -remaining));
      }
      if (balance === 0) break;
      t++;
    }

  } else if (type === "german") {
    const basePrincipal = pv / n;
    let balance = pv;

    for (let t = 1; t <= n && balance > 0.005; t++) {
      const interest  = balance * i;
      const principal = Math.min(basePrincipal, balance);
      const extra     = Math.min(extraMap[t] ?? 0, Math.max(0, balance - principal));
      balance = Math.max(0, balance - principal - extra);
      rows.push({ t, pmt: principal + interest, interest, principal, extra, totalPaid: principal + interest + extra, balance, isCancelled: balance === 0 });
      if (balance === 0) break;
    }

  } else {
    // Americano (bullet)
    let balance = pv;
    for (let t = 1; t <= n && balance > 0.005; t++) {
      const interest  = balance * i;
      const principal = t === n ? balance : 0;
      const extra     = t < n ? Math.min(extraMap[t] ?? 0, balance) : 0;
      balance = Math.max(0, balance - principal - extra);
      rows.push({ t, pmt: principal + interest, interest, principal, extra, totalPaid: principal + interest + extra, balance, isCancelled: balance === 0 });
      if (balance === 0) break;
    }
  }

  return rows;
}

// =============================================================================
// SECCIÓN 4: COMPONENTES
// =============================================================================

// -----------------------------------------------------------------------------
// 4.1 TVMPanel — Valor del Dinero en el Tiempo
// -----------------------------------------------------------------------------
function TVMPanel() {
  const [mode, setMode] = useState("fv");
  const [pv,   setPv]   = useState(1000);
  const [fv,   setFv]   = useState(0);
  const [i,    setI]    = useState(5);
  const [n,    setN]    = useState(10);
  const [conv, setConv] = useState("nominal");
  const [m,    setM]    = useState(12);
  const [result, setResult] = useState<TVMResult | null>(null);

  const calculate = () => {
    const i_eff = effectiveRate(i / 100, m, conv);
    let res: TVMResult;
    if (mode === "fv") {
      res = { value: calcFV(pv, i_eff, n), label: "Future Value", detail: `PV $${fmt(pv)} crece durante ${n} períodos`, i_eff, i_nom: i / 100, delta: Math.log(1 + i_eff) };
    } else {
      res = { value: calcPV(fv, i_eff, n), label: "Present Value", detail: `FV $${fmt(fv)} descontado ${n} períodos`, i_eff, i_nom: i / 100, delta: Math.log(1 + i_eff) };
    }
    setResult(res);
  };

  return (
    <div>
      <div className="formula">{mode === "fv" ? "FV = PV · (1 + i)ⁿ" : "PV = FV · (1 + i)⁻ⁿ = FV · vⁿ"}</div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Parámetros</div>
          <div className="field">
            <label>Calcular</label>
            <select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="fv">Future Value (dado PV)</option>
              <option value="pv">Present Value (dado FV)</option>
            </select>
          </div>
          {mode === "fv"
            ? <div className="field"><label>Present Value ($)</label><input type="number" value={pv} onChange={e => setPv(parseFloat(e.target.value))} /></div>
            : <div className="field"><label>Future Value ($)</label><input type="number" value={fv} onChange={e => setFv(parseFloat(e.target.value))} /></div>
          }
          <div className="field"><label>Tasa (%)</label><input type="number" step="0.01" value={i} onChange={e => setI(parseFloat(e.target.value))} /></div>
          <div className="field">
            <label>Convención de tasa</label>
            <select value={conv} onChange={e => setConv(e.target.value)}>
              <option value="nominal">Nominal i^(m)</option>
              <option value="effective">Efectiva anual i</option>
              <option value="continuous">Fuerza de interés δ</option>
            </select>
          </div>
          {conv === "nominal" && (
            <div className="field">
              <label>Capitalización (m)</label>
              <select value={m} onChange={e => setM(parseInt(e.target.value))}>
                <option value="1">Anual</option><option value="2">Semestral</option>
                <option value="4">Trimestral</option><option value="12">Mensual</option>
                <option value="365">Diaria</option>
              </select>
            </div>
          )}
          <div className="field"><label>Períodos (n)</label><input type="number" value={n} onChange={e => setN(parseFloat(e.target.value))} /></div>
          <button className="btn" onClick={calculate}>Calcular</button>
        </div>
        <div>
          {result ? (
            <div className="result-box">
              <div className="result-label">{result.label}</div>
              <div className="result-value">${fmt(result.value)}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{result.detail}</div>
              <hr className="result-divider" />
              <div className="result-detail">
                <span className="result-hl">i efectiva anual</span> = {fmtPct(result.i_eff)}<br />
                <span className="result-hl">i nominal</span> = {fmtPct(result.i_nom)}<br />
                <span className="result-hl">Fuerza δ</span> = {fmtPct(result.delta)}
              </div>
            </div>
          ) : (
            <div className="empty-state"><div className="empty-icon">◎</div>Ingresa parámetros y presiona Calcular</div>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4.2 AnnuityPanel — Anualidades
// -----------------------------------------------------------------------------
function AnnuityPanel() {
  const [type,   setType]   = useState("immediate");
  const [pmt,    setPmt]    = useState(100);
  const [i,      setI]      = useState(5);
  const [n,      setN]      = useState(20);
  const [d,      setD]      = useState(5);
  const [result, setResult] = useState<AnnuityResult | null>(null);

  const calculate = () => {
    const rate = i / 100;
    let pv: number, label: string, formula: string;
    if (type === "immediate") {
      pv = annuityImmediate(pmt, rate, n);
      label = "Anualidad Vencida — a⌐n|i";
      formula = "PV = PMT · (1 − vⁿ) / i";
    } else if (type === "due") {
      pv = annuityDue(pmt, rate, n);
      label = "Anualidad Anticipada — ä⌐n|i";
      formula = "PV = PMT · (1+i) · a⌐n|i";
    } else {
      pv = annuityDeferred(pmt, rate, n, d);
      label = `Anualidad Diferida ${d} períodos`;
      formula = `PV = v^${d} · PMT · a⌐${n}|i`;
    }
    const fv = calcFV(pv, rate, type === "deferred" ? n + d : n);
    setResult({ pv, fv, label, formula, totalPmts: pmt * n, totalInterest: fv - pmt * n });
  };

  return (
    <div>
      <div className="tabs">
        {[["immediate","Vencida"],["due","Anticipada"],["deferred","Diferida"]].map(([k,v]) => (
          <div key={k} className={`tab ${type === k ? "active" : ""}`} onClick={() => { setType(k); setResult(null); }}>{v}</div>
        ))}
      </div>
      {result && <div className="formula">{result.formula}</div>}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Parámetros</div>
          <div className="field"><label>Pago PMT ($)</label><input type="number" value={pmt} onChange={e => setPmt(parseFloat(e.target.value))} /></div>
          <div className="field"><label>Tasa efectiva anual (%)</label><input type="number" step="0.01" value={i} onChange={e => setI(parseFloat(e.target.value))} /></div>
          <div className="field"><label>Pagos n</label><input type="number" value={n} onChange={e => setN(parseFloat(e.target.value))} /></div>
          {type === "deferred" && <div className="field"><label>Diferimiento d</label><input type="number" value={d} onChange={e => setD(parseFloat(e.target.value))} /></div>}
          <button className="btn" onClick={calculate}>Calcular</button>
        </div>
        <div>
          {result ? (
            <div className="result-box">
              <div className="result-label">{result.label}</div>
              <div className="result-value">${fmt(result.pv)}</div>
              <hr className="result-divider" />
              <div className="result-detail">
                <span className="result-hl">Valor acumulado</span> = ${fmt(result.fv)}<br />
                <span className="result-hl">Suma pagos</span> = ${fmt(result.totalPmts)}<br />
                <span className="result-hl">Interés total</span> = ${fmt(result.totalInterest)}
              </div>
            </div>
          ) : (
            <div className="empty-state"><div className="empty-icon">◎</div>Ingresa parámetros y presiona Calcular</div>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4.3 AmortPanel — Amortización con abonos extraordinarios
// -----------------------------------------------------------------------------
function AmortPanel() {
  const [pvInput,   setPvInput]   = useState(10000);
  const [iInput,    setIInput]    = useState(6);
  const [nInput,    setNInput]    = useState(12);
  const [type,      setType]      = useState("french");
  const [baseRows,  setBaseRows]  = useState<AmortRow[]>([]);
  const [baseSummary, setBaseSummary] = useState<AmortSummary | null>(null);
  const [extraMap,  setExtraMap]  = useState<ExtraMap>({});
  const [extraRows, setExtraRows] = useState<AmortRow[]>([]);
  const [extraSummary, setExtraSummary] = useState<AmortSummary | null>(null);
  const [pendingT,  setPendingT]  = useState("");
  const [pendingAmt,setPendingAmt]= useState("");
  const [addedMsg,  setAddedMsg]  = useState("");

  const calculate = () => {
    const i  = iInput / 100;
    const schedule = amortizationSchedule(pvInput, i, nInput, type, {});
    setBaseRows(schedule);
    setBaseSummary({
      totalInterest: schedule.reduce((s, r) => s + r.interest, 0),
      totalPmt:      schedule.reduce((s, r) => s + r.pmt, 0),
      pv: pvInput, periods: schedule.length,
    });
    setExtraMap({}); setExtraRows([]); setExtraSummary(null);
    setPendingT(""); setPendingAmt(""); setAddedMsg("");
  };

  const recalcWithExtras = (newMap: ExtraMap) => {
    const i = iInput / 100;
    const schedule = amortizationSchedule(pvInput, i, nInput, type, newMap);
    setExtraRows(schedule);
    const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
    setExtraSummary({
      totalInterest,
      totalPmt: schedule.reduce((s, r) => s + r.pmt + r.extra, 0),
      pv: pvInput, periods: schedule.length,
      interestSaved: (baseSummary?.totalInterest ?? 0) - totalInterest,
      periodsSaved:  (baseSummary?.periods ?? 0) - schedule.length,
    });
  };

  const addExtra = () => {
    const t      = parseInt(pendingT);
    const amount = parseFloat(pendingAmt);
    if (isNaN(t) || isNaN(amount) || amount <= 0 || t < 1 || t > nInput) return;
    const newMap: ExtraMap = { ...extraMap, [t]: (extraMap[t] ?? 0) + amount };
    setExtraMap(newMap);
    recalcWithExtras(newMap);
    setAddedMsg(`✓ Abono de $${fmt(amount)} en período ${t}`);
    setPendingT(""); setPendingAmt("");
    setTimeout(() => setAddedMsg(""), 3000);
  };

  const removeExtra = (t: number) => {
    const newMap: ExtraMap = { ...extraMap };
    delete newMap[t];
    setExtraMap(newMap);
    if (Object.keys(newMap).length === 0) { setExtraRows([]); setExtraSummary(null); return; }
    recalcWithExtras(newMap);
  };

  const displayRows = extraRows.length > 0 ? extraRows : baseRows;
  const hasExtras   = Object.keys(extraMap).length > 0;
  const totalExtrasPaid = Object.values(extraMap).reduce((s: number, v: number) => s + v, 0);

  return (
    <div>
      <div className="formula">Francés: PMT = PV·i/(1−(1+i)⁻ⁿ) | Alemán: K=PV/n | Abono extra → capital directo</div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">Parámetros del Préstamo</div>
          <div className="field"><label>Monto ($)</label><input type="number" value={pvInput} onChange={e => setPvInput(parseFloat(e.target.value))} /></div>
          <div className="field"><label>Tasa efectiva anual (%)</label><input type="number" step="0.01" value={iInput} onChange={e => setIInput(parseFloat(e.target.value))} /></div>
          <div className="field"><label>Períodos</label><input type="number" value={nInput} onChange={e => setNInput(parseInt(e.target.value))} /></div>
          <div className="field">
            <label>Esquema</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="french">Francés — cuota constante</option>
              <option value="german">Alemán — capital constante</option>
              <option value="american">Americano — bullet</option>
            </select>
          </div>
          <button className="btn" onClick={calculate}>Generar Tabla</button>
        </div>

        {baseSummary && (
          <div className="card">
            <div className="card-title">{hasExtras ? "Comparativo: Base vs Con Abonos" : "Resumen"}</div>
            <div className="info-row"><span className="info-key">Capital</span><span>${fmt(baseSummary.pv)}</span></div>
            <div className="info-row">
              <span className="info-key">Períodos</span>
              <span>
                {hasExtras && extraSummary ? (
                  <><span style={{ textDecoration:"line-through", color:"var(--gray-light)", marginRight:8 }}>{baseSummary.periods}</span>
                  <span style={{ color:"#1a5c3a", fontWeight:600 }}>{extraSummary.periods}{(extraSummary.periodsSaved ?? 0) > 0 && <span style={{ fontSize:10, marginLeft:6 }}>(−{extraSummary.periodsSaved})</span>}</span></>
                ) : baseSummary.periods}
              </span>
            </div>
            <div className="info-row">
              <span className="info-key">Interés total</span>
              <span>
                {hasExtras && extraSummary ? (
                  <><span style={{ textDecoration:"line-through", color:"var(--gray-light)", marginRight:8 }}>${fmt(baseSummary.totalInterest)}</span>
                  <span className="td-navy">${fmt(extraSummary.totalInterest)}</span></>
                ) : <span className="td-navy">${fmt(baseSummary.totalInterest)}</span>}
              </span>
            </div>
            {hasExtras && extraSummary && (extraSummary.interestSaved ?? 0) > 0 && (
              <div className="info-row" style={{ background:"#f0fff4", margin:"0 -28px", padding:"10px 28px" }}>
                <span className="info-key" style={{ color:"#1a5c3a" }}>💰 Interés ahorrado</span>
                <span style={{ color:"#1a5c3a", fontWeight:600 }}>${fmt(extraSummary.interestSaved ?? 0)}</span>
              </div>
            )}
            {hasExtras && (
              <div className="info-row"><span className="info-key">Total abonos extra</span><span style={{ color:"var(--gold)", fontWeight:600 }}>${fmt(totalExtrasPaid)}</span></div>
            )}
          </div>
        )}
      </div>

      {baseRows.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Abonos Extraordinarios</div>
          <div style={{ display:"flex", gap:12, alignItems:"flex-end", marginBottom:16 }}>
            <div className="field" style={{ flex:1, marginBottom:0 }}>
              <label>Período</label>
              <input type="number" min="1" max={nInput} placeholder={`1–${nInput}`} value={pendingT} onChange={e => setPendingT(e.target.value)} />
            </div>
            <div className="field" style={{ flex:2, marginBottom:0 }}>
              <label>Monto ($)</label>
              <input type="number" min="1" placeholder="ej: 500" value={pendingAmt} onChange={e => setPendingAmt(e.target.value)} />
            </div>
            <button className="btn" style={{ width:"auto", padding:"10px 20px", marginTop:0 }} onClick={addExtra}>+ Agregar</button>
          </div>
          {addedMsg && <div style={{ fontSize:11, color:"#1a5c3a", background:"#f0fff4", border:"1px solid #c3e6cb", padding:"8px 12px", marginBottom:12 }}>{addedMsg}</div>}
          {hasExtras ? (
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {Object.entries(extraMap).sort(([a],[b]) => Number(a)-Number(b)).map(([t, amount]) => (
                <div key={t} style={{ display:"flex", alignItems:"center", gap:8, background:"var(--off-white)", border:"1px solid var(--rule)", borderLeft:"3px solid var(--gold)", padding:"6px 12px", fontSize:11 }}>
                  <span style={{ color:"var(--gray-mid)" }}>Período {t}</span>
                  <span style={{ color:"var(--gold)", fontWeight:600 }}>${fmt(amount as number)}</span>
                  <span onClick={() => removeExtra(Number(t))} style={{ cursor:"pointer", color:"var(--gray-light)", fontSize:13 }} title="Eliminar">×</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize:11, color:"var(--gray-light)", fontStyle:"italic" }}>Ingresa un período y monto para simular un abono extraordinario.</div>
          )}
        </div>
      )}

      {displayRows.length > 0 && (
        <div className="card">
          <div className="card-title">
            Tabla — {displayRows.length} períodos
            {hasExtras && <span style={{ marginLeft:12, color:"var(--gold)" }}>★ Con {Object.keys(extraMap).length} abono(s)</span>}
          </div>
          <div style={{ overflowX:"auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Período</th><th className="td-right">Cuota</th>
                  <th className="td-right">Interés</th><th className="td-right">Capital</th>
                  {hasExtras && <th className="td-right" style={{ color:"var(--gold)" }}>Abono Extra</th>}
                  <th className="td-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map(r => (
                  <tr key={r.t} style={{ background: r.extra > 0 ? "rgba(184,150,12,0.06)" : r.isCancelled && r.t < nInput ? "rgba(26,92,58,0.07)" : undefined }}>
                    <td>
                      {r.t}
                      {r.isCancelled && r.t < nInput && (
                        <span style={{ marginLeft:6, fontSize:8, background:"#1a5c3a", color:"white", padding:"1px 5px" }}>CANCELADO</span>
                      )}
                    </td>
                    <td className="td-right">${fmt(r.pmt)}</td>
                    <td className="td-right td-navy">${fmt(r.interest)}</td>
                    <td className="td-right td-green">${fmt(r.principal)}</td>
                    {hasExtras && <td className="td-right" style={{ color: r.extra > 0 ? "var(--gold)" : "var(--gray-light)", fontWeight: r.extra > 0 ? 600 : 400 }}>{r.extra > 0 ? `$${fmt(r.extra)}` : "—"}</td>}
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
// 4.4 RateConvPanel — Conversión de Tasas
// -----------------------------------------------------------------------------
function RateConvPanel() {
  const [r, setR] = useState(6);
  const [m, setM] = useState(12);

  const i_eff = effectiveRate(r / 100, m, "nominal");
  const delta  = Math.log(1 + i_eff);

  const equivalentRates = [
    { label: "Efectiva anual (m=1)",     val: Math.pow(1 + i_eff, 1)   - 1 },
    { label: "Nominal semestral (m=2)",  val: 2   * (Math.pow(1 + i_eff, 1/2)   - 1) },
    { label: "Nominal trimestral (m=4)", val: 4   * (Math.pow(1 + i_eff, 1/4)   - 1) },
    { label: "Nominal mensual (m=12)",   val: 12  * (Math.pow(1 + i_eff, 1/12)  - 1) },
    { label: "Nominal diaria (m=365)",   val: 365 * (Math.pow(1 + i_eff, 1/365) - 1) },
    { label: "Fuerza de interés δ",      val: delta },
  ];

  return (
    <div>
      <div className="formula">i^(m) = m·[(1+i)^(1/m)−1] | δ = ln(1+i) | i = e^δ−1</div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Tasa de Entrada</div>
          <div className="field"><label>Nominal i^(m) (%)</label><input type="number" step="0.01" value={r} onChange={e => setR(parseFloat(e.target.value))} /></div>
          <div className="field">
            <label>Capitalización m</label>
            <select value={m} onChange={e => setM(parseInt(e.target.value))}>
              <option value="1">Anual</option><option value="2">Semestral</option>
              <option value="4">Trimestral</option><option value="12">Mensual</option>
              <option value="365">Diaria</option>
            </select>
          </div>
          <div className="result-box" style={{ marginTop:20 }}>
            <div className="result-label">Tasa Efectiva Anual</div>
            <div className="result-value">{fmtPct(i_eff)}</div>
            <div className="result-detail">δ = <span className="result-hl">{fmtPct(delta)}</span></div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Tasas equivalentes — misma acumulación anual</div>
          <table className="table">
            <thead><tr><th>Convención</th><th className="td-right">Tasa</th></tr></thead>
            <tbody>
              {equivalentRates.map(row => (
                <tr key={row.label}><td>{row.label}</td><td className="td-right td-green">{fmtPct(row.val)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SECCIÓN 5: NAVEGACIÓN Y APP RAÍZ
// =============================================================================

type PanelId = "tvm" | "annuity" | "amort" | "rates";

const NAV_ITEMS: { id: PanelId; label: string }[] = [
  { id: "tvm",     label: "Valor del Dinero en el Tiempo" },
  { id: "annuity", label: "Anualidades"                   },
  { id: "amort",   label: "Amortización"                  },
  { id: "rates",   label: "Conversión de Tasas"           },
];

const COMING_SOON = ["Bond Pricer","Yield Curve","Duration & Convexity","Immunización de Pasivos"];

const PAGE_META: Record<PanelId, { eyebrow: string; title: string; desc: string; fm: string }> = {
  tvm:     { eyebrow:"Sección 1 & 2 — FM", title:"Valor del Dinero\nen el Tiempo",    desc:"PV y FV para capital único bajo cualquier convención de tasa.", fm:"FM Sections 1–2: Interest Measurement" },
  annuity: { eyebrow:"Sección 2 — FM",     title:"Valuación de\nAnualidades",          desc:"Anualidades vencidas, anticipadas y diferidas con notación FM.", fm:"FM Section 2: Annuities" },
  amort:   { eyebrow:"Sección 2 — FM",     title:"Tablas de\nAmortización",            desc:"Tabla período a período con soporte para abonos extraordinarios.", fm:"FM Section 2: Loan Repayment" },
  rates:   { eyebrow:"Sección 1 — FM",     title:"Conversión de\nTasas de Interés",   desc:"Equivalencias entre tasas nominales, efectivas y fuerza de interés.", fm:"FM Section 1: Interest Rate Measurement" },
};

const PANELS: Record<PanelId, React.ReactElement> = {
  tvm:     <TVMPanel />,
  annuity: <AnnuityPanel />,
  amort:   <AmortPanel />,
  rates:   <RateConvPanel />,
};

export default function App() {
  const [active, setActive] = useState<PanelId>("tvm");
  const meta  = PAGE_META[active];
  const panel = PANELS[active];

  return (
    <div className="app">
      <style>{STYLES}</style>
      <header className="header">
        <span className="header-logo">Fixed Income Risk Analyzer</span>
        <span className="header-module">Módulo 1 — Time Value Engine</span>
        <span className="header-badge">SOA · FM Exam Prep</span>
      </header>
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-label">Módulo 1 — Activo</div>
          {NAV_ITEMS.map(item => (
            <div key={item.id} className={`nav-item ${active === item.id ? "active" : ""}`} onClick={() => setActive(item.id)}>
              <div className="nav-bullet" />{item.label}
            </div>
          ))}
          <hr className="sidebar-divider" />
          <div className="sidebar-label">Módulos 2 & 3 — En construcción</div>
          {COMING_SOON.map(label => (
            <div key={label} className="nav-item" style={{ opacity:0.35, cursor:"not-allowed", fontSize:10 }}>
              <div className="nav-bullet" />{label}
            </div>
          ))}
        </aside>
        <main className="main">
          <div className="page-eyebrow">{meta.eyebrow}</div>
          <div className="page-title">
            {meta.title.split("\n").map((line, idx) => <span key={idx}>{line}<br /></span>)}
          </div>
          <div className="fm-tag">▸ {meta.fm}</div>
          <div className="page-desc">{meta.desc}</div>
          {panel}
        </main>
      </div>
    </div>
  );
}
