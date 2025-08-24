import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import type { User } from "@shared/schema";

interface UserProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
}

export default function Settings() {
  const { user } = useAuth();
  const typedUser = user as User | undefined;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<UserProfileForm>({
    firstName: typedUser?.firstName || "",
    lastName: typedUser?.lastName || "",
    email: typedUser?.email || "",
    phone: typedUser?.phone || "",
    dateOfBirth: typedUser?.dateOfBirth ? new Date(typedUser.dateOfBirth).toISOString().split('T')[0] : "",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: UserProfileForm) => {
      // Convert date string to Date object for backend
      const dataToSend = {
        ...profileData,
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : undefined,
      };
      await apiRequest("PUT", "/api/profile", dataToSend);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof UserProfileForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isProfileComplete = () => {
    return !!(typedUser?.firstName && typedUser?.lastName && typedUser?.email && typedUser?.phone);
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header with Back Button */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Link href="/">
            <button className="text-neutral-medium hover:text-neutral-dark" data-testid="button-back-home">
              ← Back
            </button>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-dark">Account Settings</h1>
        </div>
      </div>

      <div className="p-4">
        
        {/* Profile Completion Status */}
        <div className={`p-4 rounded-lg mb-6 ${
          isProfileComplete() 
            ? "bg-green-50 border border-green-200" 
            : "bg-yellow-50 border border-yellow-200"
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {isProfileComplete() ? "✅" : "⚠️"}
            </span>
            <div>
              <p className={`font-medium ${
                isProfileComplete() ? "text-green-800" : "text-yellow-800"
              }`}>
                {isProfileComplete() ? "Profile Complete" : "Profile Incomplete"}
              </p>
              <p className={`text-sm ${
                isProfileComplete() ? "text-green-600" : "text-yellow-600"
              }`}>
                {isProfileComplete() 
                  ? "You can create child profiles and register for events."
                  : "Please complete all required fields to add children and register for events."
                }
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="firstName">
              First Name *
            </label>
            <input 
              type="text" 
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              data-testid="input-first-name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="lastName">
              Last Name *
            </label>
            <input 
              type="text" 
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              data-testid="input-last-name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="email">
              Email *
            </label>
            <input 
              type="email" 
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              data-testid="input-email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="phone">
              Phone *
            </label>
            <input 
              type="tel" 
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              required 
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              data-testid="input-phone"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-1" htmlFor="dateOfBirth">
              Date of Birth
            </label>
            <input 
              type="date" 
              id="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              data-testid="input-date-of-birth"
            />
          </div>

          <button 
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="w-full bg-primary-green text-white py-3 rounded-lg font-medium hover:bg-primary-green/90 transition duration-200 disabled:opacity-50"
            data-testid="button-save-profile"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
          </button>
        </form>

        {/* Account Information */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-neutral-dark mb-4">Account Information</h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-neutral-medium">Account Role</p>
              <p className="font-medium text-neutral-dark">{typedUser?.role === "admin" ? "Admin" : "Parent"}</p>
            </div>
            
            <div>
              <p className="text-sm text-neutral-medium">Member Since</p>
              <p className="font-medium text-neutral-dark">
                {typedUser?.createdAt ? new Date(typedUser.createdAt).toLocaleDateString() : "Unknown"}
              </p>
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button 
            onClick={() => window.location.href = "/api/logout"}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition duration-200"
            data-testid="button-logout-settings"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}