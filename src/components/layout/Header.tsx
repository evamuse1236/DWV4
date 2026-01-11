interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

/**
 * Page header component with title, subtitle, and optional actions
 */
export function Header({ title, subtitle, actions }: HeaderProps) {
  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          ) : (
            <p className="text-sm text-gray-500 mt-0.5">{dateString}</p>
          )}
        </div>

        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}

export default Header;
