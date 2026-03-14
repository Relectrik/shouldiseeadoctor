export function LoadingState({ message = "Loading your care dashboard..." }: { message?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
