import type { HabitKind } from '../types'

export interface HabitIdea {
  name: string
  why: string
  days: number[]
  kind?: HabitKind
  target?: number
  unit?: string
}

const ALL = [0, 1, 2, 3, 4, 5, 6]
const WORK = [1, 2, 3, 4, 5]

/** Sugestões simples para melhorar o dia a dia, adicionadas com um toque. */
export const HABIT_IDEAS: HabitIdea[] = [
  { name: 'Ler 20 minutos', why: 'Alguns minutos por dia viram vários livros por ano.', days: ALL },
  { name: 'Meditar 10 minutos', why: 'Ajuda a reduzir o estresse e a focar melhor.', days: ALL },
  { name: 'Alongar-se', why: 'Menos dor nas costas e mais disposição.', days: WORK },
  { name: 'Caminhar 30 minutos', why: 'O exercício mais fácil de manter.', days: ALL },
  { name: 'Treinar', why: 'Treino de força, 3 vezes por semana.', days: [1, 3, 5] },
  { name: 'Arrumar a cama', why: 'Uma pequena vitória logo cedo.', days: ALL },
  { name: 'Planejar o dia', why: 'Escolha 3 prioridades antes de começar.', days: WORK },
  { name: 'Escrever 3 gratidões', why: 'Treina o olhar para o que está bom.', days: ALL },
  { name: 'Estudar 30 minutos', why: 'Aprender um pouco todo dia vale mais que muito de vez em quando.', days: WORK },
  { name: 'Tomar sol por 10 minutos', why: 'Ajuda o sono e o humor.', days: ALL },
  { name: 'Ficar sem celular 1 hora antes de dormir', why: 'Você dorme mais rápido e melhor.', days: ALL },
  { name: 'Comer frutas', why: 'Meta: 2 porções por dia.', days: ALL, kind: 'count', target: 2, unit: 'porções' },
]
