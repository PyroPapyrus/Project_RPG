# Gerenciador de Campanhas de RPG

Uma aplicação web para gerenciar suas campanhas de RPG, construída com Next.js e Supabase.

## Tecnologias Utilizadas

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase

## Pré-requisitos

- Node.js 18.17 ou superior
- npm ou yarn

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:
```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

5. Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.