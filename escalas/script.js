// =========================================================
// UTILITÁRIOS
// =========================================================
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

// =========================================================
// RELÓGIO RADIAL DE 24H (elemento assinatura do site)
// segments: [{ start, end, color, label }]  start/end em horas (0-24)
// =========================================================
function polarToCartesian(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx, cy, r, startHour, endHour) {
  const startAngle = (startHour / 24) * 360;
  const endAngle = (endHour / 24) * 360;
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
}

function buildRadialClock(segments, opts = {}) {
  const size = opts.size || 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const rInner = size * 0.24;

  let arcs = "";
  segments.forEach((seg) => {
    arcs += `<path d="${arcPath(cx, cy, r, seg.start, seg.end)}" fill="${seg.color}" fill-opacity="0.85" stroke="var(--void)" stroke-width="2"></path>`;
  });

  // hour ticks
  let ticks = "";
  for (let h = 0; h < 24; h += 1) {
    const major = h % 6 === 0;
    const p1 = polarToCartesian(cx, cy, r + 4, (h / 24) * 360);
    const p2 = polarToCartesian(cx, cy, r + (major ? 14 : 8), (h / 24) * 360);
    ticks += `<line x1="${p1.x.toFixed(2)}" y1="${p1.y.toFixed(2)}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}" stroke="var(--ink-faint)" stroke-width="${major ? 1.4 : 0.8}" opacity="${major ? 0.8 : 0.4}"/>`;
  }

  let labels = "";
  [0, 6, 12, 18].forEach((h) => {
    const p = polarToCartesian(cx, cy, r + 26, (h / 24) * 360);
    labels += `<text x="${p.x.toFixed(2)}" y="${p.y.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="var(--ink-faint)">${String(h).padStart(2, "0")}h</text>`;
  });

  const inner = `<circle cx="${cx}" cy="${cy}" r="${rInner}" fill="var(--panel-2)" stroke="var(--line)" stroke-width="1"/>`;

  return `<svg viewBox="0 0 ${size} ${size}" width="100%" height="100%" role="img" aria-label="Relógio de cobertura de 24 horas">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--panel)" />
    ${arcs}
    ${inner}
    ${ticks}
    ${labels}
  </svg>`;
}

// Relógio do Hero — exemplo fixo de posto 24h em 12x36
function renderHeroClock() {
  const el = $("#heroClock");
  if (!el) return;
  const segments = [
    { start: 7, end: 19, color: "var(--amber)" },
    { start: 19, end: 24, color: "var(--indigo)" },
    { start: 0, end: 7, color: "var(--indigo)" },
  ];
  el.innerHTML = buildRadialClock(segments);
}

// =========================================================
// MOTOR DO SIMULADOR
// =========================================================
function calcularEscala({ postos, horas, dias, regime, armado, salario }) {
  const shiftLength = regime === "12x36" ? 12 : 8;
  const slotsPerDay = horas / shiftLength;

  let guardsPerSlot;
  let formulaTexto;
  let diasTrabalhadosRegime;

  if (regime === "12x36") {
    guardsPerSlot = 2;
    formulaTexto = "12x36 sempre usa 2 pessoas por turno (revezando dia sim, dia não), independente dos dias por semana selecionados — é a natureza do regime.";
  } else {
    diasTrabalhadosRegime = regime === "44-5x2" ? 5 : 6; // revezamento assume base 6x1
    guardsPerSlot = Math.max(1, Math.ceil(dias / diasTrabalhadosRegime));
    formulaTexto = `guardas por turno = arredondar para cima (${dias} dias necessários ÷ ${diasTrabalhadosRegime} dias trabalhados por pessoa nesse regime) = ${guardsPerSlot}`;
  }

  const guardsPerPost = Math.round(guardsPerSlot * slotsPerDay);
  const totalGuards = guardsPerPost * postos;

  // armas: 1 por posto armado simultâneo + reserva técnica de 10%
  const armasBase = armado ? postos : 0;
  const armasReserva = armado ? Math.ceil(postos * 0.1) : 0;
  const armasTotal = armasBase + armasReserva;

  const custoMensal = salario > 0 ? totalGuards * salario : null;

  return {
    slotsPerDay,
    guardsPerSlot,
    guardsPerPost,
    totalGuards,
    armasBase,
    armasReserva,
    armasTotal,
    custoMensal,
    formulaTexto,
    shiftLength,
  };
}

const REGIME_LABELS = {
  "12x36": "12x36",
  "44-5x2": "44h semanais · 5x2",
  "44-6x1": "44h semanais · 6x1",
  revezamento: "Revezamento 8h (3 turnos)",
};

function renderResult() {
  const postos = parseInt($("#postos").value, 10) || 1;
  const horas = parseInt($("#horas").value, 10);
  const dias = parseInt($("#dias").value, 10);
  const regime = $("#regime").value;
  const armado = $("#armadoToggle").dataset.value === "sim";
  const salario = parseFloat($("#salario").value) || 0;

  const r = calcularEscala({ postos, horas, dias, regime, armado, salario });

  const resultEl = $("#simResult");

  const custoHtml =
    r.custoMensal !== null
      ? `<div class="result-stat"><span class="result-stat__label">Custo mensal estimado</span><span class="result-stat__value">R$ ${r.custoMensal.toLocaleString("pt-BR")}</span></div>`
      : `<div class="result-stat"><span class="result-stat__label">Custo mensal estimado</span><span class="result-stat__value" style="font-size:1rem; color: var(--ink-faint)">informe o salário-base ao lado</span></div>`;

  resultEl.innerHTML = `
    <div class="result-grid">
      <div class="result-stat">
        <span class="result-stat__label">Vigilantes por turno</span>
        <span class="result-stat__value">${r.guardsPerSlot}<small>/ turno de ${r.shiftLength}h</small></span>
      </div>
      <div class="result-stat">
        <span class="result-stat__label">Total por posto</span>
        <span class="result-stat__value">${r.guardsPerPost}<small>vigilante${r.guardsPerPost > 1 ? "s" : ""}</small></span>
      </div>
      <div class="result-stat">
        <span class="result-stat__label">Total geral (${postos} posto${postos > 1 ? "s" : ""})</span>
        <span class="result-stat__value">${r.totalGuards}<small>vigilantes</small></span>
      </div>
    </div>

    <div class="result-body">
      <div class="result-formula">
        <p><strong>Como chegamos nesse número</strong></p>
        <ul>
          <li>Regime escolhido: <code>${REGIME_LABELS[regime]}</code>, cobrindo <code>${horas}h/dia</code> em <code>${dias} dia(s)/semana</code>.</li>
          <li>Isso equivale a <code>${r.slotsPerDay}</code> turno(s) de ${r.shiftLength}h por dia.</li>
          <li>${r.formulaTexto}</li>
          <li>Total por posto = ${r.guardsPerSlot} × ${r.slotsPerDay} turno(s) = <code>${r.guardsPerPost}</code> vigilantes.</li>
          <li>Total geral = ${r.guardsPerPost} × ${postos} posto(s) = <code>${r.totalGuards}</code> vigilantes.</li>
        </ul>
        <div class="weapons-note ${armado ? "" : "is-hidden"}">
          <span>🔫</span>
          <span><strong>${r.armasTotal} arma(s)</strong> recomendadas: ${r.armasBase} operacional(is) (1 por posto armado) + ${r.armasReserva} de reserva técnica (~10%).</span>
        </div>
        ${custoHtml}
      </div>
      <div id="simClock" class="clock-widget"></div>
    </div>
  `;

  renderSimClock(regime, horas);
}

function renderSimClock(regime, horas) {
  const el = $("#simClock");
  if (!el) return;
  let segments = [];

  if (regime === "revezamento" && horas === 24) {
    segments = [
      { start: 6, end: 14, color: "var(--amber)" },
      { start: 14, end: 22, color: "var(--teal)" },
      { start: 22, end: 24, color: "var(--indigo)" },
      { start: 0, end: 6, color: "var(--indigo)" },
    ];
  } else if (horas === 24) {
    segments = [
      { start: 7, end: 19, color: "var(--amber)" },
      { start: 19, end: 24, color: "var(--indigo)" },
      { start: 0, end: 7, color: "var(--indigo)" },
    ];
  } else if (horas === 12) {
    segments = [{ start: 7, end: 19, color: "var(--amber)" }];
  } else {
    segments = [{ start: 8, end: 16, color: "var(--amber)" }];
  }

  el.innerHTML = buildRadialClock(segments, { size: 220 });
}

// =========================================================
// ESCALA TRABALHADA (roster 14 dias, 12x36)
// =========================================================
function renderRoster() {
  const el = $("#rosterTable");
  if (!el) return;
  const days = Array.from({ length: 14 }, (_, i) => i + 1);

  const head = `<tr><th>Turno</th>${days.map((d) => `<th>Dia ${d}</th>`).join("")}</tr>`;
  const dayRow = `<tr><td>Diurno (07h–19h)</td>${days
    .map((d) => `<td class="day">${d % 2 !== 0 ? "A" : "B"}</td>`)
    .join("")}</tr>`;
  const nightRow = `<tr><td>Noturno (19h–07h)</td>${days
    .map((d) => `<td class="night">${d % 2 !== 0 ? "C" : "D"}</td>`)
    .join("")}</tr>`;

  el.innerHTML = `<table>${head}${dayRow}${nightRow}</table>`;
}

// =========================================================
// INTERAÇÕES: menu mobile, toggle armado, accordion, scroll reveal
// =========================================================
function initNav() {
  const toggle = $("#navToggle");
  const nav = $("#nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    nav.style.display = open ? "flex" : "";
  });
  $$("#nav a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      nav.style.display = "";
      toggle.setAttribute("aria-expanded", "false");
    })
  );
}

function initArmadoToggle() {
  const wrap = $("#armadoToggle");
  if (!wrap) return;
  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".toggle__btn");
    if (!btn) return;
    $$(".toggle__btn", wrap).forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    wrap.dataset.value = btn.dataset.value;
    renderResult();
  });
}

function initFormListeners() {
  ["postos", "horas", "dias", "regime", "salario"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", renderResult);
    el.addEventListener("change", renderResult);
  });
}

function initAccordion() {
  $$(".accordion__item").forEach((item) => {
    const trigger = $(".accordion__trigger", item);
    const panel = $(".accordion__panel", item);
    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      $$(".accordion__item").forEach((i) => {
        i.classList.remove("is-open");
        $(".accordion__panel", i).style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add("is-open");
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });
  });
}

function initScrollReveal() {
  const targets = $$(".section__head, .card, .glossary__item, .law-item, .weapon-card");
  targets.forEach((t) => t.classList.add("reveal"));
  if (!("IntersectionObserver" in window)) {
    targets.forEach((t) => t.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  targets.forEach((t) => io.observe(t));
}

function initStickyTopbarShadow() {
  const topbar = $("#topbar");
  if (!topbar) return;
  window.addEventListener("scroll", () => {
    topbar.style.boxShadow = window.scrollY > 8 ? "0 8px 24px rgba(0,0,0,0.25)" : "none";
  });
}

// =========================================================
// BOOT
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  renderHeroClock();
  renderResult();
  renderRoster();
  initNav();
  initArmadoToggle();
  initFormListeners();
  initAccordion();
  initScrollReveal();
  initStickyTopbarShadow();
});
