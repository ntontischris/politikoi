import type { Notification } from '../services/notificationService'

// Mock notifications για testing purposes
export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Νέο Αίτημα',
    message: 'Νέο αίτημα για βεβαίωση κατοικίας από τον Γιάννη Παπαδόπουλο',
    type: 'info',
    is_read: false,
    related_entity_type: 'request',
    related_entity_id: 'req-123',
    action_url: '/dashboard/requests',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    title: 'Ολοκλήρωση Αιτήματος',
    message: 'Το αίτημα για πιστοποιητικό γέννησης ολοκληρώθηκε επιτυχώς',
    type: 'success',
    is_read: false,
    related_entity_type: 'request',
    related_entity_id: 'req-122',
    action_url: '/dashboard/requests',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    title: 'Υπενθύμιση Αιτήματος',
    message: 'Το αίτημα για άδεια οικοδομής χρειάζεται επιπλέον έγγραφα',
    type: 'warning',
    is_read: true,
    related_entity_type: 'request',
    related_entity_id: 'req-121',
    action_url: '/dashboard/requests',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    title: 'Νέος Πολίτης',
    message: 'Εγγράφηκε νέος πολίτης: Μαρία Δημητρίου',
    type: 'info',
    is_read: true,
    related_entity_type: 'citizen',
    related_entity_id: 'cit-456',
    action_url: '/dashboard/citizens',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    title: 'Σφάλμα Συστήματος',
    message: 'Προσωρινό πρόβλημα με την υπηρεσία email. Προσπαθήστε ξανά αργότερα.',
    type: 'error',
    is_read: false,
    related_entity_type: 'system',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
]

// In-memory storage για development testing
let currentNotifications = [...mockNotifications]

// Function για development testing - αυτό θα αφαιρεθεί στην παραγωγή
export const loadMockNotifications = () => {
  return Promise.resolve([...currentNotifications])
}

export const getMockUnreadCount = () => {
  return Promise.resolve(currentNotifications.filter(n => !n.is_read).length)
}

export const mockMarkAsRead = (id: string) => {
  const notification = currentNotifications.find(n => n.id === id)
  if (notification) {
    notification.is_read = true
    notification.updated_at = new Date().toISOString()
  }
  return Promise.resolve(notification)
}

export const mockMarkAllAsRead = () => {
  currentNotifications = currentNotifications.map(n => ({
    ...n,
    is_read: true,
    updated_at: new Date().toISOString()
  }))
  return Promise.resolve()
}

export const mockDeleteNotification = (id: string) => {
  currentNotifications = currentNotifications.filter(n => n.id !== id)
  return Promise.resolve()
}