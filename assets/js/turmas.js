document.addEventListener('DOMContentLoaded', () => {
    const groupsGrid = document.getElementById('groupsGrid');
    const modal = document.getElementById('groupModal');
    const closeModal = document.querySelector('.close-modal');

    let allGroups = [];

    async function fetchGroups() {
        try {
            const response = await fetch('https://presence-confirmation-system.onrender.com/groups');

            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}`);
            }

            allGroups = await response.json();

            console.log("Turmas recebidas:", allGroups);

            renderGroups(allGroups);

        } catch (error) {
            console.error("Erro ao buscar turmas:", error);

            groupsGrid.innerHTML = `
                <div class="error-message">
                    Não foi possível carregar as turmas.
                </div>
            `;
        }
    }

    function renderGroups(groups) {
        groupsGrid.innerHTML = '';

        if (!groups || groups.length === 0) {
            groupsGrid.innerHTML = `
                <div class="empty-message">
                    Nenhuma turma cadastrada.
                </div>
            `;
            return;
        }

        groups.forEach(group => {
            const card = document.createElement('div');
            card.className = 'group-card';

            card.innerHTML = `
                <h3>${group.name}</h3>
                <span>
                    <i class="fas fa-graduation-cap"></i>
                    Ver alunos
                </span>
            `;

            card.addEventListener('click', () => showGroupDetails(group));

            groupsGrid.appendChild(card);
        });
    }

    function showGroupDetails(group) {
        document.getElementById('modalGroupName').textContent = group.name;
        document.getElementById('modalProfessorName').textContent =
            `CPF: ${group.professor_cpf || 'Não informado'}`;

        const list = document.getElementById('modalStudentList');
        list.innerHTML = '';

        if (group.students && group.students.length > 0) {

            group.students.forEach(student => {
                const li = document.createElement('li');

                li.innerHTML = `
                    <span>${student.name}</span>
                    <small>${student.registration_number}</small>
                `;

                list.appendChild(li);
            });

        } else {
            list.innerHTML = `
                <li>Nenhum aluno vinculado a esta turma.</li>
            `;
        }

        modal.style.display = 'block';
    }

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    fetchGroups();
});