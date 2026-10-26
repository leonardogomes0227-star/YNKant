# Meu Dia

Organizador pessoal para planejar e acompanhar a rotina diária: tarefas, rotina em blocos de horário, hábitos, foco (Pomodoro), notas e diário, metas e revisão semanal. Sem login e sem backend — tudo fica salvo no seu navegador e funciona offline (PWA).

**Stack:** Vite + React + TypeScript + Tailwind CSS 4, Zustand (persistência em `localStorage`), lucide-react, date-fns (pt-BR), Vitest.

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
```

Outros comandos:

```bash
npm run build      # checa tipos e gera a pasta dist/
npm run preview    # serve o build (útil para testar o PWA/offline)
npm run lint
npm test           # testes das funções de data, streak, rotina, backup…
```

## Atalhos

| Atalho | Ação |
| --- | --- |
| `Ctrl/⌘ + K` | Busca global (tarefas, notas e metas) |
| `C` | Captura rápida para a Caixa de entrada |
| Alça de uma tarefa + `↑` `↓` | Reordenar pelo teclado (também dá para arrastar) |

## Backup

Os dados vivem só neste navegador. Para não perdê-los:

1. **Ajustes › Exportar JSON** baixa `meu-dia-backup-AAAA-MM-DD.json`.
2. Em outro aparelho (ou depois de limpar o navegador), **Ajustes › Importar dados** e escolha o arquivo. O app mostra um resumo e pede confirmação antes de sobrescrever.

O arquivo tem `app`, `version` e `data`. Backups de versões anteriores do app são migrados automaticamente; backups de versões *mais novas* são recusados com uma mensagem.

## Evoluindo o modelo de dados

O formato salvo é versionado (`DATA_VERSION` em `src/store/migrations.ts`). Para mudar o modelo sem perder dados:

1. Some 1 a `DATA_VERSION`.
2. Adicione `steps[N] = (dados) => dadosNovos` em `migrations.ts`.
3. Se criou campos, dê um valor padrão em `src/store/defaults.ts` (campos ausentes são preenchidos ao carregar/importar).

## Publicar na Vercel

1. Suba o repositório no GitHub (a pasta `.github/workflows/pages.yml` também publica no GitHub Pages: ative em *Settings › Pages › Source: GitHub Actions*).
2. Na Vercel: **Add New › Project**, importe o repositório. O preset **Vite** é detectado sozinho (build `npm run build`, saída `dist`). Nenhuma variável de ambiente é necessária.
3. **Deploy.** Abra o site no celular e use “Adicionar à tela inicial” (ou o botão *Instalar* em Ajustes) para instalar o PWA.

Pela CLI: `npx vercel` (e `npx vercel --prod`).

## Estrutura

```
src/
  components/   interface compartilhada (layout, modal, busca, captura…)
  features/     uma pasta por módulo: today, tasks, routine, habits, focus, notes, goals, review, settings
  store/        estado (Zustand + persist), migrações, estado de UI
  lib/          funções puras: datas, streak, rotina, revisão, backup… (com testes *.test.ts)
  types/        Task, Habit, RoutineBlock, Note, Goal, FocusSession…
public/         manifest, service worker (sw.js) e ícones
scripts/        make-icons.mjs (regenera os PNGs a partir de public/icon.svg)
```
