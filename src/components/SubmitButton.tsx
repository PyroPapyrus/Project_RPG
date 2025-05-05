interface SubmitButtonProps {
  loading: boolean;
  disabled?: boolean;
  loadingText?: string;
  buttonText: string;
  isValid?: boolean;
}

export function SubmitButton({
  loading,
  disabled = false,
  loadingText = "Carregando...",
  buttonText,
  isValid = true
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || disabled || !isValid}
      className={`relative w-full py-2 text-lg rounded-md text-white bg-indigo-600 
        hover:bg-indigo-700 transition-all duration-200
        ${(!isValid || disabled) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
    >
      {loading ? (
        <span className="flex justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText}
        </span>
      ) : (
        buttonText
      )}
    </button>
  );
}