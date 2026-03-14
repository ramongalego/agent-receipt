type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-16 text-center shadow-sm">
      {icon && <div className="mb-5 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
