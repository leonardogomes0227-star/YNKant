import { useState } from 'react'
import { authErrorMessage } from '../lib/syncRules'
import { signIn, signUp } from '../store/cloud'
import { Field } from './ui'

export function LoginScreen() {
  const [mode, setMode] = useState<'entrar' | 'criar'>('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    const res = mode === 'entrar' ? await signIn(email.trim(), password) : await signUp(email.trim(), password)
    setBusy(false)
    if (res === 'confirm') setInfo('Conta criada! Abra o e-mail que enviamos, toque no link de confirmação e depois volte aqui para entrar.')
    else if (res) setError(authErrorMessage(res))
  }

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-md content-center gap-6 px-5 py-10">
      <div className="text-center">
        <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width={56} height={56} className="mx-auto rounded-2xl" />
        <h1 className="mt-4 text-4xl">Meu Dia</h1>
        <p className="mt-2 text-muted">
          {mode === 'entrar' ? 'Entre para ver suas tarefas em qualquer aparelho.' : 'Crie sua conta. Seus dados ficam salvos na nuvem e não se perdem.'}
        </p>
      </div>

      <form onSubmit={submit} className="card grid grid-cols-1 gap-4 p-5">
        <Field label="E-mail" htmlFor="login-email">
          <input id="login-email" className="input" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Senha" htmlFor="login-senha" hint={mode === 'criar' ? 'Mínimo de 6 caracteres.' : undefined}>
          <input id="login-senha" className="input" type="password" autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {info && <p role="status" className="rounded-lg bg-accent-soft px-3 py-2 text-sm">{info}</p>}
        <button className="btn btn-primary min-h-12" type="submit" disabled={busy}>
          {busy ? 'Aguarde…' : mode === 'entrar' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>

      <button className="btn btn-ghost" onClick={() => { setMode(mode === 'entrar' ? 'criar' : 'entrar'); setError(''); setInfo('') }}>
        {mode === 'entrar' ? 'Primeira vez? Criar conta' : 'Já tenho conta. Entrar'}
      </button>
    </main>
  )
}
