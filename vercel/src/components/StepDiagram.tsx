interface StepDiagramProps {
  step: number;
  className?: string;
}

const BG = <rect width="320" height="200" rx="16" fill="#F6F3FF" />;
const PURPLE = '#6C5CE7';
const SLATE = '#94A3B8';

export default function StepDiagram({ step, className = '' }: StepDiagramProps) {
  const common = {
    viewBox: '0 0 320 200',
    role: 'img',
    'aria-hidden': true,
    className: `h-auto w-full ${className}`,
  } as const;

  switch (step) {
    case 1:
      return (
        <svg {...common}>
          {BG}
          <path d="M150 44h34v16" fill="none" stroke={SLATE} strokeWidth="7" strokeLinecap="round" />
          <path d="M184 60v18" stroke={PURPLE} strokeWidth="5" strokeLinecap="round" strokeDasharray="4 6" />
          <path d="M124 44h26" stroke={SLATE} strokeWidth="7" strokeLinecap="round" />
          <circle cx="184" cy="92" r="4" fill={PURPLE} opacity="0.6" />
          <circle cx="184" cy="110" r="4" fill={PURPLE} opacity="0.4" />
          <path d="M104 162c0-22 20-40 44-40s44 18 44 40v6h-88z" fill={PURPLE} opacity="0.16" />
          <path d="M116 130v-16M132 124V104M148 122V100M164 126v-20" stroke={PURPLE} strokeWidth="6" strokeLinecap="round" />
          <circle cx="116" cy="110" r="5" fill={PURPLE} />
          <circle cx="132" cy="100" r="5" fill={PURPLE} />
          <circle cx="148" cy="96" r="5" fill={PURPLE} />
          <circle cx="164" cy="102" r="5" fill={PURPLE} />
          <circle cx="86" cy="104" r="8" fill="none" stroke={PURPLE} strokeWidth="3" opacity="0.5" />
          <circle cx="214" cy="118" r="10" fill="none" stroke={PURPLE} strokeWidth="3" opacity="0.5" />
          <circle cx="230" cy="96" r="6" fill="none" stroke={PURPLE} strokeWidth="3" opacity="0.4" />
          <text x="160" y="190" textAnchor="middle" fontSize="11" fill={SLATE}>Wash for 20 seconds, then dry</text>
        </svg>
      );
    case 2:
      return (
        <svg {...common}>
          {BG}
          <rect x="52" y="58" width="96" height="80" rx="10" fill="#fff" stroke={PURPLE} strokeWidth="5" />
          <path d="M52 80h96" stroke={PURPLE} strokeWidth="5" />
          <path d="M88 58l12-22 12 22" fill={PURPLE} opacity="0.85" />
          <rect x="188" y="60" width="20" height="78" rx="8" fill="#fff" stroke={SLATE} strokeWidth="5" />
          <rect x="188" y="60" width="20" height="20" rx="6" fill={SLATE} opacity="0.4" />
          <path d="M236 84h46M236 104h46" stroke={PURPLE} strokeWidth="6" strokeLinecap="round" />
          <path d="M236 84c0-16 46-16 46 0" fill="none" stroke={PURPLE} strokeWidth="3" strokeDasharray="5 5" opacity="0.5" />
          <circle cx="216" cy="150" r="10" fill="#fff" stroke={PURPLE} strokeWidth="4" />
          <text x="160" y="190" textAnchor="middle" fontSize="11" fill={SLATE}>Do not touch the swab tip</text>
        </svg>
      );
    case 3:
      return (
        <svg {...common}>
          {BG}
          <circle cx="128" cy="44" r="16" fill={PURPLE} opacity="0.25" />
          <path d="M128 62v60" stroke={PURPLE} strokeWidth="7" strokeLinecap="round" opacity="0.25" />
          <path d="M128 80l-22 46M128 80l22 46" stroke={PURPLE} strokeWidth="7" strokeLinecap="round" opacity="0.2" />
          <path d="M156 132l46-46" stroke={PURPLE} strokeWidth="7" strokeLinecap="round" />
          <path d="M198 90l14-14" stroke={SLATE} strokeWidth="9" strokeLinecap="round" />
          <path d="M210 78l12 12" stroke={PURPLE} strokeWidth="7" strokeLinecap="round" />
          <path d="M180 168h64" stroke={SLATE} strokeWidth="3" strokeDasharray="6 6" />
          <text x="212" y="186" textAnchor="middle" fontSize="11" fill={SLATE}>2-3 inches (5-7 cm)</text>
        </svg>
      );
    case 4:
      return (
        <svg {...common}>
          {BG}
          <path d="M160 58v70" stroke={PURPLE} strokeWidth="9" strokeLinecap="round" />
          <circle cx="160" cy="52" r="10" fill={PURPLE} />
          <path d="M110 94a50 50 0 0 1 100 0" fill="none" stroke={PURPLE} strokeWidth="6" strokeLinecap="round" strokeDasharray="9 8" />
          <path d="M210 94l10-9M210 94l-3-13" stroke={PURPLE} strokeWidth="6" strokeLinecap="round" />
          <path d="M210 140a50 50 0 0 1-100 0" fill="none" stroke={PURPLE} strokeWidth="6" strokeLinecap="round" strokeDasharray="9 8" opacity="0.5" />
          <text x="160" y="188" textAnchor="middle" fontSize="11" fill={SLATE}>Rotate gently for 15-30 seconds</text>
        </svg>
      );
    case 5:
      return (
        <svg {...common}>
          {BG}
          <rect x="132" y="42" width="36" height="120" rx="12" fill="#fff" stroke={PURPLE} strokeWidth="5" />
          <rect x="132" y="110" width="36" height="52" rx="10" fill={PURPLE} opacity="0.25" />
          <path d="M150 48v58" stroke={SLATE} strokeWidth="6" strokeLinecap="round" />
          <circle cx="150" cy="42" r="8" fill={PURPLE} />
          <path d="M126 108h48" stroke={PURPLE} strokeWidth="4" strokeDasharray="6 5" />
          <path d="M204 100l22 12-22 12" fill="none" stroke={PURPLE} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <text x="160" y="188" textAnchor="middle" fontSize="11" fill={SLATE}>Snap the swab at the marked line</text>
        </svg>
      );
    case 6:
      return (
        <svg {...common}>
          {BG}
          <rect x="72" y="40" width="34" height="110" rx="12" fill="#fff" stroke={PURPLE} strokeWidth="5" />
          <rect x="72" y="34" width="34" height="18" rx="6" fill={PURPLE} />
          <rect x="78" y="72" width="22" height="22" rx="4" fill="#F6F3FF" stroke={PURPLE} strokeWidth="3" />
          <path d="M140 54h84v84h-84z" fill="#fff" stroke={SLATE} strokeWidth="5" strokeLinejoin="round" />
          <path d="M140 54l14-16h56l14 16" fill="none" stroke={SLATE} strokeWidth="5" strokeLinejoin="round" />
          <path d="M224 78h-84" stroke={SLATE} strokeWidth="3" />
          <circle cx="182" cy="112" r="10" fill="none" stroke={PURPLE} strokeWidth="5" />
          <path d="M192 94l-10 14-6-5" fill="none" stroke={PURPLE} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="160" y="188" textAnchor="middle" fontSize="11" fill={SLATE}>Label it, then seal the biohazard bag</text>
        </svg>
      );
    case 7:
      return (
        <svg {...common}>
          {BG}
          <path d="M40 150h240" stroke={SLATE} strokeWidth="5" strokeLinecap="round" />
          <rect x="70" y="86" width="80" height="64" rx="8" fill="#fff" stroke={SLATE} strokeWidth="4" />
          <path d="M70 106h80" stroke={SLATE} strokeWidth="3" />
          <rect x="96" y="118" width="28" height="20" rx="4" fill={PURPLE} opacity="0.25" stroke={PURPLE} strokeWidth="3" />
          <path d="M210 70v70" stroke={PURPLE} strokeWidth="7" strokeLinecap="round" />
          <circle cx="210" cy="146" r="16" fill={PURPLE} opacity="0.2" stroke={PURPLE} strokeWidth="5" />
          <path d="M210 138v-6" stroke={PURPLE} strokeWidth="6" strokeLinecap="round" />
          <circle cx="264" cy="70" r="18" fill="none" stroke={PURPLE} strokeWidth="5" />
          <path d="M264 52v-8M264 88v8M246 70h-8M282 70h8M251 57l-6-6M277 83l6 6M277 57l6-6M251 83l-6 6" stroke={PURPLE} strokeWidth="4" strokeLinecap="round" />
          <path d="M252 58l24 24" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />
          <text x="160" y="188" textAnchor="middle" fontSize="11" fill={SLATE}>Room temperature — no heat, no freezing</text>
        </svg>
      );
    case 8:
      return (
        <svg {...common}>
          {BG}
          <rect x="30" y="70" width="60" height="80" rx="8" fill="#fff" stroke={SLATE} strokeWidth="4" />
          <path d="M30 88h60" stroke={SLATE} strokeWidth="3" />
          <rect x="46" y="98" width="28" height="20" rx="4" fill={PURPLE} opacity="0.25" stroke={PURPLE} strokeWidth="3" />
          <path d="M100 110h58" stroke={PURPLE} strokeWidth="7" strokeLinecap="round" />
          <path d="M158 110l-14-10M158 110l-14 10" stroke={PURPLE} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="176" y="60" width="96" height="90" rx="8" fill="#fff" stroke={PURPLE} strokeWidth="4" />
          <path d="M176 84h96" stroke={PURPLE} strokeWidth="4" />
          <path d="M218 104v34M201 121h34" stroke={PURPLE} strokeWidth="7" strokeLinecap="round" />
          <path d="M72 40a28 28 0 1 1 0 56 28 28 0 0 1 0-56z" fill="#fff" stroke={PURPLE} strokeWidth="4" />
          <path d="M72 48v16l12 8" fill="none" stroke={PURPLE} strokeWidth="5" strokeLinecap="round" />
          <text x="160" y="188" textAnchor="middle" fontSize="11" fill={SLATE}>Return within 25 days — hand it to a health worker</text>
        </svg>
      );
    case 9:
      return (
        <svg {...common}>
          {BG}
          <rect x="70" y="34" width="180" height="132" rx="10" fill="#fff" stroke={SLATE} strokeWidth="4" />
          <rect x="128" y="26" width="64" height="18" rx="6" fill={SLATE} opacity="0.5" />
          {[60, 88, 116, 144].map((y, i) => (
            <g key={y}>
              <rect x="88" y={y - 10} width="24" height="24" rx="6" fill={i < 2 ? '#DCFCE7' : '#FEE2E2'} stroke={i < 2 ? '#22C55E' : '#EF4444'} strokeWidth="3" />
              {i < 2 ? (
                <path d={`M94 ${y}l5 5 8-9`} fill="none" stroke="#16A34A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d={`M94 ${y - 3}l12 12M106 ${y - 3}l-12 12`} stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" />
              )}
              <rect x="128" y={y - 6} width="100" height="12" rx="6" fill={SLATE} opacity="0.25" />
            </g>
          ))}
          <text x="160" y="188" textAnchor="middle" fontSize="11" fill={SLATE}>Check the label, seal, and timing</text>
        </svg>
      );
    case 10:
      return (
        <svg {...common}>
          {BG}
          <rect x="26" y="74" width="58" height="54" rx="8" fill="#fff" stroke={PURPLE} strokeWidth="4" />
          <path d="M26 88h58" stroke={PURPLE} strokeWidth="3" />
          <rect x="40" y="96" width="28" height="18" rx="4" fill={PURPLE} opacity="0.25" stroke={PURPLE} strokeWidth="3" />
          <path d="M92 100h34" stroke={SLATE} strokeWidth="5" strokeLinecap="round" />
          <path d="M126 100l-11-8M126 100l-11 8" stroke={SLATE} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M168 74h34l20 27-20 27h-34z" fill="#fff" stroke={PURPLE} strokeWidth="4" strokeLinejoin="round" />
          <path d="M180 96h22a10 10 0 0 1 0 20h-22z" fill={PURPLE} opacity="0.2" stroke={PURPLE} strokeWidth="3" />
          <path d="M232 100h30" stroke={SLATE} strokeWidth="5" strokeLinecap="round" />
          <path d="M262 100l-11-8M262 100l-11 8" stroke={SLATE} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="272" y="70" width="30" height="60" rx="6" fill="#fff" stroke={PURPLE} strokeWidth="4" />
          <path d="M280 84h14M280 96h14M280 108h10" stroke={PURPLE} strokeWidth="4" strokeLinecap="round" />
          <text x="160" y="188" textAnchor="middle" fontSize="11" fill={SLATE}>Sample → laboratory → results in the app</text>
        </svg>
      );
    default:
      return null;
  }
}
