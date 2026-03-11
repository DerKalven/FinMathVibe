// =============================================================================
// FIXED INCOME RISK ANALYZER — Módulo 1: Time Value Engine
// =============================================================================
// Stack: React + TypeScript + FastAPI backend
// Estilo: Institucional McKinsey — azul marino, blanco, dorado.
//
// ARQUITECTURA:
//   Este archivo NO hace ningún cálculo matemático.
//   Cada vez que el usuario presiona "Calcular", React hace un POST al backend
//   FastAPI (Python) que devuelve el resultado como JSON.
//
//   React (Vercel) ──POST /annuity──► FastAPI (Railway) ──JSON──► React (muestra)
//
// CONFIGURACIÓN:
//   Cambia API_BASE_URL a la URL de tu backend en Railway.
// =============================================================================

import { useState } from "react";

// =============================================================================
// CONFIGURACIÓN DEL BACKEND
// =============================================================================
const API_BASE_URL =
  (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL ||
  "http://localhost:8000";

// =============================================================================
// SECCIÓN 1: TIPOS TypeScript
// =============================================================================

interface TVMResult {
  value: number;
  label: string;
  detail: string;
  i_eff: number;
  i_nom: number;
  delta: number;
}

// Full 5-variable annuity result — backend always returns all five variables.
// "solved" tells the UI which one was computed.
interface AnnuityResult {
  solved:         "pv" | "fv" | "pmt" | "i" | "n";
  pv:             number;
  fv:             number;
  pmt:            number;
  i_annual:       number;   // effective annual rate
  i_period:       number;   // effective rate per payment period
  n:              number;
  delta:          number;   // force of interest
  label:          string;
  formula:        string;
  freq_label:     string;   // "mensual" | "trimestral" | ...
  total_pmts:     number;
  total_interest: number;
}

interface AmortRow {
  t:            number;
  pmt:          number;
  interest:     number;
  principal:    number;
  extra:        number;
  balance:      number;
  is_cancelled: boolean;
}

interface AmortResult {
  rows:           AmortRow[];
  total_interest: number;
  total_pmt:      number;
  periods:        number;
}

interface AmortSummary {
  total_interest: number;
  total_pmt:      number;
  pv:             number;
  periods:        number;
  interest_saved?: number;
  periods_saved?:  number;
}

interface RateEquivalent {
  label: string;
  value: number;
}

interface RatesResult {
  i_eff:       number;
  delta:       number;
  equivalents: RateEquivalent[];
}

type ExtraMap = Record<number, number>;

// =============================================================================
// SECCIÓN 2: API CLIENT
// =============================================================================

async function apiPost<T>(endpoint: string, body: object): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${res.status} en ${endpoint}`);
  }
  return res.json() as Promise<T>;
}

const api = {
  tvm:          (body: object) => apiPost<TVMResult>("/tvm", body),
  annuity:      (body: object) => apiPost<AnnuityResult>("/annuity", body),
  amortization: (body: object) => apiPost<AmortResult>("/amortization", body),
  rates:        (body: object) => apiPost<RatesResult>("/rates", body),
};

// =============================================================================
// SECCIÓN 3: ESTILOS GLOBALES
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

  .formula { background: var(--navy); color: rgba(255,255,255,0.85); padding: 12px 20px; font-size: 12px; font-style: italic; margin-bottom: 24px; border-left: 3px solid var(--gold); }

  .field { margin-bottom: 16px; }
  .field label { display: block; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gray-mid); margin-bottom: 7px; }
  .field input, .field select { width: 100%; background: var(--off-white); border: 1px solid var(--rule); border-bottom: 2px solid var(--navy); padding: 10px 12px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: var(--ink); outline: none; transition: border-color 0.15s; border-radius: 0; appearance: none; }
  .field input:focus, .field select:focus { border-bottom-color: var(--gold); background: var(--white); }

  /* Solved-for field: gold bottom border to distinguish it */
  .field-solved input, .field-solved select {
    border-bottom-color: var(--gold) !important;
    background: #fffdf0 !important;
  }
  .field-solved label { color: var(--gold) !important; }

  .btn { width: 100%; background: var(--navy); color: var(--white); border: none; padding: 13px; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer; transition: background 0.15s; margin-top: 8px; }
  .btn:hover { background: var(--blue-mid); }
  .btn:disabled { background: var(--gray-light); cursor: not-allowed; }

  .btn.loading::after { content: " ◌"; animation: spin 1s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .result-box { background: var(--result-bg); color: var(--white); padding: 28px; border-top: 3px solid var(--gold); }
  .result-label { font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 8px; }
  .result-value { font-family: 'Libre Baskerville', serif; font-size: 40px; font-weight: 700; color: var(--white); letter-spacing: -1.5px; line-height: 1; margin-bottom: 16px; }
  .result-divider { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 14px 0; }
  .result-detail { font-size: 11px; color: rgba(255,255,255,0.5); line-height: 1.9; }
  .result-hl { color: var(--gold); font-weight: 500; }
  .result-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 11px; }
  .result-row:last-child { border-bottom: none; }
  .result-row-key { color: rgba(255,255,255,0.4); font-size: 10px; letter-spacing: 0.06em; }
  .result-row-val { color: rgba(255,255,255,0.8); font-variant-numeric: tabular-nums; }
  .result-row-val.gold { color: var(--gold); font-weight: 600; }

  .error-box { background: #fff0f0; border: 1px solid #ffcccc; border-left: 3px solid #cc0000; padding: 14px 18px; font-size: 11px; color: #cc0000; margin-top: 16px; }

  .tabs { display: flex; border-bottom: 2px solid var(--rule); margin-bottom: 28px; }
  .tab { padding: 10px 24px; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; color: var(--gray-light); border-bottom: 3px solid transparent; margin-bottom: -2px; transition: all 0.15s; }
  .tab:hover { color: var(--navy); }
  .tab.active { color: var(--navy); border-bottom-color: var(--navy); font-weight: 500; }

  /* Solve-for tab strip (smaller) */
  .solve-tabs { display: flex; gap: 0; margin-bottom: 20px; border: 1px solid var(--rule); }
  .solve-tab { flex: 1; padding: 8px 4px; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; text-align: center; cursor: pointer; color: var(--gray-light); background: var(--off-white); border-right: 1px solid var(--rule); transition: all 0.15s; }
  .solve-tab:last-child { border-right: none; }
  .solve-tab:hover { background: #e8ecf4; color: var(--navy); }
  .solve-tab.active { background: var(--navy); color: var(--white); font-weight: 600; }

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

  .api-indicator { display: flex; align-items: center; gap: 6px; font-size: 9px; color: rgba(255,255,255,0.4); margin-left: 20px; }
  .api-dot { width: 6px; height: 6px; border-radius: 50%; background: #21c55d; animation: pulse 2s infinite; }
  .api-dot.error { background: #cc0000; animation: none; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
`;

// =============================================================================
// SECCIÓN 4: UTILIDADES DE FORMATO
// =============================================================================

const fmt = (n: number, d = 2): string =>
  isNaN(n) ? "—" : n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const fmtPct = (n: number, d = 4): string =>
  isNaN(n) ? "—" : (n * 100).toFixed(d) + "%";

// =============================================================================
// SECCIÓN 5: COMPONENTES
// =============================================================================

// -----------------------------------------------------------------------------
// 5.1 TVMPanel
// -----------------------------------------------------------------------------
function TVMPanel() {
  const [mode, setMode] = useState("fv");
  const [pv,   setPv]   = useState(1000);
  const [fv,   setFv]   = useState(0);
  const [rate, setRate] = useState(5);
  const [n,    setN]    = useState(10);
  const [conv, setConv] = useState("nominal");
  const [m,    setM]    = useState(12);

  const [result,  setResult]  = useState<TVMResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const calculate = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.tvm({
        mode,
        pv:   mode === "fv" ? pv : undefined,
        fv:   mode === "pv" ? fv : undefined,
        rate: rate / 100,
        n,
        conv: conv === "Nominal i^(m)" ? "nominal"
            : conv === "Efectiva anual i" ? "effective" : "continuous",
        m,
      });
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al conectar con el backend");
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="formula">
        {mode === "fv" ? "FV = PV · (1 + i)ⁿ" : "PV = FV · (1 + i)⁻ⁿ = FV · vⁿ"}
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Parámetros</div>
          <div className="field">
            <label>Calcular</label>
            <select value={mode} onChange={e => { setMode(e.target.value); setResult(null); }}>
              <option value="fv">Future Value (dado PV)</option>
              <option value="pv">Present Value (dado FV)</option>
            </select>
          </div>
          {mode === "fv"
            ? <div className="field"><label>Present Value ($)</label><input type="number" value={pv} onChange={e => setPv(parseFloat(e.target.value))} /></div>
            : <div className="field"><label>Future Value ($)</label><input type="number" value={fv} onChange={e => setFv(parseFloat(e.target.value))} /></div>
          }
          <div className="field"><label>Tasa (%)</label><input type="number" step="0.01" value={rate} onChange={e => setRate(parseFloat(e.target.value))} /></div>
          <div className="field">
            <label>Convención</label>
            <select value={conv} onChange={e => setConv(e.target.value)}>
              <option>Nominal i^(m)</option>
              <option>Efectiva anual i</option>
              <option>Fuerza de interés δ</option>
            </select>
          </div>
          {conv === "Nominal i^(m)" && (
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
          <button className={`btn ${loading ? "loading" : ""}`} onClick={calculate} disabled={loading}>
            {loading ? "Calculando..." : "▸ Calcular"}
          </button>
          {error && <div className="error-box">⚠ {error}</div>}
        </div>

        <div>
          {result ? (
            <div className="result-box">
              <div className="result-label">{result.label}</div>
              <div className="result-value">${fmt(result.value)}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)" }}>{result.detail}</div>
              <hr className="result-divider" />
              <div className="result-detail">
                <span className="result-hl">i efectiva anual</span> = {fmtPct(result.i_eff)}<br />
                <span className="result-hl">i nominal</span> = {fmtPct(result.i_nom)}<br />
                <span className="result-hl">Fuerza δ</span> = {fmtPct(result.delta)}
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
// 5.2 AnnuityPanel — 5-variable solver: PV | FV | PMT | i | n
//
// Architecture:
//   • "Solve for" strip selects which variable the backend should compute.
//   • When solving for PMT / i / n the user must provide one reference
//     value (PV or FV), selected via a second dropdown.
//   • The backend always returns all five variables; we highlight the one
//     that was actually computed.
//
// FM coverage:
//   Annuity-immediate:  a⌐n|i  and  s⌐n|i
//   Annuity-due:        ä⌐n|i  and  s̈⌐n|i
//   Deferred annuity:   d|a⌐n|i
// -----------------------------------------------------------------------------

type SolveFor = "pv" | "fv" | "pmt" | "i" | "n";
type RefType  = "pv" | "fv";
type AnnType  = "immediate" | "due" | "deferred";

// Static formula shown before the first calculation
const STATIC_FORMULA: Record<SolveFor, Record<AnnType, string>> = {
  pv:  {
    immediate: "PV = PMT · a⌐n|i = PMT · (1 − vⁿ) / i",
    due:       "PV = PMT · ä⌐n|i = PMT · (1 − vⁿ) · (1+i) / i",
    deferred:  "PV = v^d · PMT · a⌐n|i",
  },
  fv:  {
    immediate: "FV = PMT · s⌐n|i = PMT · ((1+i)ⁿ − 1) / i",
    due:       "FV = PMT · s̈⌐n|i = PMT · ((1+i)ⁿ − 1) · (1+i) / i",
    deferred:  "FV = PMT · s⌐n|i  (accumulated at end of payment stream)",
  },
  pmt: {
    immediate: "PMT = PV / a⌐n|i    or    PMT = FV / s⌐n|i",
    due:       "PMT = PV / ä⌐n|i    or    PMT = FV / s̈⌐n|i",
    deferred:  "PMT = PV · (1+i)^d / a⌐n|i    or    PMT = FV / s⌐n|i",
  },
  i:   {
    immediate: "Find i  :  PMT · a⌐n|i = PV  (bisection)",
    due:       "Find i  :  PMT · ä⌐n|i = PV  (bisection)",
    deferred:  "Find i  :  v^d · PMT · a⌐n|i = PV  (bisection)",
  },
  n:   {
    immediate: "n = −ln(1 − PV·i/PMT) / ln(1+i)    [from PV]",
    due:       "n = −ln(1 − PV·i/(PMT·(1+i))) / ln(1+i)    [from PV]",
    deferred:  "n = −ln(1 − (PV·(1+i)^d/PMT)·i) / ln(1+i)    [from PV]",
  },
};

const SOLVE_LABELS: Record<SolveFor, string> = {
  pv:  "PV",
  fv:  "FV",
  pmt: "PMT",
  i:   "Rate i",
  n:   "# Pmts n",
};

const SOLVED_FULL_LABELS: Record<SolveFor, string> = {
  pv:  "Present Value (PV)",
  fv:  "Future Value (FV)",
  pmt: "Payment (PMT)",
  i:   "Effective Annual Rate (i)",
  n:   "Number of Payments (n)",
};

// Dynamic label for the n field depending on payment frequency
const N_FIELD_LABELS: Record<number, string> = {
  12: "Number of months",
  6:  "Number of bimonths (every 2 mo.)",
  4:  "Number of quarters (every 3 mo.)",
  2:  "Number of semesters (every 6 mo.)",
  1:  "Number of years",
};

function AnnuityPanel() {
  // ── Annuity type ──────────────────────────────────────────────────────────
  const [annType,  setAnnType]  = useState<AnnType>("immediate");

  // ── What to solve for ─────────────────────────────────────────────────────
  const [solveFor, setSolveFor] = useState<SolveFor>("pv");

  // ── Reference variable when solving PMT / i / n ───────────────────────────
  const [refType,  setRefType]  = useState<RefType>("pv");

  // ── All five input values ─────────────────────────────────────────────────
  const [pmt,   setPmt]   = useState(100);
  const [iAnn,  setIAnn]  = useState(5);      // effective annual rate (%)
  const [n,     setN]     = useState(20);
  const [pvRef, setPvRef] = useState(1500);   // reference PV when solving PMT/i/n
  const [fvRef, setFvRef] = useState(2600);   // reference FV when solving PMT/i/n
  const [freq,  setFreq]  = useState(1);
  const [d,     setD]     = useState(5);

  // ── API state ─────────────────────────────────────────────────────────────
  const [result,  setResult]  = useState<AnnuityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const needsRef = (["pmt", "i", "n"] as SolveFor[]).includes(solveFor);

  const resetResult = () => { setResult(null); setError(null); };

  const handleSolveTab = (s: SolveFor) => {
    setSolveFor(s); resetResult();
  };

  const handleAnnType = (t: AnnType) => {
    setAnnType(t); resetResult();
  };

  // ── API call ──────────────────────────────────────────────────────────────
  const calculate = async () => {
    setLoading(true); setError(null);
    try {
      // Build the request body: omit the field that is being solved for.
      const body: Record<string, unknown> = {
        type:  annType,
        solve: solveFor,
        freq,
        d,
        ref: refType,
      };

      if (solveFor !== "pmt") body.pmt = pmt;
      if (solveFor !== "i")   body.i   = iAnn / 100;
      if (solveFor !== "n")   body.n   = n;

      // Provide the reference value when solving for PMT, i, or n
      if (needsRef) {
        if (refType === "pv") body.pv = pvRef;
        else                  body.fv = fvRef;
      }

      const res = await api.annuity(body);
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al conectar con el backend");
    } finally { setLoading(false); }
  };

  // ── Format the solved value for the large number display ─────────────────
  const formatPrimary = (r: AnnuityResult): string => {
    switch (r.solved) {
      case "pv":  return "$" + fmt(r.pv);
      case "fv":  return "$" + fmt(r.fv);
      case "pmt": return "$" + fmt(r.pmt);
      case "i":   return fmtPct(r.i_annual);
      case "n":   return r.n.toFixed(4) + " pmts";
    }
  };

  // ── Current formula to show ───────────────────────────────────────────────
  const formulaText = result
    ? result.formula
    : STATIC_FORMULA[solveFor][annType];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Annuity-type tabs */}
      <div className="tabs">
        {(["immediate","due","deferred"] as AnnType[]).map(k => (
          <div key={k}
            className={`tab ${annType === k ? "active" : ""}`}
            onClick={() => handleAnnType(k)}>
            {{ immediate:"Immediate (Vencida)", due:"Due (Anticipada)", deferred:"Deferred (Diferida)" }[k]}
          </div>
        ))}
      </div>

      {/* FM formula bar */}
      <div className="formula">{formulaText}</div>

      {/* Solve-for strip */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase",
                      color:"var(--gray-mid)", marginBottom:8 }}>
          Solve for
        </div>
        <div className="solve-tabs">
          {(Object.keys(SOLVE_LABELS) as SolveFor[]).map(k => (
            <div key={k}
              className={`solve-tab ${solveFor === k ? "active" : ""}`}
              onClick={() => handleSolveTab(k)}>
              {SOLVE_LABELS[k]}
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {/* ── Input card ──────────────────────────────────────────────── */}
        <div className="card">
          <div className="card-title">Parameters</div>

          {/* Payment PMT — hidden when solving for PMT */}
          {solveFor !== "pmt" ? (
            <div className="field">
              <label>Payment PMT ($)</label>
              <input type="number" step="0.01" value={pmt}
                onChange={e => setPmt(parseFloat(e.target.value))} />
            </div>
          ) : (
            <div className="field field-solved">
              <label>Payment PMT  ← solving</label>
              <input type="text" disabled value="?" style={{ color:"var(--gold)", fontWeight:600 }} />
            </div>
          )}

          {/* Effective annual rate — hidden when solving for i */}
          {solveFor !== "i" ? (
            <div className="field">
              <label>Effective Annual Rate (%)</label>
              <input type="number" step="0.01" value={iAnn}
                onChange={e => setIAnn(parseFloat(e.target.value))} />
            </div>
          ) : (
            <div className="field field-solved">
              <label>Effective Annual Rate i  ← solving</label>
              <input type="text" disabled value="?" style={{ color:"var(--gold)", fontWeight:600 }} />
            </div>
          )}

          {/* Number of payments — hidden when solving for n */}
          {solveFor !== "n" ? (
            <div className="field">
              <label>{N_FIELD_LABELS[freq] ?? "Number of payments"}</label>
              <input type="number" value={n}
                onChange={e => setN(parseFloat(e.target.value))} />
            </div>
          ) : (
            <div className="field field-solved">
              <label>Number of Payments n  ← solving</label>
              <input type="text" disabled value="?" style={{ color:"var(--gold)", fontWeight:600 }} />
            </div>
          )}

          {/* Payment frequency */}
          <div className="field">
            <label>Payment frequency</label>
            <select value={freq} onChange={e => { setFreq(parseInt(e.target.value)); resetResult(); }}>
              <option value="12">Monthly (12/year)</option>
              <option value="6">Bimonthly (6/year)</option>
              <option value="4">Quarterly (4/year)</option>
              <option value="2">Semiannual (2/year)</option>
              <option value="1">Annual (1/year)</option>
            </select>
          </div>

          {/* Deferral period — only for deferred annuities */}
          {annType === "deferred" && (
            <div className="field">
              <label>Deferral d (periods)</label>
              <input type="number" min="1" value={d}
                onChange={e => setD(parseFloat(e.target.value))} />
            </div>
          )}

          {/* Reference value — only when solving PMT, i, or n */}
          {needsRef && (
            <>
              <div style={{ borderTop:"1px solid var(--rule)", margin:"8px 0 16px",
                            paddingTop:14 }}>
                <div style={{ fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase",
                              color:"var(--gray-light)", marginBottom:12 }}>
                  Known reference value
                </div>
                <div className="field" style={{ marginBottom:12 }}>
                  <label>Reference variable</label>
                  <select value={refType}
                    onChange={e => { setRefType(e.target.value as RefType); resetResult(); }}>
                    <option value="pv">Present Value (PV) at t=0</option>
                    <option value="fv">Future Value (FV) at end of payments</option>
                  </select>
                </div>
                {refType === "pv" ? (
                  <div className="field">
                    <label>Present Value ($)</label>
                    <input type="number" step="0.01" value={pvRef}
                      onChange={e => setPvRef(parseFloat(e.target.value))} />
                  </div>
                ) : (
                  <div className="field">
                    <label>Future Value ($)</label>
                    <input type="number" step="0.01" value={fvRef}
                      onChange={e => setFvRef(parseFloat(e.target.value))} />
                  </div>
                )}
              </div>
            </>
          )}

          <button
            className={`btn ${loading ? "loading" : ""}`}
            onClick={calculate}
            disabled={loading}>
            {loading ? "Calculating..." : "▸ Calculate"}
          </button>
          {error && <div className="error-box">⚠ {error}</div>}
        </div>

        {/* ── Result card ─────────────────────────────────────────────── */}
        <div>
          {result ? (
            <div className="result-box">
              {/* Primary solved value */}
              <div className="result-label">
                ★ Solved: {SOLVED_FULL_LABELS[result.solved]}
              </div>
              <div className="result-value">{formatPrimary(result)}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)",
                            letterSpacing:"0.1em", textTransform:"uppercase",
                            marginBottom:16 }}>
                {result.label}
              </div>

              <hr className="result-divider" />

              {/* All five variables */}
              <div style={{ marginBottom:12 }}>
                {/* PV */}
                <div className="result-row">
                  <span className="result-row-key">Present Value (PV)</span>
                  <span className={`result-row-val ${result.solved === "pv" ? "gold" : ""}`}>
                    ${fmt(result.pv)}
                  </span>
                </div>
                {/* FV */}
                <div className="result-row">
                  <span className="result-row-key">Future Value (FV)</span>
                  <span className={`result-row-val ${result.solved === "fv" ? "gold" : ""}`}>
                    ${fmt(result.fv)}
                  </span>
                </div>
                {/* PMT */}
                <div className="result-row">
                  <span className="result-row-key">Payment (PMT)</span>
                  <span className={`result-row-val ${result.solved === "pmt" ? "gold" : ""}`}>
                    ${fmt(result.pmt)}
                  </span>
                </div>
                {/* i annual */}
                <div className="result-row">
                  <span className="result-row-key">Annual Rate (i)</span>
                  <span className={`result-row-val ${result.solved === "i" ? "gold" : ""}`}>
                    {fmtPct(result.i_annual)}
                  </span>
                </div>
                {/* i period */}
                <div className="result-row">
                  <span className="result-row-key">Period Rate (i_{result.freq_label})</span>
                  <span className="result-row-val">
                    {fmtPct(result.i_period, 6)}
                  </span>
                </div>
                {/* Force of interest */}
                <div className="result-row">
                  <span className="result-row-key">Force of interest (δ)</span>
                  <span className="result-row-val">
                    {fmtPct(result.delta)}
                  </span>
                </div>
                {/* n */}
                <div className="result-row">
                  <span className="result-row-key">Payments (n)</span>
                  <span className={`result-row-val ${result.solved === "n" ? "gold" : ""}`}>
                    {result.n.toFixed(4)}
                    {result.solved === "n" && !Number.isInteger(result.n) && (
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)",
                                     marginLeft:8 }}>
                        ≈ {Math.ceil(result.n)} full periods
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <hr className="result-divider" />

              {/* Totals */}
              <div className="result-row">
                <span className="result-row-key">Σ Payments</span>
                <span className="result-row-val">${fmt(result.total_pmts)}</span>
              </div>
              <div className="result-row">
                <span className="result-row-key">Total interest</span>
                <span className="result-row-val">${fmt(result.total_interest)}</span>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">◎</div>
              Select "Solve for", fill in the known values, then press Calculate
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 5.3 AmortPanel
// -----------------------------------------------------------------------------
function AmortPanel() {
  const [pvInput,      setPvInput]      = useState(10000);
  const [iInput,       setIInput]       = useState(6);
  const [nInput,       setNInput]       = useState(24);
  const [freq,         setFreq]         = useState(12);
  const [type,         setType]         = useState("french");
  const [extraMap,     setExtraMap]     = useState<ExtraMap>({});
  const [pendingT,     setPendingT]     = useState("");
  const [pendingAmt,   setPendingAmt]   = useState("");
  const [addedMsg,     setAddedMsg]     = useState("");
  const [baseResult,   setBaseResult]   = useState<AmortResult | null>(null);
  const [extraResult,  setExtraResult]  = useState<AmortResult | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const fetchAmort = async (map: ExtraMap, isBase = false) => {
    setLoading(true); setError(null);
    try {
      const res = await api.amortization({
        pv: pvInput, i: iInput / 100, n: nInput, freq, scheme: type,
        extra_map: Object.fromEntries(Object.entries(map).map(([k,v]) => [String(k), v])),
      });
      if (isBase) { setBaseResult(res); setExtraResult(null); setExtraMap({}); }
      else        { setExtraResult(res); }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al conectar con el backend");
    } finally { setLoading(false); }
  };

  const addExtra = async () => {
    const t = parseInt(pendingT), amount = parseFloat(pendingAmt);
    if (isNaN(t) || isNaN(amount) || amount <= 0 || t < 1 || t > nInput) return;
    const newMap = { ...extraMap, [t]: (extraMap[t] ?? 0) + amount };
    setExtraMap(newMap);
    setAddedMsg(`✓ Extra payment of $${fmt(amount)} at period ${t}`);
    setPendingT(""); setPendingAmt("");
    setTimeout(() => setAddedMsg(""), 3000);
    await fetchAmort(newMap);
  };

  const removeExtra = async (t: number) => {
    const newMap = { ...extraMap }; delete newMap[t]; setExtraMap(newMap);
    if (Object.keys(newMap).length === 0) { setExtraResult(null); return; }
    await fetchAmort(newMap);
  };

  const displayRows = extraResult?.rows ?? baseResult?.rows ?? [];
  const hasExtras   = Object.keys(extraMap).length > 0;
  const totalExtras = Object.values(extraMap).reduce((s, v) => s + v, 0);

  const baseSummary: AmortSummary | null = baseResult
    ? { total_interest: baseResult.total_interest, total_pmt: baseResult.total_pmt,
        pv: pvInput, periods: baseResult.periods }
    : null;
  const extraSummary: AmortSummary | null = extraResult && baseSummary
    ? { ...extraResult, pv: pvInput,
        interest_saved: baseSummary.total_interest - extraResult.total_interest,
        periods_saved:  baseSummary.periods - extraResult.periods }
    : null;

  return (
    <div>
      <div className="formula">Francés: PMT = PV·i/(1−(1+i)⁻ⁿ) | Alemán: K=PV/n | Abono extra → capital directo</div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        <div className="card">
          <div className="card-title">Parámetros del Préstamo</div>
          <div className="field"><label>Monto ($)</label><input type="number" value={pvInput} onChange={e => setPvInput(parseFloat(e.target.value))} /></div>
          <div className="field">
            <label>Frecuencia de pago</label>
            <select value={freq} onChange={e => setFreq(parseInt(e.target.value))}>
              <option value="12">Mensual (12 pagos/año)</option>
              <option value="4">Trimestral (4 pagos/año)</option>
              <option value="2">Semestral (2 pagos/año)</option>
              <option value="1">Anual (1 pago/año)</option>
            </select>
          </div>
          <div className="field">
            <label>Número de {freq === 12 ? "meses" : freq === 4 ? "trimestres" : freq === 2 ? "semestres" : "años"}</label>
            <input type="number" value={nInput} onChange={e => setNInput(parseInt(e.target.value))} />
          </div>
          <div className="field"><label>Tasa efectiva anual (%)</label><input type="number" step="0.01" value={iInput} onChange={e => setIInput(parseFloat(e.target.value))} /></div>
          <div className="field">
            <label>Esquema</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="french">Francés — cuota constante</option>
              <option value="german">Alemán — capital constante</option>
              <option value="american">Americano — bullet</option>
            </select>
          </div>
          <button className={`btn ${loading ? "loading" : ""}`}
            onClick={() => fetchAmort({}, true)} disabled={loading}>
            {loading ? "Calculando..." : "▸ Generar Tabla"}
          </button>
          {error && <div className="error-box">⚠ {error}</div>}
        </div>

        {baseSummary && (
          <div className="card">
            <div className="card-title">{hasExtras ? "Comparativo Base vs Con Abonos" : "Resumen"}</div>
            <div className="info-row"><span className="info-key">Capital</span><span>${fmt(baseSummary.pv)}</span></div>
            <div className="info-row">
              <span className="info-key">Períodos</span>
              <span>
                {hasExtras && extraSummary ? (
                  <><span style={{ textDecoration:"line-through", color:"var(--gray-light)", marginRight:8 }}>{baseSummary.periods}</span>
                  <span style={{ color:"#1a5c3a", fontWeight:600 }}>{extraSummary.periods}
                    {(extraSummary.periods_saved ?? 0) > 0 && <span style={{ fontSize:10, marginLeft:6 }}>(−{extraSummary.periods_saved})</span>}
                  </span></>
                ) : baseSummary.periods}
              </span>
            </div>
            <div className="info-row">
              <span className="info-key">Interés total</span>
              <span>
                {hasExtras && extraSummary ? (
                  <><span style={{ textDecoration:"line-through", color:"var(--gray-light)", marginRight:8 }}>${fmt(baseSummary.total_interest)}</span>
                  <span className="td-navy">${fmt(extraSummary.total_interest)}</span></>
                ) : <span className="td-navy">${fmt(baseSummary.total_interest)}</span>}
              </span>
            </div>
            {hasExtras && extraSummary && (extraSummary.interest_saved ?? 0) > 0 && (
              <div className="info-row" style={{ background:"#f0fff4", margin:"0 -28px", padding:"10px 28px" }}>
                <span className="info-key" style={{ color:"#1a5c3a" }}>💰 Interés ahorrado</span>
                <span style={{ color:"#1a5c3a", fontWeight:600 }}>${fmt(extraSummary.interest_saved ?? 0)}</span>
              </div>
            )}
            {hasExtras && (
              <div className="info-row"><span className="info-key">Total abonos extra</span>
              <span style={{ color:"var(--gold)", fontWeight:600 }}>${fmt(totalExtras)}</span></div>
            )}
          </div>
        )}
      </div>

      {baseResult && (
        <div className="card" style={{ marginBottom:24 }}>
          <div className="card-title">Abonos Extraordinarios</div>
          <div style={{ display:"flex", gap:12, alignItems:"flex-end", marginBottom:16 }}>
            <div className="field" style={{ flex:1, marginBottom:0 }}>
              <label>Período</label>
              <input type="number" min="1" max={nInput} placeholder={`1–${nInput}`}
                value={pendingT} onChange={e => setPendingT(e.target.value)} />
            </div>
            <div className="field" style={{ flex:2, marginBottom:0 }}>
              <label>Monto ($)</label>
              <input type="number" min="1" placeholder="ej: 500"
                value={pendingAmt} onChange={e => setPendingAmt(e.target.value)} />
            </div>
            <button className={`btn ${loading ? "loading" : ""}`}
              style={{ width:"auto", padding:"10px 20px", marginTop:0 }}
              onClick={addExtra} disabled={loading}>+ Agregar</button>
          </div>
          {addedMsg && <div style={{ fontSize:11, color:"#1a5c3a", background:"#f0fff4", border:"1px solid #c3e6cb", padding:"8px 12px", marginBottom:12 }}>{addedMsg}</div>}
          {hasExtras ? (
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {Object.entries(extraMap).sort(([a],[b]) => Number(a)-Number(b)).map(([t, amount]) => (
                <div key={t} style={{ display:"flex", alignItems:"center", gap:8, background:"var(--off-white)", border:"1px solid var(--rule)", borderLeft:"3px solid var(--gold)", padding:"6px 12px", fontSize:11 }}>
                  <span style={{ color:"var(--gray-mid)" }}>Período {t}</span>
                  <span style={{ color:"var(--gold)", fontWeight:600 }}>${fmt(amount)}</span>
                  <span onClick={() => removeExtra(Number(t))} style={{ cursor:"pointer", color:"var(--gray-light)", fontSize:13 }}>×</span>
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
                  <tr key={r.t} style={{ background: r.extra > 0 ? "rgba(184,150,12,0.06)" : r.is_cancelled && r.t < nInput ? "rgba(26,92,58,0.07)" : undefined }}>
                    <td>
                      {r.t}
                      {r.is_cancelled && r.t < nInput && (
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
// 5.4 RateConvPanel
// -----------------------------------------------------------------------------
function RateConvPanel() {
  const [rate,    setRate]    = useState(6);
  const [m,       setM]       = useState(12);
  const [result,  setResult]  = useState<RatesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const calculate = async (r = rate, mVal = m) => {
    setLoading(true); setError(null);
    try {
      const res = await api.rates({ rate: r / 100, m: mVal, conv: "nominal" });
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al conectar con el backend");
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="formula">i^(m) = m·[(1+i)^(1/m)−1] | δ = ln(1+i) | i = e^δ−1</div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Tasa de Entrada</div>
          <div className="field">
            <label>Nominal i^(m) (%)</label>
            <input type="number" step="0.01" value={rate}
              onChange={e => { setRate(parseFloat(e.target.value)); calculate(parseFloat(e.target.value), m); }} />
          </div>
          <div className="field">
            <label>Capitalización m</label>
            <select value={m} onChange={e => { setM(parseInt(e.target.value)); calculate(rate, parseInt(e.target.value)); }}>
              <option value="1">Anual</option><option value="2">Semestral</option>
              <option value="4">Trimestral</option><option value="12">Mensual</option>
              <option value="365">Diaria</option>
            </select>
          </div>
          <button className={`btn ${loading ? "loading" : ""}`} onClick={() => calculate()} disabled={loading}>
            {loading ? "Calculando..." : "▸ Calcular Equivalencias"}
          </button>
          {error && <div className="error-box">⚠ {error}</div>}
          {result && (
            <div className="result-box" style={{ marginTop:20 }}>
              <div className="result-label">Tasa Efectiva Anual</div>
              <div className="result-value">{fmtPct(result.i_eff)}</div>
              <div className="result-detail">δ = <span className="result-hl">{fmtPct(result.delta)}</span></div>
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-title">Tasas equivalentes — misma acumulación anual</div>
          {result ? (
            <table className="table">
              <thead><tr><th>Convención</th><th className="td-right">Tasa</th></tr></thead>
              <tbody>
                {result.equivalents.map(r => (
                  <tr key={r.label}><td>{r.label}</td><td className="td-right td-green">{fmtPct(r.value)}</td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state"><div className="empty-icon">◎</div>Presiona Calcular para ver equivalencias</div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SECCIÓN 6: NAVEGACIÓN Y APP RAÍZ
// =============================================================================

type PanelId = "tvm" | "annuity" | "amort" | "rates";

const NAV_ITEMS: { id: PanelId; label: string }[] = [
  { id: "tvm",     label: "Valor del Dinero en el Tiempo" },
  { id: "annuity", label: "Anualidades"                   },
  { id: "amort",   label: "Amortización"                  },
  { id: "rates",   label: "Conversión de Tasas"           },
];

const COMING_SOON = ["Bond Pricer","Yield Curve","Duration & Convexity","Immunización"];

const PAGE_META: Record<PanelId, { eyebrow:string; title:string; desc:string; fm:string }> = {
  tvm:     { eyebrow:"Sección 1 & 2 — FM", title:"Valor del Dinero\nen el Tiempo",   desc:"PV y FV bajo cualquier convención de tasa. Calculado por el backend Python.", fm:"FM Sections 1–2: Interest Measurement" },
  annuity: { eyebrow:"Sección 2 — FM",     title:"Valuación de\nAnualidades",         desc:"Solve for PV, FV, PMT, interest rate, or number of payments — for immediate, due, and deferred annuities.", fm:"FM Section 2: Annuities" },
  amort:   { eyebrow:"Sección 2 — FM",     title:"Tablas de\nAmortización",           desc:"Tabla período a período con abonos extraordinarios. Cálculo en Python.",        fm:"FM Section 2: Loan Repayment" },
  rates:   { eyebrow:"Sección 1 — FM",     title:"Conversión de\nTasas de Interés",  desc:"Equivalencias entre tasas. Respuesta en tiempo real desde el backend.",         fm:"FM Section 1: Interest Rate Measurement" },
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
        <span className="api-indicator">
          <span className="api-dot"></span>
          Python API
        </span>
        <span className="header-badge">SOA · FM Exam Prep</span>
      </header>
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-label">Módulo 1 — Activo</div>
          {NAV_ITEMS.map(item => (
            <div key={item.id} className={`nav-item ${active === item.id ? "active" : ""}`}
              onClick={() => setActive(item.id)}>
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
