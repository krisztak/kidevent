import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertChildSchema } from "@shared/schema";
import type { InsertChild } from "@shared/schema";

interface AddChildModalProps {
  onClose: () => void;
  onChildAdded: () => void;
}

export function AddChildModal({ onClose, onChildAdded }: AddChildModalProps) {
  const [formData, setFormData] = useState<Partial<InsertChild>>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    secondaryContact: "",
    gender: "",
    dietaryRestrictions: "",
    allergies: "",
    medicineNeeds: "",
    otherNotes: "",
  });
  const { toast } = useToast();

  const createChildMutation = useMutation({
    mutationFn: async (childData: InsertChild) => {
      await apiRequest("POST", "/api/children", childData);
    },
    onSuccess: () => {
      onChildAdded();
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
        description: error.message || "Failed to add child",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate required fields and convert date
      const childData: InsertChild = {
        parentId: "", // This will be set by the server
        firstName: formData.firstName!,
        lastName: formData.lastName!,
        dateOfBirth: formData.dateOfBirth!,
        secondaryContact: formData.secondaryContact!,
        gender: formData.gender || undefined,
        dietaryRestrictions: formData.dietaryRestrictions || undefined,
        allergies: formData.allergies || undefined,
        medicineNeeds: formData.medicineNeeds || undefined,
        otherNotes: formData.otherNotes || undefined,
      };

      createChildMutation.mutate(childData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof InsertChild, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-xl sm:rounded-xl max-w-md w-full m-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-xl">
          <h3 className="text-lg font-semibold text-neutral-dark">Add Child Profile</h3>
          <button 
            onClick={onClose}
            className="text-neutral-medium hover:text-neutral-dark"
            data-testid="button-close-add-child-modal"
          >
            ✕
          </button>
        </div>

        {/* Add Child Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Required Fields */}
          <div className="space-y-4">
            <h4 className="font-medium text-neutral-dark">Required Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="firstName">
                First Name
              </label>
              <input 
                type="text" 
                id="firstName"
                value={formData.firstName || ""}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                data-testid="input-child-first-name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="lastName">
                Last Name
              </label>
              <input 
                type="text" 
                id="lastName"
                value={formData.lastName || ""}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                data-testid="input-child-last-name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="dateOfBirth">
                Date of Birth
              </label>
              <input 
                type="date" 
                id="dateOfBirth"
                value={formData.dateOfBirth || ""}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                data-testid="input-child-date-of-birth"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="secondaryContact">
                Secondary Contact
              </label>
              <input 
                type="text" 
                id="secondaryContact"
                value={formData.secondaryContact || ""}
                onChange={(e) => handleInputChange("secondaryContact", e.target.value)}
                placeholder="Name and phone number"
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                data-testid="input-child-secondary-contact"
              />
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-neutral-dark">Optional Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="gender">
                Gender
              </label>
              <select 
                id="gender"
                value={formData.gender || ""}
                onChange={(e) => handleInputChange("gender", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                data-testid="select-child-gender"
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="dietaryRestrictions">
                Dietary Restrictions
              </label>
              <textarea 
                id="dietaryRestrictions"
                value={formData.dietaryRestrictions || ""}
                onChange={(e) => handleInputChange("dietaryRestrictions", e.target.value)}
                rows={2}
                placeholder="Any food allergies or dietary requirements..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                data-testid="textarea-child-dietary-restrictions"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="allergies">
                Allergies
              </label>
              <textarea 
                id="allergies"
                value={formData.allergies || ""}
                onChange={(e) => handleInputChange("allergies", e.target.value)}
                rows={2}
                placeholder="Any known allergies..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                data-testid="textarea-child-allergies"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="medicineNeeds">
                Medicine Needs
              </label>
              <textarea 
                id="medicineNeeds"
                value={formData.medicineNeeds || ""}
                onChange={(e) => handleInputChange("medicineNeeds", e.target.value)}
                rows={2}
                placeholder="Any regular medications or medical needs..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                data-testid="textarea-child-medicine-needs"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="otherNotes">
                Other Notes
              </label>
              <textarea 
                id="otherNotes"
                value={formData.otherNotes || ""}
                onChange={(e) => handleInputChange("otherNotes", e.target.value)}
                rows={3}
                placeholder="Any other important information about your child..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent form-input"
                data-testid="textarea-child-other-notes"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 bg-gray-200 text-neutral-dark py-2 rounded-lg font-medium hover:bg-gray-300 transition duration-200"
              data-testid="button-cancel-add-child"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={createChildMutation.isPending}
              className="flex-1 bg-primary-green text-white py-2 rounded-lg font-medium hover:bg-primary-green/90 transition duration-200 disabled:opacity-50"
              data-testid="button-save-child"
            >
              {createChildMutation.isPending ? "Adding..." : "Add Child"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
