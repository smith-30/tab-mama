import { motion } from 'framer-motion';
import { useMemo } from 'preact/hooks';

interface Props {
  enabled: boolean;
  loading: boolean;
  onToggle: () => void;
}

const tapTransition = { type: 'spring', stiffness: 400, damping: 25 } as const;
const tapScale = { scale: 0.92 } as const;

export function PowerButton({ enabled, loading, onToggle }: Props) {
  const buttonStyle = useMemo(
    () => ({
      borderColor: enabled ? 'var(--power-on-border)' : 'var(--power-off-border)',
      background: enabled ? 'var(--power-on-bg)' : 'var(--power-off-bg)',
      boxShadow: enabled ? 'var(--power-on-shadow)' : 'none',
      transition: 'border-color 0.3s, background 0.3s, box-shadow 0.3s',
    }),
    [enabled],
  );

  return (
    <motion.button
      onClick={onToggle}
      disabled={loading}
      whileTap={tapScale}
      transition={tapTransition}
      aria-pressed={enabled}
      className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      style={buttonStyle}
    >
      {enabled && (
        <span className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-20" />
      )}
      <PowerIcon enabled={enabled} />
    </motion.button>
  );
}

function PowerIcon({ enabled }: { enabled: boolean }) {
  const iconStyle = useMemo(
    () => ({
      color: enabled ? 'var(--power-on-icon)' : 'var(--power-off-icon)',
      transition: 'color 0.3s',
    }),
    [enabled],
  );

  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={iconStyle}
    >
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}
