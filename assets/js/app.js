// ============================================
// ESTADO DA APLICAÇÃO
// Tudo que o app "sabe" fica aqui
// ============================================
let todos = [];
let currentFilter = 'all';

// ============================================
// ELEMENTOS DO DOM
// Cache = guardar referência para não buscar toda hora
// ============================================
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const appFooter = document.getElementById('appFooter');
const taskCount = document.getElementById('taskCount');
const btnClear = document.getElementById('btnClear');
const filterButtons = document.querySelectorAll('.filter-btn');
const currentDate = document.getElementById('currentDate');

// ============================================
// INICIALIZAÇÃO
// Roda quando a página carrega
// ============================================
function init() {
    loadTodos();
    render();
    showDate();
    bindEvents();
}

// ============================================
// DATA ATUAL NO CABEÇALHO
// ============================================
function showDate() {
    const options = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    };
    const today = new Date().toLocaleDateString('pt-BR', options);
    // Capitalizar primeira letra
    currentDate.textContent = today.charAt(0).toUpperCase() + today.slice(1);
}

// ============================================
// LOCAL STORAGE (Salvar e Carregar)
// Os dados sobrevivem ao fechar o navegador!
// ============================================
function saveTodos() {
    localStorage.setItem('meus_todos', JSON.stringify(todos));
}

function loadTodos() {
    const saved = localStorage.getItem('meus_todos');
    if (saved) {
        try {
            todos = JSON.parse(saved);
        } catch {
            todos = [];
        }
    }
}

// ============================================
// GERAR ID ÚNICO
// ============================================
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ============================================
// FORMATAR HORA
// ============================================
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// ============================================
// ADICIONAR TAREFA
// ============================================
function addTodo(text) {
    // Limpar espaços e verificar se não está vazio
    const cleanText = text.trim();
    if (!cleanText) return;

    const newTodo = {
        id: generateId(),
        text: cleanText,
        completed: false,
        createdAt: new Date().toISOString()
    };

    todos.unshift(newTodo); // Adicionar no início
    saveTodos();
    render();
}

// ============================================
// TOGGLE (Marcar/Desmarcar)
// ============================================
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        render();
    }
}

// ============================================
// DELETAR TAREFA
// ============================================
function deleteTodo(id) {
    // Animação de saída
    const item = document.querySelector(`[data-id="${id}"]`);
    if (item) {
        item.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            todos = todos.filter(t => t.id !== id);
            saveTodos();
            render();
        }, 280);
    }
}

// ============================================
// LIMPAR CONCLUÍDAS
// ============================================
function clearCompleted() {
    const completedCount = todos.filter(t => t.completed).length;
    if (completedCount === 0) return;

    if (confirm(`Deseja remover ${completedCount} tarefa(s) concluída(s)?`)) {
        todos = todos.filter(t => !t.completed);
        saveTodos();
        render();
    }
}

// ============================================
// FILTRAR TAREFAS
// ============================================
function getFilteredTodos() {
    switch (currentFilter) {
        case 'active':
            return todos.filter(t => !t.completed);
        case 'completed':
            return todos.filter(t => t.completed);
        default:
            return todos;
    }
}

// ============================================
// RENDERIZAR (Atualizar a tela)
// Esta é a função MAIS IMPORTANTE!
// ============================================
function render() {
    const filtered = getFilteredTodos();

    // Mostrar/esconder estado vazio
    if (filtered.length === 0) {
        emptyState.style.display = 'block';
        todoList.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        todoList.style.display = 'flex';
    }

    // Gerar HTML das tarefas
    todoList.innerHTML = filtered.map(todo => `
        <li class="todo-item ${todo.completed ? 'completed' : ''}" 
            data-id="${todo.id}">
            <div class="todo-checkbox" data-action="toggle"></div>
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <span class="todo-date">${formatTime(todo.createdAt)}</span>
            <button class="btn-delete" data-action="delete" title="Excluir">
                ✕
            </button>
        </li>
    `).join('');

    // Atualizar contador
    const active = todos.filter(t => !t.completed).length;
    const total = todos.length;
    taskCount.textContent = `${active} pendente(s) de ${total}`;

    // Mostrar/esconder rodapé
    appFooter.style.display = total > 0 ? 'flex' : 'none';
}

// ============================================
// SEGURANÇA: Evitar XSS
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// VINCULAR EVENTOS
// ============================================
function bindEvents() {
    // Formulário de nova tarefa
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTodo(todoInput.value);
        todoInput.value = '';
        todoInput.focus();
    });

    // Cliques na lista (Event Delegation - MELHOR PRÁTICA!)
    todoList.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const item = target.closest('.todo-item');
        const id = item.dataset.id;
        const action = target.dataset.action;

        if (action === 'toggle') toggleTodo(id);
        if (action === 'delete') deleteTodo(id);
    });

    // Filtros
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            render();
        });
    });

    // Limpar concluídas
    btnClear.addEventListener('click', clearCompleted);

    // Atalho de teclado: Escape limpa o input
    todoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            todoInput.value = '';
            todoInput.blur();
        }
    });
}

// ============================================
// CSS DA ANIMAÇÃO DE SAÍDA
// (Adicionado via JS para manter tudo junto)
// ============================================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            opacity: 0;
            transform: translateX(50px);
            height: 0;
            padding: 0;
            margin: 0;
            overflow: hidden;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// INICIAR O APP!
// ============================================
init();