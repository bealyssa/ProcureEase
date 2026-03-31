import { useState } from 'react'
import { toast } from 'sonner'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

/**
 * Shadcn-style confirmation dialog.
 * - Shows an "Are you sure?" modal before running `onConfirm`.
 * - Shows a toast/snackbar on success.
 */
export default function ConfirmActionDialog({
    children,
    title = 'Are you sure?',
    description,
    confirmText = 'Continue',
    cancelText = 'Cancel',
    confirmVariant = 'default',
    successMessage,
    onConfirm,
}) {
    const [open, setOpen] = useState(false)
    const [pending, setPending] = useState(false)

    async function handleConfirm() {
        if (pending) return

        try {
            setPending(true)
            const result = await onConfirm?.()

            setOpen(false)

            if (successMessage) {
                const message =
                    typeof successMessage === 'function'
                        ? successMessage(result)
                        : successMessage
                if (message) toast.success(message)
            }
        } catch {
            // Close so the page-level error UI is visible.
            setOpen(false)
        } finally {
            setPending(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {description ? (
                        <AlertDialogDescription>{description}</AlertDialogDescription>
                    ) : null}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={pending}
                        className={cn(buttonVariants({ variant: confirmVariant }))}
                    >
                        {pending ? 'Working…' : confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
