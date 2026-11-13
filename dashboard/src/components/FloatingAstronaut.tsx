interface Props {
  variant?: 'hero' | 'ambient';
}

export const FloatingAstronaut = ({ variant = 'hero' }: Props) => {
  return (
    <div className={`floating-astronaut floating-astronaut-${variant}`} aria-hidden="true">
      <svg viewBox="0 0 240 400" className="floating-astronaut-svg" preserveAspectRatio="xMidYMin meet">
        <defs>
          <radialGradient id="helmetVisor" cx="42%" cy="34%" r="65%">
            <stop offset="0%" stopColor="#a4efff" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#1c80c4" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#031728" stopOpacity="0.08" />
          </radialGradient>
          <radialGradient id="visorGlass" cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#cff8ff" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#1e6fa8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#02101e" stopOpacity="0.05" />
          </radialGradient>
          <linearGradient id="suitBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4ecff4" stopOpacity="0.4" />
            <stop offset="55%" stopColor="#1c74a8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#062436" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="suitRim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(140, 225, 255, 0.9)" />
            <stop offset="50%" stopColor="rgba(90, 190, 235, 0.5)" />
            <stop offset="100%" stopColor="rgba(140, 225, 255, 0.9)" />
          </linearGradient>
          <filter id="astroGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Backpack rim behind helmet */}
        <ellipse cx="120" cy="118" rx="92" ry="70"
          fill="rgba(18, 60, 100, 0.35)"
          stroke="rgba(120, 200, 255, 0.28)" strokeWidth="1.4" />

        <g filter="url(#astroGlow)">
          {/* Suit shoulders */}
          <path
            d="M 26 300 Q 30 235 78 210 Q 96 200 120 200 Q 144 200 162 210 Q 210 235 214 300 L 218 400 L 22 400 Z"
            fill="url(#suitBody)"
            stroke="url(#suitRim)"
            strokeWidth="2.2"
          />

          {/* Chest plate */}
          <rect x="86" y="248" width="68" height="52" rx="7"
            fill="rgba(15, 55, 92, 0.75)"
            stroke="rgba(160, 230, 255, 0.55)" strokeWidth="1.4" />

          {/* Status indicator dots */}
          <circle cx="103" cy="272" r="4" fill="rgba(255, 200, 90, 0.95)" />
          <circle cx="120" cy="272" r="4" fill="rgba(130, 240, 200, 0.95)" />
          <circle cx="137" cy="272" r="4" fill="rgba(140, 220, 255, 0.95)" />

          {/* Data lines */}
          <line x1="96" y1="284" x2="144" y2="284" stroke="rgba(140, 220, 255, 0.4)" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="96" y1="290" x2="128" y2="290" stroke="rgba(140, 220, 255, 0.35)" strokeWidth="1.3" strokeLinecap="round" />

          {/* Tube on sides */}
          <path d="M 55 230 Q 40 280 55 340" stroke="rgba(140, 220, 255, 0.4)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M 185 230 Q 200 280 185 340" stroke="rgba(140, 220, 255, 0.4)" strokeWidth="1.6" fill="none" strokeLinecap="round" />

          {/* Helmet outer */}
          <ellipse cx="120" cy="112" rx="76" ry="86"
            fill="url(#helmetVisor)"
            stroke="rgba(155, 230, 255, 0.8)"
            strokeWidth="2.4" />

          {/* Helmet visor glass */}
          <ellipse cx="120" cy="120" rx="60" ry="66"
            fill="url(#visorGlass)"
            stroke="rgba(190, 245, 255, 0.55)"
            strokeWidth="1.4" />

          {/* Visor reflection highlight */}
          <ellipse cx="96" cy="96" rx="22" ry="12"
            fill="rgba(220, 250, 255, 0.4)"
            transform="rotate(-32 96 96)" />
          <ellipse cx="88" cy="88" rx="8" ry="4"
            fill="rgba(255, 255, 255, 0.6)"
            transform="rotate(-32 88 88)" />

          {/* Helmet trim */}
          <path d="M 46 130 Q 60 200 120 205 Q 180 200 194 130"
            fill="none" stroke="rgba(140, 225, 255, 0.55)" strokeWidth="1.8" />

          {/* Side antenna */}
          <circle cx="46" cy="80" r="4" fill="rgba(140, 225, 255, 0.6)" />
          <line x1="46" y1="80" x2="46" y2="60" stroke="rgba(140, 225, 255, 0.5)" strokeWidth="1.4" />
        </g>
      </svg>
    </div>
  );
};