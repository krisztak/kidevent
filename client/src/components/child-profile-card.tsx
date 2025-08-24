import type { Child } from "@shared/schema";

interface ChildProfileCardProps {
  child: Child;
}

export function ChildProfileCard({ child }: ChildProfileCardProps) {
  const age = Math.floor((new Date().getTime() - new Date(child.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  return (
    <div className="child-card bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4" data-testid={`card-child-${child.id}`}>
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-secondary-green/20 rounded-full flex items-center justify-center">
          <span className="text-primary-green font-semibold" data-testid={`text-child-initials-${child.id}`}>
            {child.firstName[0]}{child.lastName[0]}
          </span>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-neutral-dark" data-testid={`text-child-name-${child.id}`}>
            {child.firstName} {child.lastName}
          </h4>
          <p className="text-sm text-neutral-medium" data-testid={`text-child-age-${child.id}`}>
            Age {age}
          </p>
        </div>
        <button className="text-neutral-medium hover:text-neutral-dark" data-testid={`button-edit-child-${child.id}`}>
          ✏️
        </button>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-neutral-medium">Emergency Contact:</span>
          <p className="font-medium" data-testid={`text-child-emergency-${child.id}`}>
            {child.secondaryContact}
          </p>
        </div>
        <div>
          <span className="text-neutral-medium">Dietary Restrictions:</span>
          <p className="font-medium" data-testid={`text-child-dietary-${child.id}`}>
            {child.dietaryRestrictions || "None"}
          </p>
        </div>
      </div>

      {child.allergies && (
        <div className="mt-2 text-xs">
          <span className="text-neutral-medium">Allergies:</span>
          <p className="font-medium text-red-600" data-testid={`text-child-allergies-${child.id}`}>
            {child.allergies}
          </p>
        </div>
      )}
    </div>
  );
}
