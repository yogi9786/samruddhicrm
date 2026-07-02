import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { Plus, CheckSquare, Square, Trash2, Calendar, RefreshCw } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  assignedTo: string;
  leadId?: string;
}

export const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Add Task states
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('siriadmin');

  const loadTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/crm/tasks');
      setTasks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/crm/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title,
          dueDate,
          status: 'Pending',
          assignedTo
        })
      });
      setTitle('');
      setDueDate('');
      setShowAdd(false);
      loadTasks();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await apiFetch(`/crm/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: task.title,
          dueDate: task.dueDate,
          status: newStatus,
          assignedTo: task.assignedTo,
          leadId: task.leadId || ''
        })
      });
      loadTasks();
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiFetch(`/crm/tasks/${id}`, { method: 'DELETE' });
      loadTasks();
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-serif font-bold text-brand-maroon">Tasks Checklist</h1>
          <p className="text-gray-500 text-sm mt-1">Organize and schedule follows-ups for lead nurturing</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={loadTasks}
            disabled={loading}
            className="p-3 bg-brand-cream border border-brand-gold border-opacity-30 text-brand-maroon hover:bg-brand-maroon hover:text-white rounded-xl transition"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center space-x-2 bg-brand-maroon text-white font-bold px-5 py-2.5 rounded-xl hover:bg-opacity-90 transition shadow-sm"
          >
            <Plus size={18} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Tasks List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center p-8 text-gray-450">
            No tasks scheduled. Click 'Add Task' to create one.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tasks.map(task => {
              const isCompleted = task.status === 'Completed';
              return (
                <div key={task.id} className="py-4 flex items-center justify-between hover:bg-gray-50 px-2 rounded-xl transition-colors">
                  <div className="flex items-center space-x-3 flex-grow">
                    <button 
                      onClick={() => handleToggleStatus(task)}
                      className="text-brand-gold hover:text-brand-maroon transition-colors shrink-0"
                    >
                      {isCompleted ? (
                        <CheckSquare size={22} className="text-brand-maroon" />
                      ) : (
                        <Square size={22} />
                      )}
                    </button>
                    <div className="flex-grow">
                      <span className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center space-x-2 text-xs text-gray-450 mt-1">
                        <Calendar size={12} />
                        <span>Due: {task.dueDate}</span>
                        <span>•</span>
                        <span>Assignee: {task.assignedTo}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="font-serif font-bold text-brand-maroon text-lg">Add New Task</h4>
              <button onClick={() => setShowAdd(false)} className="text-gray-450 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-450 uppercase mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call Amit regarding design draft"
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-brand-gold outline-none"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-450 uppercase mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-brand-gold outline-none"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-450 uppercase mb-1">Assignee</label>
                <select
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-sm bg-white focus:ring-1 focus:ring-brand-gold outline-none font-medium"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <option value="siriadmin">siriadmin (Administrator)</option>
                  <option value="sales_agent">Sales Agent</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 border border-gray-255 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-maroon text-white font-bold rounded-xl text-xs"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
