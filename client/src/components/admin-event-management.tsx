import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EventCard } from "@/components/event-card";
import { EventDetailModal } from "@/components/event-detail-modal";
import { DeleteEventModal } from "@/components/delete-event-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { EventWithSupervisor, EventStatus } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Edit, Trash2 } from "lucide-react";

export function AdminEventManagement() {
  const [selectedEvent, setSelectedEvent] = useState<EventWithSupervisor | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventWithSupervisor | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<EventWithSupervisor | null>(null);
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery<EventWithSupervisor[]>({
    queryKey: ["/api/admin/events"],
    retry: false,
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiRequest(`/api/admin/events/${eventId}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: EventStatus }) => {
      const response = await apiRequest(`/api/admin/events/${eventId}/status`, "PUT", { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      });
    },
  });

  // Filter events based on status
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (statusFilter === "all") return events;
    return events.filter(event => event.status === statusFilter);
  }, [events, statusFilter]);

  const handleEditEvent = async (event: EventWithSupervisor) => {
    // Set event status to "editing" when user clicks edit
    await updateStatusMutation.mutateAsync({ 
      eventId: event.id, 
      status: "editing" 
    });
    setEditingEvent(event);
  };

  const handleDeleteEvent = (event: EventWithSupervisor) => {
    setDeletingEvent(event);
  };

  const handleConfirmDelete = async () => {
    if (deletingEvent) {
      await deleteEventMutation.mutateAsync(deletingEvent.id);
      setDeletingEvent(null);
    }
  };

  const handleEventClick = (event: EventWithSupervisor) => {
    setSelectedEvent(event);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="text-neutral-medium">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <Filter className="w-5 h-5 text-neutral-medium" />
        <span className="text-sm font-medium text-neutral-dark">Filter by Status:</span>
        <Select value={statusFilter} onValueChange={(value: EventStatus | "all") => setStatusFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="open">Open for Registration</SelectItem>
            <SelectItem value="registration_closed">Registration Closed</SelectItem>
            <SelectItem value="full">Event Full</SelectItem>
            <SelectItem value="past">Past Events</SelectItem>
            <SelectItem value="editing">Currently Editing</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-neutral-medium">
          Showing {filteredEvents.length} of {events?.length || 0} events
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-neutral-medium">
            {statusFilter === "all" 
              ? "No events found" 
              : `No events with status "${statusFilter}"`
            }
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="relative group">
              <EventCard 
                event={event} 
                onClick={() => handleEventClick(event)} 
              />
              
              {/* Admin Action Buttons */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditEvent(event);
                  }}
                  className="bg-white shadow-md hover:bg-blue-50"
                  data-testid={`button-edit-event-${event.id}`}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEvent(event);
                  }}
                  className="bg-white shadow-md hover:bg-red-50 text-red-600 border-red-200"
                  data-testid={`button-delete-event-${event.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          children={[]}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* TODO: Edit Event Modal will be implemented separately */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Event</h3>
            <p className="text-gray-600 mb-4">
              Event "{editingEvent.name}" is now in editing mode. 
              Full edit functionality will be available soon.
            </p>
            <button
              onClick={() => setEditingEvent(null)}
              className="bg-primary-green text-white px-4 py-2 rounded hover:bg-primary-green/90"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteEventModal
        event={deletingEvent}
        isOpen={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteEventMutation.isPending}
      />
    </div>
  );
}