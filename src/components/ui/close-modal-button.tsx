interface CloseModalButtonProps {
  onClose: () => void;
  className?: string;
}

export function CloseModalButton({ onClose, className }: CloseModalButtonProps) {
  return (
    <button 
      className="font-bold hover:text-gray-300 transition-colors"
      onClick={onClose} 
      aria-label="Fechar"
    >
      ✕
    </button>
  );
}