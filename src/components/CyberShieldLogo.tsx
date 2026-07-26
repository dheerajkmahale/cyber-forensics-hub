const CyberShieldLogo = ({ size = 120 }: { size?: number }) => {
  return (
    <div className="relative flex items-center justify-center animate-float">
      {/* Outer rotating ring */}
      <div
        className="absolute animate-rotate-slow"
        style={{ width: size * 1.6, height: size * 1.6 }}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle
            cx="50"
            cy="50"
            r="48"
            stroke="hsl(155 100% 50% / 0.3)"
            strokeWidth="0.5"
            strokeDasharray="4 3"
          />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <circle
              key={i}
              cx={50 + 48 * Math.cos((angle * Math.PI) / 180)}
              cy={50 + 48 * Math.sin((angle * Math.PI) / 180)}
              r="1.5"
              fill="hsl(155 100% 50%)"
            />
          ))}
        </svg>
      </div>

      {/* Inner counter-rotating ring */}
      <div
        className="absolute"
        style={{
          width: size * 1.3,
          height: size * 1.3,
          animation: "rotate-slow 15s linear infinite reverse",
        }}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle
            cx="50"
            cy="50"
            r="48"
            stroke="hsl(185 100% 55% / 0.25)"
            strokeWidth="0.5"
            strokeDasharray="2 6"
          />
        </svg>
      </div>

      {/* Main shield */}
      <div
        className="relative animate-shield-pulse"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Shield body */}
          <path
            d="M50 5L10 22V55C10 78 28 98 50 108C72 98 90 78 90 55V22L50 5Z"
            fill="url(#shieldGrad)"
            stroke="hsl(155 100% 50%)"
            strokeWidth="1.5"
          />
          {/* Shield inner */}
          <path
            d="M50 14L17 29V55C17 74 32 92 50 100C68 92 83 74 83 55V29L50 14Z"
            fill="url(#shieldInner)"
            stroke="hsl(155 100% 50% / 0.4)"
            strokeWidth="0.5"
          />
          {/* Lock icon */}
          <rect x="35" y="56" width="30" height="24" rx="3" fill="hsl(155 100% 50%)" opacity="0.9" />
          <path
            d="M40 56V48C40 41 60 41 60 48V56"
            stroke="hsl(155 100% 50%)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="50" cy="66" r="4" fill="hsl(220 20% 6%)" />
          <rect x="48.5" y="66" width="3" height="8" rx="1.5" fill="hsl(220 20% 6%)" />
          {/* Scan lines on shield */}
          <line x1="20" y1="42" x2="80" y2="42" stroke="hsl(185 100% 55% / 0.3)" strokeWidth="0.5" />
          <line x1="18" y1="50" x2="82" y2="50" stroke="hsl(185 100% 55% / 0.2)" strokeWidth="0.5" />
          <line x1="17" y1="58" x2="83" y2="58" stroke="hsl(185 100% 55% / 0.15)" strokeWidth="0.5" />

          <defs>
            <linearGradient id="shieldGrad" x1="50" y1="5" x2="50" y2="108" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(155 100% 15% / 0.9)" />
              <stop offset="100%" stopColor="hsl(220 20% 6% / 0.95)" />
            </linearGradient>
            <linearGradient id="shieldInner" x1="50" y1="14" x2="50" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(155 100% 50% / 0.08)" />
              <stop offset="100%" stopColor="hsl(185 100% 55% / 0.04)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

export default CyberShieldLogo;
