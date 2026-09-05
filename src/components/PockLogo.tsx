import React, { useMemo } from 'react';

export interface PockLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'card';
  variant?: 'desktop' | 'mobile';
  theme?: 'light' | 'dark' | 'auto';
  showWordmark?: boolean;
  showCard?: boolean;
  className?: string;
}

export const PockLogo: React.FC<PockLogoProps> = ({
  size = 'md',
  variant = 'desktop',
  theme = 'auto',
  showWordmark = false,
  showCard = false,
  className = '',
}) => {
  // Resolve effective theme
  const isDark = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    if (typeof document !== 'undefined') {
      return !document.documentElement.classList.contains('light');
    }
    return true;
  }, [theme]);

  const isDesktop = variant === 'desktop';

  // Palette from user specification
  const colors = isDark
    ? {
        cardBg: '#092224',
        cardBorder: 'rgba(20, 184, 166, 0.35)',
        coinGradientId: `coin-gold-dark-${variant}`,
        coinRim: '#06423E',
        coinSymbol: '#063834',
        shineRays: '#35D0BA',
        pocketFill: '#043A37',
        pocketStroke: '#00BFA5',
        pocketHem: '#00BFA5',
        stitching: '#FFFFFF',
        titleText: '#FFFFFF',
        subText: '#5EEAD4',
      }
    : {
        cardBg: '#FFFFFF',
        cardBorder: 'rgba(226, 232, 240, 0.9)',
        coinGradientId: `coin-gold-light-${variant}`,
        coinRim: '#08423E',
        coinSymbol: '#08423E',
        shineRays: '#00A896',
        pocketFill: '#FFFFFF',
        pocketStroke: '#08423E',
        pocketHem: '#08423E',
        stitching: '#08423E',
        titleText: '#111827',
        subText: '#64748B',
      };

  // If showCard is requested, render the standalone app icon card (512x512 canvas proportion)
  if (showCard || size === 'card') {
    const cardScale = isDesktop ? 1.0 : 1.12;
    const cardYOffset = isDesktop ? 0 : -8;

    return (
      <div className={`relative inline-block select-none ${className}`}>
        <svg
          viewBox="0 0 512 512"
          className="w-full h-full max-w-[512px] drop-shadow-xl rounded-[24%]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id={colors.coinGradientId} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="65%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </radialGradient>
          </defs>

          {/* Squircle Card Background */}
          <rect
            x="24"
            y="24"
            width="464"
            height="464"
            rx="118"
            fill={colors.cardBg}
            stroke={colors.cardBorder}
            strokeWidth="3"
          />

          {/* Inner Pocket + Coin + Wordmark Group */}
          <g transform={`translate(256, ${256 + cardYOffset}) scale(${cardScale}) translate(-256, -256)`}>
            {/* Sparkle shine rays */}
            <line x1="324" y1="126" x2="338" y2="112" stroke={colors.shineRays} strokeWidth="7" strokeLinecap="round" />
            <line x1="344" y1="148" x2="358" y2="134" stroke={colors.shineRays} strokeWidth="7" strokeLinecap="round" />

            {/* Peeking Gold Colón Coin */}
            <circle cx="256" cy="176" r="56" fill={`url(#${colors.coinGradientId})`} stroke={colors.coinRim} strokeWidth="7" />
            <circle cx="256" cy="176" r="47" fill="none" stroke="#FDE047" strokeWidth="1.8" strokeOpacity="0.8" />
            
            {/* ₡ Symbol */}
            <path
              d="M 272 159 C 242 159, 234 170, 234 176 C 234 182, 242 193, 272 193"
              fill="none"
              stroke={colors.coinSymbol}
              strokeWidth="7.5"
              strokeLinecap="round"
            />
            <line x1="256" y1="150" x2="256" y2="202" stroke={colors.coinSymbol} strokeWidth="6.5" strokeLinecap="round" />

            {/* Pocket Body */}
            <path
              d="M 160 206 L 352 206 L 346 304 C 342 354, 298 386, 256 394 C 214 386, 170 354, 166 304 Z"
              fill={colors.pocketFill}
              stroke={colors.pocketStroke}
              strokeWidth="11"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Pocket Folded Cuff */}
            <rect x="154" y="196" width="204" height="22" rx="10" fill={colors.pocketHem} />

            {/* Pocket Stitching */}
            <path
              d="M 180 232 L 180 300 C 183 340, 218 368, 256 374 C 294 368, 329 340, 332 300 L 332 232"
              fill="none"
              stroke={colors.stitching}
              strokeWidth="5"
              strokeDasharray="8 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Wordmark typography */}
            <text
              x="256"
              y="432"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontSize="34"
              fontWeight="800"
              letterSpacing="-0.5"
              fill={colors.titleText}
            >
              Pock
            </text>
            <text
              x="256"
              y="456"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontSize="16"
              fontWeight="500"
              letterSpacing="0.2"
              fill={colors.subText}
            >
              Mi bolsillo
            </text>
          </g>
        </svg>
      </div>
    );
  }

  // Sizing definitions for in-app header/sidebar badge
  const sizeMap = {
    sm: { box: 'w-8 h-8 rounded-xl', icon: 28, text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'w-10 h-10 rounded-xl', icon: 34, text: 'text-base', sub: 'text-[10px]' },
    lg: { box: 'w-12 h-12 rounded-2xl', icon: 42, text: 'text-lg', sub: 'text-xs' },
    xl: { box: 'w-16 h-16 rounded-[22px]', icon: 54, text: 'text-2xl', sub: 'text-sm' },
    card: { box: 'w-24 h-24 rounded-3xl', icon: 80, text: 'text-2xl', sub: 'text-sm' },
  };

  const current = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Icon Emblem (App Icon Squircle) */}
      <div
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        }}
        className={`${current.box} border shadow-sm shrink-0 select-none flex items-center justify-center relative overflow-hidden transition-colors duration-200`}
      >
        <svg
          width={current.icon}
          height={current.icon}
          viewBox="0 0 256 256"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          <defs>
            <radialGradient id={`${colors.coinGradientId}-emblem`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="65%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </radialGradient>
          </defs>

          {/* Group centered */}
          <g transform={isDesktop ? 'translate(0, 8)' : 'scale(1.08) translate(-9, 4)'}>
            {/* Shine Rays */}
            <line x1="162" y1="62" x2="170" y2="54" stroke={colors.shineRays} strokeWidth="4.5" strokeLinecap="round" />
            <line x1="174" y1="74" x2="182" y2="66" stroke={colors.shineRays} strokeWidth="4.5" strokeLinecap="round" />

            {/* Peeking Coin */}
            <circle
              cx="128"
              cy="90"
              r="34"
              fill={`url(#${colors.coinGradientId}-emblem)`}
              stroke={colors.coinRim}
              strokeWidth="4.5"
            />
            {/* Coin ₡ */}
            <path
              d="M 137 80 C 120 80, 115 86, 115 90 C 115 94, 120 100, 137 100"
              fill="none"
              stroke={colors.coinSymbol}
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <line x1="128" y1="74" x2="128" y2="106" stroke={colors.coinSymbol} strokeWidth="3.8" strokeLinecap="round" />

            {/* Pocket Pouch Body */}
            <path
              d="M 72 108 L 184 108 L 180 166 C 177 198, 152 216, 128 221 C 104 216, 79 198, 76 166 Z"
              fill={colors.pocketFill}
              stroke={colors.pocketStroke}
              strokeWidth="7"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Pocket Top Cuff */}
            <rect x="68" y="101" width="120" height="14" rx="7" fill={colors.pocketHem} />

            {/* Pocket U-Stitches */}
            <path
              d="M 85 124 L 85 162 C 87 186, 107 202, 128 206 C 149 202, 169 186, 171 162 L 171 124"
              fill="none"
              stroke={colors.stitching}
              strokeWidth="3.2"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      {/* Optional Wordmark */}
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center">
            <span
              style={{ color: colors.titleText }}
              className={`font-extrabold tracking-tight ${current.text} transition-colors duration-200`}
            >
              Pock
            </span>
            <span
              style={{ color: colors.shineRays }}
              className="font-black leading-none ml-0.5 text-base"
            >
              .
            </span>
          </div>
          <span
            style={{ color: colors.subText }}
            className={`${current.sub} font-semibold tracking-wider uppercase mt-0.5 transition-colors duration-200`}
          >
            MI BOLSILLO
          </span>
        </div>
      )}
    </div>
  );
};
