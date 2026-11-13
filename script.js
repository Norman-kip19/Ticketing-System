// Use one storage key so the app can find its saved tasks each time it opens.
const STORAGE_KEY = "clear-day-tasks";

const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const taskCount = document.querySelector("#task-count");
const saveMessage = document.querySelector("#save-message");

// Read the saved list once when the page loads.
let tasks = loadTasks();

// Render the saved tasks immediately so the page matches what is on screen.
renderTasks();

// Adding the submit listener also lets users press Enter in the input.
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    return;
  }

  // Give every task an ID so its checkbox and delete button can find it later.
  tasks.push({
    id: createTaskId(),
    text,
    completed: false,
  });

  taskInput.value = "";
  taskInput.focus();
  updateTasks();
});

// A single listener on the list handles checkbox and delete clicks for all rows.
taskList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const taskItem = target.closest(".task-item");
  if (!(taskItem instanceof HTMLLIElement)) {
    return;
  }

  const taskId = taskItem.dataset.taskId;

  if (target instanceof HTMLInputElement && target.matches(".task-checkbox")) {
    tasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: target.checked } : task
    );
    updateTasks();
  }

  if (target instanceof HTMLButtonElement && target.matches(".delete-button")) {
    tasks = tasks.filter((task) => task.id !== taskId);
    updateTasks();
  }
});

// Load only valid task records; malformed saved data shouldn't break the page.
function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (!savedTasks) {
      return [];
    }

    const parsedTasks = JSON.parse(savedTasks);
    if (!Array.isArray(parsedTasks)) {
      throw new Error("Saved tasks are not a list.");
    }

    return parsedTasks.filter(
      (task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.text === "string" &&
        typeof task.completed === "boolean"
    );
  } catch (error) {
    // Keep the app usable, and make the problem visible in the browser console.
    console.error("Could not read saved tasks:", error);
    return [];
  }
}

// Update storage and the visible list whenever a task changes.
function updateTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    saveMessage.textContent = "";
  } catch (error) {
    console.error("Could not save tasks:", error);
    saveMessage.textContent = "Your changes could not be saved on this device.";
  }

  renderTasks();
}

// Build each row with DOM methods so task text is shown as text, not HTML.
function renderTasks() {
  taskList.replaceChildren();

  for (const task of tasks) {
    const row = document.createElement("li");
    row.className = `task-item${task.completed ? " is-complete" : ""}`;
    row.dataset.taskId = task.id;

    const checkbox = document.createElement("input");
    checkbox.className = "task-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark "${task.text}" as complete`);

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete "${task.text}"`);

    row.append(checkbox, text, deleteButton);
    taskList.append(row);
  }

  // Keep the empty message and remaining-task count in sync with the list.
  emptyState.hidden = tasks.length > 0;
  const remaining = tasks.filter((task) => !task.completed).length;
  taskCount.textContent = `${remaining} ${remaining === 1 ? "task" : "tasks"} left`;
}

// Add a random suffix to the time so tasks created close together stay unique.
function createTaskId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
