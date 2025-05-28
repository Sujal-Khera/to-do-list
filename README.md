# Smart To-Do List Application

![Smart To-Do List](https://img.shields.io/badge/Status-Active-success)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![Flask](https://img.shields.io/badge/Flask-2.0+-lightgrey)
![License](https://img.shields.io/badge/License-MIT-green)

A modern, feature-rich task management application built with Flask and vanilla JavaScript. This application helps users stay organized, boost productivity, and never miss deadlines with its intelligent task management system.

## 🌟 Features

### Task Management
- ✨ Create, read, update, and delete tasks (CRUD operations)
- 📝 Rich task details:
  - Title and description
  - Priority levels (High, Medium, Low)
  - Due dates and times
  - Custom categories/tags
  - Task status tracking

### Smart Dashboard
- 📊 Real-time task statistics:
  - Total tasks count
  - Completed tasks
  - Pending tasks
  - Overdue tasks
- 📈 Visual progress bar
- 📊 Percentage-based completion tracking

### Advanced Features
- 🔍 Smart search functionality
- 🏷️ Filter by priority and status
- 📅 Multiple sorting options
- 🌓 Dark/Light theme toggle
- 📱 Fully responsive design
- 📤 Import/Export functionality

## 🛠️ Tech Stack

### Backend
- **Framework**: Flask (Python)
- **Data Storage**: JSON
- **API**: RESTful
- **Security**: CORS enabled

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with animations
- **JavaScript**: Vanilla JS for interactivity
- **UI Components**:
  - Bootstrap 5
  - Font Awesome icons
  - Flatpickr (date/time picker)

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smart-todo.git
   cd smart-todo
   ```

2. **Create and activate virtual environment**
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS/Linux
   python -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the application**
   Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## 📁 Project Structure

```
smart-todo/
├── app.py              # Flask application
├── static/            # Static assets
│   ├── css/
│   │   └── style.css  # Custom styles
│   ├── js/
│   │   └── main.js    # Frontend logic
│   └── flatpickr/     # Date picker library
├── templates/         # HTML templates
│   └── index.html     # Main page
├── tasks.json         # Data storage
├── requirements.txt   # Python dependencies
└── README.md         # Documentation
```

## 💻 Development

### Code Style
- Follow PEP 8 guidelines for Python code
- Use ESLint for JavaScript code
- Maintain consistent indentation (4 spaces for Python, 2 spaces for JavaScript)

### Best Practices
- Write meaningful commit messages
- Keep functions small and focused
- Add comments for complex logic
- Use meaningful variable names

## 📊 Development Time Log

| Task | Time Spent | Description |
|------|------------|-------------|
| Project Setup | 1 hour | Environment setup and dependency installation |
| Backend Development | 3 hours | API implementation and data management |
| Frontend Development | 4 hours | UI implementation and interactivity |
| Testing & Debugging | 2 hours | Bug fixes and optimization |
| Documentation | 1 hour | README and code documentation |
| **Total** | **11 hours** | |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [Flask](https://flask.palletsprojects.com/) - Web framework
- [Bootstrap](https://getbootstrap.com/) - CSS framework
- [Font Awesome](https://fontawesome.com/) - Icons
- [Flatpickr](https://flatpickr.js.org/) - Date picker

## 📞 Support

For support, email sujalkhera.c@gmail.com or open an issue in the repository.

---

Made by [Sujal Khera]