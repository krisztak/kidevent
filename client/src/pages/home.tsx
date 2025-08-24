import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { NavigationTabs } from "@/components/navigation-tabs";
import { EventCard } from "@/components/event-card";
import { ChildProfileCard } from "@/components/child-profile-card";
import { EventDetailModal } from "@/components/event-detail-modal";
import { AddChildModal } from "@/components/add-child-modal";
import { CreateEventModal } from "@/components/create-event-modal";
import { MyEvents } from "@/components/my-events";
import { StaffManagement } from "@/components/staff-management";
import { SupervisedEvents } from "@/components/supervised-events";
import { AdminEventManagement } from "@/components/admin-event-management";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { EventWithSupervisor, Child, User } from "@shared/schema";
import { isUserProfileComplete } from "@shared/schema";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("events");
  const [selectedEvent, setSelectedEvent] = useState<EventWithSupervisor | null>(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventSortBy, setEventSortBy] = useState<"startTime" | "createdAt">("startTime");
  const { toast } = useToast();
  const { user } = useAuth();
  const typedUser = user as User | undefined;
  const isAdmin = typedUser?.role === "admin";

  const { data: events, isLoading: eventsLoading, error: eventsError } = useQuery<EventWithSupervisor[]>({
    queryKey: isAdmin ? ["/api/admin/events"] : ["/api/events"],
    retry: false,
  });

  const { data: children, isLoading: childrenLoading, error: childrenError, refetch: refetchChildren } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    retry: false,
  });

  // Sort events based on selected criteria
  const sortedEvents = useMemo(() => {
    if (!events) return [];
    
    return [...events].sort((a, b) => {
      if (eventSortBy === "startTime") {
        // Sort by due date/time (startTime) - upcoming first
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      } else {
        // Sort by creation time (createdAt) - newest first
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });
  }, [events, eventSortBy]);

  // Handle unauthorized errors
  useEffect(() => {
    if (childrenError && isUnauthorizedError(childrenError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [childrenError, toast]);

  const handleEventClick = (event: EventWithSupervisor) => {
    setSelectedEvent(event);
  };

  const handleCloseEventModal = () => {
    setSelectedEvent(null);
  };

  const handleAddChild = () => {
    // Check if user profile is complete before showing modal
    if (!isUserProfileComplete(typedUser)) {
      toast({
        title: "Complete Your Profile",
        description: "Please fill in your name, email, and phone number in Account Settings before adding children.",
        variant: "destructive",
      });
      return;
    }
    setShowAddChild(true);
  };

  const handleCloseAddChild = () => {
    setShowAddChild(false);
  };

  const handleChildAdded = () => {
    refetchChildren();
    setShowAddChild(false);
    toast({
      title: "Success",
      description: "Child profile created successfully!",
    });
  };

  const handleCreateEvent = () => {
    setShowCreateEvent(true);
  };

  const handleCloseCreateEvent = () => {
    setShowCreateEvent(false);
  };

  const handleEventCreated = () => {
    setShowCreateEvent(false);
  };

  const renderEventsTab = () => {
    if (eventsLoading) {
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

    if (eventsError) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠</span>
          </div>
          <h3 className="text-lg font-semibold text-neutral-dark mb-2">Error Loading Events</h3>
          <p className="text-neutral-medium">Please try again later</p>
        </div>
      );
    }

    if (!events || events.length === 0) {
      return (
        <div className="text-center py-12" data-testid="no-events">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">📅</span>
          </div>
          <h3 className="text-lg font-semibold text-neutral-dark mb-2">No Events Available</h3>
          <p className="text-neutral-medium">Check back soon for new activities!</p>
        </div>
      );
    }

    if (isAdmin) {
      return <AdminEventManagement />;
    }

    return (
      <div className="space-y-4">
        {/* Sort Controls */}
        <div className="flex items-center justify-end gap-2 mb-2">
          <div className="flex items-center gap-1 text-xs text-neutral-medium">
            <ArrowUpDown className="w-3 h-3" />
            <span>Sort:</span>
          </div>
          <Select
            value={eventSortBy}
            onValueChange={(value: "startTime" | "createdAt") => setEventSortBy(value)}
            data-testid="select-event-sort"
          >
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="startTime" data-testid="sort-by-due-date">Due Date</SelectItem>
              <SelectItem value="createdAt" data-testid="sort-by-creation-time">Created</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Admin Create Event Button */}
        {isAdmin && (
          <div className="bg-primary-green/10 border-2 border-dashed border-primary-green rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-primary-green rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">+</span>
            </div>
            <h3 className="font-semibold text-neutral-dark mb-2">Create New Event</h3>
            <p className="text-neutral-medium text-sm mb-4">Add a new afterschool activity for children</p>
            <button 
              onClick={handleCreateEvent}
              className="bg-primary-green text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-green/90 transition duration-200"
              data-testid="button-create-event"
            >
              Create Event
            </button>
          </div>
        )}
        
        {sortedEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onClick={() => handleEventClick(event)}
          />
        ))}
      </div>
    );
  };

  const renderChildrenTab = () => {
    if (childrenLoading) {
      return (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!children || children.length === 0) {
      return (
        <div className="text-center py-12" data-testid="no-children">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">👶</span>
          </div>
          <h3 className="text-lg font-semibold text-neutral-dark mb-2">No Children Added</h3>
          <p className="text-neutral-medium mb-4">Add your first child to get started</p>
          <button 
            onClick={handleAddChild}
            className="bg-primary-green text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-green/90 transition duration-200"
            data-testid="button-add-first-child"
          >
            Add Child
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {children.map((child) => (
          <ChildProfileCard key={child.id} child={child} />
        ))}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "events":
        return (
          <div className="p-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-neutral-dark mb-2">Upcoming Activities</h3>
              <p className="text-sm text-neutral-medium">Discover fun afterschool programs for your child</p>
            </div>
            {renderEventsTab()}
          </div>
        );
      case "children":
        return (
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-neutral-dark">My Children</h3>
                <p className="text-sm text-neutral-medium">Manage your children's profiles</p>
              </div>
              {children && children.length > 0 && (
                <button 
                  onClick={handleAddChild}
                  className="bg-primary-green text-white p-2 rounded-lg hover:bg-primary-green/90 transition duration-200"
                  data-testid="button-add-child"
                >
                  <span className="text-lg">+</span>
                </button>
              )}
            </div>
            {renderChildrenTab()}
          </div>
        );
      case "myevents":
        return (
          <div className="p-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-neutral-dark">My Events</h3>
              <p className="text-sm text-neutral-medium">View your registered events</p>
            </div>
            <MyEvents />
          </div>
        );
      case "credits":
        return (
          <div className="p-4">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">🪙</span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-dark mb-2">Credits System</h3>
              <p className="text-neutral-medium">Coming soon in a future update!</p>
            </div>
          </div>
        );
      case "supervised":
        return (
          <div className="p-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-neutral-dark mb-2">Supervised Events</h3>
              <p className="text-sm text-neutral-medium">Events you are supervising as staff</p>
            </div>
            <SupervisedEvents />
          </div>
        );
      case "staff":
        return (
          <div className="p-4">
            <StaffManagement />
          </div>
        );
      case "settings":
        // Redirect to dedicated settings page
        window.location.href = "/settings";
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="max-w-md mx-auto bg-white min-h-screen">
        {renderTabContent()}
      </main>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          children={children || []}
          onClose={handleCloseEventModal}
        />
      )}

      {showAddChild && (
        <AddChildModal
          onClose={handleCloseAddChild}
          onChildAdded={handleChildAdded}
        />
      )}

      {showCreateEvent && (
        <CreateEventModal
          onClose={handleCloseCreateEvent}
          onEventCreated={handleEventCreated}
        />
      )}
    </div>
  );
}
