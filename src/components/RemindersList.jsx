import { useEffect, useState } from 'preact/hooks';
import { calculateSwatchTime, localTimeToBeats } from '../utils/swatchTime';
import { computeReminderDate } from '../utils/reminderTime';
import { requestNotificationPermission, registerServiceWorker } from '../utils/notifications';
import { eventsSignal, removeEvent, setMute as setMuteSignal, muteSignal, setSelectedEvent } from '../signals/store';

export function RemindersList() {
  const currentEvents = eventsSignal.value;
  const currentMute = muteSignal.value;
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

  const now = Date.now();
  const active = (currentEvents || []).filter(e => !e.dismissed);

  // Helper: compute a comparable timestamp for sorting. Prefer explicit reminderTime;
  // if missing, try to compute from swatchTime/startDate; otherwise use Infinity for upcoming, 0 for past.
  const tsFor = (ev) => {
    try {
      if (ev && ev.reminderTime) return new Date(ev.reminderTime).getTime();
      // attempt to compute from stored form fields
      const maybe = computeReminderDate(ev || {});
      if (maybe) return maybe.getTime();
    } catch (e) {}
    return null;
  };

  const due = active
    .filter(e => {
      const t = tsFor(e);
      return t !== null && t <= now;
    })
    .sort((a, b) => {
      const ta = tsFor(a) || 0;
      const tb = tsFor(b) || 0;
      // most-recently-due first (closest to now on top)
      return tb - ta;
    });

  const upcoming = active
    .filter(e => {
      const t = tsFor(e);
      return t === null ? true : t > now;
    })
    .sort((a, b) => {
      const ta = tsFor(a) || Infinity;
      const tb = tsFor(b) || Infinity;
      // soonest first
      return ta - tb;
    });

  const handleNotificationToggle = async (e) => {
    const checked = e.target.checked;
    if (checked) {
      // Request permission when user explicitly enables notifications from the UI
      const perm = await requestNotificationPermission();
      if (perm === 'granted') {
        // Register the service worker so SW notifications are available,
        // but avoid calling register() if there's already an active registration.
        try {
          if (navigator && navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
            const existing = await navigator.serviceWorker.getRegistration();
            if (!existing) {
              await registerServiceWorker();
            }
          } else {
            // fall back to attempting registration if the platform APIs are not available
            await registerServiceWorker();
          }
        } catch (err) {
          // Non-fatal: if registration fails, continue without throwing
        }
        // keep checkbox checked
        e.target.checked = true;
      } else {
        // permission denied or dismissed -> reflect actual state
        e.target.checked = false;
        alert('Notifications were not enabled. To enable notifications, allow them in your browser site settings.');
      }
    } else {
      // user tried to uncheck; instruct how to revoke permission in browser
      alert('This checkbox reflects your browser\'s permission settings for notifications. To revoke these permissions, change your browser settings.');
      // reflect actual current permission
      e.target.checked = Notification.permission === 'granted';
    }
  };

  const handleMuteToggle = (e) => {
    const checked = e.target.checked;
    setMuteSignal(checked);
  };

  const handleDelete = (id) => {
    const ev = (currentEvents || []).find(r => r.id === id);
    const nowT = Date.now();
    const isDue = ev && ev.reminderTime && new Date(ev.reminderTime).getTime() <= nowT;
    const prompt = isDue ? 'Dismiss this reminder?' : 'Delete this reminder?';
    if (!confirm(prompt)) return;
    removeEvent(id);
  };

  return (
    <div className="modal fade" id="remindersListModal" tabIndex="-1" aria-labelledby="remindersListModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="remindersListModalLabel">Reminders</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>Current time: <strong>@{swatchText}</strong></div>
              <div className="d-flex gap-2">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="enableNotifications" defaultChecked={Notification.permission === 'granted'} onChange={handleNotificationToggle} />
                  <label className="form-check-label" htmlFor="enableNotifications">Enable browser notifications</label>
                </div>
                <div className="btn-group ms-3" role="group" aria-label="Reminders actions">
                  <input type="checkbox" className="btn-check" id="mute-toggle" autoComplete="off" checked={!!currentMute} onChange={handleMuteToggle} />
                  <label className="btn btn-outline-secondary" htmlFor="mute-toggle" title="Mute reminders"><i className="bi bi-bell-slash"></i></label>

                  <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#reminderFormModal" title="New Reminder" onClick={() => setSelectedEvent(null)}><i className="bi bi-plus-square"></i></button>
                </div>
              </div>
            </div>

            <h6 className="mt-2">Future</h6>
            <div className="mb-3">
              {upcoming.length === 0 ? (
                <div className="text-muted">No future reminders.</div>
              ) : (
                upcoming.map(r => (
                  <div key={r.id} className={`d-flex align-items-center border rounded p-2 mb-2 reminder-future-row`}>
                    <div style={{ width: '80px' }}>
                      <strong className="swatch-future">@{(() => {
                        try {
                          if (r.swatchTime) return String(Math.trunc(Number(r.swatchTime))).padStart(3, '0');
                          if (r.reminderTime) {
                            const b = Number(localTimeToBeats(new Date(r.reminderTime)));
                            if (!Number.isNaN(b)) return String(Math.trunc(b)).padStart(3, '0');
                          }
                        } catch (e) {}
                        return String(Math.trunc(Number(0))).padStart(3, '0');
                      })()}</strong>
                    </div>
                    <div className="flex-grow-1 text-truncate">{r.title}</div>
                    <div className="d-flex gap-2 ms-3">
                          <button className="btn btn-sm btn-outline-secondary" data-bs-toggle={'modal'} data-bs-target={'#reminderFormModal'} onClick={() => setSelectedEvent(r)} title={'Edit reminder'}> <i className="bi bi-pencil"></i> </button>
                      <button className={`btn btn-sm btn-outline-danger`} onClick={() => handleDelete(r.id)} title={'Delete reminder'}> <i className="bi bi-x"></i> </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ height: '12px' }}></div>

            <h6 className="mt-2">Past</h6>
            <div className="mb-3">
              {due.length === 0 ? (
                <div className="text-muted">No past reminders.</div>
              ) : (
                due.map(r => (
                  <div key={r.id} className={`d-flex align-items-center border rounded p-2 mb-2 reminder-past-row`}>
                    <div style={{ width: '80px' }}>
                      <strong className="swatch-past">@{(() => {
                        try {
                          if (r.swatchTime) return String(Math.trunc(Number(r.swatchTime))).padStart(3, '0');
                          if (r.reminderTime) {
                            const b = Number(localTimeToBeats(new Date(r.reminderTime)));
                            if (!Number.isNaN(b)) return String(Math.trunc(b)).padStart(3, '0');
                          }
                        } catch (e) {}
                        return String(Math.trunc(Number(0))).padStart(3, '0');
                      })()}</strong>
                    </div>
                    <div className="flex-grow-1 text-truncate">{r.title}</div>
                    <div className="d-flex gap-2 ms-3">
                      <button className="btn btn-sm btn-outline-secondary" disabled title={'Edit disabled for past reminders'}> <i className="bi bi-pencil"></i> </button>
                      <button className={`btn btn-sm btn-outline-secondary`} onClick={() => handleDelete(r.id)} title={'Dismiss reminder'}> <i className="bi bi-check2-square"></i> </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
