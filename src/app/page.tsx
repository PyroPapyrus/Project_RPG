import Link from 'next/link'
import Image from 'next/image'
import { Poppins } from 'next/font/google'

import './globals.css'

const poppins = Poppins({
  weight: '800',
  subsets: ['latin'],
})

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/rpg-camp-bg.png"
            alt="RPG Background"
            fill
            className="object-cover opacity-50"
            priority
          />
        </div>
        <div className="relative z-10 text-center">

          {/*<h1 className={`${poppins.className} text-9xl text-center`}>
            STORY<span className='text-blue-600 '>&</span>PLOT
          </h1>*/}

          <img src="/images/logo.png" alt="logo story&plot" className='-mb-12'/>

          <p className="text-2xl mb-10 mt-2 max-w-2xl mx-auto -mt-12">
            Gerencie as narrativas de suas campanhas e sessões, histórias e personagens de RPG em um só lugar!
          </p>

          <p className='text-lg mb-3 mx-auto'>
            Comece agora  criando a sua conta e junte-se a seus amigos
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
          <h2 className="text-4xl font-bold text-center mb-8">RECURSOS PRINCIPAIS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg">

              <div className="text-3xl mb-2 flex gap-3 items-center">
              <span className="material-symbols-rounded">stacks</span>
                <h3 className="text-[19px] font-bold ">Gestão de Campanhas</h3>
              </div>
              <p className="text-gray-300 text-[15px]">
                Crie, gerencie e personalize suas campanhas e sessões de RPG com facilidade. Mantenha o controle
                 de todas as suas histórias e informações em um só lugar.
              </p>

            </div>
            <div className="bg-gray-800 p-6 rounded-lg">

              <div className="text-3xl mb-2 flex gap-3 items-center">
              <span className="material-symbols-rounded">contract_edit</span>
                <h3 className="text-[19px] font-bold">Organize suas Histórias</h3>
              </div>
              <p className="text-gray-300 text-gray-300 text-[15px]">
                Crie e organize facilmente suas histórias através de anotações, formatações, resumos, interações com seus amigos
                 e acesso a detalhes importantes. Utilize da IA para gerar ideias e sugestões para suas histórias.
              </p>

            </div>
            <div className="bg-gray-800 p-6 rounded-lg">

              <div className="text-3xl mb-2 flex gap-3 items-center">
              <span className="material-symbols-rounded">build</span>
                <h3 className="text-[19px] font-bold">Ferramenta simples e intuitiva</h3>
              </div>
              <p className="text-gray-300 text-[15px]">
                Nossa ferramenta e suas funcionalidades são simples e intuitivas, permitindo que você se concentre na narrativa e na diversão do jogo sem dificuldades.
              </p>

            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 upper-case">COMO FUNCIONA</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
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
              <h3 className="font-bold mb-2">Monte suas sessões</h3>
              <p className="text-gray-300">Registre e organize suas sessões</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">5</span>
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
          <h2 className="text-3xl font-bold mb-6">Pronto para começar sua aventura?</h2>
          <p className="text-xl mb-8 text-gray-300">
            Junte-se a seus amigos e aventurem-se ao RPG de forma simples e intuitiva através da nossa ferramenta. 
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
          <p>&copy; {new Date().getFullYear()} Story&Plot. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}