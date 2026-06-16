import { useCallback } from 'react'

import { ejemploJuliaca } from '../types'
import type { ClinicalFormData } from '../types'

export function useExampleCase() {
  const loadExample = useCallback((): ClinicalFormData => {
    return { ...ejemploJuliaca }
  }, [])

  return { loadExample }
}
