const API_URL = 'https://presence-confirmation-system.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    loadStats();
    initCodeGenerator();
});

/* =========================================================
   ESTATÍSTICAS (mantido)
========================================================= */
async function loadStats() {
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) window.location.href = 'index.html';
            throw new Error('Falha ao carregar estatísticas');
        }

        const data = await response.json();
        animateValue('totalAlunos', 0, data.total_groups, 1000);
        animateValue('totalPresencas', 0, data.total_presences, 1000);
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        document.getElementById('totalAlunos').innerText = '0';
        document.getElementById('totalPresencas').innerText = '0';
    }
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

/* =========================================================
   CÓDIGO DINÂMICO (novo) — substitui o reconhecimento facial
========================================================= */
let codeTimer = null;        // timeout que renova o código
let countdownTimer = null;   // intervalo do contador regressivo

async function initCodeGenerator() {
    const groupSelect = document.getElementById('dashboardGroupSelect');
    if (!groupSelect) {
        console.warn('Elemento #dashboardGroupSelect não encontrado no HTML do dashboard.');
        return;
    }

    // Carrega as turmas para o professor escolher
    try {
        const res = await fetch(`${API_URL}/groups`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        if (res.ok) {
            const turmas = await res.json();
            groupSelect.innerHTML = '<option value="">Selecione a turma...</option>';
            turmas.forEach(t => {
                const o = document.createElement('option');
                o.value = t.id;
                o.textContent = t.name;
                groupSelect.appendChild(o);
            });
        }
    } catch (e) {
        console.error('Erro ao carregar turmas:', e);
    }

    groupSelect.addEventListener('change', () => {
        stopRotation();
        const gid = groupSelect.value;
        if (gid) {
            refreshCode(gid);
        } else {
            clearCodeUI();
        }
    });
}

function stopRotation() {
    if (codeTimer) clearTimeout(codeTimer);
    if (countdownTimer) clearInterval(countdownTimer);
    codeTimer = null;
    countdownTimer = null;
}

function clearCodeUI() {
    const codeEl = document.getElementById('codeDisplay');
    const qr = document.getElementById('qrcode');
    const cd = document.getElementById('codeCountdown');
    if (codeEl) codeEl.textContent = '—';
    if (qr) qr.innerHTML = '';
    if (cd) cd.textContent = '';
}

async function refreshCode(groupId) {
    try {
        const res = await fetch(`${API_URL}/presence/code`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ group_id: Number(groupId) })
        });

        if (!res.ok) throw new Error(`Falha ao gerar código (${res.status})`);

        const data = await res.json(); // { code, expires_at, ttl_seconds }
        renderCode(groupId, data.code);
        startCountdown(data.ttl_seconds);

        // Renova um pouco antes de expirar para nunca ficar sem código válido na tela
        const renewMs = Math.max(data.ttl_seconds - 3, 5) * 1000;
        codeTimer = setTimeout(() => refreshCode(groupId), renewMs);
    } catch (e) {
        console.error('Erro ao gerar código:', e);
        const codeEl = document.getElementById('codeDisplay');
        if (codeEl) codeEl.textContent = 'erro';
    }
}

function renderCode(groupId, code) {
    const codeEl = document.getElementById('codeDisplay');
    if (codeEl) codeEl.textContent = code;

    const qr = document.getElementById('qrcode');
    if (qr) {
        qr.innerHTML = '';
        const url = `${window.location.origin}/Registrar_presenca.html`
            + `?group_id=${encodeURIComponent(groupId)}&code=${encodeURIComponent(code)}`;
        new QRCode(qr, {
            text: url,
            width: 200,
            height: 200,
            colorDark: '#2563eb',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}

function startCountdown(seconds) {
    if (countdownTimer) clearInterval(countdownTimer);
    let left = seconds;
    const el = document.getElementById('codeCountdown');
    const tick = () => {
        if (el) el.textContent = `Renova em ${Math.max(left, 0)}s`;
        left -= 1;
    };
    tick();
    countdownTimer = setInterval(tick, 1000);
}