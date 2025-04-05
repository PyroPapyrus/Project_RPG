import Link from 'next/link'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">{session.user.email}</span>
              <Link
                href="/auth/signout"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-300"
              >
                Sair
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/campaigns/new"
              className="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg transition duration-300"
            >
              <h3 className="font-bold mb-2">Nova Campanha</h3>
              <p className="text-gray-300">Crie uma nova campanha de RPG</p>
            </Link>
            <Link
              href="/characters/new"
              className="bg-green-600 hover:bg-green-700 p-4 rounded-lg transition duration-300"
            >
              <h3 className="font-bold mb-2">Novo Personagem</h3>
              <p className="text-gray-300">Crie um novo personagem</p>
            </Link>
            <Link
              href="/rules"
              className="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg transition duration-300"
            >
              <h3 className="font-bold mb-2">Regras</h3>
              <p className="text-gray-300">Consulte as regras do sistema</p>
            </Link>
          </div>
        </section>

        {/* Recent Campaigns */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Campanhas Recentes</h2>
            <Link
              href="/campaigns"
              className="text-blue-400 hover:text-blue-300"
            >
              Ver todas
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Placeholder para campanhas */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Aventura no Deserto</h3>
              <p className="text-gray-300 mb-2">Última sessão: 2 dias atrás</p>
              <Link
                href="/campaigns/1"
                className="text-blue-400 hover:text-blue-300"
              >
                Continuar
              </Link>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Reino das Sombras</h3>
              <p className="text-gray-300 mb-2">Última sessão: 1 semana atrás</p>
              <Link
                href="/campaigns/2"
                className="text-blue-400 hover:text-blue-300"
              >
                Continuar
              </Link>
            </div>
          </div>
        </section>

        {/* Recent Characters */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Personagens Recentes</h2>
            <Link
              href="/characters"
              className="text-blue-400 hover:text-blue-300"
            >
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Placeholder para personagens */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Aragorn</h3>
              <p className="text-gray-300 mb-2">Nível 5 - Guerreiro</p>
              <Link
                href="/characters/1"
                className="text-blue-400 hover:text-blue-300"
              >
                Ver detalhes
              </Link>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Gandalf</h3>
              <p className="text-gray-300 mb-2">Nível 7 - Mago</p>
              <Link
                href="/characters/2"
                className="text-blue-400 hover:text-blue-300"
              >
                Ver detalhes
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
} 