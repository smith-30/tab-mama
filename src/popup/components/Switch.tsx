import { motion } from 'framer-motion';
import { useMemo } from 'preact/hooks';

interface Props {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

const spring = { type: 'spring', stiffness: 500, damping: 35 } as const;

export function Switch({ checked, onChange, disabled }: Props) {
  const trackStyle = useMemo(() => ({ background: checked ? '#22c55e' : '#3f3f46' }), [checked]);
  const thumbStyle = useMemo(() => ({ marginLeft: checked ? '26px' : '2px' }), [checked]);

  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className="relative inline-flex h-7 w-14 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
      style={trackStyle}
    >
      <motion.span
        layout
        transition={spring}
        className="block h-5 w-5 rounded-full bg-white shadow-md"
        style={thumbStyle}
      />
    </button>
  );
}
