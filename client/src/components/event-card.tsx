import { format } from "date-fns";
import type { EventWithSupervisor, EventStatus } from "@shared/schema";

interface EventCardProps {
  event: EventWithSupervisor & { status?: EventStatus };
  onClick: () => void;
}

// Status badge component
function EventStatusBadge({ status }: { status?: EventStatus }) {
  if (!status) return null;
  
  const statusConfig = {
    open: { label: "Open", className: "bg-green-100 text-green-800" },
    registration_closed: { label: "Registration Closed", className: "bg-yellow-100 text-yellow-800" },
    full: { label: "Event Full", className: "bg-red-100 text-red-800" },
    past: { label: "Past Event", className: "bg-gray-100 text-gray-600" },
    editing: { label: "Editing", className: "bg-blue-100 text-blue-800" },
  };
  
  const config = statusConfig[status];
  if (!config) return null;
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

export function EventCard({ event, onClick }: EventCardProps) {
  const isFullyBooked = event.remainingSeats <= 0;
  const isLowSeats = event.remainingSeats <= 2 && event.remainingSeats > 0;
  const eventStatus = event.status || "open";
  const isActionDisabled = eventStatus === "full" || eventStatus === "registration_closed" || eventStatus === "past";

  return (
    <div className="event-card bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden" data-testid={`card-event-${event.id}`}>
      {/* Event Image */}
      {event.image && (
        <img 
          src={event.image} 
          alt={event.name} 
          className="w-full h-32 object-cover"
          data-testid={`img-event-${event.id}`}
        />
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 mr-2">
            <h4 className="font-semibold text-neutral-dark" data-testid={`text-event-name-${event.id}`}>
              {event.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <EventStatusBadge status={eventStatus} />
            </div>
          </div>
          <span className="bg-accent-yellow/20 text-accent-yellow px-2 py-1 rounded text-xs font-medium" data-testid={`text-event-credits-${event.id}`}>
            {event.creditsRequired} Credits
          </span>
        </div>
        
        <div className="flex items-center space-x-4 text-xs text-neutral-medium mb-3">
          <span>
            🕐 {format(new Date(event.startTime), "h:mm a")}
          </span>
          <span>
            📍 {event.location}
          </span>
          <span className={isFullyBooked ? "text-red-500" : isLowSeats ? "text-orange-500" : ""}>
            👥 {event.remainingSeats}/{event.maxSeats} spots
          </span>
        </div>
        
        <p className="text-sm text-neutral-medium mb-2 line-clamp-2" data-testid={`text-event-description-${event.id}`}>
          {event.description}
        </p>
        
        {event.supervisorName && (
          <div className="text-xs text-neutral-medium mb-3 flex items-center">
            <span>👨‍🏫 Supervisor: {event.supervisorName}</span>
          </div>
        )}
        
        <button 
          onClick={onClick}
          disabled={isActionDisabled}
          className={`w-full py-2 rounded-lg font-medium transition duration-200 ${
            isActionDisabled 
              ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
              : "bg-primary-green text-white hover:bg-primary-green/90"
          }`}
          data-testid={`button-view-event-${event.id}`}
        >
          {eventStatus === "full" ? "Event Full" : 
           eventStatus === "registration_closed" ? "Registration Closed" :
           eventStatus === "past" ? "Event Ended" :
           "View Details & Sign Up"}
        </button>
      </div>
    </div>
  );
}
