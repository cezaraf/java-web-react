import { describe, expect, it } from 'vitest'
import { horasParaIso, isoParaHoras } from './duration'

describe('duration', () => {
  it('converte horas para ISO-8601', () => {
    expect(horasParaIso(48)).toBe('PT48H')
    expect(horasParaIso(8760)).toBe('PT8760H')
  })

  it('converte ISO-8601 para horas', () => {
    expect(isoParaHoras('PT48H')).toBe(48)
    expect(isoParaHoras('PT1H')).toBe(1)
  })

  it('rejeita formato fora do padrão PT{n}H', () => {
    expect(() => isoParaHoras('PT1H30M')).toThrow()
  })
})
