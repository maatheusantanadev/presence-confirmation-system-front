const API_URL = 'https://presence-confirmation-system.onrender.com';

document.addEventListener('DOMContentLoaded', async () => {
    const studentInput = document.getElementById('studentSearch');
    const groupSelect = document.getElementById('groupSelect');
    const autocompleteList = document.getElementById('autocompleteList');
    const presenceForm = document.getElementById('presenceForm');
    const codeInput = document.getElementById('codeInput');        // opcional (digitação manual)
    const feedback = document.getElementById('feedbackContainer'); // opcional

    // Parâmetros vindos do QR Code (quando o aluno escaneia)
    const params = new URLSearchParams(window.location.search);
    const urlGroupId = params.get('group_id');
    const urlCode = params.get('code');

    let alunos = [];

    async function carregarTurmas() {
        try {
            const r = await fetch(`${API_URL}/groups`);
            if (r.ok) {
                const turmas = await r.json();
                turmas.forEach(t => {
                    const o = document.createElement('option');
                    o.value = t.id;
                    o.textContent = t.name;
                    groupSelect.appendChild(o);
                });
                // Se veio do QR, pré-seleciona e trava a turma
                if (urlGroupId) {
                    groupSelect.value = urlGroupId;
                    groupSelect.disabled = true;
                }
            }
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
        }
    }

    async function carregarAlunos() {
        try {
            const r = await fetch(`${API_URL}/students`);
            if (r.ok) {
                const data = await r.json();
                alunos = data.map(a => a.name);
            }
        } catch (error) {
            console.error('Erro de conexão:', error);
        }
    }

    // Se o código veio pela URL e existe campo de código, preenche e esconde
    if (urlCode && codeInput) {
        codeInput.value = urlCode;
        const wrapper = codeInput.closest('.form-group') || codeInput;
        wrapper.style.display = 'none';
    }

    await carregarTurmas();
    await carregarAlunos();

    // Autocomplete (mantido)
    studentInput.addEventListener('input', function () {
        const val = this.value;
        autocompleteList.innerHTML = '';
        if (!val) return false;
        const filtered = alunos.filter(a => a.toLowerCase().includes(val.toLowerCase()));
        filtered.forEach(aluno => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            div.innerHTML = `<strong>${aluno.substr(0, val.length)}</strong>${aluno.substr(val.length)}`;
            div.addEventListener('click', function () {
                studentInput.value = aluno;
                autocompleteList.innerHTML = '';
            });
            autocompleteList.appendChild(div);
        });
    });

    // Submissão — agora envia direto pro backend com o código (sem facial)
    presenceForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const groupId = groupSelect.value;
        const studentName = studentInput.value.trim();
        const code = (urlCode || (codeInput ? codeInput.value : '')).trim();

        if (!groupId || !studentName) {
            alert('Selecione a turma e o aluno.');
            return;
        }
        if (!code) {
            alert('Informe o código exibido pelo professor.');
            return;
        }
        if (!alunos.includes(studentName)) {
            alert('Aluno não encontrado na lista.');
            return;
        }

        if (feedback) feedback.style.display = 'flex';

        try {
            const res = await fetch(`${API_URL}/presence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: studentName,
                    group_id: Number(groupId),
                    code: code
                })
            });

            const data = await res.json();

            if (!res.ok) {
                // 400 = código inválido/expirado | 404 = aluno não cadastrado
                throw new Error(data.detail || 'Falha ao registrar presença.');
            }

            alert(data.msg || 'Presença confirmada!');
            // Opcional: redirecionar para uma tela de sucesso
            // window.location.href = 'sucesso.html';
        } catch (err) {
            alert(err.message);
        } finally {
            if (feedback) feedback.style.display = 'none';
        }
    });
});