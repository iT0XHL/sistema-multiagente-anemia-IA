import { AlertTriangle } from 'lucide-react'

export default function AcademicWarning() {
  return (
    <div className="bg-amber-50/80 border-b border-amber-200/60 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-start gap-2 px-4 py-2">
        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-amber-600" />
        <p className="text-[11px] leading-snug text-amber-700">
          <strong>Prototipo académico.</strong> No reemplaza el diagnóstico ni el
          tratamiento realizado por profesionales de salud. Toda recomendación debe ser
          validada por personal médico autorizado.
        </p>
      </div>
    </div>
  )
}
