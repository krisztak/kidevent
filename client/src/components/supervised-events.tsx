import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EventCard } from "@/components/event-card";
import { EventDetailModal } from "@/components/event-detail-modal";
import type { EventWithSupervisor, Child } from "@shared/schema";

export function SupervisedEvents() {
  const [selectedEvent, setSelectedEvent] = useState<EventWithSupervisor | null>(null);

  const { data: supervisedEvents = [], isLoading, error } = useQuery<EventWithSupervisor[]>({
    queryKey: ["/api/supervised-events"],
    retry: false,
  });

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    retry: false,
  });

  const handleEventClick = (event: EventWithSupervisor) => {
    setSelectedEvent(event);
  };

  const handleCloseEventModal = () => {
    setSelectedEvent(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="animate-pulse">
              <div className="w-full h-32 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-2xl">⚠</span>
        </div>
        <h3 className="text-lg font-semibold text-neutral-dark mb-2">Error Loading Supervised Events</h3>
        <p className="text-neutral-medium">Please try again later</p>
      </div>
    );
  }

  if (supervisedEvents.length === 0) {
    return (
      <div className="text-center py-12" data-testid="no-supervised-events">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-400 text-2xl">👨‍🏫</span>
        </div>
        <h3 className="text-lg font-semibold text-neutral-dark mb-2">No Supervised Events</h3>
        <p className="text-neutral-medium">You are not currently supervising any events.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {supervisedEvents.map((event) => (
          <div key={event.id} className="relative">
            <div className="absolute top-2 left-2 bg-primary-green text-white text-xs px-2 py-1 rounded-md z-10">
              Supervising
            </div>
            <EventCard
              event={event}
              onClick={() => handleEventClick(event)}
            />
          </div>
        ))}
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          children={children}
          onClose={handleCloseEventModal}
        />
      )}
    </>
  );
}