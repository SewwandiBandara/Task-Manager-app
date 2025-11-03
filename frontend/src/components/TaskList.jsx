import { useState, useEffect } from 'react';
import axios from 'axios';
import TaskForm from './TaskForm';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(checkReminders, 60000);
    requestNotificationPermission();
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/tasks');
      setTasks(res.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addOrUpdateTask = async (taskData) => {
    try {
      if (editingTask) {
        await axios.put(`http://localhost:5000/api/tasks/${editingTask._id}`, taskData);
        setEditingTask(null);
      } else {
        await axios.post('http://localhost:5000/api/tasks', taskData);
      }
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const deleteTask = async (id) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`http://localhost:5000/api/tasks/${id}`);
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const toggleStatus = async (id, status) => {
    try {
      await axios.patch(`http://localhost:5000/api/tasks/${id}/status`, { 
        status: status === 'pending' ? 'complete' : 'pending' 
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const clearAll = async () => {
    if (confirm('Are you sure you want to clear ALL tasks? This action cannot be undone.')) {
      try {
        await axios.delete('http://localhost:5000/api/tasks');
        fetchTasks();
      } catch (error) {
        console.error('Error clearing tasks:', error);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if (Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  };

  const checkReminders = () => {
    tasks.forEach((task) => {
      if (task.dueDate && task.status === 'pending') {
        const due = new Date(task.dueDate);
        const now = new Date();
        if (due - now <= 3600000 && due > now) {
          new Notification('Task Reminder', { 
            body: `Task "${task.title}" is due soon!`,
            icon: '/task-icon.png'
          });
        }
      }
    });
  };

  const cancelEdit = () => {
    setEditingTask(null);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
                         task.description?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(task => task.status === 'pending').length,
    completed: tasks.filter(task => task.status === 'complete').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header with User Info and Logout */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <Link
                to="/notes"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
              >
                📝 Notes
              </Link>
              <Link
                to="/workflows"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
              >
                📅 Workflows
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-gray-800">Task Manager</h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold text-gray-800">{user?.name}</p>
              </div>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
          <p className="text-gray-600">Stay organized and productive</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-gray-600">Total Tasks</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-gray-600">Completed</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Task Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
              <TaskForm 
                onSubmit={addOrUpdateTask} 
                initialData={editingTask}
                onCancel={editingTask ? cancelEdit : null}
              />
            </div>
          </div>

          {/* Right Column - Task List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute left-3 top-3 text-gray-400">
                      🔍
                    </div>
                  </div>
                </div>
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)} 
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Tasks</option>
                  <option value="pending">Pending</option>
                  <option value="complete">Completed</option>
                </select>
                <button 
                  onClick={clearAll} 
                  className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg transition-colors duration-200 font-medium"
                >
                  Clear All
                </button>
              </div>

              {/* Task List */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading tasks...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your search'}
                  </h3>
                  <p className="text-gray-500">
                    {tasks.length === 0 ? 'Create your first task to get started!' : 'Try adjusting your search or filter'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <div 
                      key={task._id} 
                      className={`border-l-4 rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                        task.status === 'complete' 
                          ? 'bg-green-50 border-green-500' 
                          : 'bg-white border-blue-500'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleStatus(task._id, task.status)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 transition-colors ${
                                task.status === 'complete'
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-gray-300 hover:border-green-500'
                              }`}
                            >
                              {task.status === 'complete' && '✓'}
                            </button>
                            <div className="flex-1">
                              <h3 className={`font-semibold text-lg ${
                                task.status === 'complete' ? 'line-through text-gray-500' : 'text-gray-800'
                              }`}>
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="text-gray-600 mt-1">{task.description}</p>
                              )}
                              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                {task.dueDate && !isNaN(new Date(task.dueDate).getTime()) && (
                                  <span className="flex items-center gap-1">
                                    📅 Due {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                                  </span>
                                )}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  task.status === 'pending' 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {task.status === 'pending' ? 'Pending' : 'Completed'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingTask(task)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors duration-200"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteTask(task._id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskList;