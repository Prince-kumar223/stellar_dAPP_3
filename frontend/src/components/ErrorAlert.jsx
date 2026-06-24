import { AlertCircle } from 'lucide-react';

const ErrorAlert = ({ title = 'Error', message }) => {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
      <div>
        {title && <p className="font-semibold text-rose-50">{title}</p>}
        <p className={title ? 'mt-1 text-rose-100/85' : ''}>{message}</p>
      </div>
    </div>
  );
};

export default ErrorAlert;
