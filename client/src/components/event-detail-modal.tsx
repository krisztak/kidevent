import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { EventWithSupervisor, Child, ExtraService } from "@shared/schema";

interface EventDetailModalProps {
  event: EventWithSupervisor;
  children: Child[];
  onClose: () => void;
}

export function EventDetailModal({ event, children, onClose }: EventDetailModalProps) {
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [isParentRegistration, setIsParentRegistration] = useState<boolean>(false);
  const [isRegistrationExpanded, setIsRegistrationExpanded] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch registrations for this event to check which children are already registered
  const { data: eventRegistrations } = useQuery({
    queryKey: ["/api/registrations"],
    retry: false,
  });

  // Check if a child is already registered for this event
  const isChildRegistered = (childId: string) => {
    if (!eventRegistrations || !Array.isArray(eventRegistrations)) return false;
    return eventRegistrations.some((reg: any) => 
      reg.eventId === event.id && reg.childId === childId
    );
  };

  // Check if parent is already registered for this event
  const isParentRegistered = () => {
    if (!eventRegistrations || !Array.isArray(eventRegistrations)) return false;
    return eventRegistrations.some((reg: any) => 
      reg.eventId === event.id && reg.childId === null
    );
  };

  const registerMutation = useMutation({
    mutationFn: async ({ childId, selectedServices }: { childId?: string, selectedServices: number[] }) => {
      await apiRequest("POST", `/api/events/${event.id}/register`, { 
        childId: childId || null, 
        selectedServices 
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully registered for event!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-events"] });
      // Reset form state but keep modal open
      setSelectedChildId("");
      setSelectedServices([]);
      setIsParentRegistration(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }

      // Handle specific error cases with user-friendly messages
      const errorMessage = error.message || "Failed to register for event";
      let title = "Registration Error";
      let description = errorMessage;
      
      if (errorMessage.includes("already registered")) {
        title = "Already Registered";
        description = "This child is already registered for this event. You can check your registrations in the My Events tab.";
      } else if (errorMessage.includes("not enough seats") || errorMessage.includes("fully booked")) {
        title = "Event Full";
        description = "This event is now fully booked. Please try registering for another event.";
      } else if (errorMessage.includes("registration closed") || errorMessage.includes("cutoff")) {
        title = "Registration Closed";
        description = "The registration deadline for this event has passed.";
      } else if (errorMessage.includes("insufficient credits")) {
        title = "Insufficient Credits";
        description = "You don't have enough credits to register for this event.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });

  const handleRegister = () => {
    if (!isParentRegistration && !selectedChildId) {
      toast({
        title: "Error",
        description: "Please select a child for registration",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate({ 
      childId: isParentRegistration ? undefined : selectedChildId, 
      selectedServices 
    });
  };

  // Calculate costs separately
  const creditsCost = event.creditsRequired;
  const servicesCost = selectedServices.reduce((sum, serviceIndex) => {
    const service = event.extraServices?.[serviceIndex];
    return sum + (service?.price || 0);
  }, 0);

  // Handle service selection
  const toggleService = (serviceIndex: number) => {
    setSelectedServices(prev => 
      prev.includes(serviceIndex) 
        ? prev.filter(i => i !== serviceIndex)
        : [...prev, serviceIndex]
    );
  };

  const isFullyBooked = event.remainingSeats <= 0;
  const cutoffTime = new Date(event.startTime);
  cutoffTime.setHours(cutoffTime.getHours() - event.cutoffHours);
  const isAfterCutoff = new Date() > cutoffTime;

  return (
    <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-xl sm:rounded-xl max-w-md w-full m-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-xl">
          <h3 className="text-lg font-semibold text-neutral-dark">Event Details</h3>
          <button 
            onClick={onClose}
            className="text-neutral-medium hover:text-neutral-dark"
            data-testid="button-close-event-modal"
          >
            ✕
          </button>
        </div>

        {/* Event Detail Content */}
        <div className="p-4">
          {/* Event Image */}
          {event.image && (
            <img 
              src={event.image} 
              alt={event.name} 
              className="w-full h-48 object-cover rounded-lg mb-4"
              data-testid="img-event-detail"
            />
          )}

          {/* Event Info */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-bold text-neutral-dark mb-2" data-testid="text-event-detail-name">
                {event.name}
              </h4>
              <div className="flex items-center space-x-4 text-sm text-neutral-medium">
                <span>🏷️ {event.type}</span>
                <span>⏱️ {event.duration}</span>
              </div>
            </div>

            {/* Event Stats */}
            <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-200">
              <div className="text-center">
                <div className="text-lg font-bold text-primary-green" data-testid="text-event-credits">
                  {event.creditsRequired}
                </div>
                <div className="text-xs text-neutral-medium">Credits</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-secondary-green" data-testid="text-event-seats">
                  {event.remainingSeats}
                </div>
                <div className="text-xs text-neutral-medium">Spots Left</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-accent-yellow" data-testid="text-event-max-seats">
                  {event.maxSeats}
                </div>
                <div className="text-xs text-neutral-medium">Total Spots</div>
              </div>
            </div>

            {/* Event Details */}
            <div className="space-y-3">
              <div>
                <h5 className="font-semibold text-neutral-dark mb-1">When & Where</h5>
                <div className="text-sm text-neutral-medium space-y-1">
                  <div>📅 {format(new Date(event.startTime), "EEEE, MMMM d")}</div>
                  <div>🕐 {format(new Date(event.startTime), "h:mm a")}</div>
                  <div>📍 {event.location}</div>
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-neutral-dark mb-1">About This Activity</h5>
                <p className="text-sm text-neutral-medium leading-relaxed" data-testid="text-event-full-description">
                  {event.description}
                </p>
              </div>

              <div>
                <h5 className="font-semibold text-neutral-dark mb-1">Additional Info</h5>
                <div className="text-sm text-neutral-medium space-y-1">
                  {event.supervisorNames && (
                    <div>👨‍🏫 Supervisor{event.supervisorNames.includes(',') ? 's' : ''}: {event.supervisorNames}</div>
                  )}
                  <div>⚠️ Registration closes {event.cutoffHours} hours before the event</div>
                  {event.extraServices && event.extraServices.length > 0 ? (
                    <div>
                      <div className="font-medium text-neutral-dark mb-1">Available Services:</div>
                      {event.extraServices.map((service, index) => (
                        <div key={index} className="pl-2">
                          • {service.description} - {service.currency || event.servicesCurrency || 'USD'} {service.price}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>ℹ️ No additional services available</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Registration Section */}
          {!isFullyBooked && !isAfterCutoff && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsRegistrationExpanded(!isRegistrationExpanded)}
                className="flex items-center justify-between w-full text-left font-semibold text-neutral-dark mb-3 hover:text-primary-green transition-colors"
              >
                <span>Register for Event</span>
                {isRegistrationExpanded ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
              
              {isRegistrationExpanded && (
                <div className="space-y-4">
              
              {/* Show registration permissions info */}
              {(() => {
                const allowedRegistrants = event.allowedRegistrants || "attendee";
                if (allowedRegistrants === "user") {
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-600">👤</span>
                        <span className="text-sm font-medium text-blue-800">
                          This event is open to parents only
                        </span>
                      </div>
                    </div>
                  );
                } else if (allowedRegistrants === "attendee") {
                  return (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600">👶</span>
                        <span className="text-sm font-medium text-green-800">
                          This event is open to children only
                        </span>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-purple-600">👥</span>
                        <span className="text-sm font-medium text-purple-800">
                          This event is open to both parents and children
                        </span>
                      </div>
                    </div>
                  );
                }
              })()}

              {/* Person Selection - Always show all options with enabled/disabled states */}
              <div className="mb-4">
                <h6 className="font-semibold text-neutral-dark mb-2">Who is registering?</h6>
                <div className="space-y-2">
                  {/* Parent option - always visible */}
                  <div className="relative">
                    <div 
                      className={`
                        p-3 border rounded-lg cursor-pointer transition-all duration-200
                        ${isParentRegistration 
                          ? 'border-primary-green bg-green-50' 
                          : event.allowedRegistrants === "attendee"
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            : isParentRegistered()
                              ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 bg-white hover:border-primary-green hover:bg-green-50'
                        }
                      `}
                      onClick={() => {
                        if (event.allowedRegistrants !== "attendee" && !isParentRegistered()) {
                          setIsParentRegistration(true);
                          setSelectedChildId("");
                        }
                      }}
                      data-testid="option-parent-registration"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="registrant"
                          checked={isParentRegistration}
                          disabled={event.allowedRegistrants === "attendee" || isParentRegistered()}
                          readOnly
                          className="text-primary-green focus:ring-primary-green disabled:opacity-50"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-neutral-dark">
                            👤 {(user as any)?.firstName && (user as any)?.lastName ? `${(user as any).firstName} ${(user as any).lastName}` : 'Parent Registration'}
                          </div>
                          <div className="text-sm text-neutral-medium">Register yourself for this event</div>
                        </div>
                        {event.allowedRegistrants === "attendee" && (
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Not allowed</span>
                        )}
                        {isParentRegistered() && event.allowedRegistrants !== "attendee" && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Already registered</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Children options - always visible */}
                  {children.map((child) => {
                    const isChildAlreadyRegistered = isChildRegistered(child.id);
                    const isChildDisabled = event.allowedRegistrants === "user" || isChildAlreadyRegistered;
                    const isSelected = selectedChildId === child.id && !isParentRegistration;
                    
                    return (
                      <div key={child.id} className="relative">
                        <div 
                          className={`
                            p-3 border rounded-lg cursor-pointer transition-all duration-200
                            ${isSelected 
                              ? 'border-primary-green bg-green-50' 
                              : isChildDisabled
                                ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                : 'border-gray-200 bg-white hover:border-primary-green hover:bg-green-50'
                            }
                          `}
                          onClick={() => {
                            if (!isChildDisabled) {
                              setIsParentRegistration(false);
                              setSelectedChildId(child.id);
                            }
                          }}
                          data-testid={`option-child-${child.id}`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="registrant"
                              checked={isSelected}
                              disabled={isChildDisabled}
                              readOnly
                              className="text-primary-green focus:ring-primary-green disabled:opacity-50"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-neutral-dark">👶 {child.firstName} {child.lastName}</div>
                              <div className="text-sm text-neutral-medium">
                                Born: {format(new Date(child.dateOfBirth), "MMM yyyy")}
                              </div>
                            </div>
                            {isChildAlreadyRegistered && (
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Already registered</span>
                            )}
                            {event.allowedRegistrants === "user" && !isChildAlreadyRegistered && (
                              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Not allowed</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Extra Services Selection - shown regardless of selection */}
              {event.extraServices && event.extraServices.length > 0 && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h6 className="font-semibold text-neutral-dark mb-3">Extra Services (Optional)</h6>
                  <div className="space-y-2">
                    {event.extraServices.map((service, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`service-${index}`}
                          checked={selectedServices.includes(index)}
                          onChange={() => toggleService(index)}
                          className="text-primary-green focus:ring-primary-green"
                          data-testid={`checkbox-service-${index}`}
                        />
                        <label 
                          htmlFor={`service-${index}`} 
                          className="flex-1 flex justify-between items-center cursor-pointer"
                        >
                          <span className="text-sm text-neutral-dark">{service.description}</span>
                          <span className="text-sm font-medium text-primary-green">{service.currency || event.servicesCurrency || 'USD'} {service.price}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  {/* Cost Summary */}
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-dark">Base Cost:</span>
                      <span className="text-sm font-medium text-primary-green" data-testid="text-credits-cost">
                        {creditsCost} credits
                      </span>
                    </div>
                    {servicesCost > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-dark">Services Cost:</span>
                        <span className="text-sm font-medium text-blue-600" data-testid="text-services-cost">
{event.servicesCurrency || 'USD'} {servicesCost.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-sm font-semibold text-neutral-dark">Total:</span>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-primary-green">
                          {creditsCost} credits
                        </div>
                        {servicesCost > 0 && (
                          <div className="text-sm font-semibold text-blue-600">
                            + {event.servicesCurrency || 'USD'} {servicesCost.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

                <button 
                  onClick={handleRegister}
                  disabled={registerMutation.isPending || (!isParentRegistration && !selectedChildId)}
                  className="w-full bg-primary-green text-white py-3 rounded-lg font-semibold hover:bg-primary-green/90 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-register-event"
                >
                  {registerMutation.isPending ? "Registering..." : 
                    isParentRegistration 
                      ? `Register ${(user as any)?.firstName || 'Yourself'} - ${creditsCost} credits${servicesCost > 0 ? ` + ${event.servicesCurrency || 'USD'} ${servicesCost.toFixed(2)}` : ""}` 
                      : selectedChildId 
                        ? `Register Child - ${creditsCost} credits${servicesCost > 0 ? ` + ${event.servicesCurrency || 'USD'} ${servicesCost.toFixed(2)}` : ""}`
                        : "Select someone to register"
                  }
                </button>
                </div>
              )}
            </div>
          )}

          {/* Status Messages for fully booked or after cutoff */}
          {isFullyBooked && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">❌</span>
                  <span className="text-sm font-medium text-red-800">
                    This event is fully booked
                  </span>
                </div>
              </div>
            </div>
          )}

          {isAfterCutoff && !isFullyBooked && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-600">⏰</span>
                  <span className="text-sm font-medium text-yellow-800">
                    Registration deadline has passed
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}