import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Target, Trash2, Pencil, CalendarDays, TrendingUp, WalletCards, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { formatCurrency } from '../utils/formatCurrency';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';

const BASE_STORAGE_KEY = 'fintrack_savings_goals';

export const Goals = () => {
  const { user } = useAuth();
  const storageKey = useMemo(() => {
    return user?.id ? `${BASE_STORAGE_KEY}_${user.id}` : BASE_STORAGE_KEY;
  }, [user]);

  const readGoals = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
      // Fallback check to un-scoped key if user-specific key is not found yet
      const fallback = localStorage.getItem(BASE_STORAGE_KEY);
      return fallback ? JSON.parse(fallback) : [];
    } catch {
      return [];
    }
  };

  const [goals, setGoals] = useState(readGoals);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });
  const [error, setError] = useState('');
  const [editingGoal, setEditingGoal] = useState(null);
  const [editError, setEditError] = useState('');
  const [contributionGoal, setContributionGoal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionError, setContributionError] = useState('');

  // Re-read when storageKey changes (e.g. user logs in)
  useEffect(() => {
    setGoals(readGoals());
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(goals));
    // Also sync to BASE_STORAGE_KEY for backwards compatibility
    localStorage.setItem(BASE_STORAGE_KEY, JSON.stringify(goals));
  }, [goals, storageKey]);

  const totals = useMemo(() => goals.reduce((summary, goal) => ({
    target: summary.target + Number(goal.targetAmount),
    saved: summary.saved + Number(goal.currentAmount)
  }), { target: 0, saved: 0 }), [goals]);

  // Deadline & status calculation helper
  const getDeadlineInfo = (targetDateStr) => {
    if (!targetDateStr) return null;
    const target = new Date(`${targetDateStr}T00:00:00`);
    if (isNaN(target.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return {
        label: `${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue`,
        isOverdue: true,
        days: diffDays
      };
    }
    if (diffDays === 0) {
      return {
        label: 'Due today',
        isDueToday: true,
        days: 0
      };
    }
    return {
      label: `${diffDays} ${diffDays === 1 ? 'day' : 'days'} left`,
      isOverdue: false,
      days: diffDays
    };
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const targetAmount = parseFloat(form.targetAmount);
    const currentAmount = parseFloat(form.currentAmount || 0);

    if (!form.name.trim()) {
      setError('Please provide a goal name.');
      return;
    }
    if (isNaN(targetAmount) || targetAmount <= 0) {
      setError('Target amount must be a positive number.');
      return;
    }
    if (isNaN(currentAmount) || currentAmount < 0) {
      setError('Already saved amount cannot be negative.');
      return;
    }
    if (currentAmount > targetAmount) {
      setError('Already saved amount cannot exceed target amount.');
      return;
    }

    setGoals(previous => [{
      id: Date.now(),
      name: form.name.trim(),
      targetAmount,
      currentAmount,
      targetDate: form.targetDate || ''
    }, ...previous]);
    setForm({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });
    setError('');
    setIsModalOpen(false);
  };

  const handleEditSubmit = (event) => {
    event.preventDefault();
    if (!editingGoal) return;
    const targetAmount = parseFloat(editingGoal.targetAmount);
    const currentAmount = parseFloat(editingGoal.currentAmount || 0);

    if (!editingGoal.name.trim()) {
      setEditError('Please provide a goal name.');
      return;
    }
    if (isNaN(targetAmount) || targetAmount <= 0) {
      setEditError('Target amount must be a positive number.');
      return;
    }
    if (isNaN(currentAmount) || currentAmount < 0) {
      setEditError('Already saved amount cannot be negative.');
      return;
    }
    if (currentAmount > targetAmount) {
      setEditError('Already saved amount cannot exceed target amount.');
      return;
    }

    setGoals(previous => previous.map(item => item.id === editingGoal.id ? {
      ...item,
      name: editingGoal.name.trim(),
      targetAmount,
      currentAmount,
      targetDate: editingGoal.targetDate || ''
    } : item));
    setEditingGoal(null);
    setEditError('');
  };

  const updateProgress = (goal, value) => {
    const currentAmount = Math.max(0, Math.min(Number(goal.targetAmount), Number(value) || 0));
    setGoals(previous => previous.map(item => item.id === goal.id ? { ...item, currentAmount } : item));
  };

  const openContributionModal = (goal) => {
    setContributionGoal(goal);
    setContributionAmount('');
    setContributionError('');
  };

  const handleContribution = (event) => {
    event.preventDefault();
    const amount = parseFloat(contributionAmount);
    if (!contributionGoal) return;
    const remaining = Number(contributionGoal.targetAmount) - Number(contributionGoal.currentAmount);

    if (isNaN(amount) || amount <= 0) {
      setContributionError('Contribution amount must be greater than zero.');
      return;
    }
    if (amount > remaining) {
      setContributionError(`Contribution exceeds remaining target. Max allowed: ${formatCurrency(remaining)}.`);
      return;
    }

    const updatedAmount = Number(contributionGoal.currentAmount) + amount;
    const targetAmt = Number(contributionGoal.targetAmount);
    const newProgress = Math.min(100, Math.round((updatedAmount / targetAmt) * 100));

    updateProgress(contributionGoal, updatedAmount);
    setContributionGoal(null);

    // Savings goal contribution notification
    const goalName = contributionGoal.name;
    const isCompleted = newProgress === 100;
    notificationService.createNotification({
      title: isCompleted ? `Goal "${goalName}" reached! 🎉` : `${goalName} savings goal updated`,
      message: isCompleted
        ? `Congratulations! Target of ${formatCurrency(targetAmt)} has been fully reached.`
        : `${formatCurrency(amount)} contribution added. Your goal is now ${newProgress}% complete (${formatCurrency(updatedAmount)} of ${formatCurrency(targetAmt)} saved).`,
      category: 'GOAL',
      severity: isCompleted ? 'SUCCESS' : 'INFO',
      actionUrl: 'goals',
      metadata: { goalId: contributionGoal.id, goalName, amount, currentAmount: updatedAmount, targetAmount: targetAmt, progress: newProgress }
    });

    // Notify backend email notification engine
    notificationService.recordSavingsGoalEvent({
      goalId: String(contributionGoal.id),
      goalName,
      targetAmount: targetAmt,
      currentAmount: updatedAmount,
      contributionAmount: amount,
      progressPercentage: newProgress,
      targetDate: contributionGoal.targetDate || null,
      eventType: isCompleted ? 'MILESTONE' : 'CONTRIBUTION'
    });
  };

  const removeGoal = (id) => {
    const targetGoal = goals.find(g => g.id === id);
    const goalName = targetGoal ? `"${targetGoal.name}"` : 'this savings goal';
    if (window.confirm(`Are you sure you want to delete ${goalName}? This action cannot be undone.`)) {
      setGoals(previous => previous.filter(goal => goal.id !== id));
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div>
          <div className="dashboard-kicker"><Target size={14} /> Financial planning</div>
          <h2 style={{ fontSize: 'clamp(1.85rem, 2.7vw, 2.55rem)' }}>Savings Goals</h2>
          <p style={{ marginTop: '0.55rem', color: 'var(--text-secondary)' }}>Turn your next milestone into a clear, trackable plan.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={16} /> New Goal</button>
      </div>

      <div className="stats-ribbon">
        <div className="stat-item"><span className="stat-label">Active Goals</span><span className="stat-value">{goals.length}</span></div>
        <div className="stat-item"><span className="stat-label">Total Saved</span><span className="stat-value" style={{ color: 'var(--accent-hover)' }}>{formatCurrency(totals.saved)}</span></div>
        <div className="stat-item"><span className="stat-label">Total Targets</span><span className="stat-value">{formatCurrency(totals.target)}</span></div>
        <div className="stat-item"><span className="stat-label">Overall Progress</span><span className="stat-value">{totals.target ? `${Math.round((totals.saved / totals.target) * 100)}%` : '0%'}</span></div>
      </div>

      {goals.length === 0 ? (
        <div className="card dashboard-empty-state"><Target size={28} color="var(--accent)" style={{ marginBottom: '0.75rem' }} /><h3>No savings goals yet</h3><p style={{ marginTop: '0.35rem' }}>Create a goal for an emergency fund, trip, purchase, or any future milestone.</p></div>
      ) : (
        <div className="grid-2">
          {goals.map(goal => {
            const current = Number(goal.currentAmount);
            const target = Number(goal.targetAmount);
            const remaining = Math.max(0, target - current);
            const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
            const deadline = getDeadlineInfo(goal.targetDate);

            return (
              <div className="card" key={goal.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className="dashboard-transaction-icon income"><TrendingUp size={18} /></div>
                    <div>
                      <h3 style={{ margin: 0 }}>{goal.name}</h3>
                      {goal.targetDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CalendarDays size={13} />
                            Target {goal.targetDate}
                          </span>
                          {deadline && (
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              background: deadline.isOverdue ? '#FEF2F2' : (deadline.isDueToday ? '#FFFBEB' : '#F0FDF4'),
                              color: deadline.isOverdue ? '#DC2626' : (deadline.isDueToday ? '#D97706' : '#15803D'),
                              border: `1px solid ${deadline.isOverdue ? '#FECACA' : (deadline.isDueToday ? '#FDE68A' : '#BBF7D0')}`
                            }}>
                              <Clock size={11} />
                              {deadline.label}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button
                      className="btn btn-secondary btn-icon"
                      title="Edit goal"
                      onClick={() => {
                        setEditingGoal(goal);
                        setEditError('');
                      }}
                      style={{ color: '#4F46E5', borderColor: '#C7D2FE' }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button className="btn btn-secondary btn-icon" title="Delete goal" onClick={() => removeGoal(goal.id)}>
                      <Trash2 size={15} color="var(--danger)" />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '1.5rem', fontSize: '0.9rem' }}>
                  <strong>{formatCurrency(current)}</strong>
                  <span style={{ color: 'var(--text-secondary)' }}>of {formatCurrency(target)}</span>
                </div>

                <div className="progress-bar-bg" style={{ marginTop: '0.55rem', height: '10px' }}>
                  <div className="progress-bar-fill" style={{ width: `${progress}%`, background: progress === 100 ? 'var(--accent-hover)' : 'var(--accent)' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.9rem', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ color: 'var(--accent-hover)', fontWeight: '800' }}>{progress}% complete</span>
                    {progress < 100 && (
                      <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600' }}>
                        • {formatCurrency(remaining)} remaining
                      </span>
                    )}
                  </div>
                  {progress < 100 && (
                    <button className="btn btn-secondary" onClick={() => openContributionModal(goal)} style={{ padding: '0.45rem 0.75rem', color: 'var(--accent-hover)', borderColor: '#A7F3D0' }}>
                      <Plus size={14} /> Add funds
                    </button>
                  )}
                  {progress === 100 && (
                    <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={12} /> Goal reached
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Savings Goal">
        <form onSubmit={handleSubmit}>
          {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          <div className="form-group"><label className="form-label">Goal name *</label><input className="form-input" required placeholder="e.g. Emergency fund" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></div>
          <div className="grid-2"><div className="form-group"><label className="form-label">Target amount *</label><input className="form-input" required type="number" min="1" step="0.01" value={form.targetAmount} onChange={event => setForm({ ...form, targetAmount: event.target.value })} /></div><div className="form-group"><label className="form-label">Already saved</label><input className="form-input" type="number" min="0" step="0.01" value={form.currentAmount} onChange={event => setForm({ ...form, currentAmount: event.target.value })} /></div></div>
          <div className="form-group"><label className="form-label">Target date</label><input className="form-input" type="date" value={form.targetDate} onChange={event => setForm({ ...form, targetDate: event.target.value })} /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}><button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Goal</button></div>
        </form>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal isOpen={Boolean(editingGoal)} onClose={() => setEditingGoal(null)} title="Edit Savings Goal">
        <form onSubmit={handleEditSubmit}>
          {editError && <div className="form-error" style={{ marginBottom: '1rem', color: '#DC2626' }}>{editError}</div>}
          <div className="form-group">
            <label className="form-label">Goal name *</label>
            <input
              className="form-input"
              required
              value={editingGoal?.name || ''}
              onChange={event => setEditingGoal(prev => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Target amount *</label>
              <input
                className="form-input"
                required
                type="number"
                min="1"
                step="0.01"
                value={editingGoal?.targetAmount || ''}
                onChange={event => setEditingGoal(prev => ({ ...prev, targetAmount: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Already saved</label>
              <input
                className="form-input"
                type="number"
                min="0"
                step="0.01"
                value={editingGoal?.currentAmount || ''}
                onChange={event => setEditingGoal(prev => ({ ...prev, currentAmount: event.target.value }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Target date</label>
            <input
              className="form-input"
              type="date"
              value={editingGoal?.targetDate || ''}
              onChange={event => setEditingGoal(prev => ({ ...prev, targetDate: event.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setEditingGoal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(contributionGoal)} onClose={() => setContributionGoal(null)} title={`Add funds to ${contributionGoal?.name || 'goal'}`}>
        <form onSubmit={handleContribution}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem', marginBottom: '1.25rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid var(--border-color)' }}>
            <WalletCards size={20} color="var(--accent-hover)" />
            <div><div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Remaining to reach target</div><strong>{contributionGoal && formatCurrency(Number(contributionGoal.targetAmount) - Number(contributionGoal.currentAmount))}</strong></div>
          </div>
          {contributionError && <div className="form-error" style={{ marginBottom: '1rem' }}>{contributionError}</div>}
          <div className="form-group"><label className="form-label">Contribution amount *</label><input className="form-input" autoFocus required type="number" min="0.01" step="0.01" value={contributionAmount} onChange={event => setContributionAmount(event.target.value)} placeholder="e.g. 1000" /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}><button type="button" className="btn btn-secondary" onClick={() => setContributionGoal(null)}>Cancel</button><button type="submit" className="btn btn-primary"><Plus size={15} /> Add contribution</button></div>
        </form>
      </Modal>
    </div>
  );
};
