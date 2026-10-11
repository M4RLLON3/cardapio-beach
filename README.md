# 🏖️ Cardápio Digital Beach House (PWA + Cloudflare Pages)

Aplicativo oficial de **Cardápio Digital PWA** da **Beach House Sports N' Bar**, integrado à infraestrutura Serverless da **Cloudflare Pages** e ao ecossistema do **Beach Tennis Pro**.

---

## 🚀 Tecnologias Utilizadas
- **React 18** + **Vite 6** + **Tailwind CSS**
- **PWA (Progressive Web App)**: Service Worker com suporte offline e instalação instantânea em iOS/Android/Desktop.
- **Cloudflare Pages**: Hospedagem global no Edge com SSL gratuito e alta disponibilidade.
- **Autenticação via CNPJ**: Integração direta com a API e banco Cloudflare D1 do Beach Tennis Pro (`beach-tennis-app`).

---

## 📱 Instalação como App (PWA)
1. Acesse o cardápio no navegador do smartphone ou computador.
2. No iOS (Safari), toque no botão **Compartilhar** e selecione **Adicionar à Tela de Início**.
3. No Android/Chrome, toque em **Instalar Aplicativo** no banner ou menu.

---

## 🔐 Acesso à Área do Lojista (Painel Administrativo)
Para gerenciar produtos, pedidos e relatórios:
1. Acesse a rota `/#admin` (ou `/admin`).
2. Digite o **CNPJ** e a **Senha** cadastrados da Loja/Arena.
3. Se a loja ainda não estiver cadastrada, use a aba **Solicitar Acesso (Cadastrar Loja)** para enviar a solicitação diretamente à área de administração geral do **Beach Tennis Pro**. Assim que o Administrador Geral aprovar a loja, o acesso ao catálogo de produtos e pedidos será liberado automaticamente.

---

## 🛠️ Comandos de Desenvolvimento e Deploy

### Rodar Localmente
```bash
npm install
npm run dev
```

### Compilar para Produção
```bash
npm run build
```

### Publicar no Cloudflare Pages
```bash
npx wrangler pages deploy dist --project-name beachhousecardapio
```

---

## 🌐 URLs Oficiais
- **Cardápio Digital na Cloudflare:** [https://beachhousecardapio.pages.dev](https://beachhousecardapio.pages.dev)
- **Repositório GitHub:** [https://github.com/M4RLLON3/cardapio-beach](https://github.com/M4RLLON3/cardapio-beach)
