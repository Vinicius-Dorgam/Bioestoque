# Bioestoque

**Sistema de Biometria e Controle de Estoque**

Bioestoque é uma aplicação moderna para gerenciamento de biometria e controle de estoque, desenvolvida com React, Vite e Tailwind CSS.

## 🚀 Configuração Local

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Vinicius-Dorgam/Bioestoque.git
cd Bioestoque
```

2. Instale as dependências:
```bash
npm install
```

3. Crie um arquivo `.env.local` com as variáveis de ambiente:
```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 🌐 Deploy no Vercel

### Deploy Automático

1. Conecte seu repositório GitHub ao Vercel
2. O Vercel detectará automaticamente que é um projeto React/Vite
3. Configure as variáveis de ambiente no painel do Vercel
4. Faça o deploy

### Deploy Manual

```bash
npm run build
```

Envie a pasta `dist` para sua plataforma de hospedagem preferida.

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview do build local
- `npm run lint` - Verificação de código
- `npm run lint:fix` - Correção automática de lint
- `npm run typecheck` - Verificação de tipos

## 🛠️ Stack Tecnológico

- React 18
- Vite
- Tailwind CSS
- Radix UI
- React Hook Form
- TanStack Query
- Lucide React

## 📄 Licença

MIT License
