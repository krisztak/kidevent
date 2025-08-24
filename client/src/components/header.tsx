import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

export function Header() {
  const { user } = useAuth();
  const typedUser = user as User | undefined;

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const getFullName = (firstName?: string, lastName?: string) => {
    const name = [firstName, lastName].filter(Boolean).join(" ");
    return name || "User";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-green rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm" data-testid="text-user-initials">
              {getInitials(typedUser?.firstName, typedUser?.lastName)}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-neutral-dark" data-testid="text-user-name">
              {getFullName(typedUser?.firstName, typedUser?.lastName)}
            </h2>
            <p className="text-xs text-neutral-medium">
              {typedUser?.role === "admin" ? "Admin" : "Parent"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="text-neutral-medium hover:text-neutral-dark" data-testid="button-notifications">
            🔔
          </button>
          <button 
            onClick={handleLogout}
            className="text-neutral-medium hover:text-neutral-dark text-sm"
            data-testid="button-logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
