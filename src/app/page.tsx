import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/bg-exemplo.jpg"
            alt="RPG Background"
            fill
            className="object-cover opacity-50"
            priority
          />
        </div>
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6">
            Sistema de RPG
          </h1>
          <p className="text-xl sm:text-2xl mb-8 max-w-2xl mx-auto">
            Gerencie suas campanhas, personagens e histórias em um só lugar
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
              prefetch={false}
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
              prefetch={false}
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Recursos Principais</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-blue-500 text-4xl mb-4">🎲</div>
              <h3 className="text-xl font-bold mb-2">Gerenciamento de Campanhas</h3>
              <p className="text-gray-300">
                Crie e gerencie suas campanhas de RPG com facilidade. Mantenha o controle de todas as suas histórias em um só lugar.
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-blue-500 text-4xl mb-4">👤</div>
              <h3 className="text-xl font-bold mb-2">Criação de Personagens</h3>
              <p className="text-gray-300">
                Desenvolva personagens detalhados com fichas personalizáveis. Mantenha o histórico de seus personagens organizado.
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-blue-500 text-4xl mb-4">📚</div>
              <h3 className="text-xl font-bold mb-2">Biblioteca de Regras</h3>
              <p className="text-gray-300">
                Acesse regras e referências rapidamente. Mantenha todas as informações importantes ao alcance dos dedos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Como Funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="font-bold mb-2">Crie sua Conta</h3>
              <p className="text-gray-300">Registro rápido e simples</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="font-bold mb-2">Inicie uma Campanha</h3>
              <p className="text-gray-300">Configure sua primeira aventura</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="font-bold mb-2">Adicione seus Amigos</h3>
              <p className="text-gray-300">Desenvolva suas histórias juntos</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">4</span>
              </div>
              <h3 className="font-bold mb-2">Comece a Jogar</h3>
              <p className="text-gray-300">Aventure-se!</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para Começar sua Aventura?</h2>
          <p className="text-xl mb-8 text-gray-300">
            Junte-se a milhares de jogadores e mestres que já estão usando nosso sistema
          </p>
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 inline-block"
            prefetch={false}
          >
            Começar Agora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Sistema de RPG. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
} 