import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { api } from './api'

export type Row = Record<string, any>
export function message(error: unknown) { return axios.isAxiosError(error) ? error.response?.data?.error || 'Não foi possível conectar à API.' : error instanceof Error ? error.message : 'Não foi possível concluir a operação.' }
export function changed() { window.dispatchEvent(new Event('data:updated')) }
export function useData<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => { setLoading(true); try { const response = await api.get<T>(endpoint); setData(response.data); setError('') } catch (err) { setError(message(err)) } finally { setLoading(false) } }, [endpoint])
  useEffect(() => { void reload(); const refresh = () => { void reload() }; window.addEventListener('data:updated', refresh); return () => window.removeEventListener('data:updated', refresh) }, [reload])
  return { data, error, loading, reload }
}
export function saveBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) }
export function date(value: string) { return value ? new Date(value).toLocaleString('pt-BR') : '—' }
