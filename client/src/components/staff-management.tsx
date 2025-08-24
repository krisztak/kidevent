import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, Crown, Shield, User } from "lucide-react";

interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
}

export function StaffManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role: newRole });
    },
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "User role has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter and sort users
  const filteredUsers = (users as StaffUser[])
    .filter((user: StaffUser) => {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const phone = user.phone?.toLowerCase() || "";
      return fullName.includes(searchLower) || phone.includes(searchLower);
    })
    .sort((a: StaffUser, b: StaffUser) => {
      // Sort by role priority: admin, staff, user
      const roleOrder = { admin: 0, staff: 1, user: 2 };
      const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 3;
      const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 3;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      // If same role, sort by name
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case "staff":
        return <Shield className="w-4 h-4 text-blue-600" />;
      case "user":
        return <User className="w-4 h-4 text-gray-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "staff":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "user":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const handleRoleChange = (newRole: string) => {
    if (!selectedUser) return;
    
    updateRoleMutation.mutate({
      userId: selectedUser.id,
      newRole,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-primary-green" />
          <h2 className="text-xl font-bold text-neutral-dark">Staff Management</h2>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-primary-green" />
        <h2 className="text-xl font-bold text-neutral-dark">Staff Management</h2>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Search by name or phone number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="input-search-users"
        />
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm ? "No users found matching your search." : "No users found."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user: StaffUser) => (
            <Card
              key={user.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedUser?.id === user.id
                  ? "ring-2 ring-primary-green border-primary-green"
                  : "hover:border-gray-300"
              }`}
              onClick={() => setSelectedUser(user)}
              data-testid={`card-user-${user.id}`}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <div>
                        <h3 className="font-semibold text-neutral-dark text-sm" data-testid={`text-username-${user.id}`}>
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-xs text-neutral-medium" data-testid={`text-email-${user.id}`}>
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-xs text-neutral-medium" data-testid={`text-phone-${user.id}`}>
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Role Change Dialog */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-green" />
                Change User Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-neutral-medium mb-2">User:</p>
                <p className="font-semibold text-neutral-dark">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-sm text-neutral-medium">{selectedUser.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-neutral-medium mb-2">Current Role:</p>
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(selectedUser.role)}`}>
                  {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                </div>
              </div>

              <div>
                <p className="text-sm text-neutral-medium mb-2">New Role:</p>
                <Select onValueChange={handleRoleChange} data-testid="select-new-role">
                  <SelectTrigger>
                    <SelectValue placeholder="Select new role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1"
                  data-testid="button-cancel-role-change"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}