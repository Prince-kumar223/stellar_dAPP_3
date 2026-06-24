import { CheckCircle2, CircleDot, Clock3 } from 'lucide-react';

const statusStyles = {
  Pending: {
    className: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
    icon: Clock3,
  },
  Reviewed: {
    className: 'border-sky-300/25 bg-sky-300/10 text-sky-100',
    icon: CircleDot,
  },
  Resolved: {
    className: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100',
    icon: CheckCircle2,
  },
};

const StatusBadge = ({ status = 'Pending' }) => {
  const normalized = status || 'Pending';
  const config = statusStyles[normalized] || statusStyles.Pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${config.className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {normalized}
    </span>
  );
};

export default StatusBadge;
