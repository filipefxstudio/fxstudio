# Seed de dados de teste — FX Studio

Script opcional para popular o banco com imóveis, leads, visitas, propostas, negócios e agenda de demonstração.

## Pré-requisitos

1. **Corretor cadastrado** — o script usa o primeiro registro de `corretores`.
2. **Migrations aplicadas** — execute todas as migrations do projeto **antes** do seed, em ordem. Obrigatórias:
   - `status_imovel` (Disponível, Reservado, Vendido, Locado)
   - `20260702220000_imoveis_corretor_codigo_unique.sql` — constraint `UNIQUE (corretor_id, codigo)` usada pelo `ON CONFLICT` do seed
3. Execute como **admin** no **Supabase SQL Editor** (não precisa de service role).

### Ordem de execução

1. Aplique as migrations (`supabase db push`, CLI local, ou SQL Editor migration por migration).
2. Confirme que existe a constraint `imoveis_corretor_codigo_unique` em `imoveis`.
3. Execute `seed_dados_teste.sql`.

## Como executar

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto → **SQL Editor**.
2. Cole o conteúdo de `seed_dados_teste.sql`.
3. Clique em **Run**.
4. Confira o resultado da query final de contagens.

## O que é inserido

| Tabela            | Quantidade | Observação                                      |
|-------------------|-----------:|-------------------------------------------------|
| `imoveis`         | 20         | Códigos `0001`–`0020`, bairros de BH            |
| `imovel_fotos`    | 51         | 2–4 fotos Unsplash por imóvel                   |
| `leads`           | 30         | Funil completo (novo → fechado/perdido)         |
| `lead_interacoes` | 8          | Exemplos de atendimento                         |
| `visitas`         | 10         | Jun/jul 2026                                    |
| `propostas`       | 8          | Vários status                                   |
| `negocios`        | 3          | Comissão 3%; 1 com recebimento registrado       |
| `agenda`          | 20         | Atividades passadas e futuras                   |

## Segurança

- **Não apaga dados existentes** por padrão.
- Imóveis usam `ON CONFLICT (corretor_id, codigo) DO NOTHING` — reexecutar não duplica códigos.
- Demais registros usam IDs fixos com `ON CONFLICT (id) DO NOTHING`.

## Limpeza (opcional)

No topo de `seed_dados_teste.sql` há comandos `DELETE` comentados. Descomente apenas se quiser remover **somente** os registros deste seed (identificados pelos prefixos de UUID).

## Observações

- Valores de `status` em visitas seguem o app: `agendada`, `realizada`, `cancelada`, `nao_compareceu`.
- Parecer de visita: `positivo`, `neutro`, `negativo`.
- `visitas.vai_gerar_proposta` é **BOOLEAN** — use `true`, `false` ou `NULL` (não `'sim'`/`'nao'`/`'talvez'`).
- Colunas booleanas em `imoveis` (`publicado_site`, `publicado_portais`, `exclusividade`, `imovel_ocupado`, `aceita_financiamento`) e `agenda` (`lembrete_email`, `lembrete_enviado`) também exigem literais SQL `true`/`false`.
- Tipos de agenda: `visita`, `ligacao`, `reuniao`, `tarefa`, `lembrete`, `outro` (e-mail/WhatsApp mapeados em `tarefa`/`lembrete`).
- Status de agenda: `pendente`, `concluida`, `cancelada`.
