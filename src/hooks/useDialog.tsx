import { create } from 'zustand'

interface DialogState {
  isOpen: boolean
  type: 'alert' | 'confirm'
  title: string
  message: string
  variant?: 'default' | 'warning' | 'danger' | 'success' | 'info'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

interface DialogStore extends DialogState {
  showAlert: (message: string, title?: string, variant?: DialogState['variant']) => void
  showConfirm: (message: string, title?: string, variant?: DialogState['variant']) => Promise<boolean>
  close: () => void
  confirm: () => void
  cancel: () => void
}

export const useDialogStore = create<DialogStore>((set, get) => ({
  isOpen: false,
  type: 'alert',
  title: '',
  message: '',
  variant: 'default',
  confirmText: 'OK',
  cancelText: 'Cancel',

  showAlert: (message, title = 'Notice', variant = 'info') => {
    set({
      isOpen: true,
      type: 'alert',
      title,
      message,
      variant,
      confirmText: 'OK'
    })
  },

  showConfirm: (message, title = 'Confirm', variant = 'default') => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        variant,
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: () => {
          set({ isOpen: false })
          resolve(true)
        },
        onCancel: () => {
          set({ isOpen: false })
          resolve(false)
        }
      })
    })
  },

  close: () => set({ isOpen: false }),

  confirm: () => {
    const state = get()
    state.onConfirm?.()
  },

  cancel: () => {
    const state = get()
    state.onCancel?.()
    set({ isOpen: false })
  }
}))
