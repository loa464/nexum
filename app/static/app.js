// Nexum Financial Ledger Mission Control — Vanilla ES6+ Engine

// 1. Web Audio API — Síntesis Háptica Sutil
class SoundEngine {
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

  click() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch (e) {
      // Silently ignore audio context autoplay restrictions
    }
  }

  success() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.03, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.15);
      });
    } catch (e) {}
  }

  error() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }
}

const sounds = new SoundEngine();

// 2. 3D Spatial Canvas — Bóveda Isométrica Interactiva
class SpatialVault {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mode = 'vault';
    this.rotX = 0.4;
    this.rotY = 0.4;
    this.targetRotX = 0.4;
    this.targetRotY = 0.4;
    this.nodes = [];
    this.initNodes();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Seguimiento del cursor para perspectiva espacial
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      this.targetRotY = x * 0.8;
      this.targetRotX = -y * 0.8;
    });

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initNodes() {
    this.nodes = [];
    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
          this.nodes.push({ x: x * 60, y: y * 60, z: z * 60 });
        }
      }
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

  animate() {
    // Interpolación de resortes (damping)
    this.rotX += (this.targetRotX - this.rotX) * 0.05;
    this.rotY += (this.targetRotY - this.rotY) * 0.05;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    const cosX = Math.cos(this.rotX);
    const sinX = Math.sin(this.rotX);
    const cosY = Math.cos(this.rotY + Date.now() * 0.0005);
    const sinY = Math.sin(this.rotY + Date.now() * 0.0005);

    const projected = this.nodes.map(n => {
      // Rotación Y
      let x1 = n.x * cosY - n.z * sinY;
      let z1 = n.z * cosY + n.x * sinY;
      // Rotación X
      let y1 = n.y * cosX - z1 * sinX;
      let z2 = z1 * cosX + n.y * sinX;

      const fov = 300;
      const scale = fov / (fov + z2 + 100);
      return {
        px: cx + x1 * scale,
        py: cy + y1 * scale,
        scale: scale,
        depth: z2
      };
    });

    // Conectar nodos (Aristas del hipercubo financiero)
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = this.mode === 'audit' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.2)';
    this.ctx.beginPath();
    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        const dx = projected[i].px - projected[j].px;
        const dy = projected[i].py - projected[j].py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 75) {
          this.ctx.moveTo(projected[i].px, projected[i].py);
          this.ctx.lineTo(projected[j].px, projected[j].py);
        }
      }
    }
    this.ctx.stroke();

    // Dibujar Nodos con reflejo luminoso
    projected.forEach(p => {
      const radius = Math.max(1.5, 3.5 * p.scale);
      this.ctx.beginPath();
      this.ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.mode === 'audit' ? '#10B981' : (this.mode === 'matrix' ? '#8B5CF6' : '#F59E0B');
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = this.ctx.fillStyle;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });

    requestAnimationFrame(this.animate);
  }
}

// 3. UI Controller & API Bridge
let accountsCache = [];
let spatialVault = null;

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function showToast(message, type = 'info') {
  const stack = document.getElementById('toastStack');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  stack.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// Cargar Health Check
async function checkHealth() {
  try {
    const res = await fetch('/api/v1/health');
    const data = await res.json();
    const dbLed = document.getElementById('dbLed');
    const redisLed = document.getElementById('redisLed');
    const dbText = document.getElementById('dbStatusText');
    const redisText = document.getElementById('redisStatusText');

    if (data.services.database === 'healthy') {
      dbLed.className = 'status-led';
      dbText.textContent = 'ONLINE (ACID)';
    } else {
      dbLed.className = 'status-led degraded';
      dbText.textContent = 'ERROR';
    }

    if (data.services.redis === 'healthy') {
      redisLed.className = 'status-led';
      redisText.textContent = 'IDEMPOTENCY OK';
    } else {
      redisLed.className = 'status-led degraded';
      redisText.textContent = 'OFFLINE';
    }
  } catch (err) {
    console.error('Health check failed', err);
  }
}

// Cargar Cuentas
async function loadAccounts() {
  try {
    // Si tenemos al menos una cuenta conocida podemos listar, o creamos y consultamos
    const listContainer = document.getElementById('accountListContainer');
    const sourceSelect = document.getElementById('transferSource');
    const targetSelect = document.getElementById('transferTarget');

    // Consultamos cuentas existentes
    // NOTA: Para el frontend consultamos las cuentas creadas en memoria local o cargamos la cuenta principal
    let accounts = accountsCache;

    if (accounts.length === 0) {
      // Intentar consultar cuenta conocida o consultar health
      const initialFetch = await fetch('/api/v1/accounts/by-number/NX-USD-3039824260').catch(() => null);
      if (initialFetch && initialFetch.ok) {
        const acc = await initialFetch.json();
        accounts = [acc];
      }
    }

    // Actualizar badges
    document.getElementById('statAccountsCount').textContent = accounts.length;
    document.getElementById('accountBadgeCount').textContent = `${accounts.length} ACTIVAS`;

    // Calcular liquidez total
    const totalLiquidity = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    document.getElementById('statTotalLiquidity').textContent = `$${totalLiquidity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (accounts.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; color: var(--color-text-muted); padding: 2rem;">
          <p style="margin-bottom: 0.75rem;">No hay cuentas registradas en este visor.</p>
          <button class="btn-primary" onclick="document.getElementById('btnNewAccount').click()" style="padding: 6px 14px; font-size: 0.8rem;">
            Abrir Primera Cuenta
          </button>
        </div>
      `;
      return;
    }

    // Render de cuentas
    listContainer.innerHTML = accounts.map(acc => `
      <div class="account-row" onclick="auditAccount('${acc.id}', '${acc.owner_name}')">
        <div>
          <div class="acc-info-name">${acc.owner_name}</div>
          <div class="acc-info-number">${acc.account_number}</div>
        </div>
        <div class="acc-balance-block">
          <div class="acc-balance-val">$${parseFloat(acc.balance).toFixed(2)}</div>
          <div class="acc-currency-tag">${acc.currency} • Clic para auditar</div>
        </div>
      </div>
    `).join('');

    // Actualizar selects de transferencia
    sourceSelect.innerHTML = accounts.map(a => `<option value="${a.id}">${a.owner_name} ($${parseFloat(a.balance).toFixed(2)})</option>`).join('');
    targetSelect.innerHTML = accounts.map(a => `<option value="${a.id}">${a.owner_name} ($${parseFloat(a.balance).toFixed(2)})</option>`).join('');
    if (accounts.length > 1) {
      targetSelect.selectedIndex = 1;
    }

    // Cargar libro mayor de la primera cuenta
    if (accounts[0]) {
      loadLedger(accounts[0].id);
    }
  } catch (err) {
    console.error('Failed to load accounts', err);
  }
}

// Cargar Libro Mayor (Double-Entry Ledger)
async function loadLedger(accountId) {
  try {
    const feed = document.getElementById('ledgerFeedContainer');
    const res = await fetch(`/api/v1/accounts/${accountId}/ledger`);
    if (!res.ok) return;
    const entries = await res.json();

    if (entries.length === 0) {
      feed.innerHTML = `<div style="text-align: center; color: var(--color-text-muted); padding: 2rem;">Sin asientos contables aún.</div>`;
      return;
    }

    feed.innerHTML = entries.map(e => `
      <div class="ledger-item ${e.entry_type.toLowerCase()}">
        <div>
          <span class="ledger-badge ${e.entry_type.toLowerCase()}">${e.entry_type}</span>
          <span style="color: var(--color-text-muted); font-size: 0.75rem; margin-left: 6px;">
            ${new Date(e.created_at).toLocaleTimeString()}
          </span>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 3px;">
            Tx: ${e.transaction_id.substring(0, 8)}...
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 700; color: ${e.entry_type === 'CREDIT' ? 'var(--color-success)' : 'var(--color-danger)'}">
            ${e.entry_type === 'CREDIT' ? '+' : '-'}$${parseFloat(e.amount).toFixed(2)}
          </div>
          <div style="font-size: 0.7rem; color: var(--color-text-muted)">
            Saldo después: $${parseFloat(e.balance_after).toFixed(2)}
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load ledger', err);
  }
}

// Auditar Cuenta en Tiempo Real
async function auditAccount(accountId, ownerName) {
  sounds.click();
  try {
    const res = await fetch(`/api/v1/reconciliation/${accountId}`);
    const report = await res.json();
    if (report.is_reconciled) {
      sounds.success();
      showToast(`Auditoría OK: Cuenta ${ownerName} reconciliada al 100% (Discrepancia: $${report.discrepancy})`, 'success');
      document.getElementById('auditParityText').textContent = 'PARIDAD CONFIRMADA';
    } else {
      sounds.error();
      showToast(`Alerta: Discrepancia detectada en ${ownerName}: $${report.discrepancy}`, 'error');
    }
    loadLedger(accountId);
  } catch (err) {
    showToast('Error al auditar cuenta', 'error');
  }
}

// Crear Cuenta
async function handleCreateAccount(e) {
  e.preventDefault();
  sounds.click();
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

    if (!res.ok) throw new Error('Error al crear cuenta');
    const account = await res.json();
    accountsCache.push(account);
    sounds.success();
    showToast(`Cuenta creada para ${account.owner_name} (${account.account_number})`, 'success');
    document.getElementById('accountModal').classList.remove('open');
    document.getElementById('createAccountForm').reset();
    loadAccounts();
  } catch (err) {
    sounds.error();
    showToast(err.message, 'error');
  }
}

// Ejecutar Transferencia con Idempotencia
async function handleTransfer(e) {
  e.preventDefault();
  sounds.click();
  const source = document.getElementById('transferSource').value;
  const target = document.getElementById('transferTarget').value;
  const amount = parseFloat(document.getElementById('transferAmount').value) || 0;
  const idempotencyKey = document.getElementById('transferIdempotencyKey').value;

  if (source === target) {
    sounds.error();
    showToast('La cuenta origen y destino deben ser distintas.', 'error');
    return;
  }

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
      sounds.success();
      showToast(`Transferencia de $${amount.toFixed(2)} USD completada`, 'success');
      document.getElementById('transferModal').classList.remove('open');
      
      // Actualizar balances locales en caché
      const sAcc = accountsCache.find(a => a.id === source);
      const tAcc = accountsCache.find(a => a.id === target);
      if (sAcc) sAcc.balance = data.source_balance_after;
      if (tAcc) tAcc.balance = data.target_balance_after;

      loadAccounts();
    } else {
      sounds.error();
      showToast(data.detail?.message || 'Error en la transferencia', 'error');
    }
  } catch (err) {
    sounds.error();
    showToast(err.message, 'error');
  }
}

// Simulador de Estrés de Concurrencia (30 Peticiones Simultáneas)
async function runConcurrencyStress() {
  sounds.click();
  if (accountsCache.length < 2) {
    // Si no hay dos cuentas, creamos 2 cuentas de demostración al vuelo
    showToast('Creando 2 cuentas de demostración para el test de estrés...', 'info');
    const acc1 = await fetch('/api/v1/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_name: 'Cuenta Estrés Origen', initial_balance: '500.0000', currency: 'USD' })
    }).then(r => r.json());
    
    const acc2 = await fetch('/api/v1/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_name: 'Cuenta Estrés Destino', initial_balance: '0.0000', currency: 'USD' })
    }).then(r => r.json());

    accountsCache.push(acc1, acc2);
    loadAccounts();
  }

  const sAcc = accountsCache[0];
  const tAcc = accountsCache[1];
  const resultsBlock = document.getElementById('stressResultsBlock');
  resultsBlock.style.display = 'block';

  const barSuccess = document.getElementById('stressBarSuccess');
  const barRejected = document.getElementById('stressBarRejected');
  const successEl = document.getElementById('stressSuccessCount');
  const rejectedEl = document.getElementById('stressRejectedCount');
  const finalBalEl = document.getElementById('stressFinalBalance');
  const progressPct = document.getElementById('stressProgressPct');

  barSuccess.style.width = '0%';
  barRejected.style.width = '0%';
  successEl.textContent = '0';
  rejectedEl.textContent = '0';
  progressPct.textContent = 'Ejecutando...';

  const TOTAL_REQUESTS = 30;
  const AMOUNT_PER_TX = 25.0; // Demandará $750 a una cuenta que tiene $500 o su saldo actual
  const tasks = [];

  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const p = fetch('/api/v1/transfers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `ui-stress-${uuidv4()}-${i}`
      },
      body: JSON.stringify({
        source_account_id: sAcc.id,
        target_account_id: tAcc.id,
        amount: AMOUNT_PER_TX.toFixed(4),
        currency: 'USD'
      })
    }).then(r => r.json().then(data => ({ status: r.status, data })));
    tasks.push(p);
  }

  const results = await Promise.all(tasks);
  let successCount = 0;
  let rejectedCount = 0;

  results.forEach(res => {
    if (res.status === 201) successCount++;
    else rejectedCount++;
  });

  const successPct = (successCount / TOTAL_REQUESTS) * 100;
  const rejectedPct = (rejectedCount / TOTAL_REQUESTS) * 100;

  barSuccess.style.width = `${successPct}%`;
  barRejected.style.width = `${rejectedPct}%`;
  successEl.textContent = successCount;
  rejectedEl.textContent = rejectedCount;
  progressPct.textContent = 'Completado (100% ACID)';

  // Refrescar balance final
  const updatedSAcc = await fetch(`/api/v1/accounts/${sAcc.id}`).then(r => r.json());
  finalBalEl.textContent = `$${parseFloat(updatedSAcc.balance).toFixed(2)}`;

  sAcc.balance = updatedSAcc.balance;
  loadAccounts();
  sounds.success();
  showToast(`Test de estrés finalizado: ${successCount} aprobadas, ${rejectedCount} rechazadas. Saldo exacto: $${updatedSAcc.balance}`, 'success');
}

// Command Palette Keyboard Handling
function setupCommandPalette() {
  const modal = document.getElementById('commandPaletteModal');
  const input = document.getElementById('paletteInput');

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      sounds.click();
      modal.classList.toggle('open');
      if (modal.classList.contains('open')) {
        input.focus();
      }
    }
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      modal.classList.remove('open');
    }
  });

  document.getElementById('openPaletteBtn').addEventListener('click', () => {
    sounds.click();
    modal.classList.add('open');
    input.focus();
  });

  document.querySelectorAll('.palette-action').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      modal.classList.remove('open');
      executePaletteAction(action);
    });
  });
}

function executePaletteAction(action) {
  sounds.click();
  switch (action) {
    case 'new-account':
      document.getElementById('btnNewAccount').click();
      break;
    case 'new-transfer':
      document.getElementById('btnNewTransfer').click();
      break;
    case 'stress-test':
      runConcurrencyStress();
      break;
    case 'audit-all':
      if (accountsCache[0]) auditAccount(accountsCache[0].id, accountsCache[0].owner_name);
      break;
    case 'toggle-audio':
      sounds.enabled = !sounds.enabled;
      showToast(`Sonido háptico: ${sounds.enabled ? 'ACTIVADO' : 'MUTED'}`, 'info');
      break;
  }
}

// Inicialización de la Aplicación
window.addEventListener('DOMContentLoaded', () => {
  // Inicializar Canvas 3D
  const canvas = document.getElementById('vaultCanvas');
  if (canvas) {
    spatialVault = new SpatialVault(canvas);
  }

  // Modos de Bóveda 3D
  document.querySelectorAll('.mode-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      sounds.click();
      document.querySelectorAll('.mode-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      spatialVault.setMode(pill.dataset.mode);
    });
  });

  // Modal: Nueva Cuenta
  const accModal = document.getElementById('accountModal');
  document.getElementById('btnNewAccount').addEventListener('click', () => {
    sounds.click();
    accModal.classList.add('open');
    document.getElementById('accOwnerName').focus();
  });
  document.getElementById('closeAccountModal').addEventListener('click', () => {
    accModal.classList.remove('open');
  });
  document.getElementById('createAccountForm').addEventListener('submit', handleCreateAccount);

  // Modal: Transferencia
  const txModal = document.getElementById('transferModal');
  document.getElementById('btnNewTransfer').addEventListener('click', () => {
    sounds.click();
    document.getElementById('transferIdempotencyKey').value = `tx-${uuidv4()}`;
    txModal.classList.add('open');
  });
  document.getElementById('closeTransferModal').addEventListener('click', () => {
    txModal.classList.remove('open');
  });
  document.getElementById('transferForm').addEventListener('submit', handleTransfer);

  // Test de Estrés
  document.getElementById('btnLaunchStress').addEventListener('click', runConcurrencyStress);

  // Paleta de Comandos
  setupCommandPalette();

  // Mute Audio Toggle
  document.getElementById('audioToggleBtn').addEventListener('click', () => {
    sounds.enabled = !sounds.enabled;
    showToast(`Sonido háptico: ${sounds.enabled ? 'ACTIVADO' : 'MUTED'}`, 'info');
  });

  // Cargar Cuentas y Health
  checkHealth();
  loadAccounts();
  setInterval(checkHealth, 8000);
});
