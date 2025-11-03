import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

const Workflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [stats, setStats] = useState({});
  const { user, logout } = useAuth();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('custom');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState([]);
  const [steps, setSteps] = useState([{ title: '', duration: 30 }]);
  const [color, setColor] = useState('#3b82f6');

  const categories = [
    { value: 'daily', label: 'Daily Routine', icon: '☀️' },
    { value: 'weekly', label: 'Weekly', icon: '📅' },
    { value: 'project', label: 'Project', icon: '🎯' },
    { value: 'meeting', label: 'Meeting', icon: '👥' },
    { value: 'custom', label: 'Custom', icon: '⚡' }
  ];

  const colorOptions = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#ef4444', '#06b6d4', '#6366f1'
  ];

  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    fetchWorkflows();
    fetchStats();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/workflows');
      setWorkflows(res.data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/workflows/stats/summary');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const workflowData = {
      title,
      description,
      category,
      startDate: startDate || new Date().toISOString().split('T')[0],
      startTime,
      isRecurring,
      recurringDays: isRecurring ? recurringDays : [],
      steps: steps.filter(s => s.title.trim()).map((step, index) => ({
        ...step,
        order: index
      })),
      color
    };

    try {
      if (editingWorkflow) {
        await axios.put(`http://localhost:5000/api/workflows/${editingWorkflow._id}`, workflowData);
      } else {
        await axios.post('http://localhost:5000/api/workflows', workflowData);
      }
      resetForm();
      fetchWorkflows();
      fetchStats();
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Error saving workflow: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('custom');
    setStartDate('');
    setStartTime('09:00');
    setIsRecurring(false);
    setRecurringDays([]);
    setSteps([{ title: '', duration: 30 }]);
    setColor('#3b82f6');
    setEditingWorkflow(null);
    setShowForm(false);
  };

  const handleEdit = (workflow) => {
    setEditingWorkflow(workflow);
    setTitle(workflow.title);
    setDescription(workflow.description || '');
    setCategory(workflow.category);
    setStartDate(workflow.startDate.split('T')[0]);
    setStartTime(workflow.startTime);
    setIsRecurring(workflow.isRecurring);
    setRecurringDays(workflow.recurringDays || []);
    setSteps(workflow.steps.length > 0 ? workflow.steps : [{ title: '', duration: 30 }]);
    setColor(workflow.color);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      try {
        await axios.delete(`http://localhost:5000/api/workflows/${id}`);
        fetchWorkflows();
        fetchStats();
      } catch (error) {
        console.error('Error deleting workflow:', error);
      }
    }
  };

  const toggleStep = async (workflowId, stepId) => {
    try {
      await axios.patch(`http://localhost:5000/api/workflows/${workflowId}/steps/${stepId}/toggle`);
      fetchWorkflows();
      fetchStats();
    } catch (error) {
      console.error('Error toggling step:', error);
    }
  };

  const duplicateWorkflow = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/workflows/${id}/duplicate`);
      fetchWorkflows();
      fetchStats();
    } catch (error) {
      console.error('Error duplicating workflow:', error);
    }
  };

  const addStep = () => {
    setSteps([...steps, { title: '', duration: 30 }]);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const toggleRecurringDay = (day) => {
    if (recurringDays.includes(day)) {
      setRecurringDays(recurringDays.filter(d => d !== day));
    } else {
      setRecurringDays([...recurringDays, day]);
    }
  };

  const getWorkflowsForDay = (date) => {
    return workflows.filter(workflow => {
      const workflowDate = parseISO(workflow.startDate);
      return isSameDay(workflowDate, date);
    });
  };

  const renderCalendarView = () => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Weekly Schedule</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dayWorkflows = getWorkflowsForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={index}
                className={`border rounded-lg p-3 min-h-[200px] ${
                  isToday ? 'bg-blue-50 border-blue-500 border-2' : 'bg-gray-50'
                }`}
              >
                <div className="font-semibold text-center mb-2">
                  <div className="text-xs text-gray-600">{format(day, 'EEE')}</div>
                  <div className={`text-lg ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                    {format(day, 'd')}
                  </div>
                </div>

                <div className="space-y-2">
                  {dayWorkflows.map(workflow => (
                    <div
                      key={workflow._id}
                      className="p-2 rounded cursor-pointer hover:shadow-md transition"
                      style={{ backgroundColor: workflow.color + '20', borderLeft: `3px solid ${workflow.color}` }}
                      onClick={() => handleEdit(workflow)}
                    >
                      <div className="text-xs font-semibold truncate">{workflow.title}</div>
                      <div className="text-xs text-gray-600">{workflow.startTime}</div>
                      <div className="text-xs mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="h-1 rounded-full"
                            style={{ width: `${workflow.progress}%`, backgroundColor: workflow.color }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const groupedWorkflows = workflows.reduce((acc, workflow) => {
      if (!acc[workflow.status]) acc[workflow.status] = [];
      acc[workflow.status].push(workflow);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        {['scheduled', 'in-progress', 'completed'].map(status => {
          const statusWorkflows = groupedWorkflows[status] || [];
          if (statusWorkflows.length === 0) return null;

          return (
            <div key={status} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 capitalize">
                {status.replace('-', ' ')} ({statusWorkflows.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statusWorkflows.map(workflow => (
                  <WorkflowCard
                    key={workflow._id}
                    workflow={workflow}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDuplicate={duplicateWorkflow}
                    onToggleStep={toggleStep}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-600 hover:text-gray-800">
                ← Tasks
              </Link>
              <Link to="/notes" className="text-gray-600 hover:text-gray-800">
                📝 Notes
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-gray-800">Workflow Schedule</h1>
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

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total || 0}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.scheduled || 0}</div>
              <div className="text-sm text-gray-600">Scheduled</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.inProgress || 0}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed || 0}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.averageProgress || 0}%</div>
              <div className="text-sm text-gray-600">Avg Progress</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                📅 Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                📋 List
              </button>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition font-medium"
            >
              {showForm ? 'Cancel' : '+ New Workflow'}
            </button>
          </div>
        </div>

        {/* Form (continued in next message due to length) */}
        {showForm && (
          <WorkflowForm
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            category={category}
            setCategory={setCategory}
            startDate={startDate}
            setStartDate={setStartDate}
            startTime={startTime}
            setStartTime={setStartTime}
            isRecurring={isRecurring}
            setIsRecurring={setIsRecurring}
            recurringDays={recurringDays}
            toggleRecurringDay={toggleRecurringDay}
            steps={steps}
            updateStep={updateStep}
            addStep={addStep}
            removeStep={removeStep}
            color={color}
            setColor={setColor}
            categories={categories}
            colorOptions={colorOptions}
            weekDays={weekDays}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            isEditing={!!editingWorkflow}
          />
        )}

        {/* View */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading workflows...</p>
          </div>
        ) : (
          viewMode === 'calendar' ? renderCalendarView() : renderListView()
        )}
      </div>
    </div>
  );
};

// Workflow Form Component
const WorkflowForm = ({
  title, setTitle, description, setDescription, category, setCategory,
  startDate, setStartDate, startTime, setStartTime, isRecurring, setIsRecurring,
  recurringDays, toggleRecurringDay, steps, updateStep, addStep, removeStep,
  color, setColor, categories, colorOptions, weekDays, onSubmit, onCancel, isEditing
}) => (
  <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
    <h2 className="text-2xl font-semibold mb-4 text-gray-800">
      {isEditing ? 'Edit Workflow' : 'Create New Workflow'}
    </h2>
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Workflow title..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="2"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="Workflow description..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">Recurring Workflow</span>
        </label>
        {isRecurring && (
          <div className="mt-2 flex flex-wrap gap-2">
            {weekDays.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleRecurringDay(day)}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  recurringDays.includes(day)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {day.substring(0, 3).toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Workflow Steps</label>
        {steps.map((step, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={step.title}
              onChange={(e) => updateStep(index, 'title', e.target.value)}
              placeholder="Step title..."
              className="flex-1 p-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              value={step.duration}
              onChange={(e) => updateStep(index, 'duration', parseInt(e.target.value) || 0)}
              placeholder="Minutes"
              min="1"
              className="w-24 p-2 border border-gray-300 rounded-lg"
            />
            <button
              type="button"
              onClick={() => removeStep(index)}
              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addStep}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          + Add Step
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
        <div className="flex gap-2">
          {colorOptions.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition ${
                color === c ? 'border-gray-800 scale-110' : 'border-gray-300'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium"
        >
          {isEditing ? 'Update Workflow' : 'Create Workflow'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
);

// Workflow Card Component
const WorkflowCard = ({ workflow, onEdit, onDelete, onDuplicate, onToggleStep }) => {
  const completedSteps = workflow.steps.filter(s => s.isCompleted).length;
  const totalSteps = workflow.steps.length;

  return (
    <div
      className="border rounded-lg p-4 hover:shadow-lg transition"
      style={{ borderLeft: `4px solid ${workflow.color}` }}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-gray-800">{workflow.title}</h4>
          <p className="text-xs text-gray-600">{format(parseISO(workflow.startDate), 'MMM d, yyyy')} • {workflow.startTime}</p>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full"
          style={{ backgroundColor: workflow.color + '20', color: workflow.color }}
        >
          {workflow.category}
        </span>
      </div>

      {workflow.description && (
        <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
      )}

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress: {completedSteps}/{totalSteps} steps</span>
          <span>{workflow.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${workflow.progress}%`, backgroundColor: workflow.color }}
          />
        </div>
      </div>

      {workflow.steps.length > 0 && (
        <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
          {workflow.steps.map(step => (
            <label key={step._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
              <input
                type="checkbox"
                checked={step.isCompleted}
                onChange={() => onToggleStep(workflow._id, step._id)}
                className="w-4 h-4"
              />
              <span className={step.isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}>
                {step.title}
              </span>
              <span className="text-xs text-gray-500 ml-auto">{step.duration}m</span>
            </label>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(workflow)}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          Edit
        </button>
        <button
          onClick={() => onDuplicate(workflow._id)}
          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
        >
          Copy
        </button>
        <button
          onClick={() => onDelete(workflow._id)}
          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default Workflows;
