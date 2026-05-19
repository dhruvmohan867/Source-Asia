// ============================================================
// Empty State Component
// ============================================================

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '✈️', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="text-5xl mb-4" role="img" aria-label="empty state icon">
        {icon}
      </span>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted text-sm max-w-md mb-6">{description}</p>
      {action}
    </div>
  );
}
