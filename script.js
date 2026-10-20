// MySpace: a small personal dashboard. Data is stored in this browser only.
const STORAGE_KEY = "myspaceDashboardV1";
const initialState = { tasks: [], notes: [], goals: [] };
let state = loadState();
let currentFilter = "all";
let toastTimer;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.tasks) && Array.isArray(saved.notes) && Array.isArray(saved.goals)) {
      return saved;
    }
  } catch (error) {
    console.warn("Could not load saved dashboard data.", error);
  }
  return { tasks: [], notes: [], goals: [] };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render();
  } catch (error) {
    showToast("Could not save data. Check your browser storage settings.");
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function updateDate() {
  const now = new Date();
  document.querySelector("#dateLine").textContent = now.toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric"
  }).toUpperCase();
  document.querySelector("#todayLabel").textContent = now.toLocaleDateString(undefined, {
    month: "short", day: "numeric"
  });
}

function renderTasks() {
  const list = document.querySelector("#taskList");
  const filtered = state.tasks.filter((task) => {
    if (currentFilter === "active") return !task.done;
    if (currentFilter === "completed") return task.done;
    return true;
  });

  list.innerHTML = filtered.map((task) => `
    <li class="task-row ${task.done ? "done" : ""}">
      <input class="task-check" type="checkbox" data-action="toggle-task" data-id="${escapeHTML(task.id)}"
        aria-label="Mark ${escapeHTML(task.text)} as ${task.done ? "not completed" : "completed"}" ${task.done ? "checked" : ""}>
      <span class="task-text">${escapeHTML(task.text)}</span>
      <button class="delete-button" type="button" data-action="delete-task" data-id="${escapeHTML(task.id)}" aria-label="Delete task">×</button>
    </li>`).join("");

  document.querySelector("#emptyTasks").hidden = filtered.length > 0;
  const completed = state.tasks.filter((task) => task.done).length;
  document.querySelector("#completedCount").textContent = completed;
  document.querySelector("#taskTotal").textContent = `/ ${state.tasks.length} tasks`;
  document.querySelector("#taskProgress").style.width = state.tasks.length
    ? `${(completed / state.tasks.length) * 100}%` : "0%";
}

function renderNotes() {
  const list = document.querySelector("#notesList");
  list.innerHTML = state.notes.slice().reverse().map((note) => `
    <article class="note-item">
      <button class="delete-button" type="button" data-action="delete-note" data-id="${escapeHTML(note.id)}" aria-label="Delete note">×</button>
      <h3>${escapeHTML(note.title)}</h3>
      <p>${escapeHTML(note.body)}</p>
    </article>`).join("");
  document.querySelector("#emptyNotes").hidden = state.notes.length > 0;
  document.querySelector("#noteCount").textContent = state.notes.length;
}

function renderGoals() {
  const list = document.querySelector("#goalsList");
  list.innerHTML = state.goals.map((goal) => `
    <div class="goal-row ${goal.done ? "done" : ""}">
      <input class="goal-check" type="checkbox" data-action="toggle-goal" data-id="${escapeHTML(goal.id)}"
        aria-label="Mark goal ${escapeHTML(goal.text)} as ${goal.done ? "in progress" : "complete"}" ${goal.done ? "checked" : ""}>
      <span class="goal-text">${escapeHTML(goal.text)}</span>
      ${goal.done ? '<span class="goal-badge">Done ✓</span>' : ""}
      <button class="delete-button" type="button" data-action="delete-goal" data-id="${escapeHTML(goal.id)}" aria-label="Delete goal">×</button>
    </div>`).join("");
  document.querySelector("#emptyGoals").hidden = state.goals.length > 0;
  document.querySelector("#goalCount").textContent = state.goals.filter((goal) => !goal.done).length;
}

function render() {
  renderTasks();
  renderNotes();
  renderGoals();
  const activeTask = state.tasks.find((task) => !task.done);
  document.querySelector("#focusSummary").textContent = activeTask ? activeTask.text : "One step at a time";
}

document.querySelector("#taskForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#taskInput");
  const text = input.value.trim();
  if (!text) return;
  state.tasks.push({ id: makeId(), text, done: false });
  input.value = "";
  currentFilter = "all";
  document.querySelectorAll(".filter").forEach((button) => button.classList.toggle("active", button.dataset.filter === "all"));
  saveState();
  showToast("Task added. You’ve got this!");
});

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach((item) => item.classList.toggle("active", item === button));
    renderTasks();
  });
});

document.querySelector("#noteForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.querySelector("#noteTitle").value.trim();
  const body = document.querySelector("#noteBody").value.trim();
  if (!title || !body) return;
  state.notes.push({ id: makeId(), title, body, createdAt: new Date().toISOString() });
  event.target.reset();
  saveState();
  showToast("Your note has been saved.");
});

document.querySelector("#goalForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#goalInput");
  const text = input.value.trim();
  if (!text) return;
  state.goals.push({ id: makeId(), text, done: false });
  input.value = "";
  saveState();
  showToast("New goal added. Keep going!");
});

document.body.addEventListener("change", (event) => {
  const control = event.target;
  const action = control.dataset.action;
  const id = control.dataset.id;
  if (action === "toggle-task") {
    const task = state.tasks.find((item) => item.id === id);
    if (task) task.done = control.checked;
    saveState();
  }
  if (action === "toggle-goal") {
    const goal = state.goals.find((item) => item.id === id);
    if (goal) goal.done = control.checked;
    saveState();
  }
});

document.body.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action^='delete-']");
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === "delete-task") state.tasks = state.tasks.filter((item) => item.id !== id);
  if (action === "delete-note") state.notes = state.notes.filter((item) => item.id !== id);
  if (action === "delete-goal") state.goals = state.goals.filter((item) => item.id !== id);
  saveState();
  showToast("Item deleted.");
});

document.querySelector("#clearDataBtn").addEventListener("click", () => {
  const confirmed = window.confirm("Delete all tasks, notes, and goals saved in this browser? This cannot be undone.");
  if (!confirmed) return;
  state = { tasks: [], notes: [], goals: [] };
  saveState();
  showToast("Your demo data has been reset.");
});

updateDate();
render();
