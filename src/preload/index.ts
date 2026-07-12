import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  addTask: (name: string, description: string) => ipcRenderer.invoke('add-task', name, description),
  deleteTask: (id: number) => ipcRenderer.invoke('delete-task', id),
  getActiveTimer: () => ipcRenderer.invoke('get-active-timer'),
  startTimer: (taskId: number) => ipcRenderer.invoke('start-timer', taskId),
  stopTimer: (taskId: number) => ipcRenderer.invoke('stop-timer', taskId),
  getAllTimeEntries: () => ipcRenderer.invoke('get-all-time-entries'),
  getTimeSummary: () => ipcRenderer.invoke('get-time-summary'),
  deleteTimeEntry: (id: number) => ipcRenderer.invoke('delete-time-entry', id),
  showNotification: (title: string, body: string) => ipcRenderer.invoke('show-notification', title, body),
  toggleTodayTask: (id: number) => ipcRenderer.invoke('toggle-today', id),
  getTodayTasks: () => ipcRenderer.invoke('get-today-tasks'),
  clearTodayDate: (id: number) => ipcRenderer.invoke('clear-today-date', id),
})
