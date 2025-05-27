from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# In-memory storage for tasks
tasks = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def add_task():
    task = request.json
    task['id'] = len(tasks) + 1
    task['completed'] = False
    task['created_at'] = datetime.now().isoformat()
    tasks.append(task)
    return jsonify(task), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    print(f"Received PUT for task {task_id}")
    print(f"Request JSON: {request.json}")
    task = next((t for t in tasks if t['id'] == task_id), None)
    if task:
        data = request.json
        print(f"Updating task {task_id} with data: {data}")
        task.update(data)
        print(f"Updated task: {task}")
        return jsonify(task)
    print(f"Task {task_id} not found")
    return jsonify({'error': 'Task not found'}), 404

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    global tasks
    tasks = [t for t in tasks if t['id'] != task_id]
    return '', 204

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    task = next((t for t in tasks if t['id'] == task_id), None)
    if task:
        return jsonify(task)
    return jsonify({'error': 'Task not found'}), 404


if __name__ == '__main__':
    app.run(debug=True) 