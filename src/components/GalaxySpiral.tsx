import React from "react";

interface GalaxySpiralProps {
  size?: number;
  className?: string;
  animate?: boolean;
  color?: string;
}

const GalaxySpiral: React.FC<GalaxySpiralProps> = ({ 
  size = 100, 
  className = "", 
  animate = true,
  color = "currentColor" 
}) => {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className={animate ? "animate-spin-slow" : ""}
        style={{ animationDuration: animate ? "20s" : undefined }}
      >
        <defs>
          <radialGradient id="galaxyGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#e0e7ff" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.3" />
          </radialGradient>
          
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="30%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.1" />
          </radialGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Spiral arms */}
        <g filter="url(#glow)">
          {/* Main spiral arm */}
          <path
            d="M 100 100 Q 120 80 140 90 Q 160 100 170 130 Q 180 160 160 180 Q 140 200 110 190 Q 80 180 60 160 Q 40 140 50 110 Q 60 80 90 70 Q 120 60 150 70"
            stroke="url(#galaxyGradient)"
            strokeWidth="3"
            fill="none"
            opacity="0.8"
          />
          
          {/* Secondary spiral arm */}
          <path
            d="M 100 100 Q 80 120 60 110 Q 40 100 30 70 Q 20 40 40 20 Q 60 0 90 10 Q 120 20 140 40 Q 160 60 150 90 Q 140 120 110 130 Q 80 140 50 130"
            stroke="url(#galaxyGradient)"
            strokeWidth="2.5"
            fill="none"
            opacity="0.6"
          />

          {/* Tertiary spiral arm */}
          <path
            d="M 100 100 Q 110 70 130 60 Q 150 50 170 60 Q 190 70 190 100 Q 190 130 170 150 Q 150 170 120 170 Q 90 170 70 150 Q 50 130 50 100 Q 50 70 70 50"
            stroke="url(#galaxyGradient)"
            strokeWidth="2"
            fill="none"
            opacity="0.4"
          />
        </g>

        {/* Stars scattered throughout */}
        <g opacity="0.8">
          <circle cx="75" cy="60" r="1" fill="#ffffff" />
          <circle cx="135" cy="75" r="1.5" fill="#e0e7ff" />
          <circle cx="160" cy="120" r="1" fill="#8b5cf6" />
          <circle cx="65" cy="140" r="1" fill="#ffffff" />
          <circle cx="125" cy="160" r="1.5" fill="#e0e7ff" />
          <circle cx="45" cy="85" r="1" fill="#8b5cf6" />
          <circle cx="175" cy="55" r="1" fill="#ffffff" />
          <circle cx="85" cy="175" r="1.5" fill="#e0e7ff" />
          <circle cx="155" cy="45" r="1" fill="#8b5cf6" />
          <circle cx="35" cy="165" r="1" fill="#ffffff" />
        </g>

        {/* Central bright core - more visible sphere */}
        <circle 
          cx="100" 
          cy="100" 
          r="15" 
          fill="url(#centerGlow)" 
          filter="url(#glow)"
        />
        
        {/* Central nucleus - enhanced visibility */}
        <circle 
          cx="100" 
          cy="100" 
          r="8" 
          fill="#fbbf24" 
          opacity="1"
        />
      </svg>
    </div>
  );
};

export default GalaxySpiral;
