import { describe, expect, it } from 'vitest'
import { emptyWorkout, estimate1RM, exerciseHistory, exerciseKey, initialSets, knownExercises, lastPerformance, logVolume, startFromTemplate, summarizeSets } from './workout'
import type { WorkoutLog, WorkoutTemplate } from '../types'

const log = (date: string, exercises: [string, [number, number, boolean][]][], id = date): WorkoutLog => ({
  id,
  date,
  templateId: null,
  name: 'Treino',
  durationMin: 50,
  note: '',
  createdAt: date + 'T10:00',
  exercises: exercises.map(([name, sets], i) => ({ id: `${id}${i}`, name, sets: sets.map(([reps, kg, done]) => ({ reps, kg, done })) })),
})

describe('treino', () => {
  it('compara exercícios sem acento nem maiúsculas', () => {
    expect(exerciseKey('  Tríceps   na POLIA ')).toBe('triceps na polia')
  })

  it('estima a carga máxima (Epley)', () => {
    expect(estimate1RM(100, 1)).toBe(100)
    expect(estimate1RM(80, 10)).toBe(106.7)
    expect(estimate1RM(0, 10)).toBe(0)
  })

  it('volume conta só séries feitas', () => {
    const l = log('2026-10-26', [['Supino', [[10, 40, true], [10, 40, true], [8, 40, false]]]])
    expect(logVolume(l)).toBe(800)
  })

  it('repete a última vez e usa a meta quando é a primeira', () => {
    const logs = [log('2026-10-20', [['Supino reto', [[10, 40, true], [8, 45, true]]]]), log('2026-10-26', [['Supino reto', [[12, 30, false]]]])]
    const last = lastPerformance(logs, 'supino RETO')
    expect(last?.date).toBe('2026-10-20') // ignora treino sem séries feitas
    expect(initialSets(logs, 'Supino reto', { sets: 3, reps: 10, kg: null })).toEqual([
      { reps: 10, kg: 40, done: false },
      { reps: 8, kg: 45, done: false },
    ])
    expect(initialSets([], 'Agachamento', { sets: 3, reps: 12, kg: 20 })).toEqual(Array(3).fill({ reps: 12, kg: 20, done: false }))
  })

  it('resume séries iguais e diferentes', () => {
    expect(summarizeSets([{ reps: 10, kg: 40, done: true }, { reps: 10, kg: 40, done: true }, { reps: 10, kg: 40, done: true }])).toBe('3×10 · 40 kg')
    expect(summarizeSets([{ reps: 10, kg: 40, done: true }, { reps: 8, kg: 45, done: true }])).toBe('10×40kg · 8×45kg')
    expect(summarizeSets([{ reps: 15, kg: 0, done: true }])).toBe('1×15')
  })

  it('monta o histórico de evolução de um exercício', () => {
    const logs = [
      log('2026-10-26', [['Supino', [[8, 50, true]]]]),
      log('2026-10-19', [['supino', [[10, 40, true], [10, 45, true], [5, 60, false]]]]),
      log('2026-10-12', [['Agachamento', [[10, 60, true]]]]),
    ]
    const h = exerciseHistory(logs, 'Supino')
    expect(h.map((p) => p.date)).toEqual(['2026-10-19', '2026-10-26'])
    expect(h[0].topKg).toBe(45)
    expect(h[1].topKg).toBe(50)
    expect(h[1].volume).toBe(400)
  })

  it('lista exercícios conhecidos, mais usados primeiro', () => {
    const logs = [log('2026-10-20', [['Rosca direta', [[10, 10, true]]], ['Supino', [[10, 40, true]]]]), log('2026-10-26', [['supino', [[10, 40, true]]]])]
    expect(knownExercises(logs)).toEqual(['Supino', 'Rosca direta'])
  })

  it('começa o treino a partir de um modelo', () => {
    const t: WorkoutTemplate = { id: 't', name: 'A', exercises: [{ id: 'e', name: 'Supino', sets: 3, reps: 10, kg: 30 }] }
    const w = startFromTemplate(t, [], '2026-10-27')
    expect(w.name).toBe('A')
    expect(w.exercises[0].sets).toHaveLength(3)
    expect(emptyWorkout('2026-10-27').exercises).toEqual([])
  })
})
