/**
 * script.js — Task List App
 * 
 * Architecture:
 *  - State  : a single `tasks` array stored in localStorage.
 *  - Render : one `renderTasks()` function that re-draws the list
 *             and stats every time state changes.
 *  - Events : delegated where possible; otherwise attached once on init.
 *
 * No external libraries — pure Vanilla JavaScript (ES6+).
 */

"use strict";

/* ==========================================================
   1. STATE
   ========================================================== */

/** @type {{ id: string, text: string, completed: boolean }[]} */
let tasks = [];

/** @type {'all' | 'active' | 'completed'} */
let currentFilter = "all";

/* ==========================================================
   2. LOCAL STORAGE HELPERS
   ========================================================== */

const STORAGE_KEY = "task-list-data";

/** Persist current tasks array to localStorage. */
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/** Load tasks from localStorage (returns [] if nothing stored). */
function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/* ==========================================================
   3. TASK CRUD
   ========================================================== */

/**
 * Create and append a new task.
 * @param {string} text - Task description.
 */
function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  tasks.push({
    id: crypto.randomUUID(),
    text: trimmed,
    completed: false,
  });

  saveTasks();
  renderTasks();
}

/**
 * Toggle the completed state of a task.
 * @param {string} id - Task ID.
 */
function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

/**
 * Update the text of an existing task.
 * @param {string} id   - Task ID.
 * @param {string} text - New text.
 */
function updateTask(id, text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  task.text = trimmed;
  saveTasks();
  renderTasks();
}

/**
 * Remove a task by ID.
 * @param {string} id - Task ID.
 */
function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
}

/** Remove all tasks that are marked as completed. */
function clearCompleted() {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  renderTasks();
}

/* ==========================================================
   4. RENDER
   ========================================================== */

/**
 * Filter tasks based on the current filter setting.
 * @returns {typeof tasks}
 */
function getFilteredTasks() {
  if (currentFilter === "active")    return tasks.filter((t) => !t.completed);
  if (currentFilter === "completed") return tasks.filter((t) =>  t.completed);
  return tasks; // 'all'
}

/**
 * Build the HTML for a single task item.
 * @param {{ id: string, text: string, completed: boolean }} task
 * @returns {HTMLLIElement}
 */
function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-item";
  li.dataset.id = task.id;

  // Checkbox
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-checkbox";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", `Mark "${task.text}" as ${task.completed ? "active" : "completed"}`);

  // Task text
  const span = document.createElement("span");
  span.className = `task-text${task.completed ? " completed" : ""}`;
  span.textContent = task.text;

  // Edit button
  const editBtn = document.createElement("button");
  editBtn.className = "btn-action edit";
  editBtn.dataset.action = "edit";
  editBtn.setAttribute("aria-label", `Edit task: ${task.text}`);
  editBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
         viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round"
            d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828
               a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" />
    </svg>`;

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn-action delete";
  deleteBtn.dataset.action = "delete";
  deleteBtn.setAttribute("aria-label", `Delete task: ${task.text}`);
  deleteBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
         viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7
               m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
    </svg>`;

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(editBtn);
  li.appendChild(deleteBtn);

  return li;
}

/**
 * Main render function — clears and repaints the task list,
 * then updates stats and UI visibility.
 */
function renderTasks() {
  const list       = document.getElementById("task-list");
  const emptyState = document.getElementById("empty-state");
  const emptyMsg   = document.getElementById("empty-msg");
  const clearBtn   = document.getElementById("clear-completed");

  const filtered = getFilteredTasks();

  // Clear existing items
  list.innerHTML = "";

  // Show empty state or task items
  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    emptyState.classList.add("flex");

    // Contextual empty message
    if (currentFilter === "active")    emptyMsg.textContent = "No active tasks. Great job!";
    else if (currentFilter === "completed") emptyMsg.textContent = "No completed tasks yet.";
    else emptyMsg.textContent = "No tasks yet. Add one above!";
  } else {
    emptyState.classList.add("hidden");
    emptyState.classList.remove("flex");

    // Render each task
    const fragment = document.createDocumentFragment();
    filtered.forEach((task) => fragment.appendChild(createTaskElement(task)));
    list.appendChild(fragment);
  }

  // Update tab counts
  const totalActive    = tasks.filter((t) => !t.completed).length;
  const totalCompleted = tasks.filter((t) =>  t.completed).length;
  const totalAll       = tasks.length;
  document.getElementById("count-all").textContent       = totalAll       > 0 ? `(${totalAll})`       : "";
  document.getElementById("count-active").textContent    = totalActive    > 0 ? `(${totalActive})`    : "";
  document.getElementById("count-completed").textContent = totalCompleted > 0 ? `(${totalCompleted})` : "";

  // Show / hide "Clear completed" button
  if (totalCompleted > 0) {
    clearBtn.classList.remove("hidden");
  } else {
    clearBtn.classList.add("hidden");
  }
}

/* ==========================================================
   5. FILTER TABS
   ========================================================== */

/**
 * Activate the tab that matches `filter` and deactivate the others.
 * @param {'all' | 'active' | 'completed'} filter
 */
function setFilter(filter) {
  currentFilter = filter;

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle("active-tab", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  renderTasks();
}

/* ==========================================================
   6. MODAL (EDIT)
   ========================================================== */

let editingTaskId = null; // ID of the task currently being edited

/** Open the edit modal pre-filled with the task's current text. */
function openEditModal(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  editingTaskId = id;

  const modal    = document.getElementById("edit-modal");
  const input    = document.getElementById("edit-input");
  const errorEl  = document.getElementById("edit-error");

  input.value = task.text;
  errorEl.classList.add("hidden");
  errorEl.textContent = "";

  modal.classList.remove("hidden");
  input.focus();
  input.select();
}

/** Close the edit modal and reset state. */
function closeEditModal() {
  document.getElementById("edit-modal").classList.add("hidden");
  editingTaskId = null;
}

/** Save the edited task from the modal. */
function saveEdit() {
  const input   = document.getElementById("edit-input");
  const errorEl = document.getElementById("edit-error");
  const newText = input.value.trim();

  if (!newText) {
    errorEl.textContent = "Task cannot be empty.";
    errorEl.classList.remove("hidden");
    input.focus();
    return;
  }

  updateTask(editingTaskId, newText);
  closeEditModal();
}

/* ==========================================================
   7. FORM VALIDATION
   ========================================================== */

/**
 * Validate the add-task form input.
 * @param {string} value
 * @returns {{ valid: boolean, message: string }}
 */
function validateTaskInput(value) {
  if (!value.trim()) return { valid: false, message: "Please enter a task." };
  if (value.trim().length < 2) return { valid: false, message: "Task must be at least 2 characters." };
  return { valid: true, message: "" };
}

/* ==========================================================
   8. EVENT LISTENERS
   ========================================================== */

function initEvents() {
  /* --- Add Task Form --- */
  const taskForm  = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const formError = document.getElementById("form-error");

  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const { valid, message } = validateTaskInput(taskInput.value);

    if (!valid) {
      formError.textContent = message;
      formError.classList.remove("hidden");
      taskInput.focus();
      return;
    }

    formError.classList.add("hidden");
    formError.textContent = "";

    addTask(taskInput.value);
    taskInput.value = "";
    taskInput.focus();
  });

  // Hide error on input change
  taskInput.addEventListener("input", () => {
    if (!formError.classList.contains("hidden")) {
      formError.classList.add("hidden");
    }
  });

  /* --- Task List (event delegation) --- */
  const taskList = document.getElementById("task-list");

  taskList.addEventListener("change", (e) => {
    // Checkbox toggle
    if (e.target.classList.contains("task-checkbox")) {
      const id = e.target.closest(".task-item").dataset.id;
      toggleTask(id);
    }
  });

  taskList.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-action");
    if (!btn) return;

    const id = btn.closest(".task-item").dataset.id;

    if (btn.dataset.action === "edit")   openEditModal(id);
    if (btn.dataset.action === "delete") deleteTask(id);
  });

  /* --- Filter Tabs --- */
  document.getElementById("filter-tabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    setFilter(btn.dataset.filter);
  });

  /* --- Clear Completed --- */
  document.getElementById("clear-completed").addEventListener("click", clearCompleted);

  /* --- Edit Modal --- */
  document.getElementById("modal-cancel").addEventListener("click", closeEditModal);
  document.getElementById("modal-save").addEventListener("click", saveEdit);

  // Save on Enter key inside edit input
  document.getElementById("edit-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") closeEditModal();
  });

  // Close modal on backdrop click
  document.getElementById("edit-modal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("edit-modal")) closeEditModal();
  });
}

/* ==========================================================
   9. INIT
   ========================================================== */

function init() {
  tasks = loadTasks();
  initEvents();
  renderTasks();
}

// Bootstrap the app once the DOM is ready
document.addEventListener("DOMContentLoaded", init);
