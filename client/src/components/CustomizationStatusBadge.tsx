import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface CustomizationStatusBadgeProps {
  status: 'complete' | 'partial' | 'not_setup';
  className?: string;
}

export function CustomizationStatusBadge({ status, className }: CustomizationStatusBadgeProps) {
  const statusConfig = {
    complete: {
      icon: CheckCircle2,
      label: 'Complete',
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    },
    partial: {
      icon: AlertCircle,
      label: 'Partial',
      variant: 'secondary' as const,
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    },
    not_setup: {
      icon: XCircle,
      label: 'Not Setup',
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className || ''}`}
      data-testid={`badge-customization-status-${status}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}
