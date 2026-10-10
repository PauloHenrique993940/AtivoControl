import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { useData, Row, changed, message, date } from '../services/ui'
import { Modal } from '../components/Modal'
import { Table } from '../components/Table'
import { Feedback } from '../components/Feedback'

export const Movimentacoes = () => {
  const { user } = useAuth()
  const canEdit = ['ADMIN', 'GESTOR_ARMARIA', 'OPERADOR'].includes(user?.role || '')
  const canReceive = ['ADMIN', 'GESTOR_ARMARIA'].includes(user?.role || '')
  const { data: rows, error, loading, reload } = useData<Row[]>('/movimentacoes')
  const { data: arms } = useData<Row[]>('/armamentos')
  const { data: ammo } = useData<Row[]>('/municoes')
  const { data: vests } = useData<Row[]>('/coletes')
  const { data: people } = useData<Row[]>('/responsaveis')
  const [form, setForm] = useState<Row | null>(null)
  const [category, setCategory] = useState('armamento')
  const [failure, setFailure] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const categoryLabel = category === 'armamento' ? 'Armamento' : category === 'colete' ? 'Colete' : 'Munição'
  const assets = category === 'armamento' ? arms : category === 'colete' ? vests : ammo
  const operations = category === 'municao' ? ['RETIRADA', 'DEVOLUCAO', ...(canReceive ? ['ENTRADA'] : [])] : ['RETIRADA', 'DEVOLUCAO', 'TRANSFERENCIA', 'MANUTENCAO']
  const filtered = (rows || []).filter(row => (!filter || row.tipo === filter) && JSON.stringify([row.armament?.numSerie, row.ammunition?.tipo, row.ammunition?.calibre, row.vest?.numSerie, row.vest?.numPatrimonio, row.vest?.modelo, row.responsible?.nome, row.motivo, row.user?.name]).toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  const pages = Math.max(1, Math.ceil(filtered.length / 20))
  const current = Math.min(page, pages)
  const assetLabel = (row: Row) => row.armament ? `Arma · ${row.armament.numSerie}` : row.vest ? `Colete · ${row.vest.numPatrimonio} · ${row.vest.tamanho}` : `Munição · ${row.ammunition?.tipo || '—'} ${row.ammunition?.calibre || ''}`
  const optionLabel = (row: Row) => category === 'armamento' ? `${row.tipo} ${row.numSerie} · ${row.status}` : category === 'colete' ? `${row.modelo} · ${row.numPatrimonio} · tamanho ${row.tamanho} · ${row.status}` : `${row.tipo} ${row.calibre} · estoque ${row.quantidade}`
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setFailure('')
    try {
      const input: Row = { tipo: form!.tipo, motivo: form!.motivo }
      if (category === 'armamento') input.armamentId = form!.assetId
      else if (category === 'colete') input.vestId = form!.assetId
      else { input.ammunitionId = form!.assetId; input.quantidade = Number(form!.quantidade) }
      if (form!.responsibleId && form!.tipo !== 'ENTRADA') input.responsibleId = form!.responsibleId
      if (form!.tipo === 'TRANSFERENCIA') input.destino = form!.destino
      await api.post('/movimentacoes', input)
      setForm(null); setSuccess('Movimentação registrada. Estoque e auditoria atualizados.'); changed()
    } catch (err) { setFailure(message(err)) } finally { setBusy(false) }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap justify-between gap-4"><h1 className="text-3xl font-black text-ssp-navy">Movimentações</h1>{canEdit && <button className="btn" onClick={() => { setForm({ tipo: 'RETIRADA', assetId: '', responsibleId: '', quantidade: 1, motivo: '', destino: '' }); setCategory('armamento'); setFailure(''); setSuccess('') }}>Nova movimentação</button>}</div>
    <Feedback error={error || (!form ? failure : '')} success={success} />
    <div className="flex flex-wrap gap-3"><input aria-label="Buscar movimentações" className="field max-w-md" placeholder="Buscar ativo, responsável ou motivo" value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} /><select aria-label="Tipo de movimentação" className="field max-w-xs" value={filter} onChange={event => { setFilter(event.target.value); setPage(1) }}><option value="">Todos os tipos</option>{['RETIRADA', 'DEVOLUCAO', 'TRANSFERENCIA', 'MANUTENCAO', 'ENTRADA'].map(type => <option key={type}>{type}</option>)}</select><button className="btn-secondary" onClick={() => void reload()}>Atualizar</button></div>
    {loading && <p role="status">Carregando...</p>}
    <Table headers={['Data', 'Tipo', 'Ativo', 'Quantidade', 'Responsável', 'Usuário', 'Destino / Motivo']}>{filtered.slice((current - 1) * 20, current * 20).map(row => <tr key={row.id}><td className="p-4">{date(row.data)}</td><td className="p-4">{row.tipo}</td><td className="p-4">{assetLabel(row)}</td><td className="p-4">{row.quantidade || '—'}</td><td className="p-4">{row.responsible?.nome || '—'}</td><td className="p-4">{row.user?.name}</td><td className="p-4">{row.destino && <strong>{row.destino} · </strong>}{row.motivo}</td></tr>)}{!filtered.length && !loading && <tr><td className="p-8 text-center" colSpan={7}>Nenhuma movimentação encontrada.</td></tr>}</Table>
    <div className="flex flex-wrap justify-between gap-3"><span>{filtered.length} registros · Página {current} de {pages}</span><div className="flex gap-2"><button className="btn-secondary" disabled={current <= 1} onClick={() => setPage(current - 1)}>Anterior</button><button className="btn-secondary" disabled={current >= pages} onClick={() => setPage(current + 1)}>Próxima</button></div></div>
    <p className="text-gray-500 text-sm">Armas e coletes são movimentados por unidade identificada. Munições usam quantidades. Para corrigir uma retirada, registre a devolução correspondente.</p>
    <Modal isOpen={Boolean(form)} title="Registrar movimentação" onClose={() => { if (!busy) setForm(null) }}><form onSubmit={submit} className="space-y-4">
      <Feedback error={failure} />
      <label className="block">Categoria<select aria-label="Categoria" className="field" value={category} onChange={event => { setCategory(event.target.value); setForm({ ...form, tipo: 'RETIRADA', assetId: '' }) }}><option value="armamento">Armamento</option><option value="municao">Munição</option><option value="colete">Colete</option></select></label>
      <label className="block">Operação<select aria-label="Operação" className="field" value={form?.tipo || 'RETIRADA'} onChange={event => setForm({ ...form, tipo: event.target.value })}>{operations.map(type => <option key={type}>{type}</option>)}</select></label>
      <label className="block">{categoryLabel}<select aria-label={categoryLabel} className="field" required value={form?.assetId || ''} onChange={event => setForm({ ...form, assetId: event.target.value })}><option value="">Selecione...</option>{assets?.map(row => <option key={row.id} value={row.id}>{optionLabel(row)}</option>)}</select></label>
      {category === 'municao' && <label className="block">Quantidade<input className="field" type="number" required min={1} max={2147483647} step={1} value={form?.quantidade ?? 1} onChange={event => setForm({ ...form, quantidade: event.target.value })} /></label>}
      {form?.tipo !== 'ENTRADA' && <label className="block">Responsável<select aria-label="Responsável" className="field" required={['RETIRADA', 'DEVOLUCAO'].includes(form?.tipo)} value={form?.responsibleId || ''} onChange={event => setForm({ ...form, responsibleId: event.target.value })}><option value="">Selecione...</option>{people?.map(row => <option key={row.id} value={row.id}>{row.nome} · {row.identificacaoFuncional}</option>)}</select></label>}
      {form?.tipo === 'TRANSFERENCIA' && <label className="block">Local de destino<input className="field" required value={form?.destino || ''} onChange={event => setForm({ ...form, destino: event.target.value })} /></label>}
      <label className="block">Motivo<textarea className="field" required maxLength={2000} value={form?.motivo || ''} onChange={event => setForm({ ...form, motivo: event.target.value })} /></label>
      <button className="btn w-full" disabled={busy}>{busy ? 'Registrando...' : 'Registrar movimentação'}</button>
    </form></Modal>
  </div>
}
