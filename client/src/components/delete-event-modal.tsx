import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import type { EventWithSupervisor } from "@shared/schema";

interface DeleteEventModalProps {
  event: EventWithSupervisor | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteEventModal({ event, isOpen, onClose, onConfirm, isDeleting }: DeleteEventModalProps) {
  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <DialogTitle className="text-lg font-semibold text-neutral-dark">
            Delete Event
          </DialogTitle>
          <DialogDescription className="text-neutral-medium">
            Are you sure you want to delete "{event.name}"? 
            <br />
            <span className="text-sm text-neutral-light mt-2 block">
              This event will be hidden from users but can be restored later from the admin panel.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 my-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">What happens when you delete:</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• Event becomes invisible to parents and children</li>
                <li>• Existing registrations are preserved</li>
                <li>• Event can be restored anytime from admin settings</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
            data-testid="button-cancel-delete"
          >
            Keep Event
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            data-testid="button-confirm-delete"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Event
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}