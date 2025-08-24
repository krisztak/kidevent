import { format } from "date-fns";
import { Calendar, MapPin, Clock, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MyEventsCardProps {
  registration: {
    eventId: string;
    childId: string;
    parentId: string;
    creditsCost?: number;
    servicesCost?: number;
    selectedServices?: number[];
    event: {
      id: string;
      name: string;
      type: string;
      startTime: Date;
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
  };
  onClick?: () => void;
}

export function MyEventsCard({ registration, onClick }: MyEventsCardProps) {
  const { event, child } = registration;
  const eventDate = new Date(event.startTime);
  const isUpcoming = eventDate > new Date();

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        !isUpcoming ? "opacity-75" : ""
      }`}
      onClick={onClick}
      data-testid={`my-event-card-${event.id}`}
    >
      <CardContent className="p-0">
        <div className="flex">
          {/* Event Image */}
          <div className="w-24 h-24 flex-shrink-0">
            {event.image ? (
              <img 
                src={event.image} 
                alt={event.name}
                className="w-full h-full object-cover rounded-l-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `data:image/svg+xml,${encodeURIComponent(`
                    <svg width="96" height="96" xmlns="http://www.w3.org/2000/svg">
                      <rect width="96" height="96" fill="#f3f4f6"/>
                      <text x="48" y="50" text-anchor="middle" dy="0.3em" fill="#9ca3af" font-size="32">📅</text>
                    </svg>
                  `)}`;
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-l-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-dark text-sm mb-1" data-testid={`text-event-name-${event.id}`}>
                  {event.name}
                </h3>
                
                {/* Child Info */}
                <div className="flex items-center gap-1 mb-2">
                  <User className="w-3 h-3 text-primary-green" />
                  <span className="text-xs text-primary-green font-medium" data-testid={`text-child-name-${child.id}`}>
                    {child.firstName} {child.lastName}
                  </span>
                </div>

                {/* Event Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-neutral-medium">
                    <Calendar className="w-3 h-3" />
                    <span data-testid={`text-event-date-${event.id}`}>
                      {format(eventDate, "EEE, MMM d")}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-neutral-medium">
                    <Clock className="w-3 h-3" />
                    <span>
                      {format(eventDate, "h:mm a")} • {event.duration}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-neutral-medium">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>

                {/* Cost Information */}
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex flex-col text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-medium">Base Cost:</span>
                      <span className="font-medium text-primary-green">
                        {registration.creditsCost || 0} credits
                      </span>
                    </div>
                    {registration.servicesCost && registration.servicesCost > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-medium">Services:</span>
                        <span className="font-medium text-blue-600">
                          ${(registration.servicesCost / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                isUpcoming 
                  ? "bg-green-100 text-green-800" 
                  : "bg-gray-100 text-gray-600"
              }`}>
                {isUpcoming ? "Upcoming" : "Past"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}