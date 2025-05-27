// API endpoints
const API_URL = '/api/tasks';

// DOM elements
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const taskTitleInput = document.getElementById('taskTitle');
const dueDateInput = document.getElementById('dueDate');

// Global variables
let timerIntervals = {};
let tasks = [];

// Load tasks when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Task form submission
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    
    // Task item click for details
    document.getElementById('taskList').addEventListener('click', handleTaskClick);
    
    // Modal close button
    document.querySelector('.btn-close').addEventListener('click', () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailsModal'));
        modal.hide();
    });
    
    // Save notes button
    document.getElementById('saveNotes').addEventListener('click', handleSaveNotes);
    
    // Robust event delegation for Save Changes button
    document.body.addEventListener('click', function(e) {
        const btn = e.target.closest('#saveTaskDetails');
        if (btn) {
            console.log('Save Changes button clicked (delegated)');
            handleSaveTaskDetails();
        }
    });
    
    // Date and time input handlers
    setupDateTimeInputs();
}

// Setup date and time inputs
function setupDateTimeInputs() {
    const dateInput = document.getElementById('dueDate');
    const timeInput = document.getElementById('dueTime');
    const dateContainer = document.querySelector('.date-picker-container');
    const timeContainer = document.querySelector('.time-picker-container');
    // Add placeholder for clarity
    dateInput.placeholder = 'YYYY-MM-DD';
    timeInput.placeholder = 'HH:MM';
    // Focus input when clicking anywhere in the container
    dateContainer.addEventListener('click', () => {
        dateInput.focus();
        dateInput.showPicker && dateInput.showPicker();
    });
    timeContainer.addEventListener('click', () => {
        timeInput.focus();
        timeInput.showPicker && timeInput.showPicker();
    });
}

// Handle task form submission
async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const taskInput = document.getElementById('taskTitle');
    const dueDateInput = document.getElementById('dueDate');
    const dueTimeInput = document.getElementById('dueTime');
    
    // Validate inputs
    if (!taskInput.value.trim()) {
        alert('Please enter a task title');
        return;
    }
    
    if (!dueDateInput.value) {
        alert('Please select a due date');
        return;
    }
    
    if (!dueTimeInput.value) {
        alert('Please select a due time');
        return;
    }
    
    const task = {
        title: taskInput.value.trim(),
        due_date: `${dueDateInput.value}T${dueTimeInput.value}`,
        description: ''
    };
    
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        });
        
        if (response.ok) {
            taskInput.value = '';
            dueDateInput.value = '';
            dueTimeInput.value = '';
            document.querySelector('.date-picker-container').removeAttribute('data-value');
            document.querySelector('.time-picker-container').removeAttribute('data-value');
            loadTasks();
        }
    } catch (error) {
        console.error('Error adding task:', error);
    }
}

// Handle task click for details
function handleTaskClick(e) {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;
    
    const taskId = taskItem.dataset.id;
    const task = tasks.find(t => t.id === parseInt(taskId));
    if (!task) return;
    
    // Show task details
    showTaskDetails(task);
}

// Show task details in modal
async function showTaskDetails(task) {
    // Always fetch the latest task data from the server
    let latestTask = task;
    try {
        const response = await fetch(`/api/tasks/${task.id}`);
        if (response.ok) {
            latestTask = await response.json();
        }
    } catch (e) { /* fallback to passed task */ }

    const modal = document.getElementById('taskDetailsModal');
    modal.dataset.taskId = latestTask.id;
    document.getElementById('editTaskTitle').value = latestTask.title;
    document.getElementById('modalDueDate').textContent = latestTask.due_date ? new Date(latestTask.due_date).toLocaleString() : 'No due date';
    document.getElementById('modalDueDate').dataset.originalDate = latestTask.due_date || '';
    document.getElementById('modalCountdown').textContent = latestTask.countdown || 'N/A';
    document.getElementById('taskNotes').value = latestTask.description || '';
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

// Handle save notes
async function handleSaveNotes() {
    const taskId = document.getElementById('taskDetailsModal').dataset.taskId;
    const notes = document.getElementById('taskNotes').value;
    
    try {
        const response = await fetch(`/api/tasks/${taskId}/notes`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notes })
        });
        
        if (response.ok) {
            const task = tasks.find(t => t.id === parseInt(taskId));
            if (task) {
                task.notes = notes;
            }
        }
    } catch (error) {
        console.error('Error saving notes:', error);
    }
}

// Handle save task details
async function handleSaveTaskDetails() {
    const taskId = document.getElementById('taskDetailsModal').dataset.taskId;
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('taskNotes').value.trim();
    let due_date = document.getElementById('modalDueDate').dataset.originalDate;

    if (!title) {
        alert('Please enter a task title');
        return;
    }

    // Fallback: fetch from backend if not present
    if (!due_date) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`);
            if (response.ok) {
                const data = await response.json();
                due_date = data.due_date;
            }
        } catch (e) {}
    }

    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                description,
                due_date
            })
        });

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailsModal'));
            modal.hide();
            loadTasks();
        }
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

// Load tasks from the server
async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        tasks = await response.json();
        clearAllTimers();
        displayTasks(tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

// Display tasks in the list
function displayTasks(tasks) {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    // Sort tasks by due_date ascending, tasks without due_date at the end
    const sortedTasks = [...tasks].sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
    });
    sortedTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
        if (task.due_date) {
            startCountdown(task);
        }
    });
}

// Create task element
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskElement.dataset.id = task.id;
    
    taskElement.innerHTML = `
        <div class="task-content" style="display: flex; align-items: center;">
            <input type="checkbox" class="form-check-input" ${task.completed ? 'checked' : ''}>
            <span class="task-title${task.completed ? ' completed-strike' : ''}" style="margin-left: 1rem;">${task.title}</span>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
        </div>
        <div class="due-date-container">
            ${task.due_date ? `
                <span class="task-due-date">
                    <i class="fas fa-calendar"></i>
                    ${new Date(task.due_date).toLocaleDateString()}
                </span>
                <span class="task-countdown">
                    <i class="fas fa-clock"></i>
                    <span class="countdown-text">${task.countdown || 'Calculating...'}</span>
                </span>
            ` : ''}
        </div>
        <div class="task-actions">
            <button class="btn btn-danger btn-sm delete-task" title="Delete task">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Add event listeners
    const checkbox = taskElement.querySelector('input[type="checkbox"]');
    const titleSpan = taskElement.querySelector('.task-title');
    checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
    titleSpan.addEventListener('dblclick', () => toggleTaskComplete(task.id));
    taskElement.querySelector('.delete-task').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task.id);
    });
    
    return taskElement;
}

// Start countdown timer for a task
function startCountdown(task) {
    const dueDate = new Date(task.due_date);
    const countdownElement = document.querySelector(`[data-id="${task.id}"] .countdown-text`);
    
    function updateCountdown() {
        const now = new Date();
        const diff = dueDate - now;
        
        if (diff <= 0) {
            countdownElement.textContent = 'Overdue';
            countdownElement.parentElement.classList.add('text-danger');
            clearInterval(timerIntervals[task.id]);
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        let countdownText = '';
        if (days > 0) countdownText += `${days}d `;
        if (hours > 0) countdownText += `${hours}h `;
        countdownText += `${minutes}m`;
        
        countdownElement.textContent = countdownText;
        
        // Add warning class if less than 24 hours remaining
        if (diff < 24 * 60 * 60 * 1000) {
            countdownElement.parentElement.classList.add('text-warning');
        }
    }
    
    updateCountdown();
    timerIntervals[task.id] = setInterval(updateCountdown, 60000);
}

// Clear all countdown timers
function clearAllTimers() {
    Object.values(timerIntervals).forEach(interval => clearInterval(interval));
    timerIntervals = {};
}

// Toggle task completion
async function toggleTaskComplete(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/toggle`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            loadTasks();
        }
    } catch (error) {
        console.error('Error toggling task:', error);
    }
}

// Delete task
async function deleteTask(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadTasks();
        }
    } catch (error) {
        console.error('Error deleting task:', error);
    }
} 