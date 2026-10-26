import { useRef, useState } from 'react'
import { Download, Smartphone, Trash2, Upload } from 'lucide-react'
import { ConfirmDialog, PageHeader, SectionTitle } from '../../components/ui'
import { dataCounts, downloadBackup, parseBackup } from '../../lib/backup'
import { modKey } from '../../lib/platform'
import { useInstall } from '../../lib/useInstall'
import { emptyData } from '../../store/defaults'
import { DATA_VERSION } from '../../store/migrations'
import { pickData, useStore } from '../../store/useStore'
import { useUI } from '../../store/ui'
import type { AppData, ThemePref } from '../../types'

function Row({ title, children, desc }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-4 first:border-t-0">
      <div className="min-w-0 flex-1 basis-56">
        <div className="font-semibold">{title}</div>
        {desc && <p className="mt-0.5 text-sm text-muted">{desc}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export function SettingsView() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const replaceAll = useStore((s) => s.replaceAll)
  const toast = useUI((s) => s.toast)
  const install = useInstall()
  const fileRef = useRef<HTMLInputElement>(null)
  const [incoming, setIncoming] = useState<AppData | null>(null)
  const [error, setError] = useState('')
  const [confirmWipe, setConfirmWipe] = useState(false)

  const current = () => pickData(useStore.getState())

  const onFile = async (file: File | undefined) => {
    setError('')
    if (!file) return
    const res = parseBackup(await file.text())
    if (res.ok) setIncoming(res.data)
    else setError(res.error)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <PageHeader title="Ajustes" subtitle="Aparência, backup e dados." />

      <section className="card px-5" aria-label="Geral">
        <Row title="Seu nome" desc="Usado na saudação da tela Hoje (opcional).">
          <input className="input w-56" aria-label="Seu nome" value={settings.name} onChange={(e) => updateSettings({ name: e.target.value })} placeholder="Como quer ser chamado?" maxLength={40} />
        </Row>
        <Row title="Tema" desc="“Sistema” segue a configuração do seu aparelho.">
          <div className="seg" role="group" aria-label="Tema">
            {([['dark', 'Escuro'], ['light', 'Claro'], ['system', 'Sistema']] as [ThemePref, string][]).map(([v, l]) => (
              <button key={v} aria-pressed={settings.theme === v} onClick={() => updateSettings({ theme: v })}>{l}</button>
            ))}
          </div>
        </Row>
        {install && (
          <Row title="Instalar o app" desc="Adicione o Meu Dia à tela inicial e use até offline.">
            <button className="btn" onClick={() => void install()}><Smartphone size={16} aria-hidden /> Instalar</button>
          </Row>
        )}
      </section>

      <section className="mt-8" aria-label="Backup">
        <SectionTitle>Backup</SectionTitle>
        <div className="card px-5">
          <Row title="Exportar dados" desc="Baixa um arquivo JSON com tudo: tarefas, rotina, hábitos, notas, metas e histórico.">
            <button className="btn" onClick={() => { downloadBackup(current()); toast('Backup baixado.') }}>
              <Download size={16} aria-hidden /> Exportar JSON
            </button>
          </Row>
          <Row title="Importar dados" desc="Restaura um backup. Os dados atuais serão substituídos — você confirma antes.">
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" id="import-file" onChange={(e) => void onFile(e.target.files?.[0])} />
            <label htmlFor="import-file" className="btn cursor-pointer focus-within:outline-2">
              <Upload size={16} aria-hidden /> Escolher arquivo…
            </label>
          </Row>
          {error && <p role="alert" className="pb-4 text-sm text-danger">{error}</p>}
        </div>
      </section>

      <section className="mt-8" aria-label="Dados">
        <SectionTitle>Dados</SectionTitle>
        <div className="card px-5">
          <Row title="Apagar tudo" desc="Remove todos os dados deste aparelho. Exporte um backup antes.">
            <button className="btn btn-danger" onClick={() => setConfirmWipe(true)}><Trash2 size={16} aria-hidden /> Apagar tudo</button>
          </Row>
        </div>
      </section>

      <section className="mt-8" aria-label="Atalhos e sobre">
        <SectionTitle>Atalhos</SectionTitle>
        <ul className="card grid grid-cols-1 gap-2 p-5 text-sm">
          <li className="flex justify-between gap-3"><span>Buscar tarefas</span><kbd className="rounded border border-line px-1.5">{modKey} + K</kbd></li>
          <li className="flex justify-between gap-3"><span>Nova tarefa</span><kbd className="rounded border border-line px-1.5">C</kbd></li>
          <li className="flex justify-between gap-3"><span>Reordenar tarefas pelo teclado</span><span className="text-muted">foco na alça + ↑ ↓</span></li>
        </ul>
        <p className="mt-4 text-xs text-muted">Meu Dia · formato de dados v{DATA_VERSION} · tudo fica salvo apenas neste navegador.</p>
      </section>

      <ConfirmDialog
        open={!!incoming}
        title="Substituir os dados atuais?"
        message={
          incoming && (
            <>
              <p>Isto vai <strong className="text-ink">sobrescrever tudo</strong> que está salvo agora.</p>
              <p className="mt-3"><strong className="text-ink">Atual:</strong> {dataCounts(current())}.</p>
              <p className="mt-1"><strong className="text-ink">Do arquivo:</strong> {dataCounts(incoming)}.</p>
              <button className="btn btn-sm mt-3" onClick={() => downloadBackup(current())}><Download size={14} aria-hidden /> Baixar backup atual antes</button>
            </>
          )
        }
        confirmLabel="Substituir"
        danger
        onCancel={() => setIncoming(null)}
        onConfirm={() => {
          if (incoming) replaceAll(incoming)
          setIncoming(null)
          toast('Dados importados com sucesso.')
        }}
      />
      <ConfirmDialog
        open={confirmWipe}
        title="Apagar todos os dados?"
        message="Tarefas, rotina, hábitos, notas, metas e histórico serão apagados deste aparelho. Isso não pode ser desfeito."
        confirmLabel="Apagar tudo"
        danger
        onCancel={() => setConfirmWipe(false)}
        onConfirm={() => {
          replaceAll({ ...emptyData(), settings })
          setConfirmWipe(false)
          toast('Tudo apagado.')
        }}
      />
    </>
  )
}
