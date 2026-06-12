document.addEventListener('DOMContentLoaded', () => {

    const tableBody = document.getElementById('presenceTableBody');
    const noData = document.getElementById('noData');
    const applyBtn = document.getElementById('applyFilters');

    const API_URL = 'https://presence-confirmation-system.onrender.com:8000';

    async function fetchHistory() {
        setLoading(true);
        try {
            const nameFilter = document.getElementById('nameFilter').value.toLowerCase().trim();

            const response = await fetch(`${API_URL}/presence/history`);

            if (!response.ok) {
                throw new Error(`Falha ao buscar dados (${response.status})`);
            }

            const data = await response.json();
            renderTable(data, nameFilter);

        } catch (error) {
            console.error("Erro na requisição:", error);
            tableBody.innerHTML =
                '<tr><td colspan="5" style="text-align:center;color:red;padding:20px;">Erro ao conectar com o servidor.</td></tr>';
            noData.style.display = 'none';
        } finally {
            setLoading(false);
        }
    }

    function renderTable(data, filter) {
        tableBody.innerHTML = '';
        const entries = Object.entries(data || {});
        let hasRecords = false;

        if (entries.length === 0) {
            noData.style.display = 'block';
            return;
        }

        entries.forEach(([groupName, presences]) => {
            const filtered = (presences || []).filter(p =>
                (p.aluno || '').toLowerCase().includes(filter) ||
                (p.email || '').toLowerCase().includes(filter)
            );

            if (filtered.length > 0) {
                hasRecords = true;

                const groupHeader = document.createElement('tr');
                groupHeader.innerHTML = `
                    <td colspan="5" style="background-color:#f8fafc;font-weight:bold;color:#2563eb;border-left:4px solid #2563eb;">
                        <i class="fas fa-users" style="margin-right:8px;"></i> Turma: ${groupName}
                    </td>
                `;
                tableBody.appendChild(groupHeader);

                filtered.forEach(reg => {
                    const [dataStr = '---', horaStr = ''] = (reg.data || '').split(' ');
                    const status = (reg.status || '').toUpperCase();

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${reg.aluno || '---'}</strong></td>
                        <td>${reg.email || '---'}</td>
                        <td>${dataStr}</td>
                        <td>${horaStr}</td>
                        <td><span class="status-badge">${status}</span></td>
                    `;
                    tableBody.appendChild(tr);
                });
            }
        });

        noData.style.display = hasRecords ? 'none' : 'block';
    }

    function setLoading(isLoading) {
        if (!applyBtn) return;
        applyBtn.disabled = isLoading;
        applyBtn.innerHTML = isLoading
            ? '<i class="fas fa-spinner fa-spin"></i> Filtrando...'
            : '<i class="fas fa-filter"></i> Filtrar';
    }

    applyBtn?.addEventListener('click', fetchHistory);

    // Logout simples (sem token pra limpar)
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'login.html';
    });

    fetchHistory();
});