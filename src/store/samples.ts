import type { AppData, Goal, Habit, JournalEntry, RoutineBlock, Task } from '../types'
import { shiftKey, todayKey, toKey, weekdayOf } from '../lib/dates'
import { emptyData } from './defaults'

/** Gerador pseudoaleatório determinístico, para exemplos estáveis. */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export function createSampleData(now: Date = new Date()): AppData {
  const today = todayKey(now)
  const at = (offset: number) => shiftKey(today, offset)
  const iso = now.toISOString()
  const rand = rng(42)
  const data = emptyData()

  const task = (
    i: number,
    title: string,
    over: Partial<Task> = {},
  ): Task => ({
    id: `ex-t${i}`,
    title,
    description: '',
    dueDate: null,
    priority: 'medium',
    category: '',
    subtasks: [],
    repeat: 'none',
    done: false,
    completedAt: null,
    order: i,
    createdAt: iso,
    sample: true,
    ...over,
  })

  data.tasks = [
    task(1, 'Responder e-mails pendentes', {
      dueDate: today,
      priority: 'high',
      category: 'Trabalho',
      description: 'Começar pelos que têm prazo esta semana.',
    }),
    task(2, 'Revisar o planejamento da semana', {
      dueDate: today,
      category: 'Pessoal',
      subtasks: [
        { id: 'ex-s1', title: 'Olhar a agenda', done: true },
        { id: 'ex-s2', title: 'Definir 3 prioridades', done: false },
      ],
    }),
    task(3, 'Pagar a conta de internet', { dueDate: at(-2), priority: 'high', category: 'Finanças' }),
    task(4, 'Marcar consulta de rotina', { dueDate: at(2), priority: 'low', category: 'Saúde' }),
    task(5, 'Estudar um capítulo do curso', {
      dueDate: at(1),
      category: 'Estudos',
      repeat: 'daily',
    }),
    task(6, 'Organizar a mesa de trabalho', { dueDate: at(4), priority: 'low', category: 'Casa' }),
    task(7, 'Ideia: planejar uma viagem curta', { category: 'Pessoal' }),
    task(8, 'Comprar presente de aniversário'),
    task(9, 'Fazer backup das fotos', {
      done: true,
      completedAt: iso,
      dueDate: at(-1),
      category: 'Pessoal',
    }),
  ]

  const days = [0, 1, 2, 3, 4, 5, 6]
  const habit = (
    i: number,
    name: string,
    over: Partial<Habit>,
    chance: number,
  ): Habit => {
    const kind = over.kind ?? 'check'
    const target = over.target ?? 1
    const sched = over.days ?? days
    const log: Record<string, number> = {}
    for (let o = 1; o <= 90; o++) {
      const key = at(-o)
      if (!sched.includes(weekdayOf(key))) continue
      if (rand() < chance) log[key] = kind === 'count' ? target : 1
      else if (kind === 'count' && rand() < 0.5) log[key] = Math.max(1, target - 2)
    }
    return {
      id: `ex-h${i}`,
      name,
      kind,
      target,
      unit: '',
      days: sched,
      note: '',
      log,
      createdAt: at(-90),
      sample: true,
      ...over,
    }
  }

  data.habits = [
    habit(1, 'Beber água', { kind: 'count', target: 8, unit: 'copos', note: 'Meta: 2 litros por dia' }, 0.7),
    habit(2, 'Ler 20 minutos', {}, 0.6),
    habit(3, 'Exercício físico', { days: [1, 3, 5, 6], note: 'Treino ou caminhada' }, 0.75),
    habit(4, 'Meditar', {}, 0.45),
  ]
  // garante uma sequência visível nos exemplos
  for (const h of data.habits.slice(0, 3)) {
    for (let o = 1; o <= 5; o++) {
      const key = at(-o)
      if (h.days.includes(weekdayOf(key))) h.log[key] = h.kind === 'count' ? h.target : 1
    }
  }

  const block = (
    i: number,
    title: string,
    start: string,
    end: string,
    color: string,
    category: string,
    daysOn: number[],
  ): RoutineBlock => ({ id: `ex-b${i}`, title, start, end, color, category, days: daysOn, sample: true })

  const weekdays = [1, 2, 3, 4, 5]
  data.routine = [
    block(1, 'Acordar e se arrumar', '06:30', '07:30', 'silver', 'Pessoal', weekdays),
    block(2, 'Exercício', '07:30', '08:15', 'sage', 'Saúde', [1, 3, 5]),
    block(3, 'Trabalho focado', '09:00', '12:00', 'brass', 'Trabalho', weekdays),
    block(4, 'Almoço e pausa', '12:00', '13:00', 'clay', 'Pessoal', weekdays),
    block(5, 'Reuniões e e-mails', '13:00', '16:00', 'steel', 'Trabalho', weekdays),
    block(6, 'Estudos', '19:00', '20:30', 'violet', 'Estudos', [1, 2, 3, 4]),
    block(7, 'Revisão do dia', '21:30', '22:00', 'silver', 'Pessoal', [0, 1, 2, 3, 4, 5, 6]),
    block(8, 'Tarefas da casa', '09:00', '11:00', 'clay', 'Casa', [6]),
    block(9, 'Lazer', '15:00', '18:00', 'rose', 'Pessoal', [6, 0]),
    block(10, 'Planejar a semana', '18:00', '18:45', 'brass', 'Pessoal', [0]),
  ]

  data.notes = [
    {
      id: 'ex-n1',
      title: 'Ideias para o fim de semana',
      body: 'Trilha curta de manhã\nCafé com a família\nTerminar o livro',
      tags: ['lazer'],
      pinned: true,
      createdAt: iso,
      updatedAt: iso,
      sample: true,
    },
    {
      id: 'ex-n2',
      title: 'Livros para ler',
      body: 'Lista rápida de leituras para este ano. Anote aqui o que despertar curiosidade.',
      tags: ['leitura', 'estudos'],
      pinned: false,
      createdAt: iso,
      updatedAt: iso,
      sample: true,
    },
    {
      id: 'ex-n3',
      title: 'Lista de compras',
      body: 'Frutas\nCafé\nProdutos de limpeza',
      tags: ['casa'],
      pinned: false,
      createdAt: iso,
      updatedAt: iso,
      sample: true,
    },
  ]

  const moods = [4, 3, 4, 5, 3, 4]
  const journal: Record<string, JournalEntry> = {}
  moods.forEach((mood, i) => {
    journal[at(-(i + 1))] = {
      mood,
      how: i === 0 ? 'Dia produtivo, consegui focar bastante pela manhã.' : '',
      good: i === 0 ? ['Treino feito', 'Almoço com calma', ''] : ['', '', ''],
      improve: i === 0 ? 'Começar a revisão do dia mais cedo.' : '',
      sample: true,
    }
  })
  data.journal = journal

  const goal: Goal = {
    id: 'ex-g1',
    title: 'Concluir o curso de inglês',
    description: 'Estudar um pouco todo dia e fechar os módulos até o fim do ano.',
    deadline: toKey(new Date(now.getFullYear(), 11, 20)),
    progress: 40,
    autoProgress: true,
    milestones: [
      { id: 'ex-m1', title: 'Módulo 1', done: true },
      { id: 'ex-m2', title: 'Módulo 2', done: true },
      { id: 'ex-m3', title: 'Módulo 3', done: false },
      { id: 'ex-m4', title: 'Prova final', done: false },
    ],
    taskIds: ['ex-t5'],
    habitIds: ['ex-h2'],
    createdAt: iso,
    sample: true,
  }
  data.goals = [goal]

  data.focusSessions = []
  for (let o = 0; o < 7; o++) {
    const n = Math.floor(rand() * 4)
    for (let k = 0; k < n; k++) {
      data.focusSessions.push({
        id: `ex-f${o}-${k}`,
        startedAt: new Date(now.getTime() - o * 86400000 - k * 3600000).toISOString(),
        date: at(-o),
        seconds: 25 * 60,
        taskId: k === 0 ? 'ex-t1' : null,
        sample: true,
      })
    }
  }

  data.samplesLoaded = true
  return data
}
