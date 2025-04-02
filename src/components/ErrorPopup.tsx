interface ErrorPopupProps {
  message: string;
  onClose: () => void;
}

export function ErrorPopup({ message, onClose }: ErrorPopupProps) {
  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Erro!</strong>
        <span className="block sm:inline"> {message}</span>
      </div>
    </div>
  );
} 