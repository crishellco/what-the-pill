let pendingResolve = null

export function useConfirm() {
  const dialog = useState('confirm-dialog', () => ({
    open: false,
    title: 'Are you sure?',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    destructive: false
  }))

  function confirm(options) {
    const opts = typeof options === 'string' ? { message: options } : options
    dialog.value = {
      open: true,
      title: opts.title || 'Are you sure?',
      message: opts.message || '',
      confirmLabel: opts.confirmLabel || 'Confirm',
      cancelLabel: opts.cancelLabel || 'Cancel',
      destructive: opts.destructive ?? false
    }
    return new Promise((resolve) => {
      pendingResolve = resolve
    })
  }

  function accept() {
    dialog.value.open = false
    pendingResolve?.(true)
    pendingResolve = null
  }

  function dismiss() {
    dialog.value.open = false
    pendingResolve?.(false)
    pendingResolve = null
  }

  return { dialog, confirm, accept, dismiss }
}
