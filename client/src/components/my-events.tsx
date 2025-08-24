import { useQuery } from "@tanstack/react-query";
import { MyEventGroupCard } from "./my-event-group-card";
import { EventDetailModal } from "./event-detail-modal";
import { useState } from "react";
import type { Event, Child } from "@shared/schema";

interface MyEventRegistration {
  eventId: string;
  childId: string;
  parentId: string;
  registeredAt: string;
  event: {
    id: string;
    name: string;
    type: string;
    startTime: string;
    location: string;
    duration: string;
    image?: string;
    description: string;
  };
  child: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export function MyEvents() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  const { data: myEvents = [], isLoading } = useQuery<MyEventRegistration[]>({
    queryKey: ["/api/my-events"],
    staleTime: 0, // Always fetch fresh data for event registrations
  });

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-primary-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-medium">Loading your events...</p>
        </div>
      </div>
    );
  }

  if (myEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎯</span>
        </div>
        <h3 className="text-lg font-semibold text-neutral-dark mb-2">No Events Yet</h3>
        <p className="text-neutral-medium mb-6">
          You haven't registered for any events yet. Browse the Events tab to find activities for your children.
        </p>
      </div>
    );
  }

  // Group registrations by event ID and separate upcoming/past
  const now = new Date();
  
  // Group registrations by event
  const groupedEvents = myEvents.reduce((acc, registration) => {
    const eventId = registration.eventId;
    if (!acc[eventId]) {
      acc[eventId] = {
        event: registration.event,
        children: []
      };
    }
    acc[eventId].children.push(registration.child);
    return acc;
  }, {} as Record<string, { event: any, children: any[] }>);
  
  // Separate into upcoming and past based on event start time
  const upcomingEvents = Object.values(groupedEvents).filter((group) => new Date(group.event.startTime) > now);
  const pastEvents = Object.values(groupedEvents).filter((group) => new Date(group.event.startTime) <= now);

  return (
    <div className="space-y-6">
      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-neutral-dark mb-4" data-testid="heading-upcoming-events">
            Upcoming Events ({upcomingEvents.length})
          </h3>
          <div className="space-y-3">
            {upcomingEvents.map((eventGroup) => (
              <MyEventGroupCard
                key={eventGroup.event.id}
                event={eventGroup.event}
                children={eventGroup.children}
                onClick={() => setSelectedEvent({
                  ...eventGroup.event,
                  startTime: new Date(eventGroup.event.startTime)
                } as Event)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-neutral-dark mb-4" data-testid="heading-past-events">
            Past Events ({pastEvents.length})
          </h3>
          <div className="space-y-3">
            {pastEvents.map((eventGroup) => (
              <MyEventGroupCard
                key={eventGroup.event.id}
                event={eventGroup.event}
                children={eventGroup.children}
                onClick={() => setSelectedEvent({
                  ...eventGroup.event,
                  startTime: new Date(eventGroup.event.startTime)
                } as Event)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Show message if only upcoming or only past events */}
      {upcomingEvents.length === 0 && pastEvents.length > 0 && (
        <div className="text-center py-8 border-t border-gray-200">
          <p className="text-neutral-medium">
            No upcoming events. Browse the Events tab to register for new activities.
          </p>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          children={children}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}