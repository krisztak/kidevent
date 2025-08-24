import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

interface NavigationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function NavigationTabs({ activeTab, onTabChange }: NavigationTabsProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const typedUser = user as User | undefined;
  const isAdmin = typedUser?.role === "admin";
  const isStaffOrAdmin = typedUser?.role === "admin" || typedUser?.role === "staff";

  const baseTabs = [
    { id: "events", label: "Events", icon: "📅", path: "/" },
    { id: "children", label: "Children", icon: "👶", path: "/" },
    { id: "myevents", label: "My Events", icon: "🎯", path: "/" },
    { id: "credits", label: "Credits", icon: "🪙", path: "/" },
  ];

  // Add supervised events tab for staff and admin
  const staffTabs = isStaffOrAdmin ? [
    { id: "supervised", label: "Supervised Events", icon: "👨‍🏫", path: "/" },
  ] : [];

  const adminTabs = isAdmin ? [
    { id: "staff", label: "Staff", icon: "👥", path: "/" },
  ] : [];

  const settingsTabs = [
    { id: "settings", label: "Settings", icon: "⚙️", path: "/settings" },
  ];

  const tabs = [...baseTabs, ...staffTabs, ...adminTabs, ...settingsTabs];

  const handleTabClick = (tab: { id: string; path: string }) => {
    if (tab.id === "settings") {
      // Navigate to settings page
      return;
    } else {
      // Handle normal tab change for home page tabs (including staff)
      onTabChange(tab.id);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-md mx-auto px-4">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const isActive = (tab.id === "settings" && location === "/settings") ||
                           (activeTab === tab.id && location === "/");

            return tab.id === "settings" ? (
              <Link key={tab.id} href={tab.path}>
                <button
                  className={`tab-button py-3 px-1 border-b-2 font-medium text-sm transition duration-200 ${
                    isActive
                      ? "active border-primary-green text-primary-green"
                      : "border-transparent text-neutral-medium hover:text-neutral-dark"
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              </Link>
            ) : (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`tab-button py-3 px-1 border-b-2 font-medium text-sm transition duration-200 ${
                  isActive
                    ? "active border-primary-green text-primary-green"
                    : "border-transparent text-neutral-medium hover:text-neutral-dark"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
