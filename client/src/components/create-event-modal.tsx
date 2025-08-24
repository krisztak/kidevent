import { useState, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Search, X, ChevronDown } from "lucide-react";
import type { InsertEvent, User, ExtraService } from "@shared/schema";

interface CreateEventModalProps {
  onClose: () => void;
  onEventCreated: () => void;
}

export function CreateEventModal({ onClose, onEventCreated }: CreateEventModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "afterschool" as const,
    startTime: "",
    location: "",
    maxSeats: 5,
    remainingSeats: 5,
    creditsRequired: 0,
    staffId: "",
    duration: "5h",
    description: "",
    image: "",
    cutoffHours: 12,
    extraServices: [] as ExtraService[],
    allowedRegistrants: "attendee" as "attendee" | "user" | "both",
  });
  const [serviceCurrency, setServiceCurrency] = useState<"RON" | "EUR" | "USD">("RON");
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch staff members (admin + staff roles)
  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ["/api/admin/users/by-roles?roles=admin,staff"],
    retry: false,
  });

  // Ensure we have arrays and handle errors
  const staffMembers: User[] = Array.isArray(staffData) ? staffData : [];

  // Filter staff members based on search query
  const filteredStaffMembers = useMemo(() => {
    if (!staffSearchQuery.trim()) return staffMembers;
    
    return staffMembers.filter(staff => 
      `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      staff.email?.toLowerCase().includes(staffSearchQuery.toLowerCase())
    );
  }, [staffMembers, staffSearchQuery]);

  // Get selected staff members for display
  const selectedStaffMembers = useMemo(() => {
    return staffMembers.filter(staff => selectedStaff.includes(staff.id));
  }, [staffMembers, selectedStaff]);

  const createEventMutation = useMutation({
    mutationFn: async (eventData: InsertEvent & { staffIds: string[], guestIds: string[] }) => {
      await apiRequest("POST", "/api/admin/events", eventData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      onEventCreated();
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
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.name || !formData.startTime || !formData.location || !formData.description) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Validate that at least one staff member is selected
      if (selectedStaff.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one staff member for the event",
          variant: "destructive",
        });
        return;
      }

      // Convert startTime string to Date object
      const eventData = {
        name: formData.name,
        type: formData.type || "afterschool",
        startTime: new Date(formData.startTime),
        location: formData.location,
        maxSeats: formData.maxSeats || 3,
        remainingSeats: formData.remainingSeats || formData.maxSeats || 3,
        creditsRequired: formData.creditsRequired ?? 0,
        staffId: formData.staffId || undefined,
        duration: formData.duration || "5h",
        description: formData.description,
        image: formData.image || undefined,
        cutoffHours: formData.cutoffHours || 12,
        extraServices: formData.extraServices.map(service => ({
          ...service,
          currency: serviceCurrency
        })),
        servicesCurrency: serviceCurrency,
        allowedRegistrants: formData.allowedRegistrants,
        staffIds: selectedStaff,
        guestIds: [] // No guest attendees functionality
      };

      createEventMutation.mutate(eventData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Please check all fields and try again",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-xl sm:rounded-xl max-w-md w-full m-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-xl">
          <h3 className="text-lg font-semibold text-neutral-dark">Create New Event</h3>
          <button 
            onClick={onClose}
            className="text-neutral-medium hover:text-neutral-dark"
            data-testid="button-close-create-event-modal"
          >
            ✕
          </button>
        </div>

        {/* Create Event Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Basic Event Info */}
          <div className="space-y-4">
            <h4 className="font-medium text-neutral-dark">Event Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="eventName">
                Event Name *
              </label>
              <input 
                type="text" 
                id="eventName"
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                data-testid="input-event-name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="eventDescription">
                Description *
              </label>
              <textarea 
                id="eventDescription"
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                required 
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                data-testid="textarea-event-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="eventStartTime">
                  Start Date & Time *
                </label>
                <input 
                  type="datetime-local" 
                  id="eventStartTime"
                  value={formData.startTime || ""}
                  onChange={(e) => handleInputChange("startTime", e.target.value)}
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                  data-testid="input-event-start-time"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="eventDuration">
                  Duration
                </label>
                <select 
                  id="eventDuration"
                  value={formData.duration || "5h"}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                  data-testid="select-event-duration"
                >
                  <option value="1h">1 hour</option>
                  <option value="1.5h">1.5 hours</option>
                  <option value="2h">2 hours</option>
                  <option value="2.5h">2.5 hours</option>
                  <option value="3h">3 hours</option>
                  <option value="4h">4 hours</option>
                  <option value="5h">5 hours</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="eventLocation">
                Location *
              </label>
              <input 
                type="text" 
                id="eventLocation"
                value={formData.location || ""}
                onChange={(e) => handleInputChange("location", e.target.value)}
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                data-testid="input-event-location"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="eventMaxSeats">
                  Max Seats *
                </label>
                <input 
                  type="number" 
                  id="eventMaxSeats"
                  value={formData.maxSeats || 3}
                  onChange={(e) => {
                    const seats = Number(e.target.value);
                    handleInputChange("maxSeats", seats);
                    handleInputChange("remainingSeats", seats);
                  }}
                  min="5"
                  max="100"
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                  data-testid="input-event-max-seats"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="eventCredits">
                  Credits Required *
                </label>
                <input 
                  type="number" 
                  id="eventCredits"
                  value={formData.creditsRequired || 0}
                  onChange={(e) => handleInputChange("creditsRequired", Number(e.target.value))}
                  min="0"
                  max="100"
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                  data-testid="input-event-credits"
                />
              </div>
            </div>

            {/* Allowed Registrants Dropdown */}
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="allowedRegistrants">
                Who Can Register *
              </label>
              <select 
                id="allowedRegistrants"
                value={formData.allowedRegistrants}
                onChange={(e) => handleInputChange("allowedRegistrants", e.target.value as "attendee" | "user" | "both")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                data-testid="select-allowed-registrants"
              >
                <option value="attendee">Children (Attendees)</option>
                <option value="user">Parents (Users)</option>
                <option value="both">Children and Parents (Both)</option>
              </select>
              <p className="text-xs text-neutral-medium mt-1">
                Choose who is allowed to register for this event
              </p>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-neutral-dark">Optional Details</h4>
            


            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="eventImage">
                Image URL
              </label>
              <input 
                type="url" 
                id="eventImage"
                value={formData.image || ""}
                onChange={(e) => handleInputChange("image", e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                data-testid="input-event-image"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="eventCutoff">
                Registration Cutoff (hours)
              </label>
              <select 
                id="eventCutoff"
                value={formData.cutoffHours || 12}
                onChange={(e) => handleInputChange("cutoffHours", Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                data-testid="select-event-cutoff"
              >
                <option value="6">6 hours</option>
                <option value="12">12 hours</option>
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
              </select>
            </div>
          </div>

          {/* Extra Services Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-neutral-dark">Extra Services</h4>
              <div className="flex items-center gap-2">
                <select
                  value={serviceCurrency}
                  onChange={(e) => setServiceCurrency(e.target.value as "RON" | "EUR" | "USD")}
                  className="text-sm px-2 py-1 border border-gray-300 rounded"
                  data-testid="select-service-currency"
                >
                  <option value="RON">RON</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      extraServices: [...prev.extraServices, { description: '', price: 0 }]
                    }));
                  }}
                  className="text-sm text-primary-green hover:text-primary-green/80 font-medium"
                  data-testid="button-add-extra-service"
                >
                  + Add Service
                </button>
              </div>
            </div>
            <p className="text-xs text-neutral-medium">Define optional services with prices in {serviceCurrency} that parents can choose during registration</p>
            
            {formData.extraServices.map((service, index) => (
              <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Service description (e.g., Food, Transportation)"
                    value={service.description}
                    onChange={(e) => {
                      const updatedServices = [...formData.extraServices];
                      updatedServices[index].description = e.target.value;
                      setFormData(prev => ({ ...prev, extraServices: updatedServices }));
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    data-testid={`input-service-description-${index}`}
                  />
                </div>
                <div className="w-32 flex items-center">
                  <input
                    type="number"
                    placeholder="Price"
                    min="0"
                    step="0.01"
                    value={service.price || ''}
                    onChange={(e) => {
                      const updatedServices = [...formData.extraServices];
                      updatedServices[index].price = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({ ...prev, extraServices: updatedServices }));
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    data-testid={`input-service-price-${index}`}
                  />
                  <span className="ml-1 text-xs text-neutral-medium">{serviceCurrency}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updatedServices = formData.extraServices.filter((_, i) => i !== index);
                    setFormData(prev => ({ ...prev, extraServices: updatedServices }));
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                  data-testid={`button-remove-service-${index}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Staff Assignment */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-neutral-dark">Staff Supervising</h4>
            
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1">
                Staff Supervising *
              </label>
              <p className="text-xs text-neutral-medium mb-2">Select staff members who will supervise this event (at least one required)</p>
              
              {/* Selected Staff Display */}
              {selectedStaffMembers.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {selectedStaffMembers.map((staff) => (
                    <span
                      key={staff.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary-green/10 text-primary-green rounded text-xs"
                      data-testid={`selected-staff-${staff.id}`}
                    >
                      {staff.firstName} {staff.lastName}
                      <button
                        type="button"
                        onClick={() => setSelectedStaff(prev => prev.filter(id => id !== staff.id))}
                        className="hover:bg-primary-green/20 rounded-full p-0.5"
                        data-testid={`remove-staff-${staff.id}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Staff Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStaffDropdownOpen(!isStaffDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  data-testid="staff-dropdown-trigger"
                >
                  <span className="text-sm text-neutral-medium">
                    {isLoadingStaff ? "Loading..." : "Select staff members"}
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${isStaffDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isStaffDropdownOpen && !isLoadingStaff && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-medium" />
                        <input
                          type="text"
                          placeholder="Search staff members..."
                          value={staffSearchQuery}
                          onChange={(e) => setStaffSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-primary-green focus:border-transparent"
                          data-testid="staff-search-input"
                        />
                      </div>
                    </div>

                    {/* Staff List */}
                    <div className="max-h-48 overflow-y-auto">
                      {filteredStaffMembers.length > 0 ? (
                        filteredStaffMembers.map((staff) => (
                          <label
                            key={staff.id}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedStaff.includes(staff.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStaff(prev => [...prev, staff.id]);
                                } else {
                                  setSelectedStaff(prev => prev.filter(id => id !== staff.id));
                                }
                              }}
                              className="form-checkbox text-primary-green"
                              data-testid={`checkbox-staff-${staff.id}`}
                            />
                            <span className="text-sm flex-1">
                              {staff.firstName} {staff.lastName}
                              <span className="text-neutral-medium ml-1">({staff.role})</span>
                              {staff.email && <span className="text-neutral-medium block text-xs">{staff.email}</span>}
                            </span>
                          </label>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-neutral-medium">
                          {staffSearchQuery ? "No staff members match your search" : "No staff members available"}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Click outside to close dropdown */}
              {isStaffDropdownOpen && (
                <div
                  className="fixed inset-0 z-5"
                  onClick={() => setIsStaffDropdownOpen(false)}
                  data-testid="staff-dropdown-overlay"
                />
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 bg-gray-200 text-neutral-dark py-2 rounded-lg font-medium hover:bg-gray-300 transition duration-200"
              data-testid="button-cancel-create-event"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={createEventMutation.isPending}
              className="flex-1 bg-primary-green text-white py-2 rounded-lg font-medium hover:bg-primary-green/90 transition duration-200 disabled:opacity-50"
              data-testid="button-save-event"
            >
              {createEventMutation.isPending ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}