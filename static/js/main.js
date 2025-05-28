// Theme Management
const themeToggle = document.querySelector('.theme-toggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update theme toggle icon
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || (prefersDarkScheme.matches ? 'dark' : 'light');
setTheme(savedTheme);

// Task Management
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.filters = {
            search: '',
            priority: 'all',
            status: 'all',
            sortBy: 'due_date'
        };
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeDatePickers();
        this.renderTasks();
        this.updateStats();
        this.checkDeadlines();
    }

    initializeDatePickers() {
        // Initialize date picker
        this.datePicker = flatpickr("#dueDate", {
            dateFormat: "Y-m-d",
            minDate: "today",
            allowInput: true,
            disableMobile: "true"
        });

        // Initialize time picker
        this.timePicker = flatpickr("#dueTime", {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
            allowInput: true,
            disableMobile: "true"
        });
    }

    initializeElements() {
        // Form elements
        this.taskForm = document.getElementById('taskForm');
        this.taskTitle = document.getElementById('taskTitle');
        this.taskDescription = document.getElementById('taskDescription');
        this.dueDate = document.getElementById('dueDate');
        this.dueTime = document.getElementById('dueTime');
        this.priority = document.getElementById('priority');
        this.taskTags = document.getElementById('taskTags');
        
        // Filter elements
        this.searchInput = document.getElementById('searchInput');
        this.priorityFilter = document.getElementById('priorityFilter');
        this.statusFilter = document.getElementById('statusFilter');
        this.sortBy = document.getElementById('sortBy');
        this.clearFilters = document.getElementById('clearFilters');
        
        // List and stats elements
        this.taskList = document.getElementById('taskList');
        this.taskCount = document.getElementById('taskCount');
        this.stats = {
            total: document.getElementById('totalTasks'),
            completed: document.getElementById('completedTasks'),
            pending: document.getElementById('pendingTasks'),
            overdue: document.getElementById('overdueTasks'),
            completionRate: document.getElementById('completionRate'),
            progressBar: document.getElementById('progressBar')
        };
        
        // Export/Import buttons
        this.exportBtn = document.getElementById('exportTasks');
        this.importBtn = document.getElementById('importTasks');
    }

    initializeEventListeners() {
        // Form submission
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Filter changes
        this.searchInput.addEventListener('input', debounce(() => {
            this.filters.search = this.searchInput.value;
            this.renderTasks();
        }, 300));

        this.priorityFilter.addEventListener('change', () => {
            this.filters.priority = this.priorityFilter.value;
            this.renderTasks();
        });

        this.statusFilter.addEventListener('change', () => {
            this.filters.status = this.statusFilter.value;
            this.renderTasks();
        });

        this.sortBy.addEventListener('change', () => {
            this.filters.sortBy = this.sortBy.value;
            this.renderTasks();
        });

        this.clearFilters.addEventListener('click', () => {
            this.clearAllFilters();
        });

        // Export/Import
        this.exportBtn.addEventListener('click', () => this.exportTasks());
        this.importBtn.addEventListener('click', () => this.importTasks());
    }

    addTask() {
        const title = this.taskTitle.value.trim();
        if (!title) return;

        const task = {
            id: Date.now(),
            title,
            description: this.taskDescription.value.trim(),
            dueDate: this.dueDate.value,
            dueTime: this.dueTime.value,
            priority: this.priority.value,
            tags: this.taskTags.value.split(',').map(tag => tag.trim()).filter(Boolean),
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.taskForm.reset();
        
        // Success messages for adding task
        const successMessages = [
            `✨ "${task.title}" added successfully!`,
            `✅ New task "${task.title}" created!`,
            `🎯 "${task.title}" added to your list!`,
            `📝 "${task.title}" saved successfully!`
        ];
        
        showNotification(
            successMessages[Math.floor(Math.random() * successMessages.length)],
            'success'
        );
        
        // Check if the new task is due soon
        const dueDate = new Date(task.dueDate + 'T' + task.dueTime);
        const now = new Date();
        const timeUntilDue = dueDate - now;
        
        if (timeUntilDue <= 24 * 60 * 60 * 1000) {
            const hoursUntilDue = Math.round(timeUntilDue / (1000 * 60 * 60));
            if (hoursUntilDue <= 0) {
                showNotification(`⚠️ "${task.title}" is overdue!`, 'error');
            } else if (hoursUntilDue <= 1) {
                showNotification(`⏰ "${task.title}" is due within an hour!`, 'warning');
            } else {
                showNotification(`📅 "${task.title}" is due in ${hoursUntilDue} hours!`, 'info');
            }
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        this.tasks = this.tasks.map(t => {
            if (t.id === id) {
                return { ...t, completed: !t.completed };
            }
            return t;
        });

        this.saveTasks();
        this.renderTasks();
        this.updateStats();

        // Add completion notification
        if (task) {
            const messages = !task.completed ? [
                `🎉 "${task.title}" completed! Great job!`,
                `✅ "${task.title}" marked as done!`,
                `✨ "${task.title}" task completed successfully!`,
                `🌟 "${task.title}" is now complete!`
            ] : [
                `📝 "${task.title}" marked as incomplete`,
                `🔄 "${task.title}" needs attention again`,
                `⏳ "${task.title}" is back on your list`,
                `📋 "${task.title}" is now pending`
            ];
            
            showNotification(
                messages[Math.floor(Math.random() * messages.length)],
                !task.completed ? 'success' : 'info'
            );
        }
    }

    deleteTask(id) {
        const task = this.tasks.find(t => t.id === id);
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        if (task) {
            const messages = [
                `🗑️ "${task.title}" deleted!`,
                `❌ "${task.title}" removed from your list`,
                `📤 "${task.title}" has been deleted`,
                `🚫 "${task.title}" removed successfully`
            ];
            
            showNotification(
                messages[Math.floor(Math.random() * messages.length)],
                'warning'
            );
        }
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        // Populate form with task data
        this.taskTitle.value = task.title;
        this.taskDescription.value = task.description;
        this.dueDate.value = task.dueDate;
        this.dueTime.value = task.dueTime;
        this.priority.value = task.priority;
        this.taskTags.value = task.tags.join(', ');

        // Remove the task
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();

        // Scroll to form
        this.taskForm.scrollIntoView({ behavior: 'smooth' });
    }

    renderTasks() {
        let filteredTasks = this.filterTasks();
        filteredTasks = this.sortTasks(filteredTasks);

        this.taskList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            this.showEmptyState();
            return;
        }

        filteredTasks.forEach(task => {
            const li = this.createTaskElement(task);
            this.taskList.appendChild(li);
        });

        this.taskCount.textContent = filteredTasks.length;
    }

    filterTasks() {
        return this.tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                                task.description.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                                task.tags.some(tag => tag.toLowerCase().includes(this.filters.search.toLowerCase()));
            
            const matchesPriority = this.filters.priority === 'all' || task.priority === this.filters.priority;
            const matchesStatus = this.filters.status === 'all' || 
                                (this.filters.status === 'completed' && task.completed) ||
                                (this.filters.status === 'active' && !task.completed);

            return matchesSearch && matchesPriority && matchesStatus;
        });
    }

    sortTasks(tasks) {
        return tasks.sort((a, b) => {
            switch (this.filters.sortBy) {
                case 'due_date':
                    return new Date(a.dueDate + 'T' + a.dueTime) - new Date(b.dueDate + 'T' + b.dueTime);
                case 'priority':
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                case 'created_at':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'title':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        const dueDate = new Date(task.dueDate + 'T' + task.dueTime);
        const isOverdue = !task.completed && dueDate < new Date();
        
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                <div class="task-meta">
                    <span class="task-priority priority-${task.priority}">${task.priority}</span>
                    <span class="task-due-date ${isOverdue ? 'text-danger' : ''}">
                        <i class="fas fa-calendar"></i>
                        ${formatDate(dueDate)}
                    </span>
                    ${task.tags.length ? `
                        <div class="task-tags">
                            ${task.tags.map(tag => `<span class="task-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn edit" data-tooltip="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-btn delete" data-tooltip="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => this.toggleTask(task.id));

        const editBtn = li.querySelector('.edit');
        editBtn.addEventListener('click', () => this.editTask(task.id));

        const deleteBtn = li.querySelector('.delete');
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

        return li;
    }

    showEmptyState() {
        this.taskList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No tasks found</h3>
                <p>Try adjusting your filters or add a new task</p>
            </div>
        `;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;
        const overdue = this.tasks.filter(task => {
            if (task.completed) return false;
            const dueDate = new Date(task.dueDate + 'T' + task.dueTime);
            return dueDate < new Date();
        }).length;
        
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        this.stats.total.textContent = total;
        this.stats.completed.textContent = completed;
        this.stats.pending.textContent = pending;
        this.stats.overdue.textContent = overdue;
        this.stats.completionRate.textContent = `${completionRate}%`;
        this.stats.progressBar.style.width = `${completionRate}%`;
    }

    clearAllFilters() {
        this.searchInput.value = '';
        this.priorityFilter.value = 'all';
        this.statusFilter.value = 'all';
        this.sortBy.value = 'due_date';
        
        this.filters = {
            search: '',
            priority: 'all',
            status: 'all',
            sortBy: 'due_date'
        };
        
        this.renderTasks();
    }

    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `tasks-${formatDate(new Date(), 'YYYY-MM-DD')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification('Tasks exported successfully!', 'success');
    }

    importTasks() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = event => {
                try {
                    const importedTasks = JSON.parse(event.target.result);
                    this.tasks = importedTasks;
                    this.saveTasks();
                    this.renderTasks();
                    this.updateStats();
                    showNotification('Tasks imported successfully!', 'success');
                } catch (error) {
                    showNotification('Error importing tasks. Invalid file format.', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    saveTasks() {
        // Save to localStorage
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        
        // Sync with backend
        fetch('/api/tasks/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.tasks)
        }).catch(error => {
            console.error('Error syncing tasks with backend:', error);
            showNotification('Error syncing tasks with server', 'error');
        });
    }

    checkDeadlines() {
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        this.tasks.forEach(task => {
            if (task.completed) return;

            const dueDate = new Date(task.dueDate + 'T' + task.dueTime);
            const timeUntilDue = dueDate - now;
            const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);
            const minutesUntilDue = Math.floor((timeUntilDue % (1000 * 60 * 60)) / (1000 * 60));

            // Only show notification if it's a new deadline (not already notified)
            const notificationKey = `notified_${task.id}_${Math.floor(hoursUntilDue)}`;
            if (localStorage.getItem(notificationKey)) return;

            // Generate varied messages based on time remaining
            if (timeUntilDue < 0) {
                const overdueHours = Math.abs(Math.floor(hoursUntilDue));
                const messages = [
                    `⚠️ "${task.title}" is overdue!`,
                    `❗ "${task.title}" is past its deadline!`,
                    `🚨 "${task.title}" needs your attention - it's overdue!`,
                    `⏰ "${task.title}" was due ${overdueHours} hour${overdueHours !== 1 ? 's' : ''} ago!`
                ];
                showNotification(messages[Math.floor(Math.random() * messages.length)], 'error');
                localStorage.setItem(notificationKey, 'true');
            } else if (timeUntilDue > 0 && timeUntilDue <= 60 * 60 * 1000) {
                const messages = [
                    `⏳ "${task.title}" is due in ${minutesUntilDue} minutes!`,
                    `⚡ "${task.title}" needs your attention - due soon!`,
                    `🎯 "${task.title}" deadline approaching - ${minutesUntilDue} minutes left!`,
                    `⏰ "${task.title}" is due in less than an hour!`
                ];
                showNotification(messages[Math.floor(Math.random() * messages.length)], 'warning');
                localStorage.setItem(notificationKey, 'true');
            } else if (timeUntilDue > 0 && timeUntilDue <= 24 * 60 * 60 * 1000) {
                const hours = Math.floor(hoursUntilDue);
                const messages = [
                    `📅 "${task.title}" is due in ${hours} hour${hours !== 1 ? 's' : ''}!`,
                    `⏰ "${task.title}" deadline approaching - ${hours} hour${hours !== 1 ? 's' : ''} remaining!`,
                    `🎯 "${task.title}" needs your attention - due today!`,
                    `⚡ "${task.title}" is coming up - ${hours} hour${hours !== 1 ? 's' : ''} to go!`
                ];
                showNotification(messages[Math.floor(Math.random() * messages.length)], 'info');
                localStorage.setItem(notificationKey, 'true');
            }
        });

        // Check deadlines every minute
        setTimeout(() => this.checkDeadlines(), 60 * 1000);
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatDate(date, format = 'MMM DD, YYYY HH:mm') {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = document.createElement('i');
    icon.className = `fas ${type === 'success' ? 'fa-check-circle' : 
                          type === 'error' ? 'fa-exclamation-circle' : 
                          type === 'warning' ? 'fa-exclamation-triangle' : 
                          'fa-info-circle'}`;
    
    notification.appendChild(icon);
    notification.appendChild(document.createTextNode(message));
    
    // Add to notifications container
    const container = document.querySelector('.notifications-container');
    container.appendChild(notification);
    
    // Play sound based on notification type
    const sounds = {
        success: 'static/sounds/success.mp3',
        error: 'static/sounds/error.mp3',
        warning: 'static/sounds/warning.mp3',
        info: 'static/sounds/info.mp3'
    };

    if (sounds[type]) {
        const audio = new Audio(sounds[type]);
        audio.volume = 0.5; // Increased volume to 50%
        
        // Try to play the sound
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('Sound playback failed:', error);
                // If autoplay is blocked, we'll try to play on next user interaction
                document.addEventListener('click', () => {
                    audio.play().catch(() => {});
                }, { once: true });
            });
        }
    }
    
    // Remove notification after delay
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Create notifications container
    const notificationsContainer = document.createElement('div');
    notificationsContainer.className = 'notifications-container';
    document.body.appendChild(notificationsContainer);

    // Initialize theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Initialize Task Manager
    const taskManager = new TaskManager();
    
    // Add background gradient
    const gradient = document.createElement('div');
    gradient.className = 'main-bg-gradient';
    document.body.appendChild(gradient);
    
    // Preload notification sounds
    const preloadSounds = () => {
        const sounds = {
            success: 'static/sounds/success.mp3',
            error: 'static/sounds/error.mp3',
            warning: 'static/sounds/warning.mp3',
            info: 'static/sounds/info.mp3'
        };

        Object.values(sounds).forEach(soundUrl => {
            const audio = new Audio(soundUrl);
            audio.load();
        });
    };

    // Try to preload sounds after user interaction
    document.addEventListener('click', () => {
        preloadSounds();
    }, { once: true });
    
    console.log('Application initialized');
}); 