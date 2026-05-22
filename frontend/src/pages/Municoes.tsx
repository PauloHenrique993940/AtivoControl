import { Plus, Package, History } from 'lucide-react';
import { Table } from '../components/Table';
import { useState, useEffect } from 'react';
import { Modal } from '../components/Modal';
import { api } from '../services/api';

interface Ammunition {
  id: string;
  tipo: string;
  calibre: string;
  quantidade: number;
}

export const Municoes = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [estoque, setEstoque] = useState<Ammunition[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    tipo: '', calibre: '', quantidade: 0
  });

  const fetchEstoque = async () => {
    try {
      const response = await api.get('/municoes');
      setEstoque(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchEstoque(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/municoes', formData);
      setIsModalOpen(false);
      setFormData({ tipo: '', calibre: '', quantidade: 0 });
      fetchEstoque();
    } catch (error) {
      alert('Falha ao registrar lote de munição.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-ssp-navy tracking-tighter uppercase flex items-center gap-3">
            <Package className="text-ssp-red" />
            Lotes de Munição
          </h1>
          <p className="text-gray-500 text-[10px] font-bold mt-1 tracking-[0.2em] uppercase">Controle de Suprimentos e Estoque Bélico</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-ssp-navy hover:bg-ssp-navy/90 text-white px-6 py-3.5 rounded-xl flex items-center gap-3 transition-all border-b-4 border-ssp-red font-black uppercase tracking-widest text-[11px] shadow-lg"
        >
          <Plus size={18} />
          Adicionar Novo Lote
        </button>
      </div>

      <Table headers={['Tipo de Munição', 'Calibre Nominal', 'Quantidade Atual', 'Status de Estoque', 'Ações']}>
        {estoque.map((item) => (
          <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
            <td className="px-6 py-5">
              <p className="text-sm font-black text-ssp-navy uppercase">{item.tipo}</p>
            </td>
            <td className="px-6 py-5">
              <p className="text-xs font-mono text-ssp-gold bg-gray-50 px-2 py-1 rounded border border-gray-100 inline-block font-bold">{item.calibre}</p>
            </td>
            <td className="px-6 py-5">
              <span className="text-sm font-black text-ssp-navy">{item.quantidade} <span className="text-[10px] text-gray-400 font-bold ml-1 uppercase">Unidades</span></span>
            </td>
            <td className="px-6 py-5">
              <div className="w-32 h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <div 
                  className={`h-full transition-all ${item.quantidade < 100 ? 'bg-ssp-red shadow-[0_0_8px_rgba(200,16,46,0.4)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'}`}
                  style={{ width: `${Math.min((item.quantidade / 1000) * 100, 100)}%` }}
                ></div>
              </div>
            </td>
            <td className="px-6 py-5">
              <button title="Histórico" className="p-2.5 bg-gray-100 text-gray-400 hover:text-ssp-gold hover:bg-white border border-gray-200 rounded-xl transition-all shadow-sm"><History size={16} /></button>
            </td>
          </tr>
        ))}
      </Table>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Registro de Lote">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tipo de Munição</label>
            <input type="text" required value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none transition-all text-xs font-bold uppercase placeholder:text-gray-400" placeholder="Ex: Ponta Oca" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Calibre</label>
              <input type="text" required value={formData.calibre} onChange={e => setFormData({...formData, calibre: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none transition-all text-xs font-bold uppercase placeholder:text-gray-400" placeholder="Ex: 9mm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Quantidade Inicial</label>
              <input type="number" required value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: parseInt(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none transition-all text-xs font-bold" placeholder="0" />
            </div>
          </div>
          
          <button disabled={isLoading} type="submit" className="w-full bg-ssp-navy text-white py-4 rounded-xl font-black uppercase tracking-[0.1em] shadow-lg border-b-4 border-ssp-red mt-4 active:translate-y-0.5 transition-all disabled:opacity-50 text-xs">
            {isLoading ? 'PROCESSANDO...' : 'REGISTRAR NO ESTOQUE'}
          </button>
        </form>
      </Modal>
    </div>
  );
};