interface CloseModalButtonProps {
  onClose: () => void;
}

export function CloseModalButton({ onClose }: CloseModalButtonProps) {
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