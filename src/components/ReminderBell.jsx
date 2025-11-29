import { useState, useEffect } from 'preact/hooks';
import { showNotification } from '../utils/notifications';
import { eventsSignal, removeEvent, activeRemindersSignal, muteSignal, settingsSignal, addOrUpdateEvent } from '../signals/store';

export function ReminderBell() {
  // Read signals directly so the component re-renders when reminders change
  const events = eventsSignal.value;
  const mute = muteSignal.value;
  const darkTheme = settingsSignal.value ? settingsSignal.value.darkTheme : true;

  const [activeReminders, setActiveReminders] = useState(() => activeRemindersSignal.value || []);
  const [showModal, setShowModal] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);

  // Keep the local activeReminders in sync with the shared transient signal
  useEffect(() => {
    activeRemindersSignal.value = activeReminders;
  }, [activeReminders]);

  // Schedule a single timer for the next due reminder instead of polling every second.
  useEffect(() => {
    let timer = null;
    try {
      const now = Date.now();
      const due = [];
      let nextTs = null;

      (events || []).forEach(ev => {
        if (ev.reminderTime && !ev.dismissed) {
          const t = new Date(ev.reminderTime).getTime();
          if (t <= now) due.push(ev);
          else if (nextTs === null || t < nextTs) nextTs = t;
        }
      });

      if (due.length > 0) {
        console.debug('[ReminderBell] Found due reminders:', due.map(d => d.id));
      } else if (nextTs) {
        console.debug('[ReminderBell] Next reminder scheduled at', new Date(nextTs).toISOString());
      }

      if (due.length > 0) {
        setActiveReminders(prev => {
          const ids = new Set(prev.map(p => p.id));
          const merged = [...prev, ...due.filter(d => !ids.has(d.id))];
          return merged;
        });

        // If no modal is currently shown and there is at least one due reminder,
        // set the current reminder to the first due and open the modal so the
        // user is immediately alerted in-app (independent of mute state).
        setCurrentReminder(prev => {
          if (!prev && due.length) {
            // Prefer the first due reminder that hasn't been acknowledged yet.
            const candidate = due.find(d => !d.acknowledged);
            if (candidate) {
              console.debug('[ReminderBell] Candidate due reminder id=', candidate && candidate.id);
              // Only open the modal if reminders are not muted. Still record
              // the current reminder so the bell UI can reflect it, but
              // suppress the pop-up when muted.
              if (!mute) {
                console.debug('[ReminderBell] Opening modal for due reminders, id=', candidate && candidate.id);
                setShowModal(true);
              } else {
                console.debug('[ReminderBell] Reminders are muted; suppressing modal for', candidate && candidate.id);
              }
              return candidate;
            }
          }
          return prev;
        });

        due.forEach(event => {
          try {
            // Avoid re-sending notifications for reminders already marked as notified
            if (event.notified) return;
            if (!mute) {
              // include reminderTime so the notification helper can prepend Swatch time
              console.debug('[ReminderBell] Sending notification for', event.id);
              const sent = showNotification(event.title || 'Reminder', {
                body: event.description || '',
                tag: `reminder-${event.id}`,
                reminderTime: event.reminderTime || null
              });
              if (sent) {
                try { addOrUpdateEvent({ ...event, notified: true }); } catch (e) {}
              }
            }
          } catch (e) {}
        });
      }

      if (nextTs) {
        const delay = Math.max(0, nextTs - now + 50);
        console.debug('[ReminderBell] Scheduling timer in', delay, 'ms for nextTs=', new Date(nextTs).toISOString());
        timer = setTimeout(() => {
          console.debug('[ReminderBell] Timer fired (scheduled for', new Date(nextTs).toISOString(), ')');
          const latest = eventsSignal.value;
          const now2 = Date.now();
          const newlyDue = latest.filter(ev => ev.reminderTime && !ev.dismissed && new Date(ev.reminderTime).getTime() <= now2);
          console.debug('[ReminderBell] newlyDue ids after timer:', newlyDue.map(d => d.id));
          if (newlyDue.length) {
            setActiveReminders(prev => {
              const ids = new Set(prev.map(p => p.id));
              const merged = [...prev, ...newlyDue.filter(d => !ids.has(d.id))];
              return merged;
            });

            // If modal isn't visible, open it and show the first newly due reminder.
            setCurrentReminder(prev => {
                if (!prev && newlyDue.length) {
                // Prefer the first newly-due reminder that hasn't been acknowledged yet.
                const candidate = newlyDue.find(d => !d.acknowledged);
                if (candidate) {
                  console.debug('[ReminderBell] Candidate newly-due reminder id=', candidate && candidate.id);
                  // Respect the mute signal: if muted, do not open the modal.
                  if (!muteSignal.value) {
                    console.debug('[ReminderBell] Opening modal for newly due reminder, id=', candidate && candidate.id);
                    setShowModal(true);
                  } else {
                    console.debug('[ReminderBell] Reminders are muted; suppressing modal for', candidate && candidate.id);
                  }
                  return candidate;
                }
              }
              return prev;
            });

            newlyDue.forEach(event => {
              try {
                if (event.notified) return;
                if (!muteSignal.value) {
                  console.debug('[ReminderBell] Sending notification for', event.id, '(timer)');
                  const sent = showNotification(event.title || 'Reminder', {
                    body: event.description || '',
                    tag: `reminder-${event.id}`,
                    reminderTime: event.reminderTime || null
                  });
                  if (sent) {
                    try { addOrUpdateEvent({ ...event, notified: true }); } catch (e) {}
                  }
                }
              } catch (e) {}
            });
          }
        }, delay);
      }
    } catch (e) {
      // ignore
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [events]);

  // Keep activeReminders in sync with events: drop any active reminders that no longer exist
  useEffect(() => {
    if (!events || events.length === 0) {
      setActiveReminders([]);
      console.debug('[ReminderBell] No events: clearing active reminders and hiding modal');
      setCurrentReminder(null);
      setShowModal(false);
      return;
    }
    const ids = new Set(events.map(e => e.id));
    setActiveReminders(prev => {
      const filtered = prev.filter(r => ids.has(r.id));
      if (filtered.length === 0) {
        console.debug('[ReminderBell] Active reminders filtered to empty; hiding modal');
        setCurrentReminder(null);
        setShowModal(false);
      } else {
        setCurrentReminder(curr => {
          // If there is no current reminder shown in the UI, prefer the
          // most-recent unacknowledged reminder (so "Close"/acknowledge
          // doesn't immediately restore the same item). If none are
          // unacknowledged, leave the modal closed (null).
          if (!curr) {
            const unacked = filtered.slice().reverse().find(r => !r.acknowledged);
            return unacked || null;
          }
          // If the current reminder no longer exists in events, show the
          // most-recent remaining reminder.
          if (!ids.has(curr.id)) return filtered[filtered.length - 1];
          return curr;
        });
      }
      return filtered;
    });
  }, [events]);

  const handleOk = () => {
    if (currentReminder) {
      setActiveReminders(prev => prev.map(r => r.id === currentReminder.id ? { ...r, acknowledged: true } : r));
    }
    console.debug('[ReminderBell] OK/Close clicked for', currentReminder && currentReminder.id);
    // Clear the current reminder when the user closes the modal (but keep it
    // in the activeReminders list). This allows newly-due reminders to become
    // the current reminder (the scheduler sets currentReminder only when it is null).
    // Persist the acknowledged state so we don't re-open this reminder after reload.
    try { if (currentReminder && currentReminder.id) addOrUpdateEvent({ ...currentReminder, acknowledged: true }); } catch (e) {}
    setCurrentReminder(null);
    setShowModal(false);
  };

  const handleDismiss = () => {
    if (!currentReminder) return;
    setActiveReminders(prev => {
      const remaining = prev.filter(r => r.id !== currentReminder.id);
      // persist removal
      removeEvent(currentReminder.id);
      if (typeof onDismiss === 'function') onDismiss(currentReminder.id);

      if (remaining.length > 0) {
        // Show the most-recent remaining reminder (treat activeReminders as
        // a FIFO where newest items are at the end).
        const next = remaining[remaining.length - 1];
        setCurrentReminder(next);
        console.debug('[ReminderBell] Dismissed reminder, showing next id=', next && next.id);
        setShowModal(true);
      } else {
        console.debug('[ReminderBell] Dismissed last active reminder, hiding modal');
        setCurrentReminder(null);
        setShowModal(false);
      }
      return remaining;
    });
  };

  const handleBellClick = () => {
    console.debug('[ReminderBell] Bell clicked; activeReminders ids=', activeReminders.map(a => a.id));
    // If reminders are muted, clicking the bell should not force the modal open.
    if (mute) {
      console.debug('[ReminderBell] Bell clicked while muted; not opening modal');
      return;
    }
    if (activeReminders.length > 0) {
      // Show the most-recent active reminder (last in the array).
      const last = activeReminders[activeReminders.length - 1];
      setCurrentReminder(last);
      setShowModal(true);
    }
  };

  const hasActiveReminders = activeReminders.length > 0;

  // If there are no active reminders and we're not muted, don't render the bell at all
  if (!hasActiveReminders && !mute) return null;

  const bellClass = darkTheme ? 'bell-dark' : 'bell-light';

  // compute a friendly display time for the current reminder
  let displayTime = '';
  if (currentReminder) {
    if (currentReminder.reminderTime) {
      const d = new Date(currentReminder.reminderTime);
      displayTime = d.toLocaleString();
    } else if (currentReminder.startDate && currentReminder.startTime) {
      try {
        const [y, m, d] = currentReminder.startDate.split('-').map(Number);
        const [hh, mm] = currentReminder.startTime.split(':').map(Number);
        const dt = new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
        displayTime = dt.toLocaleString();
      } catch (e) {
        displayTime = `${currentReminder.startDate} ${currentReminder.startTime}`;
      }
    } else {
      displayTime = currentReminder.startDate || currentReminder.startTime || '';
    }
  }

  return (
    <>
      <button 
        className={`btn position-relative ${bellClass}`}
        onClick={handleBellClick}
        title={hasActiveReminders ? 'Recent Notifications' : 'No active reminders'}
        aria-label={hasActiveReminders ? 'Recent Notifications' : 'No active reminders'}
        disabled={!hasActiveReminders}
      >
        <i className={`bi ${mute ? 'bi-bell-slash-fill' : (hasActiveReminders ? 'bi-bell-fill' : 'bi-bell')}`}></i>
      </button>

      {showModal && currentReminder && (
        <div className="modal show d-block modal-overlay" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reminder</h5>
              </div>
              <div className="modal-body">
                <h6>{currentReminder.title}</h6>
                <p>{currentReminder.description}</p>
                {displayTime && (
                  <p className="text-muted">
                    <small>{displayTime}</small>
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleOk}>
                  Close
                </button>
                <button type="button" className="btn btn-primary" onClick={handleDismiss}>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
