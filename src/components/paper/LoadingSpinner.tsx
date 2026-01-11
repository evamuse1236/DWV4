interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * Loading spinner component with optional message
 * Can be displayed full screen or inline
 */
export function LoadingSpinner({ message = "Loading...", fullScreen = true }: LoadingSpinnerProps) {
  const content = (
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {content}
      </div>
    );
  }

  return content;
}

export default LoadingSpinner;
