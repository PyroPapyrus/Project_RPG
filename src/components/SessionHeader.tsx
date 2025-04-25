// src/components/session/SessionHeader.tsx

import React from 'react';

interface SessionHeaderProps {
  name: string;
  sessionDate: string;
  goal: string;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({ name, sessionDate, goal }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{name}</h1>
      <p className="text-sm text-gray-500 mb-4">
        Data da Sessão: {new Date(sessionDate).toLocaleString('pt-BR')}
      </p>
      <div className="bg-gray-100 p-4 rounded-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Objetivo</h2>
        <p className="text-gray-600">{goal}</p>
      </div>
    </div>
  );
};

export default SessionHeader;
