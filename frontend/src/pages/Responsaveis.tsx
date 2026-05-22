import { UserPlus, UserCheck, Shield, Edit } from 'lucide-react';
import { Table } from '../components/Table';
import { useState, useEffect } from 'react';
import { Modal } from '../components/Modal';
import { api } from '../services/api';

interface Responsible {
  id: string;
  nome: string;
  identificacaoFuncional: string;
  setor: string;
}

export const Responsaveis = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [responsaveis, setResponsaveis] = useState<Responsible[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: '', identificacaoFuncional: '', setor: ''
  });

  const fetchResponsaveis = async () => {
    try {
      const response = await api.get('/responsaveis');
      setResponsaveis(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchResponsaveis(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/responsaveis', formData);
      setIsModalOpen(false);
      setFormData({ nome: '', identificacaoFuncional: '', setor: '' });
      fetchResponsaveis();
    } catch (error) {
      alert('Falha ao cadastrar responsável.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-ssp-navy tracking-tighter uppercase flex items-center gap-3">
            <UserCheck className="text-ssp-red" />
            Agentes Autorizados
          </h1>
          <p className="text-gray-500 text-[10px] font-bold mt-1 tracking-[0.2em] uppercase">Gestão de Identidades e Acessos Bélicos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-ssp-navy hover:bg-ssp-navy/90 text-white px-6 py-3.5 rounded-xl flex items-center gap-3 transition-all border-b-4 border-ssp-red font-black uppercase tracking-widest text-[11px] shadow-lg"
        >
          <UserPlus size={18} />
          Novo Responsável
        </button>
      </div>

      <Table headers={['Nome do Agente', 'ID Funcional / Matrícula', 'Setor / Unidade', 'Status de Acesso', 'Ações']}>
        {responsaveis.map((p) => (
          <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
            <td className="px-6 py-5">
              <p className="text-sm font-black text-ssp-navy uppercase">{p.nome}</p>
            </td>
            <td className="px-6 py-5">
              <p className="text-xs font-mono text-ssp-gold bg-gray-50 px-2 py-1 rounded border border-gray-100 inline-block font-bold">{p.identificacaoFuncional}</p>
            </td>
            <td className="px-6 py-5">
              <span className="text-xs font-bold text-gray-600 uppercase">{p.setor}</span>
            </td>
            <td className="px-6 py-5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Autorizado</span>
              </div>
            </td>
            <td className="px-6 py-5">
              <div className="flex items-center gap-2">
                <button title="Vincular Arma" className="p-2.5 bg-gray-100 text-gray-500 hover:text-ssp-gold hover:bg-white border border-gray-200 rounded-xl transition-all shadow-sm"><Shield size={16} /></button>
                <button title="Editar" className="p-2.5 bg-gray-100 text-gray-500 hover:text-ssp-navy hover:bg-white border border-gray-200 rounded-xl transition-all shadow-sm"><Edit size={16} /></button>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Credenciamento de Agente">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nome Completo</label>
            <input type="text" required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none transition-all text-xs font-bold uppercase placeholder:text-gray-400" placeholder="Nome do agente" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">ID Funcional / Matrícula</label>
              <input type="text" required value={formData.identificacaoFuncional} onChange={e => setFormData({...formData, identificacaoFuncional: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none transition-all font-mono text-xs font-bold" placeholder="000.000-0" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Setor / Unidade</label>
              <input type="text" required value={formData.setor} onChange={e => setFormData({...formData, setor: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none transition-all text-xs font-bold uppercase placeholder:text-gray-400" placeholder="Ex: Operacional" />
            </div>
          </div>
          
          <button disabled={isLoading} type="submit" className="w-full bg-ssp-navy text-white py-4 rounded-xl font-black uppercase tracking-[0.1em] shadow-lg border-b-4 border-ssp-red mt-4 active:translate-y-0.5 transition-all disabled:opacity-50 text-xs">
            {isLoading ? 'PROCESSANDO...' : 'EFETUAR CREDENCIAMENTO'}
          </button>
        </form>
      </Modal>
    </div>
  );
};