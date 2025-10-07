import * as React from "react"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { AlertTriangle, CheckCircle, Info } from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "warning" | "danger" | "success"
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default"
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (variant) {
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-warning-500" />
      case "danger":
        return <AlertTriangle className="h-6 w-6 text-error-500" />
      case "success":
        return <CheckCircle className="h-6 w-6 text-success-500" />
      default:
        return <Info className="h-6 w-6 text-primary-500" />
    }
  }

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-700">{message}</p>
          <div className="flex space-x-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
            >
              {cancelText}
            </Button>
            <Button
              variant={variant === "danger" ? "destructive" : "default"}
              onClick={handleConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook for easier usage
export function useConfirmDialog() {
  const [dialogState, setDialogState] = React.useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "warning" | "danger" | "success"
    onConfirm: () => void
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  })

  const confirm = (options: Omit<typeof dialogState, "isOpen">) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({
        ...options,
        isOpen: true,
        onConfirm: () => {
          options.onConfirm()
          resolve(true)
        }
      })
    })
  }

  const close = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }))
  }

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      {...dialogState}
      onClose={close}
    />
  )

  return { confirm, ConfirmDialogComponent, close }
}
