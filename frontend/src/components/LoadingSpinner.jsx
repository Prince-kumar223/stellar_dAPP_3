import { LoaderCircle } from 'lucide-react';

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

const LoadingSpinner = ({ size = 'md', label = 'Loading' }) => {
  return (
    <span className="inline-flex items-center gap-2 text-slate-300" role="status" aria-live="polite">
      <LoaderCircle className={`${sizes[size] || sizes.md} animate-spin`} aria-hidden="true" />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
};

export default LoadingSpinner;
