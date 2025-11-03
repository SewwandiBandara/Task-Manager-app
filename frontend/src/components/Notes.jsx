import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [search, setSearch] = useState('');
  const { user, logout } = useAuth();

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);

  const colorOptions = [
    { name: 'White', value: '#ffffff' },
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Green', value: '#bbf7d0' },
    { name: 'Blue', value: '#bfdbfe' },
    { name: 'Pink', value: '#fbcfe8' },
    { name: 'Purple', value: '#e9d5ff' }
  ];

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/notes');
      setNotes(res.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('color', color);

    images.forEach(image => {
      formData.append('images', image);
    });

    if (editingNote) {
      formData.append('removedImages', JSON.stringify(removedImages));
    }

    try {
      if (editingNote) {
        await axios.put(`http://localhost:5000/api/notes/${editingNote._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('http://localhost:5000/api/notes', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      resetForm();
      fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Error saving note: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setColor('#ffffff');
    setImages([]);
    setExistingImages([]);
    setRemovedImages([]);
    setEditingNote(null);
    setShowForm(false);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color);
    setExistingImages(note.images || []);
    setImages([]);
    setRemovedImages([]);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await axios.delete(`http://localhost:5000/api/notes/${id}`);
        fetchNotes();
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const togglePin = async (note) => {
    try {
      await axios.patch(`http://localhost:5000/api/notes/${note._id}/pin`);
      fetchNotes();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages([...images, ...files]);
  };

  const removeNewImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeExistingImage = (filename) => {
    setExistingImages(existingImages.filter(img => img.filename !== filename));
    setRemovedImages([...removedImages, filename]);
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(search.toLowerCase()) ||
    note.content.toLowerCase().includes(search.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter(note => note.isPinned);
  const otherNotes = filteredNotes.filter(note => !note.isPinned);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-600 hover:text-gray-800">
                ← Back to Tasks
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-gray-800">My Notes</h1>
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

          {/* Search and Add Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium"
            >
              {showForm ? 'Cancel' : '+ New Note'}
            </button>
          </div>
        </div>

        {/* Note Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              {editingNote ? 'Edit Note' : 'Create New Note'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Note title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <textarea
                  placeholder="Note content..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows="6"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note Color</label>
                <div className="flex gap-2">
                  {colorOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setColor(option.value)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        color === option.value ? 'border-purple-600 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: option.value }}
                      title={option.name}
                    />
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attach Images (Max 5)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Images</label>
                  <div className="flex flex-wrap gap-2">
                    {existingImages.map((img) => (
                      <div key={img.filename} className="relative">
                        <img
                          src={`http://localhost:5000${img.path}`}
                          alt="Note"
                          className="w-20 h-20 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.filename)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images Preview */}
              {images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Images</label>
                  <div className="flex flex-wrap gap-2">
                    {images.map((img, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(img)}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors duration-200 font-medium"
                >
                  {editingNote ? 'Update Note' : 'Create Note'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notes Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading notes...</p>
          </div>
        ) : (
          <>
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Pinned</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pinnedNotes.map(note => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onPin={togglePin}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Notes */}
            {otherNotes.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  {pinnedNotes.length > 0 ? 'Other Notes' : 'All Notes'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {otherNotes.map(note => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onPin={togglePin}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredNotes.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {notes.length === 0 ? 'No notes yet' : 'No notes match your search'}
                </h3>
                <p className="text-gray-500">
                  {notes.length === 0 ? 'Create your first note to get started!' : 'Try a different search term'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Note Card Component
const NoteCard = ({ note, onEdit, onDelete, onPin }) => {
  return (
    <div
      className="rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200 relative"
      style={{ backgroundColor: note.color }}
    >
      {/* Pin Button */}
      <button
        onClick={() => onPin(note)}
        className="absolute top-2 right-2 text-gray-600 hover:text-yellow-500 text-xl"
      >
        {note.isPinned ? '📌' : '📍'}
      </button>

      <h3 className="font-semibold text-lg mb-2 pr-8 text-gray-800 break-words">
        {note.title}
      </h3>
      <p className="text-gray-700 mb-3 whitespace-pre-wrap break-words">{note.content}</p>

      {/* Images */}
      {note.images && note.images.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {note.images.map((img) => (
            <img
              key={img.filename}
              src={`http://localhost:5000${img.path}`}
              alt="Note attachment"
              className="w-full h-32 object-cover rounded"
            />
          ))}
        </div>
      )}

      <div className="text-xs text-gray-600 mb-3">
        Updated {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(note)}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors duration-200"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(note._id)}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition-colors duration-200"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default Notes;
