// Task Manager — talks to the Supabase REST API (PostgREST) using fetch().

let config = null;

const form = document.getElementById('task-form');
const idInput = document.getElementById('task-id');
const titleInput = document.getElementById('task-title');
const descInput = document.getElementById('task-description');
const submitBtn = document.getElementById('task-submit');
const cancelBtn = document.getElementById('task-cancel');
const list = document.getElementById('task-list');
const statusEl = document.getElementById('status-message');

// Cache of tasks currently shown, keyed by id
const tasks = new Map();

function showStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.className = isError ? 'error' : 'success';
}

function apiUrl(query = '') {
  return `${config.supabaseUrl}/rest/v1/${config.tableName}${query}`;
}

async function api(method, query, body) {
  const res = await fetch(apiUrl(query), {
    method,
    headers: {
      apikey: config.supabasePublishableKey,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const err = await res.json();
      detail = err.message || err.error || detail;
    } catch (_) { /* no JSON body */ }
    throw new Error(`${method} failed (${res.status}): ${detail}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// --- CRUD operations ---

const getTasks = () => api('GET', '?select=*&order=id.asc');
const getTask = (id) => api('GET', `?id=eq.${id}&select=*`).then((rows) => rows[0]);
const createTask = (task) => api('POST', '', task);
const saveTask = (task) => api('PUT', `?id=eq.${task.id}`, task);
const deleteTask = (id) => api('DELETE', `?id=eq.${id}`);

// --- Rendering ---

function renderTasks() {
  list.innerHTML = '';
  if (tasks.size === 0) {
    list.innerHTML = '<p class="empty">No tasks yet. Add one above.</p>';
    return;
  }
  for (const task of tasks.values()) {
    const item = document.createElement('article');
    item.className = 'task-item' + (task.completed ? ' done' : '');
    item.dataset.id = task.id;

    const title = document.createElement('h3');
    title.className = 'task-title';
    title.textContent = task.title;

    const desc = document.createElement('p');
    desc.className = 'task-description';
    desc.textContent = task.description || '';

    const status = document.createElement('span');
    status.className = 'task-status';
    status.textContent = task.completed ? 'Completed' : 'Incomplete';

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    actions.append(
      button('toggle-task', task.completed ? 'Mark incomplete' : 'Mark complete'),
      button('edit-task', 'Edit'),
      button('delete-task', 'Delete')
    );

    item.append(title, desc, status, actions);
    list.appendChild(item);
  }
}

function button(className, text) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = className;
  b.textContent = text;
  return b;
}

async function loadTasks() {
  try {
    const rows = await getTasks();
    tasks.clear();
    rows.forEach((t) => tasks.set(t.id, t));
    renderTasks();
    showStatus(`Loaded ${rows.length} task(s).`);
  } catch (err) {
    showStatus(`Could not load tasks. ${err.message}`, true);
  }
}

function resetForm() {
  form.reset();
  idInput.value = '';
  submitBtn.textContent = 'Add Task';
  cancelBtn.hidden = true;
}

// --- Event handlers ---

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const description = descInput.value.trim();
  if (!title) {
    showStatus('Title is required.', true);
    return;
  }
  submitBtn.disabled = true;
  try {
    if (idInput.value) {
      const existing = tasks.get(Number(idInput.value));
      const [saved] = await saveTask({ ...existing, title, description });
      tasks.set(saved.id, saved);
      showStatus('Task updated.');
    } else {
      const [created] = await createTask({ title, description, completed: false });
      tasks.set(created.id, created);
      showStatus('Task added.');
    }
    renderTasks();
    resetForm();
  } catch (err) {
    showStatus(`Could not save task. ${err.message}`, true);
  } finally {
    submitBtn.disabled = false;
  }
});

cancelBtn.addEventListener('click', resetForm);

list.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const item = btn.closest('.task-item');
  const id = Number(item.dataset.id);

  try {
    if (btn.classList.contains('edit-task')) {
      const task = await getTask(id);
      if (!task) throw new Error('Task no longer exists.');
      idInput.value = task.id;
      titleInput.value = task.title;
      descInput.value = task.description || '';
      submitBtn.textContent = 'Save Changes';
      cancelBtn.hidden = false;
      titleInput.focus();
      showStatus(`Editing task #${id}.`);
    } else if (btn.classList.contains('toggle-task')) {
      const task = tasks.get(id);
      const [saved] = await saveTask({ ...task, completed: !task.completed });
      tasks.set(saved.id, saved);
      renderTasks();
      showStatus(saved.completed ? 'Task marked as completed.' : 'Task marked as incomplete.');
    } else if (btn.classList.contains('delete-task')) {
      if (!confirm('Delete this task?')) return;
      await deleteTask(id);
      tasks.delete(id);
      if (Number(idInput.value) === id) resetForm();
      renderTasks();
      showStatus('Task deleted.');
    }
  } catch (err) {
    showStatus(`Operation failed. ${err.message}`, true);
  }
});

// --- Startup ---

(async function init() {
  try {
    const res = await fetch('config.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`config.json not found (${res.status})`);
    config = await res.json();
  } catch (err) {
    showStatus(`Could not load configuration. ${err.message}`, true);
    return;
  }
  loadTasks();
})();
