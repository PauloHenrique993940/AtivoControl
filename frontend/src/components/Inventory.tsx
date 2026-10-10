import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { useData, changed, message, Row, date } from '../services/ui'
import { Modal } from './Modal'
import { Feedback } from './Feedback'
import { Table } from './Table'

type Field = { key: string; label: string; type?: string; required?: boolean; options?: string[]; initial?: string | number }
export function Inventory({ title, endpoint, fields, columns }: { title: string; endpoint: string; fields: Field[]; columns: string[] }) {
  const { user } = useAuth()
  const canEdit = ['ADMIN', 'GESTOR_ARMARIA'].includes(user?.role || '')
  const { data, loading, error, reload } = useData<Row[]>(endpoint)
  const [params, setParams] = useSearchParams()
  const search = params.get('busca') || ''
  const [status, setStatus] = useState('')
  const [form, setForm] = useState<Row | null>(null)
  const [detail, setDetail] = useState<Row | null>(null)
  const [failure, setFailure] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(1)
  const rows = (data || []).filter(row => (!status || row.status === status) && fields.some(field => String(row[field.key] ?? '').toLocaleLowerCase().includes(search.toLocaleLowerCase())))
  const pages = Math.max(1, Math.ceil(rows.length / 15)); const currentPage = Math.min(page, pages)
  const label = (key: string) => fields.find(field => field.key === key)?.label || key
  const display = (row: Row, key: string) => fields.find(field => field.key === key)?.type === 'date' ? (row[key] ? new Date(row[key]).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—') : String(row[key] ?? '—')
  const open = (row?: Row) => { setFailure(''); setSuccess(''); setForm(row ? { ...row } : Object.fromEntries(fields.map(field => [field.key, field.initial ?? '']))) }
  const inspect = async (row: Row) => { setFailure(''); try { setDetail((await api.get(`${endpoint}/${row.id}`)).data) } catch (err) { setFailure(message(err)) } }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setFailure('')
    try {
      const values = Object.fromEntries(fields.map(field => { let value = form![field.key]; if (field.type === 'number') value = Number(value); if (field.type === 'date' && !value) value = null; return [field.key, value] }))
      if (form?.id) await api.put(`${endpoint}/${form.id}`, values); else await api.post(endpoint, values)
      setForm(null); setSuccess('Registro salvo.'); changed()
    } catch (err) { setFailure(message(err)) } finally { setBusy(false) }
  }
  const remove = async (row: Row) => {
    if (!window.confirm('Excluir este registro? Registros com histórico são preservados.')) return
    setBusy(true); setFailure(''); try { await api.delete(`${endpoint}/${row.id}`); setSuccess('Registro excluído.'); changed() } catch (err) { setFailure(message(err)) } finally { setBusy(false) }
  }
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-black text-ssp-navy">{title}</h1>{canEdit && <button className="btn" onClick={() => open()}>Novo cadastro</button>}</div>
    <Feedback error={error || (!form ? failure : '')} success={success} />
    <div className="flex flex-wrap gap-3"><input aria-label={`Buscar ${title}`} className="field max-w-md" placeholder="Buscar nos registros..." value={search} onChange={e => { setParams(e.target.value ? { busca: e.target.value } : {}); setPage(1) }} />{fields.some(f => f.key === 'status') && <select aria-label="Filtrar status" className="field max-w-xs" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}><option value="">Todos os status</option>{fields.find(f => f.key === 'status')?.options?.map(value => <option key={value}>{value}</option>)}</select>}<button className="btn-secondary" onClick={() => void reload()}>Atualizar</button></div>
    {loading && <p role="status">Carregando...</p>}
    <Table headers={[...columns.map(label), 'Ações']}>
      {rows.slice((currentPage - 1) * 15, currentPage * 15).map(row => <tr key={row.id}>{columns.map(key => <td className="px-6 py-4 text-sm" key={key}>{display(row, key)}</td>)}<td className="px-6 py-4"><div className="flex gap-2"><button className="btn-secondary" onClick={() => void inspect(row)}>Detalhes</button>{canEdit && <><button className="btn-secondary" onClick={() => open(row)}>Editar</button><button className="btn-secondary text-red-700" disabled={busy} onClick={() => void remove(row)}>Excluir</button></>}</div></td></tr>)}
      {!rows.length && !loading && <tr><td colSpan={columns.length + 1} className="p-8 text-center text-gray-500">Nenhum registro encontrado.</td></tr>}
    </Table>
    <div className="flex items-center justify-between"><span>{rows.length} registros · Página {currentPage} de {pages}</span><div className="flex gap-2"><button className="btn-secondary" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Anterior</button><button className="btn-secondary" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Próxima</button></div></div>
    <Modal isOpen={Boolean(form)} onClose={() => { if (!busy) { setForm(null); setFailure('') } }} title={form?.id ? `Editar ${title}` : `Novo cadastro — ${title}`}>
      <form onSubmit={submit} className="space-y-4"><Feedback error={failure} />{fields.map(field => <label className="block space-y-1" key={field.key}><span className="text-sm font-bold">{field.label}</span>{field.options ? <select aria-label={field.label} className="field" value={form?.[field.key] ?? ''} onChange={e => setForm({ ...form, [field.key]: e.target.value })}>{field.options.map(value => <option key={value}>{value}</option>)}</select> : <input className="field" required={field.required} type={field.type || 'text'} min={field.type === 'number' ? 0 : undefined} maxLength={field.type === 'number' || field.type === 'date' ? undefined : 200} value={field.type === 'date' ? String(form?.[field.key] || '').slice(0, 10) : form?.[field.key] ?? ''} onChange={e => setForm({ ...form, [field.key]: e.target.value })} />}</label>)}<button className="btn w-full" disabled={busy}>{busy ? 'Salvando...' : 'Salvar registro'}</button></form>
    </Modal>
    <Modal isOpen={Boolean(detail)} onClose={() => setDetail(null)} title={`Detalhes — ${title}`}><dl className="space-y-3">{detail && fields.map(field => <div key={field.key}><dt className="font-bold">{field.label}</dt><dd>{display(detail, field.key)}</dd></div>)}</dl><h3 className="mt-6 mb-3 font-bold">Histórico de movimentações</h3>{detail?.movements?.length ? detail.movements.map((row: Row) => <div key={row.id} className="border-t py-3"><p>{row.tipo} · {date(row.data)}</p><p>{row.responsible?.nome || '—'} · {row.user?.name} {row.quantidade ? `· ${row.quantidade} unidades` : ''}</p><p className="text-gray-500">{row.motivo}</p></div>) : <p className="text-gray-500">Sem movimentações.</p>}</Modal>
  </div>
}
