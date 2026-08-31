import React, { useState } from 'react';
import { Task, TaskPriority, TaskType, TaskStatus } from '../types/crm';
import { COLORS, themeStyles } from '../styles/theme';
import { Modal } from '../components/Modal';

interface TasksPageProps {
  tasks: Task[];
  onAddTask: (task: Partial<Task>) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'TODAY' | 'PENDING' | 'COMPLETED'>('PENDING');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('Follow-up');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('17:00');
  const [priority, setPriority] = useState<TaskPriority>('High');
  const [assignedTo, setAssignedTo] = useState('Rajesh Raman');
  const [reminder, setReminder] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      t.assignedTo.toLowerCase().includes(q) ||
      (t.relatedToName && t.relatedToName.toLowerCase().includes(q));

    let matchesFilter = true;
    if (filter === 'TODAY') matchesFilter = t.dueDate === todayStr && t.status !== 'Completed';
    else if (filter === 'PENDING') matchesFilter = t.status !== 'Completed';
    else if (filter === 'COMPLETED') matchesFilter = t.status === 'Completed';

    return matchesSearch && matchesFilter;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    await onAddTask({
      title,
      description,
      type,
      dueDate,
      dueTime,
      priority,
      assignedTo,
      reminder,
      status: 'Pending',
    });

    setTitle('');
    setDescription('');
    setIsModalOpen(false);
  };

  const handleToggleComplete = async (t: Task) => {
    const nextStatus: TaskStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
    await onUpdateTask(t.id, { status: nextStatus });
  };

  return (
    <div style={themeStyles.pageContainer}>
      {/* Header */}
      <div style={themeStyles.headerRow}>
        <div>
          <h1 style={themeStyles.pageTitle}>
            <span>⏰</span> Tasks &amp; Scheduled Follow-ups
          </h1>
          <div style={themeStyles.pageSubtitle}>
            Track urgent client check-ins, scheduled demos, contracts, and auto-reminder notifications
          </div>
        </div>

        <button onClick={() => setIsModalOpen(true)} style={themeStyles.btnPrimary}>
          <span>+</span> Create Task / Follow-up
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ ...themeStyles.panel, padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Quick Filter Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'PENDING', label: 'Pending Tasks' },
              { id: 'TODAY', label: "Due Today ⭐" },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'ALL', label: 'All Tasks' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: filter === tab.id ? `2px solid ${COLORS.goldAccent}` : '1px solid #CCC',
                  backgroundColor: filter === tab.id ? COLORS.goldAccent : 'transparent',
                  color: filter === tab.id ? COLORS.textDark : COLORS.textDark,
                  fontWeight: filter === tab.id ? 800 : 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ width: '320px' }}>
            <input
              style={{ ...themeStyles.fieldInput, padding: '8px 12px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks, descriptions, assignees..."
            />
          </div>
        </div>
      </div>

      {/* Tasks List Panel */}
      <div style={themeStyles.panel}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: COLORS.goldDark }}>
            SHOWING {filtered.length} OF {tasks.length} TASKS
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: COLORS.textMuted, fontStyle: 'italic' }}>
              No tasks found for this view.
            </div>
          ) : (
            filtered.map((t) => {
              const isOverdue = t.dueDate < todayStr && t.status !== 'Completed';
              const isToday = t.dueDate === todayStr && t.status !== 'Completed';
              const isCompleted = t.status === 'Completed';

              return (
                <div
                  key={t.id}
                  style={{
                    backgroundColor: isCompleted ? '#F7F7F7' : COLORS.cardChampagne,
                    border: isOverdue
                      ? '2px solid #E05050'
                      : isToday
                      ? `2px solid ${COLORS.goldAccent}`
                      : `1px solid ${COLORS.borderGold}`,
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    opacity: isCompleted ? 0.75 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                    {/* Checkbox Complete */}
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => handleToggleComplete(t)}
                      style={{ width: '20px', height: '20px', marginTop: '2px', cursor: 'pointer' }}
                      title="Toggle completion status"
                    />

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor:
                              t.priority === 'High' ? 'rgba(224, 80, 80, 0.15)' : 'rgba(215, 171, 106, 0.2)',
                            color: t.priority === 'High' ? '#E05050' : COLORS.goldDark,
                            border: `1px solid ${t.priority === 'High' ? '#E05050' : COLORS.borderGold}`,
                          }}
                        >
                          {t.priority} Priority
                        </span>

                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(0,0,0,0.06)',
                            color: COLORS.textDark,
                          }}
                        >
                          {t.type}
                        </span>

                        {isOverdue && (
                          <span style={{ fontSize: '10.5px', fontWeight: 800, backgroundColor: '#E05050', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px' }}>
                            OVERDUE
                          </span>
                        )}

                        {isToday && (
                          <span style={{ fontSize: '10.5px', fontWeight: 800, backgroundColor: COLORS.goldAccent, color: COLORS.textDark, padding: '2px 6px', borderRadius: '4px' }}>
                            DUE TODAY
                          </span>
                        )}

                        <strong
                          style={{
                            fontSize: '14px',
                            color: COLORS.textDark,
                            textDecoration: isCompleted ? 'line-through' : 'none',
                          }}
                        >
                          {t.title}
                        </strong>
                      </div>

                      {t.description && (
                        <div style={{ fontSize: '12.5px', color: '#555', marginBottom: '6px' }}>
                          {t.description}
                        </div>
                      )}

                      <div style={{ fontSize: '11.5px', color: COLORS.textMuted }}>
                        📅 Due: <strong>{t.dueDate} at {t.dueTime}</strong> &middot; 👤 Assigned: <strong>{t.assignedTo}</strong>
                        {t.relatedToName && ` · Related to ${t.relatedToType}: ${t.relatedToName}`}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleToggleComplete(t)}
                      style={{
                        ...themeStyles.btnSmall,
                        backgroundColor: isCompleted ? COLORS.goldAccent : '#2E8B57',
                        color: isCompleted ? COLORS.textDark : '#FFFFFF',
                        fontWeight: 800,
                      }}
                    >
                      {isCompleted ? '↩ Re-open' : '✓ Done'}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete task "${t.title}"?`)) onDeleteTask(t.id);
                      }}
                      style={themeStyles.btnDelete}
                    >
                      &times;
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="⏰ Create Task &amp; Follow-up Reminder"
        subtitle="Schedule automated reminders, calls, demos, and critical milestone deadlines"
      >
        <form onSubmit={handleSubmit}>
          <div>
            <label style={themeStyles.fieldLabel}>TASK TITLE *</label>
            <input
              style={themeStyles.fieldInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Schedule Product Demo with CFO"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>TASK TYPE</label>
              <select
                style={themeStyles.fieldSelect}
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
              >
                <option value="Follow-up">Follow-up</option>
                <option value="Call">Phone Call</option>
                <option value="Meeting">Executive Meeting</option>
                <option value="Email">Email Check-in</option>
                <option value="Demo">Product Demo</option>
                <option value="Contract">Contract / Proposal</option>
                <option value="General">General Task</option>
              </select>
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>PRIORITY</label>
              <select
                style={themeStyles.fieldSelect}
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
            <div>
              <label style={themeStyles.fieldLabel}>DUE DATE *</label>
              <input
                type="date"
                style={themeStyles.fieldInput}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={themeStyles.fieldLabel}>DUE TIME</label>
              <input
                type="time"
                style={themeStyles.fieldInput}
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={themeStyles.fieldLabel}>ASSIGNED EMPLOYEE</label>
            <select
              style={themeStyles.fieldSelect}
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="Rajesh Raman">Rajesh Raman</option>
              <option value="Ananya Iyer">Ananya Iyer</option>
              <option value="Admin">Admin Executive</option>
            </select>
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={themeStyles.fieldLabel}>DESCRIPTION &amp; DETAILS</label>
            <textarea
              style={themeStyles.fieldTextarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Action items, contact background, deliverables..."
            />
          </div>

          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="reminderCheck"
              checked={reminder}
              onChange={(e) => setReminder(e.target.checked)}
            />
            <label htmlFor="reminderCheck" style={{ fontSize: '13px', color: COLORS.textDark, fontWeight: 600 }}>
              Send staff reminder alert 24 hours prior to deadline
            </label>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{ ...themeStyles.btnSecondary, color: COLORS.textDark, borderColor: COLORS.borderGold, flex: 1 }}
            >
              Cancel
            </button>
            <button type="submit" style={{ ...themeStyles.btnPrimary, flex: 2 }}>
              Save Task &amp; Set Reminder
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
