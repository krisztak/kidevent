interface SunflowerLogoProps {
  className?: string;
}

export function SunflowerLogo({ className = "w-16 h-16" }: SunflowerLogoProps) {
  return (
    <div className={`${className} bg-primary-green rounded-full flex items-center justify-center`}>
      <svg 
        viewBox="0 0 64 64" 
        className="w-3/4 h-3/4 text-white"
        fill="currentColor"
      >
        {/* Sunflower petals */}
        <g>
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              d="M32 16 C28 12, 20 12, 20 20 C20 24, 24 28, 32 24 Z"
              transform={`rotate(${i * 45} 32 32)`}
              className="text-accent-yellow"
              fill="currentColor"
            />
          ))}
        </g>
        
        {/* Center */}
        <circle cx="32" cy="32" r="8" className="text-primary-green" fill="currentColor" />
        
        {/* Seeds pattern */}
        <g className="text-neutral-dark" fill="currentColor">
          <circle cx="30" cy="30" r="1" />
          <circle cx="34" cy="30" r="1" />
          <circle cx="30" cy="34" r="1" />
          <circle cx="34" cy="34" r="1" />
          <circle cx="32" cy="32" r="1" />
        </g>
      </svg>
    </div>
  );
}
