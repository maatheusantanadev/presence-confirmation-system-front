document.addEventListener('DOMContentLoaded', () => {

    const container = document.getElementById('presenceContainer');
    const refreshBtn = document.querySelector('.btn-refresh');

    const API_URL = 'https://presence-confirmation-system.onrender.com';

    let loading = false;

async function fetchHistory() {

    if (loading) return;

    loading = true;

    setLoading(true);

    try {
        const response = await fetch(`${API_URL}/presence/history`);

        if (!response.ok) {
            throw new Error(`Falha ao buscar dados (${response.status})`);
        }

        const data = await response.json();

        renderHistory(data);

    } catch (error) {
        console.error('Erro na requisição:', error);
    } finally {
        loading = false;
        setLoading(false);
    }
}

    function renderHistory(data) {

        container.innerHTML = '';

        const groups = Object.entries(data || {});

        if (groups.length === 0) {
            container.innerHTML = `
                <div class="group-card">
                    <div style="padding:20px;text-align:center">
                        Nenhum registro encontrado.
                    </div>
                </div>
            `;
            return;
        }

        groups.forEach(([groupName, presences]) => {

            const rows = presences.map(reg => {

                const [dataStr = '---', horaStr = '---'] =
                    (reg.data || '').split(' ');

                return `
                    <tr>
                        <td><strong>${reg.aluno || '---'}</strong></td>
                        <td>${reg.email || '---'}</td>
                        <td>${dataStr}</td>
                        <td>${horaStr}</td>
                        <td>
                            <span class="status-badge">
                                ${(reg.status || '').toUpperCase()}
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');

            const card = document.createElement('div');

            card.className = 'group-card';

            card.innerHTML = `
                <div class="group-header">
                    <h3>
                        <i class="fas fa-users"></i>
                        ${groupName}
                    </h3>
                </div>

                <table class="presence-table">
                    <thead>
                        <tr>
                            <th>Aluno</th>
                            <th>Email</th>
                            <th>Data</th>
                            <th>Hora</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            `;

            container.appendChild(card);
        });
    }

    function setLoading(isLoading) {

        if (!refreshBtn) return;

        refreshBtn.disabled = isLoading;

        refreshBtn.innerHTML = isLoading
            ? '<i class="fas fa-spinner fa-spin"></i> Carregando...'
            : '<i class="fas fa-sync-alt"></i> Atualizar Dados';
    }

    refreshBtn?.addEventListener('click', fetchHistory);

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'login.html';
    });

    fetchHistory();

setInterval(() => {
    fetchHistory();
}, 10000);


    window.fetchHistory = fetchHistory;
});