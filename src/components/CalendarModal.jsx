import { useState } from 'preact/hooks';

export function CalendarModal({ onEventCreate }) {
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    reminder: '15min',
    repeat: 'none',
    useSwatchTime: false
  });

  const reminderOptions = [
    { value: '5min', label: '5 minutes' },
    { value: '15min', label: '15 minutes' },
    { value: '30min', label: '30 minutes' },
    { value: '1hr', label: '1 hour' },
    { value: '2hr', label: '2 hours' },
    { value: '12hr', label: '12 hours' },
    { value: '1day', label: '1 day' }
  ];

  const repeatOptions = [
    { value: 'none', label: 'Does not repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onEventCreate(eventData);
    // Reset form
    setEventData({
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      reminder: '15min',
      repeat: 'none',
      useSwatchTime: false
    });
  };

  const handleChange = (field, value) => {
    setEventData({ ...eventData, [field]: value });
  };

  const generateICS = () => {
    // Basic ICS generation (stub for now)
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Swatch Internet Time//EN
BEGIN:VEVENT
SUMMARY:${eventData.title}
DESCRIPTION:${eventData.description}
DTSTART:${eventData.startDate.replace(/-/g, '')}T${eventData.startTime.replace(/:/g, '')}00
DTEND:${eventData.endDate.replace(/-/g, '')}T${eventData.endTime.replace(/:/g, '')}00
END:VEVENT
END:VCALENDAR`;
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'event.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal fade" id="calendarModal" tabIndex="-1" aria-labelledby="calendarModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="calendarModalLabel">Create Event</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Title *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={eventData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  value={eventData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                ></textarea>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Start Date *</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={eventData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Start Time *</label>
                  <input 
                    type="time" 
                    className="form-control"
                    value={eventData.startTime}
                    onChange={(e) => handleChange('startTime', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">End Date *</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={eventData.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">End Time *</label>
                  <input 
                    type="time" 
                    className="form-control"
                    value={eventData.endTime}
                    onChange={(e) => handleChange('endTime', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Reminder</label>
                <select 
                  className="form-select"
                  value={eventData.reminder}
                  onChange={(e) => handleChange('reminder', e.target.value)}
                >
                  {reminderOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Repeat</label>
                <select 
                  className="form-select"
                  value={eventData.repeat}
                  onChange={(e) => handleChange('repeat', e.target.value)}
                >
                  {repeatOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-check mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="useSwatchTime"
                  checked={eventData.useSwatchTime}
                  onChange={(e) => handleChange('useSwatchTime', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="useSwatchTime">
                  Use Swatch Internet Time
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={generateICS}>
                Export as .ics
              </button>
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" className="btn btn-primary">Create Event</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
