# 🚀 Guia de Configuração do Supabase (Inox Luxury Store)

Este guia explica passo a passo como configurar o Supabase como o backend completo da loja.

---

## 1. Criar o Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e faça login (ou crie sua conta gratuita).
2. Clique no botão **"New Project"**.
3. Preencha os dados:
   - **Name:** `inox-store` (ou o nome da sua marca)
   - **Database Password:** Escolha uma senha segura e guarde-a
   - **Region:** Selecione `South America (São Paulo)` para menor latência
4. Clique em **"Create new project"** e aguarde cerca de 1 a 2 minutos.

---

## 2. Executar o Script de Banco de Dados e Seed
Criamos um script SQL completo e pronto com todas as tabelas, índices de alta performance, triggers de timestamp, políticas de segurança (RLS) e o catálogo de joias em aço inox 316L já cadastrado:

1. No menu lateral esquerdo do painel do Supabase, clique em **SQL Editor** (ícone `>_`).
2. Clique em **"+ New Query"**.
3. Abra o arquivo [`supabase/schema_and_seed.sql`](./schema_and_seed.sql) deste repositório, copie todo o seu conteúdo e cole no editor do Supabase.
4. Clique no botão **"Run"** (ou aperte `Ctrl + Enter`).
5. Você verá a mensagem de sucesso `Success. No rows returned`.

✅ **Tabelas criadas e populadas:**
- `categories`: Categorias com slugs (Anéis, Correntes, Cordões, Pingentes, Pulseiras, Brincos, Acessórios).
- `products`: Catálogo completo de joias com acabamentos (`silver`, `gold`, `black`, `bicolor`), tamanhos, fotos em alta resolução e especificações técnicas de aço 316L.
- `reviews`: Avaliações reais de clientes com notas 5 estrelas.
- `orders` e `order_items`: Estrutura pronta para registrar compras do checkout.

---

## 3. Obter as Chaves de Acesso (API Keys)
1. No menu lateral do Supabase, clique em **Project Settings** (ícone de engrenagem ⚙️).
2. Clique em **API** no submenu de configurações.
3. Copie os seguintes valores:
   - **Project URL** (ex: `https://xyzabcdefg.supabase.co`)
   - **Project API Keys** -> `anon` / `public` (chave que começa com `eyJ...`)

---

## 4. Configurar no Frontend
Abra o arquivo [`frontend/.env.local`](../frontend/.env.local) e cole as suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

Salve o arquivo. Se o servidor de desenvolvimento estiver rodando, o Next.js recarrega automaticamente e passará a consumir diretamente o seu banco de dados no Supabase!

---

## 5. Arquitetura Implementada
- **Client Supabase:** Implementado em [`frontend/src/lib/supabase/client.ts`](../frontend/src/lib/supabase/client.ts) usando `@supabase/ssr`.
- **Server Client (SSR/Next 15):** Implementado em [`frontend/src/lib/supabase/server.ts`](../frontend/src/lib/supabase/server.ts) compatível com cookies assíncronos do Next.js 15.
- **Camada de Integração Resiliente:** [`frontend/src/lib/api.ts`](../frontend/src/lib/api.ts) conecta ao Supabase prioritariamente. Caso as credenciais ainda não tenham sido inseridas, o site continua navegável exibindo o catálogo em memória com zero travamentos.
