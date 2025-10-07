import { useDialogStore } from '../hooks/useDialog'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'

export function GlobalDialog() {
  const { isOpen, type, title, message, variant, confirmText, cancelText, confirm, cancel } = useDialogStore()

  if (!isOpen) return null

  const getIcon = () => {
    switch (variant) {
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-warning-500" />
      case 'danger':
        return <XCircle className="h-6 w-6 text-error-500" />
      case 'success':
        return <CheckCircle className="h-6 w-6 text-success-500" />
      case 'info':
        return <Info className="h-6 w-6 text-primary-500" />
      default:
        return <Info className="h-6 w-6 text-gray-500" />
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={type === 'alert' ? confirm : cancel}
    >
      <Card
        className="w-full max-w-md mx-4 shadow-2xl border-2"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-700 whitespace-pre-wrap">{message}</p>
          <div className="flex space-x-3 justify-end">
            {type === 'confirm' && (
              <Button
                variant="outline"
                onClick={cancel}
              >
                {cancelText}
              </Button>
            )}
            <Button
              variant={variant === 'danger' ? 'destructive' : 'default'}
              onClick={confirm}
              autoFocus
            >
              {confirmText || 'OK'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
