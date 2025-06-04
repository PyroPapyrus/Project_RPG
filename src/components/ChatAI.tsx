'use client'

export function ChatAI() {
  return (
    <>
        <div className='text-center bg-gray-600 '>
          <h1 className='text-sm font-bold text-red-600'>Chat com IA</h1>
          <p className='text-sm'>Use a IA para te auxiliar na preparação e criação de suas narrativas!</p>
        </div>

        {/* This div will stay at the bottom */}
        <div className='bg-black py-6 px-4 mx-6 mt-auto mb-2 rounded-lg'>
          <p className='text-sm text-gray-400'>Digite aqui as mensagens/prompts para a IA te auxiliar. Seja criativo! Condicione-a a criar aventuras épicas (NÃO FUNCIONAL)</p>
        </div>
    </>
  );
}