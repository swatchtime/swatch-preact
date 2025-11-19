import { useState, useEffect } from 'preact/hooks';

export function ReminderBell({ events }) {
  const [activeReminders, setActiveReminders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);

  useEffect(() => {
    // Check for events that need reminders
    const checkReminders = () => {
      const now = new Date();
      events.forEach(event => {
        if (event.reminderTime && !event.dismissed) {
          const reminderTime = new Date(event.reminderTime);
          if (now >= reminderTime && !activeReminders.find(r => r.id === event.id)) {
            const newReminder = { ...event, acknowledged: false };
            setActiveReminders(prev => [...prev, newReminder]);
            setCurrentReminder(newReminder);
            setShowModal(true);
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 1000);
    return () => clearInterval(interval);
  }, [events, activeReminders]);

  const handleOk = () => {
    if (currentReminder) {
      setActiveReminders(prev =>
        prev.map(r => r.id === currentReminder.id ? { ...r, acknowledged: true } : r)
      );
    }
    setShowModal(false);
  };

  const handleDismiss = () => {
    if (currentReminder) {
      setActiveReminders(prev => prev.filter(r => r.id !== currentReminder.id));
    }
    setShowModal(false);
  };

  const handleBellClick = () => {
    if (activeReminders.length > 0) {
      setCurrentReminder(activeReminders[0]);
      setShowModal(true);
    }
  };

  const hasActiveReminders = activeReminders.some(r => !r.dismissed);

  return (
    <>
      <button 
        className={`btn ${hasActiveReminders ? 'btn-warning' : 'btn-outline-secondary'} position-relative`}
        onClick={handleBellClick}
        title="Reminders"
      >
        <i className="bi bi-bell-fill"></i>
        {hasActiveReminders && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {activeReminders.length}
          </span>
        )}
      </button>

      {showModal && currentReminder && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Event Reminder</h5>
              </div>
              <div className="modal-body">
                <h6>{currentReminder.title}</h6>
                <p>{currentReminder.description}</p>
                <p className="text-muted">
                  <small>
                    {currentReminder.startDate} {currentReminder.startTime}
                  </small>
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleOk}>
                  OK
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
