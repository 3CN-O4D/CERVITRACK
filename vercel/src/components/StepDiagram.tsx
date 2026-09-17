interface StepDiagramProps {
  step: number;
  className?: string;
}

export default function StepDiagram({ step, className = '' }: StepDiagramProps) {
  const common = {
    viewBox: '0 0 200 120',
    role: 'img',
    'aria-hidden': true,
    className: `h-auto w-full ${className}`,
  } as const;

  switch (step) {
    case 1:
      return (
        <svg {...common}>
          <rect width="200" height="120" rx="12" fill="#F6F3FF" />
          <path d="M70 78c0-10 8-18 18-18s18 8 18 18v6H70z" fill="#6C5CE7" opacity="0.15" />
          <path d="M78 58v-10M88 58V44M98 58v-10" stroke="#6C5CE7" strokeWidth="3" strokeLinecap="round" />
          <circle cx="78" cy="44" r="3" fill="#6C5CE7" />
          <circle cx="88" cy="38" r="3" fill="#6C5CE7" />
          <circle cx="98" cy="44" r="3" fill="#6C5CE7" />
          <path d="M120 50c6-6 14-6 20 0" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
          <circle cx="60" cy="60" r="4" fill="#6C5CE7" opacity="0.4" />
          <circle cx="112" cy="66" r="4" fill="#6C5CE7" opacity="0.4" />
        </svg>
      );
    case 2:
      return (
        <svg {...common}>
          <rect width="200" height="120" rx="12" fill="#F6F3FF" />
          <rect x="42" y="42" width="52" height="42" rx="6" fill="#fff" stroke="#6C5CE7" strokeWidth="3" />
          <path d="M42 52h52" stroke="#6C5CE7" strokeWidth="3" />
          <path d="M60 42l6-12 6 12" fill="#6C5CE7" />
          <rect x="112" y="44" width="10" height="40" rx="4" fill="#fff" stroke="#94A3B8" strokeWidth="3" />
          <path d="M140 54h26M140 66h26" stroke="#6C5CE7" strokeWidth="4" strokeLinecap="round" />
          <circle cx="132" cy="84" r="6" fill="#fff" stroke="#6C5CE7" strokeWidth="3" />
        </svg>
      );
    case 3:
      return (
        <svg {...common}>
          <rect width="200" height="120" rx="12" fill="#F6F3FF" />
          <circle cx="78" cy="30" r="10" fill="#6C5CE7" opacity="0.25" />
          <path d="M78 40v34" stroke="#6C5CE7" strokeWidth="4" strokeLinecap="round" opacity="0.25" />
          <path d="M78 50l-12 26M78 50l12 26" stroke="#6C5CE7" strokeWidth="4" strokeLinecap="round" opacity="0.2" />
          <path d="M96 74l24-24" stroke="#6C5CE7" strokeWidth="4" strokeLinecap="round" />
          <path d="M118 52l8-8" stroke="#94A3B8" strokeWidth="5" strokeLinecap="round" />
          <path d="M126 44l6 6" stroke="#6C5CE7" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 4:
      return (
        <svg {...common}>
          <rect width="200" height="120" rx="12" fill="#F6F3FF" />
          <path d="M100 44v34" stroke="#6C5CE7" strokeWidth="5" strokeLinecap="round" />
          <circle cx="100" cy="40" r="6" fill="#6C5CE7" />
          <path d="M72 61a28 28 0 0 1 56 0" fill="none" stroke="#6C5CE7" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 6" />
          <path d="M128 61l6-6M128 61l-2-8" stroke="#6C5CE7" strokeWidth="4" strokeLinecap="round" />
          <path d="M128 90a28 28 0 0 1-56 0" fill="none" stroke="#6C5CE7" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 6" opacity="0.5" />
        </svg>
      );
    case 5:
      return (
        <svg {...common}>
          <rect width="200" height="120" rx="12" fill="#F6F3FF" />
          <rect x="88" y="30" width="24" height="70" rx="8" fill="#fff" stroke="#6C5CE7" strokeWidth="3" />
          <rect x="88" y="72" width="24" height="28" rx="6" fill="#6C5CE7" opacity="0.25" />
          <path d="M100 34v34" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="30" r="5" fill="#6C5CE7" />
          <path d="M84 70h32" stroke="#6C5CE7" strokeWidth="3" strokeDasharray="4 3" />
          <path d="M130 66l14 8-14 8" fill="none" stroke="#6C5CE7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 6:
      return (
        <svg {...common}>
          <rect width="200" height="120" rx="12" fill="#F6F3FF" />
          <rect x="60" y="30" width="24" height="70" rx="8" fill="#fff" stroke="#6C5CE7" strokeWidth="3" />
          <rect x="60" y="26" width="24" height="12" rx="4" fill="#6C5CE7" />
          <rect x="64" y="52" width="16" height="16" rx="3" fill="#F6F3FF" stroke="#6C5CE7" strokeWidth="2" />
          <path d="M104 40h44v52h-44z" fill="#fff" stroke="#94A3B8" strokeWidth="3" strokeLinejoin="round" />
          <path d="M104 40l8-8h36l8 8" fill="none" stroke="#94A3B8" strokeWidth="3" strokeLinejoin="round" />
          <path d="M148 58h-44" stroke="#94A3B8" strokeWidth="2" />
          <circle cx="126" cy="78" r="6" fill="none" stroke="#6C5CE7" strokeWidth="3" />
          <path d="M132 66l-6 8-4-3" fill="none" stroke="#6C5CE7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
