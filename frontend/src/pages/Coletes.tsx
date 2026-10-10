import { Inventory } from '../components/Inventory'

export const Coletes = () => <Inventory title="Coletes" endpoint="/coletes" columns={['marca', 'modelo', 'tamanho', 'nivelProtecao', 'numPatrimonio', 'dataValidade', 'status']} summary={rows => [
  { label: 'Coletes cadastrados', value: rows.length },
  { label: 'Coletes em estoque', value: rows.filter(row => row.status === 'ESTOQUE').length },
  { label: 'Coletes em uso', value: rows.filter(row => row.status === 'USO').length },
  { label: 'Validade vencida', value: rows.filter(row => row.dataValidade && String(row.dataValidade).slice(0, 10) < new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10) && row.status !== 'BAIXADA').length },
]} fields={[
  { key: 'marca', label: 'Marca', required: true },
  { key: 'modelo', label: 'Modelo', required: true },
  { key: 'tamanho', label: 'Tamanho', required: true, suggestions: ['PP', 'P', 'M', 'G', 'GG', 'XGG'] },
  { key: 'nivelProtecao', label: 'Nível de proteção', required: true, suggestions: ['IIA', 'II', 'IIIA', 'III', 'IV'] },
  { key: 'numSerie', label: 'Número de série', required: true },
  { key: 'numPatrimonio', label: 'Número de patrimônio', required: true },
  { key: 'dataAquisicao', label: 'Data de aquisição', type: 'date', required: true, initial: new Date().toISOString().slice(0, 10) },
  { key: 'local', label: 'Local', required: true, initial: 'Armaria Central' },
  { key: 'status', label: 'Status', options: ['ESTOQUE', 'USO', 'MANUTENCAO', 'BLOQUEADA', 'BAIXADA'], initial: 'ESTOQUE' },
  { key: 'dataFabricacao', label: 'Data de fabricação', type: 'date' },
  { key: 'dataValidade', label: 'Data de validade', type: 'date' },
  { key: 'dataManutencao', label: 'Última manutenção', type: 'date' },
  { key: 'observacoes', label: 'Observações' },
]} />
