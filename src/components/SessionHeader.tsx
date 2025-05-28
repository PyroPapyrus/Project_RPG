// src/components/session/SessionHeader.tsx

import React from 'react';

interface SessionHeaderProps {
  name: string;
  goal: string;
  sessionDate: string;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({ name, sessionDate, goal }) => {
  return (
    <>
      <div className="flex justify-between items-center py-3 mb-3 border-b-2">
        <h1 className="text-2xl font-bold text-white">{name}</h1>
        
        <div className="text-md flex gap-2 text-white">
          
          <p>Data: {new Date(sessionDate ?? '').toLocaleDateString('pt-BR')}</p>
                            
          <p>({new Date(sessionDate ?? '').toLocaleDateString('pt-BR', {
            year: 'numeric', month: 'long', day: 'numeric'
          })})
          </p>
        </div>
        
      </div>

      <div className="rounded-md mb-4">
        <h2 className="text-center text-lg font-semibold text-white mb-1">Resumo Objetivo</h2>
        
        <div className='bg-gray-100 p-3 rounded-md'>
          {goal ? (
            <div className="text-sm text-black break-words">
              {goal}
            </div>
          ) : (
            <div className="text-md text-center text-gray-400">
              Sem resumo objetivo
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SessionHeader;
