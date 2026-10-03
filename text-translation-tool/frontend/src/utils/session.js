/**
 * Session identifier — stored in sessionStorage so it persists for the tab
 * but is isolated from other users/tabs (SRS NFR6, FR7.8).
 */
export function getSessionId() {
  let id = sessionStorage.getItem('ttt_session_id')
  if (!id) {
    // Simple UUID v4
    id = crypto.randomUUID
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
        })
    sessionStorage.setItem('ttt_session_id', id)
  }
  return id
}
