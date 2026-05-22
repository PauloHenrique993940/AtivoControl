import { Plus, Eye, Edit, History, ShieldAlert, Trash2 } from 'lucide-react';
import { Table } from '../components/Table';
import { useState, useEffect } from 'react';
import { Modal } from '../components/Modal';
import { api } from '../services/api';

interface Armament {
  id: string;
  tipo: string;
  marca: string;
  modelo: string;
  calibre: string;
  numSerie: string;
  numRegistro: string;
  status: string;
}

export const Armamentos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedArmaId, setSelectedArmaId] = useState<string | null>(null);
  
  const [armas, setArmas] = useState<Armament[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    tipo: '', marca: '', modelo: '', calibre: '', numSerie: '', numRegistro: '', status: 'ESTOQUE'
  });

  const fetchArmamentos = async () => {
    try {
      const response = await api.get('/armamentos');
      setArmas(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchArmamentos(); }, []);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setSelectedArmaId(null);
    setFormData({ tipo: '', marca: '', modelo: '', calibre: '', numSerie: '', numRegistro: '', status: 'ESTOQUE' });
    setIsModalOpen(true);
  };

  const handleEdit = (arma: Armament) => {
    setIsEditMode(true);
    setSelectedArmaId(arma.id);
    setFormData({
      tipo: arma.tipo,
      marca: arma.marca,
      modelo: arma.modelo,
      calibre: arma.calibre,
      numSerie: arma.numSerie,
      numRegistro: arma.numRegistro,
      status: arma.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este armamento? Esta ação é irreversível.')) return;
    try {
      await api.delete(`/armamentos/${id}`);
      fetchArmamentos();
    } catch (error) {
      alert('Falha ao excluir o armamento.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isEditMode && selectedArmaId) {
        await api.put(`/armamentos/${selectedArmaId}`, formData);
      } else {
        await api.post('/armamentos', formData);
      }
      setIsModalOpen(false);
      fetchArmamentos();
    } catch (error) {
      alert('Falha na operação de salvamento.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-ssp-navy tracking-tighter uppercase flex items-center gap-3">
            <ShieldAlert className="text-ssp-red" />
            Arsenal de Armamentos
          </h1>
          <p className="text-gray-500 text-[10px] font-bold mt-1 tracking-[0.2em] uppercase">Controle Patrimonial de Material Bélico</p>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="bg-ssp-navy hover:bg-ssp-navy/90 text-white px-6 py-3.5 rounded-xl flex items-center gap-3 transition-all border-b-4 border-ssp-red font-black uppercase tracking-widest text-[11px] shadow-lg"
        >
          <Plus size={18} />
          Cadastrar Novo Ativo
        </button>
      </div>

      <Table headers={['Tipo / Modelo', 'Identificação', 'Calibre', 'Status Operacional', 'Ações de Controle']}>
        {armas.map((arma) => (
          <tr key={arma.id} className="hover:bg-gray-50 transition-colors group">
            <td className="px-6 py-5">
              <p className="text-sm font-black text-ssp-navy uppercase">{arma.tipo}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{arma.marca} {arma.modelo}</p>
            </td>
            <td className="px-6 py-5">
              <p className="text-xs font-mono text-ssp-gold bg-gray-50 px-2 py-1 rounded border border-gray-100 inline-block font-bold">{arma.numSerie}</p>
            </td>
            <td className="px-6 py-5">
              <span className="text-xs font-bold text-gray-600">{arma.calibre}</span>
            </td>
            <td className="px-6 py-5">
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                arma.status === 'ESTOQUE' ? 'bg-green-50 text-green-600 border-green-200' :
                arma.status === 'USO' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-red-50 text-ssp-red border-red-200'
              }`}>
                {arma.status}
              </span>
            </td>
            <td className="px-6 py-5">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => alert(`Visualizando detalhes de: ${arma.tipo} ${arma.numSerie}`)}
                  title="Dossiê" 
                  className="p-2.5 bg-gray-100 text-gray-500 hover:text-ssp-navy hover:bg-white border border-gray-200 rounded-xl transition-all shadow-sm"
                >
                  <Eye size={16} />
                </button>
                <button 
                  onClick={() => handleEdit(arma)}
                  title="Atualizar" 
                  className="p-2.5 bg-gray-100 text-gray-500 hover:text-ssp-gold hover:bg-white border border-gray-200 rounded-xl transition-all shadow-sm"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(arma.id)}
                  title="Excluir" 
                  className="p-2.5 bg-gray-100 text-gray-500 hover:text-ssp-red hover:bg-white border border-gray-200 rounded-xl transition-all shadow-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? 'Atualizar Ativo Bélico' : 'Novo Registro Bélico'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tipo de Armamento</label>
              <input type="text" required value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none transition-all text-xs uppercase font-bold placeholder:text-gray-400" placeholder="Ex: Pistola" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Fabricante / Marca</label>
              <input type="text" required value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none transition-all text-xs uppercase font-bold placeholder:text-gray-400" placeholder="Ex: Taurus" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Modelo Específico</label>
              <input type="text" required value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none transition-all text-xs uppercase font-bold placeholder:text-gray-400" placeholder="Ex: TH9" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Calibre Nominal</label>
              <input type="text" required value={formData.calibre} onChange={e => setFormData({...formData, calibre: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none transition-all text-xs uppercase font-bold placeholder:text-gray-400" placeholder="Ex: 9mm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nº de Série</label>
              <input type="text" required value={formData.numSerie} onChange={e => setFormData({...formData, numSerie: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none transition-all font-mono text-xs font-bold" placeholder="Serial único" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nº de Registro</label>
              <input type="text" required value={formData.numRegistro} onChange={e => setFormData({...formData, numRegistro: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none transition-all font-mono text-xs font-bold" placeholder="Registro oficial" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Status Operacional</label>
            <select 
              value={formData.status} 
              onChange={e => setFormData({...formData, status: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none transition-all text-xs font-bold uppercase appearance-none cursor-pointer"
            >
              <option value="ESTOQUE">ESTOQUE (DISPONÍVEL)</option>
              <option value="USO">EM USO / OPERAÇÃO</option>
              <option value="MANUTENCAO">MANUTENÇÃO / REPARO</option>
            </select>
          </div>
          
          <button disabled={isLoading} type="submit" className="w-full bg-ssp-navy text-white py-4 rounded-xl font-black uppercase tracking-[0.1em] shadow-lg border-b-4 border-ssp-red mt-4 active:translate-y-0.5 transition-all disabled:opacity-50 text-xs">
            {isLoading ? 'PROCESSANDO...' : isEditMode ? 'ATUALIZAR REGISTRO' : 'REGISTRAR NO SISTEMA'}
          </button>
        </form>
      </Modal>
    </div>
  );
};