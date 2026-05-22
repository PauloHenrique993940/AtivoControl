import { Plus, ArrowLeftRight, Clock, User, Shield } from 'lucide-react';
import { Table } from '../components/Table';
import { useState, useEffect } from 'react';
import { Modal } from '../components/Modal';
import { api } from '../services/api';

interface Movement {
  id: string;
  tipo: string;
  data: string;
  motivo?: string;
  armament?: { tipo: string; marca: string; modelo: string; numSerie: string };
  responsible?: { nome: string; identificacaoFuncional: string };
}

interface Option {
  id: string;
  label: string;
}

export const Movimentacoes = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [armas, setArmas] = useState<Option[]>([]);
  const [responsaveis, setResponsaveis] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    tipo: 'RETIRADA', motivo: '', armamentId: '', responsibleId: ''
  });

  const fetchData = async () => {
    try {
      const [moveRes, armaRes, respRes] = await Promise.all([
        api.get('/movimentacoes'),
        api.get('/armamentos'),
        api.get('/responsaveis')
      ]);
      setMovements(moveRes.data);
      setArmas(armaRes.data.map((a: any) => ({ id: a.id, label: `${a.tipo} ${a.marca} ${a.modelo} (${a.numSerie})` })));
      setResponsaveis(respRes.data.map((r: any) => ({ id: r.id, label: `${r.nome} (${r.identificacaoFuncional})` })));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/movimentacoes', formData);
      setIsModalOpen(false);
      setFormData({ tipo: 'RETIRADA', motivo: '', armamentId: '', responsibleId: '' });
      fetchData();
    } catch (error) {
      alert('Falha ao registrar movimentação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-ssp-navy tracking-tighter uppercase flex items-center gap-3">
            <ArrowLeftRight className="text-ssp-red" />
            Carga e Descarga
          </h1>
          <p className="text-gray-500 text-[10px] font-bold mt-1 tracking-[0.2em] uppercase">Controle de Fluxo Operacional de Ativos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-ssp-navy hover:bg-ssp-navy/90 text-white px-6 py-3.5 rounded-xl flex items-center gap-3 transition-all border-b-4 border-ssp-red font-black uppercase tracking-widest text-[11px] shadow-lg"
        >
          <Plus size={18} />
          Registrar Saída/Entrada
        </button>
      </div>

      <Table headers={['Ativo Bélico', 'Agente Responsável', 'Tipo de Fluxo', 'Data e Horário', 'Observações']}>
        {movements.map((move) => (
          <tr key={move.id} className="hover:bg-gray-50 transition-colors group">
            <td className="px-6 py-5">
              <div className="flex items-center gap-3">
                <Shield size={16} className="text-gray-400" />
                <div>
                  <p className="text-sm font-black text-ssp-navy uppercase">{move.armament?.tipo} {move.armament?.modelo}</p>
                  <p className="text-[10px] text-ssp-gold font-mono font-bold">{move.armament?.numSerie}</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-5">
              <div className="flex items-center gap-3">
                <User size={16} className="text-gray-400" />
                <p className="text-xs font-bold text-gray-700 uppercase">{move.responsible?.nome}</p>
              </div>
            </td>
            <td className="px-6 py-5">
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                move.tipo === 'RETIRADA' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                move.tipo === 'DEVOLUCAO' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-200'
              }`}>
                {move.tipo}
              </span>
            </td>
            <td className="px-6 py-5">
              <div className="flex items-center gap-2 text-gray-500">
                <Clock size={14} />
                <span className="text-xs font-bold">{new Date(move.data).toLocaleString('pt-BR')}</span>
              </div>
            </td>
            <td className="px-6 py-5">
              <p className="text-[10px] text-gray-400 font-medium italic">{move.motivo || '-'}</p>
            </td>
          </tr>
        ))}
      </Table>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Registro de Movimentação">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tipo de Operação</label>
            <select 
              value={formData.tipo} 
              onChange={e => setFormData({...formData, tipo: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none transition-all text-xs font-bold uppercase appearance-none cursor-pointer"
            >
              <option value="RETIRADA">RETIRADA (SAÍDA)</option>
              <option value="DEVOLUCAO">DEVOLUÇÃO (ENTRADA)</option>
              <option value="MANUTENCAO">MANUTENÇÃO</option>
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Armamento</label>
            <select 
              required
              value={formData.armamentId} 
              onChange={e => setFormData({...formData, armamentId: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none transition-all text-xs font-bold uppercase appearance-none cursor-pointer"
            >
              <option value="">Selecione a arma...</option>
              {armas.map(a => <option key={a.id} value={a.id} className="text-gray-900">{a.label}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Agente Responsável</label>
            <select 
              required
              value={formData.responsibleId} 
              onChange={e => setFormData({...formData, responsibleId: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none transition-all text-xs font-bold uppercase appearance-none cursor-pointer"
            >
              <option value="">Selecione o agente...</option>
              {responsaveis.map(r => <option key={r.id} value={r.id} className="text-gray-900">{r.label}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Observações / Motivo</label>
            <textarea 
              value={formData.motivo} 
              onChange={e => setFormData({...formData, motivo: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none transition-all text-xs font-bold h-24 resize-none uppercase placeholder:text-gray-400" 
              placeholder="Descreva o motivo da operação..."
            />
          </div>
          
          <button disabled={isLoading} type="submit" className="w-full bg-ssp-navy text-white py-4 rounded-xl font-black uppercase tracking-[0.1em] shadow-lg border-b-4 border-ssp-red mt-4 active:translate-y-0.5 transition-all disabled:opacity-50 text-xs">
            {isLoading ? 'PROCESSANDO...' : 'REGISTRAR OPERAÇÃO'}
          </button>
        </form>
      </Modal>
    </div>
  );
};