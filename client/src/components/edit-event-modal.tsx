import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEventSchema, type EventWithSupervisor, type User } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { X, Plus, Trash2, Save, Eye } from "lucide-react";

const editEventSchema = insertEventSchema.extend({
  startTime: z.string(),
  staffIds: z.array(z.string()).optional(),
});

type EditEventFormData = z.infer<typeof editEventSchema>;

interface EditEventModalProps {
  event: EventWithSupervisor;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function EditEventModal({ event, isOpen, onClose, onSave }: EditEventModalProps) {
  const [extraServices, setExtraServices] = useState(event.extraServices || []);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staffUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users/by-roles"],
    retry: false,
  });

  const form = useForm<EditEventFormData>({
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      name: event.name,
      type: event.type,
      startTime: format(new Date(event.startTime), "yyyy-MM-dd'T'HH:mm"),
      location: event.location,
      maxSeats: event.maxSeats,
      remainingSeats: event.remainingSeats,
      creditsRequired: event.creditsRequired,
      duration: event.duration,
      description: event.description,
      image: event.image || "",
      cutoffHours: event.cutoffHours,
      servicesCurrency: event.servicesCurrency,
      allowedRegistrants: event.allowedRegistrants,
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: EditEventFormData & { action: "publish" | "save" | "delete" }) => {
      const { action, staffIds, ...eventData } = data;
      
      if (action === "delete") {
        const response = await apiRequest(`/api/admin/events/${event.id}`, "DELETE");
        return response.json();
      }

      // Update event data
      const updateResponse = await apiRequest(`/api/admin/events/${event.id}`, "PUT", {
        ...eventData,
        startTime: new Date(eventData.startTime),
        extraServices,
        staffIds,
      });

      // Update status based on action
      const newStatus = action === "publish" ? "open" : "editing";
      const statusResponse = await apiRequest(`/api/admin/events/${event.id}/status`, "PUT", { status: newStatus });
      
      return updateResponse.json();

      return updateResponse;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      
      if (variables.action === "delete") {
        toast({
          title: "Success",
          description: "Event deleted successfully",
        });
      } else {
        toast({
          title: "Success",
          description: variables.action === "publish" 
            ? "Event published successfully" 
            : "Event saved as draft",
        });
      }
      
      onSave();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (action: "publish" | "save" | "delete") => {
    if (action === "delete") {
      if (window.confirm("Are you sure you want to delete this event? This action can be undone later.")) {
        updateEventMutation.mutate({ ...form.getValues(), action });
      }
      return;
    }

    form.handleSubmit((data) => {
      updateEventMutation.mutate({ ...data, action });
    })();
  };

  const addExtraService = () => {
    setExtraServices([...extraServices, { description: "", price: 0, currency: event.servicesCurrency }]);
  };

  const removeExtraService = (index: number) => {
    setExtraServices(extraServices.filter((_, i) => i !== index));
  };

  const updateExtraService = (index: number, field: string, value: string | number) => {
    const updated = [...extraServices];
    updated[index] = { ...updated[index], [field]: value };
    setExtraServices(updated);
  };

  const staffOptions = staffUsers?.filter(user => user.role === "staff" || user.role === "admin") || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Edit Event: {event.name}</span>
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Editing Mode
            </span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-event-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-event-type" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date, Time and Location */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field} 
                        data-testid="input-event-datetime"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-event-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Capacity and Credits */}
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="maxSeats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Seats</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-max-seats"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remainingSeats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Seats</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-remaining-seats"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creditsRequired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credits Required</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-credits-required"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 2h" data-testid="input-duration" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={3}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Settings */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cutoffHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Cutoff (hours before)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-cutoff-hours"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="servicesCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Services Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-services-currency">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="RON">RON</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allowedRegistrants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Who Can Register</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-allowed-registrants">
                          <SelectValue placeholder="Select registrants" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="attendee">Children Only</SelectItem>
                        <SelectItem value="user">Parents Only</SelectItem>
                        <SelectItem value="both">Both Children & Parents</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Extra Services */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Extra Services</Label>
                <Button 
                  type="button" 
                  onClick={addExtraService}
                  size="sm"
                  variant="outline"
                  data-testid="button-add-service"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Service
                </Button>
              </div>

              {extraServices.map((service, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <Input
                    placeholder="Service description"
                    value={service.description}
                    onChange={(e) => updateExtraService(index, "description", e.target.value)}
                    className="flex-1"
                    data-testid={`input-service-description-${index}`}
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={service.price}
                    onChange={(e) => updateExtraService(index, "price", Number(e.target.value))}
                    className="w-24"
                    data-testid={`input-service-price-${index}`}
                  />
                  <Button
                    type="button"
                    onClick={() => removeExtraService(index)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    data-testid={`button-remove-service-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <Button
                type="button"
                onClick={() => handleSubmit("delete")}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                disabled={updateEventMutation.isPending}
                data-testid="button-delete-event"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Event
              </Button>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => handleSubmit("save")}
                  variant="outline"
                  disabled={updateEventMutation.isPending}
                  data-testid="button-save-for-later"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save for Later
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit("publish")}
                  disabled={updateEventMutation.isPending}
                  data-testid="button-save-and-publish"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Save & Publish
                </Button>
              </div>
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}