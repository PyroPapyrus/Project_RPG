// src/components/session/SessionSummary.tsx

import { useState } from 'react';

interface SessionSummaryProps {
  initialSummary: string;
  onSave: (newSummary: string) => void;
}

export default function SessionSummary({ initialSummary, onSave }: SessionSummaryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [summary, setSummary] = useState(initialSummary);

  const handleSave = () => {
    onSave(summary);
    setIsEditing(false);
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Resumo da Sessão</h3>
      {isEditing ? (
        <div>
          <textarea
            className="w-full border border-gray-300 rounded p-2"
            rows={5}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          <div className="mt-2 flex space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Salvar
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-700 whitespace-pre-line">{summary || 'Nenhum resumo disponível.'}</p>
          <button
            onClick={() => setIsEditing(true)}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Editar Resumo
          </button>
        </div>
      )}
    </div>
  );
}
