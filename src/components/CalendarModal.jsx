// Deprecated compatibility wrapper (kept for backward compatibility).
// The canonical component is `ReminderModal.jsx`. This file re-exports
// the Reminder modal under the old `CalendarModal` name so older imports
// don't break immediately. You can safely remove this file once all code
// references `ReminderModal` directly.
export { ReminderModal as CalendarModal } from './ReminderModal';

