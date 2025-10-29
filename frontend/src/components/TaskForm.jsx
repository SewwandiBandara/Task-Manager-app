import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const TaskForm = ({ onSubmit, initialData = {}, onCancel }) => {
  const safeInitialData = initialData || {};
  
  const parsedDate = safeInitialData.dueDate ? new Date(safeInitialData.dueDate) : null;
  const [title, setTitle] = useState(safeInitialData.title || '');
  const [description, setDescription] = useState(safeInitialData.description || '');
  const [dueDate, setDueDate] = useState(parsedDate && !isNaN(parsedDate.getTime()) ? format(parsedDate, 'yyyy-MM-dd') : '');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      const parsedDate = initialData.dueDate ? new Date(initialData.dueDate) : null;
      setDueDate(parsedDate && !isNaN(parsedDate.getTime()) ? format(parsedDate, 'yyyy-MM-dd') : '');
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onSubmit({ 
      title: title.trim(), 
      description: description.trim(), 
      dueDate: dueDate ? new Date(dueDate).toISOString() : null 
    });
    
    // Reset form if not editing
    if (!safeInitialData._id) {
      setTitle('');
      setDescription('');
      setDueDate('');
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    setTitle('');
    setDescription('');
    setDueDate('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Task Title *
        </label>
        <input
          id="title"
          type="text"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          required
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          placeholder="Add more details about this task..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="3"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
        />
      </div>
      
      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
          Due Date
        </label>
        <input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          min={format(new Date(), 'yyyy-MM-dd')}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
      </div>
      
      <div className="flex gap-3 pt-2">
        <button 
          type="submit" 
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-medium transition-colors duration-200"
        >
          {safeInitialData._id ? 'Update Task' : 'Add Task'}
        </button>
        {onCancel && (
          <button 
            type="button"
            onClick={handleCancel}
            className="px-6 bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg font-medium transition-colors duration-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default TaskForm;