import { useState, useEffect } from 'preact/hooks';
import { normalizeBeats, calculateSwatchTime, localTimeToBeats } from '../utils/swatchTime';
import { computeReminderDate } from '../utils/reminderTime';
import { requestNotificationPermission, showNotification } from '../utils/notifications';
import { addOrUpdateEvent, selectedEventSignal, setSelectedEvent } from '../signals/store';

export function ReminderForm() {
  const today = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  const DRAFT_KEY = 'reminder_draft_v1';
  const [reminderData, setReminderData] = useState(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { title: '', description: '', startDate: today, startTime: '', swatchTime: '', ...parsed };
      }
    } catch (e) {}
    return { title: '', description: '', startDate: today, startTime: '', swatchTime: '' };
  });
  const [errors, setErrors] = useState({});

  const [swatchText, setSwatchText] = useState('000');

  useEffect(() => {
    function update() {
      try {
        const beats = calculateSwatchTime();
        const whole = String(Math.trunc(Number(beats))).padStart(3, '0');
        setSwatchText(whole);
      } catch (e) {
        // ignore
      }
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    try { console.debug('ReminderForm submit data:', reminderData); } catch (e) {}

    if (!reminderData.startDate) newErrors.startDate = 'Please choose a date for the reminder.';
    if (!reminderData.startTime && !reminderData.swatchTime) {
      newErrors.time = 'Enter a clock time or a Swatch (@beats) value.';
    }

    const reminderDate = computeReminderDate(reminderData);
    try { console.debug('ReminderForm computed reminderDate:', reminderDate); } catch (e) {}
    if (!reminderDate) {
      newErrors.time = newErrors.time || 'Could not determine a valid reminder time.';
    } else if (reminderDate <= new Date()) {
      newErrors.time = 'Reminder must be scheduled in the future.';
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Show an immediate confirmation notification only if permission was already granted.
    // Do NOT request permission during form submit to avoid blocking the save flow.
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          let swatch = '';
          if (reminderData.swatchTime) swatch = `@${String(reminderData.swatchTime)}`;
          else if (reminderDate) {
            const b = localTimeToBeats(reminderDate);
            swatch = `@${String(Math.trunc(Number(b))).padStart(3, '0')}`;
          }
          const confMsg = `You have successfully scheduled an event for ${swatch || '(unknown time)'}`;
          showNotification(confMsg, {
            body: reminderData.description || 'Your reminder has been scheduled.',
            tag: `reminder-scheduled-${Date.now()}`,
            reminderTime: reminderDate ? reminderDate.toISOString() : null
          });
        } catch (e) {
          // ignore notification failures
        }
      }
    } catch (e) {
      // ignore environments without Notification
    }

    // Persist via signals helper and clear selected event
    // include computed reminderTime so the bell scheduler can detect due events
    try {
      const toSave = {
        ...reminderData,
        reminderTime: reminderDate ? reminderDate.toISOString() : null,
        dismissed: false
      };
      addOrUpdateEvent(toSave);
    } catch (e) {
      addOrUpdateEvent(reminderData);
    }
    setSelectedEvent(null);

    // Hide this modal and re-open the Reminders list.
    try {
      const el = document.getElementById('reminderFormModal');
      if (el && window.bootstrap && window.bootstrap.Modal) {
        const inst = window.bootstrap.Modal.getOrCreateInstance(el);
        inst.hide();
      }
      setTimeout(() => {
        try {
          const parentEl = document.getElementById('remindersListModal');
          if (parentEl && window.bootstrap && window.bootstrap.Modal) {
            const pinst = window.bootstrap.Modal.getOrCreateInstance(parentEl);
            pinst.show();
          }
        } catch (e) {}
      }, 120);
    } catch (e) {}

    // Reset form (preserve today's date)
    setReminderData({ title: '', description: '', startDate: today, startTime: '', swatchTime: '' });
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
  };

  useEffect(() => {
    const sel = selectedEventSignal.value;
    if (sel && sel.id) {
      setReminderData({
        title: sel.title || '',
        description: sel.description || '',
        startDate: sel.startDate || today,
        startTime: sel.startTime || '',
        swatchTime: sel.swatchTime || '',
        id: sel.id
      });
    } else {
      // If there is a saved draft, keep it; otherwise clear to defaults
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setReminderData({ title: '', description: '', startDate: today, startTime: '', swatchTime: '', ...parsed });
        } else {
          setReminderData({ title: '', description: '', startDate: today, startTime: '', swatchTime: '' });
        }
      } catch (e) {
        setReminderData({ title: '', description: '', startDate: today, startTime: '', swatchTime: '' });
      }
    }
  }, [selectedEventSignal.value]);

  const handleChange = (field, value) => setReminderData({ ...reminderData, [field]: value });

  // Persist draft on every change
  useEffect(() => {
    try {
      const toSave = {
        title: reminderData.title || '',
        description: reminderData.description || '',
        startDate: reminderData.startDate || today,
        startTime: reminderData.startTime || '',
        swatchTime: reminderData.swatchTime || ''
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(toSave));
    } catch (e) {}
  }, [reminderData]);

  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} };

  return (
    <div className="modal fade" id="reminderFormModal" tabIndex="-1" aria-labelledby="reminderFormModalLabel" aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="reminderFormModalLabel">Create Reminder</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>Current time: <strong>@{swatchText}</strong></div>
              </div>
              <div className="mb-3">
                <label className="form-label">Title *</label>
                <input type="text" className="form-control" value={reminderData.title} onChange={(e) => handleChange('title', e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows="3" value={reminderData.description} onChange={(e) => handleChange('description', e.target.value)}></textarea>
              </div>
              <div className="mb-3">
                <label className="form-label">Start Date *</label>
                <input type="date" className="form-control" value={reminderData.startDate} onChange={(e) => handleChange('startDate', e.target.value)} required />
                {errors.startDate && <div className="text-danger small mt-1">{errors.startDate}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Start Time *</label>
                <input type="time" className="form-control mb-2" value={reminderData.startTime} onChange={(e) => handleChange('startTime', e.target.value)} required={!reminderData.swatchTime} />
                {errors.time && <div className="text-danger small mt-1">{errors.time}</div>}
                <div className="form-text mb-2">Or enter Swatch Internet Time (@beats):</div>
                <div className="input-group">
                  <span className="input-group-text" id="reminder-beats-addon">@</span>
                  <input type="text" className="form-control" placeholder="e.g. 544 or 544.35" aria-describedby="reminder-beats-addon" value={reminderData.swatchTime} onChange={(e) => handleChange('swatchTime', normalizeBeats(e.target.value))} required={!reminderData.startTime} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#remindersListModal" onClick={clearDraft}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Reminder</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
