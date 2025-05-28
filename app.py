from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
import json
import os
from datetime import datetime, timedelta
import uuid

app = Flask(__name__)
CORS(app)

# Configuration
DATA_FILE = 'tasks.json'

def init_data_file():
    """Initialize the data file if it doesn't exist"""
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w') as f:
            json.dump([], f)

def read_tasks():
    """Read tasks from JSON file"""
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def write_tasks(tasks):
    """Write tasks to JSON file"""
    with open(DATA_FILE, 'w') as f:
        json.dump(tasks, f, indent=2, default=str)

def calculate_countdown(due_date_str):
    """Calculate countdown string from due date"""
    if not due_date_str:
        return None
    
    try:
        due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
        now = datetime.now(due_date.tzinfo) if due_date.tzinfo else datetime.now()
        diff = due_date - now
        
        if diff.total_seconds() <= 0:
            return 'Overdue'
        
        days = diff.days
        hours, remainder = divmod(diff.seconds, 3600)
        minutes, _ = divmod(remainder, 60)
        
        if days > 0:
            return f"{days}d {hours}h {minutes}m"
        elif hours > 0:
            return f"{hours}h {minutes}m"
        else:
            return f"{minutes}m"
    except (ValueError, TypeError):
        return 'Invalid date'

def get_next_id(tasks):
    """Get the next available ID"""
    if not tasks:
        return 1
    return max(task['id'] for task in tasks) + 1

# Routes

@app.route('/')
def index():
    """Serve the main HTML file"""
    return render_template('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks with countdown"""
    try:
        tasks = read_tasks()
        for task in tasks:
            task['countdown'] = calculate_countdown(task.get('due_date'))
        return jsonify(tasks)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    """Get a single task by ID"""
    try:
        tasks = read_tasks()
        task = next((t for t in tasks if t['id'] == task_id), None)
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        task['countdown'] = calculate_countdown(task.get('due_date'))
        return jsonify(task)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    try:
        data = request.get_json()
        
        if not data or not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400
        
        tasks = read_tasks()
        
        new_task = {
            'id': get_next_id(tasks),
            'title': data['title'].strip(),
            'description': data.get('description', '').strip(),
            'due_date': data.get('due_date'),
            'priority': data.get('priority', 'medium'),
            'tags': data.get('tags', []),
            'completed': False,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        tasks.append(new_task)
        write_tasks(tasks)
        
        new_task['countdown'] = calculate_countdown(new_task.get('due_date'))
        return jsonify(new_task), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update an existing task"""
    try:
        data = request.get_json()
        tasks = read_tasks()
        
        task_index = next((i for i, t in enumerate(tasks) if t['id'] == task_id), None)
        if task_index is None:
            return jsonify({'error': 'Task not found'}), 404
        
        task = tasks[task_index]
        
        # Update fields if provided
        if 'title' in data:
            task['title'] = data['title'].strip()
        if 'description' in data:
            task['description'] = data['description'].strip()
        if 'due_date' in data:
            task['due_date'] = data['due_date']
        if 'priority' in data:
            task['priority'] = data['priority']
        if 'tags' in data:
            task['tags'] = data['tags']
        if 'completed' in data:
            task['completed'] = data['completed']
        
        task['updated_at'] = datetime.now().isoformat()
        
        write_tasks(tasks)
        
        task['countdown'] = calculate_countdown(task.get('due_date'))
        return jsonify(task)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/toggle', methods=['PUT'])
def toggle_task(task_id):
    """Toggle task completion status"""
    try:
        tasks = read_tasks()
        task_index = next((i for i, t in enumerate(tasks) if t['id'] == task_id), None)
        
        if task_index is None:
            return jsonify({'error': 'Task not found'}), 404
        
        tasks[task_index]['completed'] = not tasks[task_index]['completed']
        tasks[task_index]['updated_at'] = datetime.now().isoformat()
        
        write_tasks(tasks)
        
        task = tasks[task_index]
        task['countdown'] = calculate_countdown(task.get('due_date'))
        return jsonify(task)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/notes', methods=['PUT'])
def update_notes(task_id):
    """Update task notes/description"""
    try:
        data = request.get_json()
        tasks = read_tasks()
        
        task_index = next((i for i, t in enumerate(tasks) if t['id'] == task_id), None)
        if task_index is None:
            return jsonify({'error': 'Task not found'}), 404
        
        tasks[task_index]['description'] = data.get('notes', '').strip()
        tasks[task_index]['updated_at'] = datetime.now().isoformat()
        
        write_tasks(tasks)
        
        task = tasks[task_index]
        task['countdown'] = calculate_countdown(task.get('due_date'))
        return jsonify(task)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    try:
        tasks = read_tasks()
        task_index = next((i for i, t in enumerate(tasks) if t['id'] == task_id), None)
        
        if task_index is None:
            return jsonify({'error': 'Task not found'}), 404
        
        deleted_task = tasks.pop(task_index)
        write_tasks(tasks)
        
        return jsonify({'message': 'Task deleted successfully', 'task': deleted_task})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get task statistics"""
    try:
        tasks = read_tasks()
        
        total_tasks = len(tasks)
        completed_tasks = len([t for t in tasks if t['completed']])
        pending_tasks = total_tasks - completed_tasks
        overdue_tasks = len([t for t in tasks if t.get('due_date') and 
                           datetime.fromisoformat(t['due_date'].replace('Z', '+00:00')) < datetime.now()])
        
        priority_counts = {
            'high': len([t for t in tasks if t.get('priority') == 'high']),
            'medium': len([t for t in tasks if t.get('priority') == 'medium']),
            'low': len([t for t in tasks if t.get('priority') == 'low'])
        }
        
        return jsonify({
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks,
            'overdue_tasks': overdue_tasks,
            'priority_counts': priority_counts,
            'completion_rate': round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    init_data_file()
    app.run(debug=True, host='0.0.0.0', port=5000)