import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { useData, changed, message, Row, date } from '../services/ui'
import { Modal } from './Modal'
import { Feedback } from './Feedback'
import { Table } from './Table'

export type InventoryField = { key: string; label: string; type?: string; required?: boolean; options?: string[]; initial?: string | number; suggestions?: string[]; readOnlyOnEdit?: boolean }
type InventoryProps = {
  title: string
  endpoint: string
  fields: InventoryField[]
  columns: string[]
  summary?: (rows: Row[]) => { label: string; value: number }[]
  bulk?: { uniqueFields: string[]; label: string }
  stockEntry?: boolean
}

export function Inventory({ title, endpoint, fields, columns, summary, bulk, stockEntry }: InventoryProps) {
  const { user } = useAuth()
  const canEdit = ['ADMIN', 'GESTOR_ARMARIA'].includes(user?.role || '')
  const { data, loading, error, reload } = useData<Row[]>(endpoint)
  const [params, setParams] = useSearchParams()
  const search = params.get('busca') || ''
  const [status, setStatus] = useState('')
  const [form, setForm] = useState<Row | null>(null)
  const [detail, setDetail] = useState<Row | null>(null)
  const [batch, setBatch] = useState<Row | null>(null)
  const [units, setUnits] = useState<Row[]>([{ numSerie: '', numRegistro: '' }])
  const [quantity, setQuantity] = useState(1)
  const [entry, setEntry] = useState<Row | null>(null)
  const [failure, setFailure] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(1)
  const rows = (data || []).filter(row => (!status || row.status === status) && fields.some(field => String(row[field.key] ?? '').toLocaleLowerCase().includes(search.toLocaleLowerCase())))
  const pages = Math.max(1, Math.ceil(rows.length / 15))
  const currentPage = Math.min(page, pages)
  const modalOpen = Boolean(form || batch || entry)
  const label = (key: string) => fields.find(field => field.key === key)?.label || key
  const display = (row: Row, key: string) => fields.find(field => field.key === key)?.type === 'date' ? (row[key] ? new Date(row[key]).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—') : String(row[key] ?? '—')
  const initialValues = () => Object.fromEntries(fields.map(field => [field.key, field.initial ?? '']))
  const clearFeedback = () => { setFailure(''); setSuccess('') }
  const open = (row?: Row) => { clearFeedback(); setForm(row ? { ...row } : initialValues()) }
  const inspect = async (row: Row) => { setFailure(''); try { setDetail((await api.get(`${endpoint}/${row.id}`)).data) } catch (err) { setFailure(message(err)) } }
  const valuesFor = (selectedFields: InventoryField[], values: Row, editing = false) => Object.fromEntries(selectedFields.filter(field => !editing || !field.readOnlyOnEdit).map(field => {
    let value = values[field.key]
    if (field.type === 'number') value = Number(value)
    if (field.type === 'date' && !value) value = null
    return [field.key, value]
  }))
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setFailure('')
    try {
      const values = valuesFor(fields, form!, Boolean(form?.id))
      if (form?.id) await api.put(`${endpoint}/${form.id}`, values); else await api.post(endpoint, values)
      setForm(null); setSuccess('Registro salvo.'); changed()
    } catch (err) { setFailure(message(err)) } finally { setBusy(false) }
  }
  const bulkFields = fields.filter(field => !bulk?.uniqueFields.includes(field.key)).map(field => field.key === 'status' ? { ...field, options: ['ESTOQUE', 'BLOQUEADA', 'BAIXADA'] } : field)
  const submitBatch = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setFailure('')
    try {
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new Error('Informe uma quantidade entre 1 e 100.')
      const response = await api.post(`${endpoint}/lote`, { quantidade: quantity, dados: valuesFor(bulkFields, batch!), unidades: units })
      setBatch(null); setSuccess(`${response.data.quantidade} armamentos cadastrados. Cada unidade mantém sua série e seu registro.`); changed()
    } catch (err) { setFailure(message(err)) } finally { setBusy(false) }
  }
  const submitEntry = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setFailure('')
    try {
      const response = await api.post(`${endpoint}/${entry!.id}/entrada`, { quantidade: Number(entry!.quantidadeEntrada), motivo: entry!.motivo })
      setEntry(null); setSuccess(`Entrada registrada. Estoque atual: ${Number(response.data.quantidade).toLocaleString('pt-BR')} unidades.`); changed()
    } catch (err) { setFailure(message(err)) } finally { setBusy(false) }
  }
  const remove = async (row: Row) => {
    if (!window.confirm('Excluir este registro? Registros com histórico são preservados.')) return
    setBusy(true); setFailure(''); try { await api.delete(`${endpoint}/${row.id}`); setSuccess('Registro excluído.'); changed() } catch (err) { setFailure(message(err)) } finally { setBusy(false) }
  }
  const renderField = (field: InventoryField, values: Row | null, update: (values: Row) => void, editing = false, prefix = 'registro') => <label className="block space-y-1" key={field.key}>
    <span className="text-sm font-bold">{field.label}</span>
    {field.options ? <select aria-label={field.label} className="field" required={field.required} value={values?.[field.key] ?? ''} onChange={event => update({ ...values, [field.key]: event.target.value })}>{field.options.map(value => <option key={value}>{value}</option>)}</select> : <input className="field" required={field.required} readOnly={editing && field.readOnlyOnEdit} type={field.type || 'text'} min={field.type === 'number' ? 0 : undefined} step={field.type === 'number' ? 1 : undefined} maxLength={field.type === 'number' || field.type === 'date' ? undefined : 200} list={field.suggestions ? `${prefix}-${field.key}-suggestions` : undefined} value={field.type === 'date' ? String(values?.[field.key] || '').slice(0, 10) : values?.[field.key] ?? ''} onChange={event => update({ ...values, [field.key]: event.target.value })} />}
    {field.suggestions && <datalist id={`${prefix}-${field.key}-suggestions`}>{field.suggestions.map(value => <option key={value} value={value} />)}</datalist>}
    {editing && field.readOnlyOnEdit && <span className="block text-xs text-gray-500">Use Adicionar quantidade para registrar uma entrada ou Movimentações para retirar/devolver.</span>}
  </label>

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-black text-ssp-navy">{title}</h1>{canEdit && <div className="flex flex-wrap gap-2">{bulk && <button className="btn-secondary" onClick={() => { clearFeedback(); setBatch(initialValues()); setQuantity(1); setUnits([Object.fromEntries(bulk.uniqueFields.map(key => [key, '']))]) }}>{bulk.label}</button>}<button className="btn" onClick={() => open()}>Novo cadastro</button></div>}</div>
    <Feedback error={error || (!modalOpen ? failure : '')} success={success} />
    {summary && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{summary(data || []).map(item => <div key={item.label} className="card"><p className="text-sm text-gray-500">{item.label}</p><p className="text-3xl font-black text-ssp-navy mt-2">{item.value.toLocaleString('pt-BR')}</p></div>)}</div>}
    {bulk && <p className="text-sm text-gray-500">A quantidade de armas corresponde às unidades cadastradas. Você pode cadastrar até 100 de uma vez, informando a série e o registro de cada unidade.</p>}
    {stockEntry && <p className="text-sm text-gray-500">Cadastre o tipo/calibre com a quantidade inicial. Para repor um cadastro existente, use Adicionar quantidade; a entrada fica registrada no histórico.</p>}
    <div className="flex flex-wrap gap-3"><input aria-label={`Buscar ${title}`} className="field max-w-md" placeholder="Buscar nos registros..." value={search} onChange={event => { setParams(event.target.value ? { busca: event.target.value } : {}); setPage(1) }} />{fields.some(field => field.key === 'status') && <select aria-label="Filtrar status" className="field max-w-xs" value={status} onChange={event => { setStatus(event.target.value); setPage(1) }}><option value="">Todos os status</option>{fields.find(field => field.key === 'status')?.options?.map(value => <option key={value}>{value}</option>)}</select>}<button className="btn-secondary" onClick={() => void reload()}>Atualizar</button></div>
    {loading && <p role="status">Carregando...</p>}
    <Table headers={[...columns.map(label), 'Ações']}>
      {rows.slice((currentPage - 1) * 15, currentPage * 15).map(row => <tr key={row.id}>{columns.map(key => <td className="px-6 py-4 text-sm" key={key}>{display(row, key)}</td>)}<td className="px-6 py-4"><div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={() => void inspect(row)}>Detalhes</button>{canEdit && <>{stockEntry && <button className="btn" onClick={() => { clearFeedback(); setEntry({ ...row, quantidadeEntrada: 1, motivo: '' }) }}>Adicionar quantidade</button>}<button className="btn-secondary" onClick={() => open(row)}>Editar</button><button className="btn-secondary text-red-700" disabled={busy} onClick={() => void remove(row)}>Excluir</button></>}</div></td></tr>)}
      {!rows.length && !loading && <tr><td colSpan={columns.length + 1} className="p-8 text-center text-gray-500">Nenhum registro encontrado.</td></tr>}
    </Table>
    <div className="flex flex-wrap items-center justify-between gap-3"><span>{rows.length} registros · Página {currentPage} de {pages}</span><div className="flex gap-2"><button className="btn-secondary" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Anterior</button><button className="btn-secondary" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Próxima</button></div></div>
    <Modal isOpen={Boolean(form)} onClose={() => { if (!busy) { setForm(null); setFailure('') } }} title={form?.id ? `Editar ${title}` : `Novo cadastro — ${title}`}>
      <form onSubmit={submit} className="space-y-4"><Feedback error={failure} />{fields.map(field => renderField(field, form, setForm, Boolean(form?.id)))}<button className="btn w-full" disabled={busy}>{busy ? 'Salvando...' : 'Salvar registro'}</button></form>
    </Modal>
    {bulk && <Modal isOpen={Boolean(batch)} onClose={() => { if (!busy) { setBatch(null); setFailure('') } }} title={bulk.label}>
      <form onSubmit={submitBatch} className="space-y-5"><Feedback error={failure} />
        <label className="block space-y-1"><span className="font-bold text-sm">Quantidade de armamentos</span><input className="field" type="number" min={1} max={100} step={1} required value={quantity || ''} onChange={event => { const next = Math.min(100, Math.max(0, Number(event.target.value))); setQuantity(next); setUnits(current => Array.from({ length: next }, (_, index) => current[index] || Object.fromEntries(bulk.uniqueFields.map(key => [key, ''])))) }} /></label>
        <p className="text-sm text-gray-500">Os dados abaixo se aplicam a todas as unidades. Séries e registros devem ser únicos.</p>
        {bulkFields.map(field => renderField(field, batch, setBatch, false, 'lote'))}
        <div className="space-y-4"><h4 className="font-bold">Identificação de cada unidade</h4>{units.map((unit, index) => <fieldset key={index} className="rounded-xl border p-4 space-y-3"><legend className="px-2 font-bold">Unidade {index + 1}</legend>{bulk.uniqueFields.map(key => <label key={key} className="block space-y-1"><span className="text-sm font-bold">{label(key)} — unidade {index + 1}</span><input className="field" required maxLength={200} value={unit[key]} onChange={event => setUnits(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: event.target.value } : item))} /></label>)}</fieldset>)}</div>
        <button className="btn w-full" disabled={busy || quantity < 1}>{busy ? 'Cadastrando...' : `Cadastrar ${quantity} ${quantity === 1 ? 'armamento' : 'armamentos'}`}</button>
      </form>
    </Modal>}
    {stockEntry && <Modal isOpen={Boolean(entry)} onClose={() => { if (!busy) { setEntry(null); setFailure('') } }} title="Adicionar quantidade de munições">
      <form onSubmit={submitEntry} className="space-y-4"><Feedback error={failure} /><p className="font-bold">{entry?.tipo} · {entry?.calibre}</p><p className="text-sm text-gray-500">Estoque atual: {Number(entry?.quantidade || 0).toLocaleString('pt-BR')} unidades.</p><label className="block space-y-1"><span className="text-sm font-bold">Quantidade a adicionar</span><input className="field" type="number" min={1} max={2147483647} step={1} required value={entry?.quantidadeEntrada ?? ''} onChange={event => setEntry({ ...entry, quantidadeEntrada: event.target.value })} /></label><label className="block space-y-1"><span className="text-sm font-bold">Motivo da entrada</span><textarea className="field" required maxLength={2000} placeholder="Ex.: recebimento da compra ou transferência de estoque" value={entry?.motivo || ''} onChange={event => setEntry({ ...entry, motivo: event.target.value })} /></label><p className="text-sm">Estoque após a entrada: {(Number(entry?.quantidade || 0) + Number(entry?.quantidadeEntrada || 0)).toLocaleString('pt-BR')} unidades.</p><button className="btn w-full" disabled={busy}>{busy ? 'Registrando...' : 'Registrar entrada'}</button></form>
    </Modal>}
    <Modal isOpen={Boolean(detail)} onClose={() => setDetail(null)} title={`Detalhes — ${title}`}><dl className="space-y-3">{detail && fields.map(field => <div key={field.key}><dt className="font-bold">{field.label}</dt><dd>{display(detail, field.key)}</dd></div>)}</dl><h3 className="mt-6 mb-3 font-bold">Histórico de movimentações</h3>{detail?.movements?.length ? detail.movements.map((row: Row) => <div key={row.id} className="border-t py-3"><p>{row.tipo} · {date(row.data)}</p><p>{row.responsible?.nome || '—'} · {row.user?.name} {row.quantidade ? `· ${row.quantidade} unidades` : ''}</p><p className="text-gray-500">{row.destino && `${row.destino} · `}{row.motivo}</p></div>) : <p className="text-gray-500">Sem movimentações.</p>}</Modal>
  </div>
}
