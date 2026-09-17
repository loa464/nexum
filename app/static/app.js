// ==========================================================================
// NEXUM FINANCIAL LEDGER — MISSION CONTROL ENGINE
// Standards: 21st.dev + Emil Kowalski Physics + Web Audio API
// ==========================================================================

// 1. Web Audio API — Síntesis Acústica Háptica
class HapticSoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  // Clic táctil de alta frecuencia (30ms)
  click() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(820, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch (e) {}
  }

  // Transmisión láser atómica (120ms)
  transferPulse() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  // Acorde mayor de éxito ACID (250ms)
  success() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.025, now + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.03);
        osc.stop(now + i * 0.03 + 0.18);
      });
    } catch (e) {}
  }

  // Tono de rechazo por fondos insuficientes (120ms)
  rejected() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }
}

const sound = new HapticSoundEngine();

// 2. 3D Spatial Quantum Vault Canvas
class QuantumVaultCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mode = 'vault'; // 'vault' | 'topology' | 'audit'
    this.angleX = 0.35;
    this.angleY = 0.35;
    this.targetAngleX = 0.35;
    this.targetAngleY = 0.35;
    this.particles = [];
    this.orbitRing1 = [];
    this.orbitRing2 = [];
    this.initGeometry();
    this.resize();

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      this.targetAngleY = x * 1.2;
      this.targetAngleX = -y * 1.2;
    });

    this.render = this.render.bind(this);
    requestAnimationFrame(this.render);
  }

  initGeometry() {
    // Anillo Orbital 1
    this.orbitRing1 = [];
    for (let i = 0; i < 28; i++) {
      const theta = (i / 28) * Math.PI * 2;
      this.orbitRing1.push({
        x: Math.cos(theta) * 110,
        y: Math.sin(theta) * 110,
        z: 0,
      });
    }

    // Anillo Orbital 2
    this.orbitRing2 = [];
    for (let i = 0; i < 22; i++) {
      const theta = (i / 22) * Math.PI * 2;
      this.orbitRing2.push({
        x: Math.cos(theta) * 80,
        y: 0,
        z: Math.sin(theta) * 80,
      });
    }

    // Partículas flotantes de energía
    this.particles = [];
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * 220,
        y: (Math.random() - 0.5) * 220,
        z: (Math.random() - 0.5) * 220,
        speed: 0.01 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  resize() {
    this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  setMode(mode) {
    this.mode = mode;
  }

  render() {
    // Interpolación física de resorte
    this.angleX += (this.targetAngleX - this.angleX) * 0.06;
    this.angleY += (this.targetAngleY - this.angleY) * 0.06;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const time = Date.now() * 0.001;

    const cosX = Math.cos(this.angleX);
    const sinX = Math.sin(this.angleX);
    const cosY = Math.cos(this.angleY + time * 0.2);
    const sinY = Math.sin(this.angleY + time * 0.2);

    const project = (p) => {
      let x1 = p.x * cosY - p.z * sinY;
      let z1 = p.z * cosY + p.x * sinY;
      let y1 = p.y * cosX - z1 * sinX;
      let z2 = z1 * cosX + p.y * sinX;
      const fov = 340;
      const scale = fov / (fov + z2 + 120);
      return { px: cx + x1 * scale, py: cy + y1 * scale, scale, z: z2 };
    };

    // Dibujar Anillo 1
    const pRing1 = this.orbitRing1.map(project);
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.mode === 'audit' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.3)';
    this.ctx.lineWidth = 1.5;
    for (let i = 0; i < pRing1.length; i++) {
      const next = pRing1[(i + 1) % pRing1.length];
      this.ctx.moveTo(pRing1[i].px, pRing1[i].py);
      this.ctx.lineTo(next.px, next.py);
    }
    this.ctx.stroke();

    // Dibujar Anillo 2
    const pRing2 = this.orbitRing2.map(project);
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.mode === 'topology' ? 'rgba(139, 92, 246, 0.4)' : 'rgba(245, 158, 11, 0.25)';
    for (let i = 0; i < pRing2.length; i++) {
      const next = pRing2[(i + 1) % pRing2.length];
      this.ctx.moveTo(pRing2[i].px, pRing2[i].py);
      this.ctx.lineTo(next.px, next.py);
    }
    this.ctx.stroke();

    // Núcleo Central ACID (Octaedro Dorado)
    const corePoints = [
      { x: 0, y: -35, z: 0 },
      { x: 0, y: 35, z: 0 },
      { x: -35, y: 0, z: -35 },
      { x: 35, y: 0, z: -35 },
      { x: 35, y: 0, z: 35 },
      { x: -35, y: 0, z: 35 },
    ].map(project);

    this.ctx.strokeStyle = this.mode === 'audit' ? '#10B981' : '#F59E0B';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    // Vértice superior a base
    for (let i = 2; i <= 5; i++) {
      this.ctx.moveTo(corePoints[0].px, corePoints[0].py);
      this.ctx.lineTo(corePoints[i].px, corePoints[i].py);
      // Vértice inferior a base
      this.ctx.moveTo(corePoints[1].px, corePoints[1].py);
      this.ctx.lineTo(corePoints[i].px, corePoints[i].py);
      // Anillo base
      const nextIdx = i === 5 ? 2 : i + 1;
      this.ctx.moveTo(corePoints[i].px, corePoints[i].py);
      this.ctx.lineTo(corePoints[nextIdx].px, corePoints[nextIdx].py);
    }
    this.ctx.stroke();

    // Partículas de Datos Flotantes
    this.particles.forEach(p => {
      const proj = project({
        x: p.x + Math.sin(time + p.phase) * 15,
        y: p.y + Math.cos(time + p.phase) * 15,
        z: p.z,
      });
      const r = Math.max(1, 2.5 * proj.scale);
      this.ctx.beginPath();
      this.ctx.arc(proj.px, proj.py, r, 0, Math.PI * 2);
      this.ctx.fillStyle = this.mode === 'audit' ? '#10B981' : (this.mode === 'topology' ? '#8B5CF6' : '#FBBF24');
      this.ctx.fill();
    });

    requestAnimationFrame(this.render);
  }
}

// 3. UI Controller & State
let accountsCache = [];
let vaultEngine = null;

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastReservoir');
  const pill = document.createElement('div');
  pill.className = `toast-pill ${type}`;
  pill.textContent = message;
  container.appendChild(pill);
  setTimeout(() => pill.classList.add('visible'), 10);
  setTimeout(() => {
    pill.classList.remove('visible');
    setTimeout(() => pill.remove(), 250);
  }, 3500);
}

// Health Check Telemetry
async function checkHealth() {
  try {
    const res = await fetch('/api/v1/health');
    const data = await res.json();
    const dbLed = document.getElementById('dbLed');
    const redisLed = document.getElementById('redisLed');
    const dbText = document.getElementById('dbStatusText');
    const redisText = document.getElementById('redisStatusText');

    if (data.services.database === 'healthy') {
      dbLed.className = 'led-indicator';
      dbText.textContent = 'ACID ACTIVE';
    } else {
      dbLed.className = 'led-indicator degraded';
      dbText.textContent = 'DEGRADED';
    }

    if (data.services.redis === 'healthy') {
      redisLed.className = 'led-indicator';
      redisText.textContent = 'IDEMPOTENCY OK';
    } else {
      redisLed.className = 'led-indicator degraded';
      redisText.textContent = 'OFFLINE';
    }
  } catch (err) {
    console.error('Telemetry fetch failed', err);
  }
}

// Cargar Cuentas Contables
async function loadAccounts() {
  try {
    const stack = document.getElementById('accountListContainer');
    const drawerSource = document.getElementById('drawerSourceAcc');
    const drawerTarget = document.getElementById('drawerTargetAcc');

    let accounts = accountsCache;
    if (accounts.length === 0) {
      // Intentar traer cuentas previas creadas
      const knownNumber = 'NX-USD-3039824260';
      const check = await fetch(`/api/v1/accounts/by-number/${knownNumber}`).catch(() => null);
      if (check && check.ok) {
        const item = await check.json();
        accounts = [item];
      }
    }

    document.getElementById('statAccountsCount').textContent = accounts.length;
    document.getElementById('accountBadgeCount').textContent = `${accounts.length} ACTIVAS`;

    const totalLiquidity = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    document.getElementById('statTotalLiquidity').textContent = `$${totalLiquidity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (accounts.length === 0) {
      stack.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
          <p style="margin-bottom: 0.75rem;">Sin cuentas registradas en este visor.</p>
          <button class="btn-cta-primary" onclick="document.getElementById('btnNewAccount').click()" style="padding: 6px 14px; font-size: 0.8rem;">
            Aperturar Cuenta
          </button>
        </div>
      `;
      return;
    }

    stack.innerHTML = accounts.map(acc => `
      <div class="account-item-card" onclick="auditAccount('${acc.id}', '${acc.owner_name}')">
        <div>
          <div class="acc-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            ${acc.owner_name}
          </div>
          <div class="acc-meta">${acc.account_number}</div>
        </div>
        <div class="acc-figures">
          <div class="acc-balance-num">$${parseFloat(acc.balance).toFixed(2)}</div>
          <div class="acc-action-tag">Clic para auditar</div>
        </div>
      </div>
    `).join('');

    // Selects de drawer
    drawerSource.innerHTML = accounts.map(a => `<option value="${a.id}">${a.owner_name} ($${parseFloat(a.balance).toFixed(2)})</option>`).join('');
    drawerTarget.innerHTML = accounts.map(a => `<option value="${a.id}">${a.owner_name} ($${parseFloat(a.balance).toFixed(2)})</option>`).join('');
    if (accounts.length > 1) {
      drawerTarget.selectedIndex = 1;
    }

    if (accounts[0]) {
      loadLedger(accounts[0].id);
    }
  } catch (err) {
    console.error('Failed to load accounts', err);
  }
}

// Cargar Asientos de Libro Mayor
async function loadLedger(accountId) {
  try {
    const feed = document.getElementById('ledgerFeedContainer');
    const res = await fetch(`/api/v1/accounts/${accountId}/ledger`);
    if (!res.ok) return;
    const entries = await res.json();

    if (entries.length === 0) {
      feed.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">Sin asientos aún para esta cuenta.</div>`;
      return;
    }

    feed.innerHTML = entries.map(e => `
      <div class="ledger-row-card ${e.entry_type.toLowerCase()}">
        <div>
          <span class="ledger-entry-tag ${e.entry_type.toLowerCase()}">${e.entry_type}</span>
          <span style="color: var(--text-muted); font-size: 0.72rem; margin-left: 6px;">
            ${new Date(e.created_at).toLocaleTimeString()}
          </span>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
            Tx ID: ${e.transaction_id.substring(0, 8)}...
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 700; font-size: 0.95rem; color: ${e.entry_type === 'CREDIT' ? 'var(--color-success)' : 'var(--color-danger)'}">
            ${e.entry_type === 'CREDIT' ? '+' : '-'}$${parseFloat(e.amount).toFixed(2)}
          </div>
          <div style="font-size: 0.7rem; color: var(--text-muted)">
            Balance: $${parseFloat(e.balance_after).toFixed(2)}
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load ledger', err);
  }
}

// Auditar Conciliación Contable
async function auditAccount(accountId, ownerName) {
  sound.click();
  try {
    const res = await fetch(`/api/v1/reconciliation/${accountId}`);
    const report = await res.json();
    if (report.is_reconciled) {
      sound.success();
      showToast(`Auditoría 100% OK: ${ownerName} reconciliada sin discrepancias ($${report.discrepancy})`, 'success');
      document.getElementById('auditParityText').textContent = '0.0000 DISCREPANCIA';
    } else {
      sound.rejected();
      showToast(`Alerta: Discrepancia detectada en ${ownerName}: $${report.discrepancy}`, 'error');
    }
    loadLedger(accountId);
  } catch (err) {
    showToast('Error al auditar cuenta contable', 'error');
  }
}

// Apertura de Cuenta Contable
async function handleCreateAccount(e) {
  e.preventDefault();
  sound.click();
  const owner_name = document.getElementById('accOwnerName').value.trim();
  const initial_balance = parseFloat(document.getElementById('accInitialBalance').value) || 0;

  try {
    const res = await fetch('/api/v1/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_name,
        initial_balance: initial_balance.toFixed(4),
        currency: 'USD',
      })
    });

    if (!res.ok) throw new Error('Error al aperturar cuenta');
    const account = await res.json();
    accountsCache.push(account);
    sound.success();
    showToast(`Cuenta aperturada para ${account.owner_name} (${account.account_number})`, 'success');
    document.getElementById('accountModalBackdrop').classList.remove('open');
    document.getElementById('createAccountForm').reset();
    loadAccounts();
  } catch (err) {
    sound.rejected();
    showToast(err.message, 'error');
  }
}

// Ejecutar Transferencia Atómica en Drawer
async function handleDrawerTransfer(e) {
  e.preventDefault();
  sound.click();
  const source = document.getElementById('drawerSourceAcc').value;
  const target = document.getElementById('drawerTargetAcc').value;
  const amount = parseFloat(document.getElementById('drawerAmount').value) || 0;
  const idempotencyKey = document.getElementById('drawerIdempotencyKey').value;

  if (source === target) {
    sound.rejected();
    showToast('La cuenta origen y destino deben ser distintas.', 'error');
    return;
  }

  sound.transferPulse();

  try {
    const res = await fetch('/api/v1/transfers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        source_account_id: source,
        target_account_id: target,
        amount: amount.toFixed(4),
        currency: 'USD',
      })
    });

    const data = await res.json();
    if (res.status === 201) {
      sound.success();
      showToast(`Transferencia de $${amount.toFixed(2)} USD completada exitosamente`, 'success');
      document.getElementById('transferDrawerBackdrop').classList.remove('open');

      const sAcc = accountsCache.find(a => a.id === source);
      const tAcc = accountsCache.find(a => a.id === target);
      if (sAcc) sAcc.balance = data.source_balance_after;
      if (tAcc) tAcc.balance = data.target_balance_after;

      loadAccounts();
    } else {
      sound.rejected();
      showToast(data.detail?.message || 'Error al procesar transferencia', 'error');
    }
  } catch (err) {
    sound.rejected();
    showToast(err.message, 'error');
  }
}

// Simulador de Concurrencia Extrema (Battle Arena)
async function runConcurrencyBattle() {
  sound.click();
  if (accountsCache.length < 2) {
    showToast('Creando 2 cuentas para el simulador...', 'info');
    const acc1 = await fetch('/api/v1/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_name: 'Cuenta Estrés Alpha', initial_balance: '500.0000', currency: 'USD' })
    }).then(r => r.json());

    const acc2 = await fetch('/api/v1/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_name: 'Cuenta Estrés Beta', initial_balance: '0.0000', currency: 'USD' })
    }).then(r => r.json());

    accountsCache.push(acc1, acc2);
    loadAccounts();
  }

  const sAcc = accountsCache[0];
  const tAcc = accountsCache[1];
  const block = document.getElementById('stressResultsBlock');
  block.style.display = 'block';

  const barSuccess = document.getElementById('stressBarSuccess');
  const barReject = document.getElementById('stressBarRejected');
  const successEl = document.getElementById('stressSuccessCount');
  const rejectEl = document.getElementById('stressRejectedCount');
  const finalBalEl = document.getElementById('stressFinalBalance');
  const progressPct = document.getElementById('stressProgressPct');
  const lanesBox = document.getElementById('workerLanes');

  // Inicializar 30 nodos visuales
  lanesBox.innerHTML = Array.from({ length: 30 }).map((_, i) => `<div class="worker-node" id="wnode-${i}"></div>`).join('');

  barSuccess.style.width = '0%';
  barReject.style.width = '0%';
  successEl.textContent = '0';
  rejectEl.textContent = '0';
  progressPct.textContent = 'Workers Compitiendo...';

  const TOTAL = 30;
  const AMOUNT_PER_TX = 25.0; // Total demandado: $750 a cuenta con $500
  let successCount = 0;
  let rejectCount = 0;

  sound.transferPulse();

  const promises = Array.from({ length: TOTAL }).map(async (_, idx) => {
    const nodeEl = document.getElementById(`wnode-${idx}`);
    if (nodeEl) nodeEl.className = 'worker-node busy';

    try {
      const res = await fetch('/api/v1/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `arena-${generateUUID()}-${idx}`,
        },
        body: JSON.stringify({
          source_account_id: sAcc.id,
          target_account_id: tAcc.id,
          amount: AMOUNT_PER_TX.toFixed(4),
          currency: 'USD',
        })
      });

      if (res.status === 201) {
        successCount++;
        if (nodeEl) nodeEl.className = 'worker-node ok';
      } else {
        rejectCount++;
        if (nodeEl) nodeEl.className = 'worker-node fail';
      }
    } catch (e) {
      rejectCount++;
      if (nodeEl) nodeEl.className = 'worker-node fail';
    }

    const completed = successCount + rejectCount;
    const sPct = (successCount / TOTAL) * 100;
    const rPct = (rejectCount / TOTAL) * 100;
    barSuccess.style.width = `${sPct}%`;
    barReject.style.width = `${rPct}%`;
    successEl.textContent = successCount;
    rejectEl.textContent = rejectCount;
    progressPct.textContent = `${Math.round((completed / TOTAL) * 100)}%`;
  });

  await Promise.all(promises);

  // Consultar balance final confirmado de PostgreSQL
  const updated = await fetch(`/api/v1/accounts/${sAcc.id}`).then(r => r.json());
  finalBalEl.textContent = `$${parseFloat(updated.balance).toFixed(2)}`;
  sAcc.balance = updated.balance;
  loadAccounts();

  sound.success();
  showToast(`Simulador Completado: ${successCount} transacciones aprobadas, ${rejectCount} rechazadas. Saldo final protegido en $${updated.balance}`, 'success');
}

// Command Palette Keyboard Controller
function setupPalette() {
  const overlay = document.getElementById('commandPaletteOverlay');
  const searchInput = document.getElementById('paletteSearch');

  window.addEventListener('keydown', (e) => {
    // Emil Kowalski rule: Instant open for 100+/day keyboard commands (0ms delay)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      sound.click();
      overlay.classList.toggle('open');
      if (overlay.classList.contains('open')) {
        searchInput.focus();
      }
    }
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      overlay.classList.remove('open');
    }
  });

  document.getElementById('openPaletteBtn').addEventListener('click', () => {
    sound.click();
    overlay.classList.add('open');
    searchInput.focus();
  });

  document.querySelectorAll('.palette-row').forEach(row => {
    row.addEventListener('click', () => {
      const act = row.dataset.action;
      overlay.classList.remove('open');
      executeCommand(act);
    });
  });
}

function executeCommand(action) {
  sound.click();
  switch (action) {
    case 'new-transfer':
      document.getElementById('btnOpenDrawerTransfer').click();
      break;
    case 'new-account':
      document.getElementById('btnNewAccount').click();
      break;
    case 'stress-test':
      runConcurrencyBattle();
      break;
    case 'audit-all':
      if (accountsCache[0]) auditAccount(accountsCache[0].id, accountsCache[0].owner_name);
      break;
    case 'toggle-audio':
      sound.enabled = !sound.enabled;
      showToast(`Sonido háptico: ${sound.enabled ? 'ACTIVADO' : 'SILENCIADO'}`, 'info');
      break;
  }
}

// Latency Jitter Simulation
function startLatencyTicker() {
  const el = document.getElementById('lockLatencyText');
  setInterval(() => {
    const lat = (0.35 + Math.random() * 0.15).toFixed(2);
    if (el) el.textContent = `${lat}ms`;
  }, 2000);
}

// Inicialización
window.addEventListener('DOMContentLoaded', () => {
  // Canvas 3D
  const canvas = document.getElementById('vaultCanvas');
  if (canvas) {
    vaultEngine = new QuantumVaultCanvas(canvas);
  }

  // Pestañas 3D
  document.querySelectorAll('.spatial-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      sound.click();
      document.querySelectorAll('.spatial-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (vaultEngine) vaultEngine.setMode(tab.dataset.mode);
    });
  });

  // Modal Crear Cuenta
  const accModalBackdrop = document.getElementById('accountModalBackdrop');
  document.getElementById('btnNewAccount').addEventListener('click', () => {
    sound.click();
    accModalBackdrop.classList.add('open');
    document.getElementById('accOwnerName').focus();
  });
  document.getElementById('closeAccountModal').addEventListener('click', () => {
    accModalBackdrop.classList.remove('open');
  });
  document.getElementById('btnCancelAccount').addEventListener('click', () => {
    accModalBackdrop.classList.remove('open');
  });
  document.getElementById('createAccountForm').addEventListener('submit', handleCreateAccount);

  // Drawer Transferencia (21st.dev Standard)
  const transferDrawerBackdrop = document.getElementById('transferDrawerBackdrop');
  document.getElementById('btnOpenDrawerTransfer').addEventListener('click', () => {
    sound.click();
    document.getElementById('drawerIdempotencyKey').value = `idem-${generateUUID()}`;
    transferDrawerBackdrop.classList.add('open');
  });
  document.getElementById('closeDrawerBtn').addEventListener('click', () => {
    transferDrawerBackdrop.classList.remove('open');
  });
  document.getElementById('btnCancelDrawer').addEventListener('click', () => {
    transferDrawerBackdrop.classList.remove('open');
  });
  document.getElementById('drawerTransferForm').addEventListener('submit', handleDrawerTransfer);

  // Concurrency Battle
  document.getElementById('btnLaunchStress').addEventListener('click', runConcurrencyBattle);

  // Command Palette
  setupPalette();

  // Audio Toggle
  document.getElementById('audioToggleBtn').addEventListener('click', () => {
    sound.enabled = !sound.enabled;
    showToast(`Sonido háptico: ${sound.enabled ? 'ACTIVADO' : 'SILENCIADO'}`, 'info');
  });

  // Health and Accounts
  checkHealth();
  loadAccounts();
  startLatencyTicker();
  setInterval(checkHealth, 8000);
});
