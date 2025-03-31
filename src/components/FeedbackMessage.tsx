interface FeedbackMessageProps {
  type: 'success' | 'error';
  message: string;
  additionalMessage?: string;
}

export function FeedbackMessage({ type, message, additionalMessage }: FeedbackMessageProps) {
  const styles = {
    success: {
      container: "rounded-md bg-green-50 p-4",
      icon: "h-5 w-5 text-green-400",
      message: "text-sm text-green-700",
      additional: "mt-1 text-sm text-green-600",
      iconPath: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
    },
    error: {
      container: "rounded-md bg-red-50 p-4",
      icon: "h-5 w-5 text-red-400",
      message: "text-sm text-red-700",
      additional: "mt-1 text-sm text-red-600",
      iconPath: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
    }
  };

  const currentStyle = styles[type];

  return (
    <div className={currentStyle.container}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className={currentStyle.icon} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d={currentStyle.iconPath} clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className={currentStyle.message}>{message}</p>
          {additionalMessage && (
            <p className={currentStyle.additional}>{additionalMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
} 