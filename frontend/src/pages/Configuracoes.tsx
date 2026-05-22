import { Settings, User, Shield, Bell, Database, Globe, Save, Trash2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export const Configuracoes = () => {
  const [activeTab, setActiveTab] = useState('unidade');

  const tabs = [
    { id: 'unidade', label: 'Dados da Unidade', icon: Globe },
    { id: 'perfil', label: 'Meu Perfil', icon: User },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'sistema', label: 'Parâmetros do Sistema', icon: Database },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-end border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-ssp-navy tracking-tighter uppercase flex items-center gap-3">
            <Settings className="text-ssp-red" />
            Configurações do Sistema
          </h1>
          <p className="text-gray-500 text-[10px] font-bold mt-1 tracking-[0.2em] uppercase">Gerenciamento de Parâmetros e Segurança</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Menu Lateral de Configurações */}
        <div className="lg:w-72 flex-shrink-0 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest border ${
                activeTab === tab.id 
                  ? 'bg-ssp-navy text-white shadow-lg border-ssp-navy' 
                  : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={20} className={activeTab === tab.id ? 'text-ssp-gold' : 'text-gray-400'} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1 bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden min-h-[500px]">
          {activeTab === 'unidade' && (
            <div className="p-10 space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-6">
                 <Globe className="text-ssp-red" size={24} />
                 <h2 className="text-xl font-black text-ssp-navy uppercase tracking-widest">Identidade da Unidade</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nome da Unidade Operacional</label>
                  <input type="text" defaultValue="COPOL - Coordenação de Operações" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none font-bold text-xs uppercase" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Sigla / ID SSP</label>
                  <input type="text" defaultValue="SSP-BA-COPOL" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none font-bold text-xs uppercase" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Endereço de Base</label>
                  <input type="text" defaultValue="Salvador, Bahia - Centro Administrativo" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none font-bold text-xs uppercase" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Telefone da Armaria</label>
                  <input type="text" defaultValue="(71) 3115-XXXX" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none font-bold text-xs uppercase" />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button onClick={() => alert('Configurações da Unidade Salvas!')} className="bg-ssp-navy text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-3 border-b-4 border-ssp-red hover:bg-ssp-navy/90 transition-all active:translate-y-0.5">
                  <Save size={18} className="text-ssp-gold" /> Salvar Identidade
                </button>
              </div>
            </div>
          )}

          {activeTab === 'perfil' && (
            <div className="p-10 space-y-8 animate-in slide-in-from-right-4 duration-300 text-center py-20">
               <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-gray-200">
                  <User size={48} className="text-gray-400" />
               </div>
               <h3 className="text-lg font-black text-ssp-navy uppercase">Configurações de Perfil</h3>
               <p className="text-gray-500 text-xs font-bold uppercase tracking-widest max-w-sm mx-auto">Em breve: Edição de foto, assinatura digital e alteração de e-mail institucional.</p>
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div className="p-10 space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-6">
                 <ShieldCheck className="text-ssp-red" size={24} />
                 <h2 className="text-xl font-black text-ssp-navy uppercase tracking-widest">Segurança da Conta</h2>
              </div>
              
              <div className="space-y-6 max-w-md">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Senha Atual</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none font-bold text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nova Senha</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none font-bold text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 focus:ring-1 focus:ring-ssp-navy outline-none font-bold text-xs" />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
                <button className="bg-gray-100 text-gray-500 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs border border-gray-200 hover:bg-white transition-all">Cancelar</button>
                <button onClick={() => alert('Senha Alterada!') } className="bg-ssp-navy text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-3 border-b-4 border-ssp-red hover:bg-ssp-navy/90 transition-all active:translate-y-0.5 shadow-lg">
                  <Shield size={18} className="text-ssp-gold" /> Atualizar Credenciais
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notificacoes' && (
            <div className="p-10 space-y-8 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-black text-ssp-navy uppercase">Preferências de Alerta</h3>
              <div className="space-y-4">
                {[
                  { label: 'Alertas de Manutenção Vencida', active: true },
                  { label: 'Notificar Baixo Estoque de Munição', active: true },
                  { label: 'Relatórios Semanais por E-mail', active: false },
                  { label: 'Alertas de Devolução Atrasada', active: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-xs font-black text-gray-700 uppercase tracking-wide">{item.label}</span>
                    <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${item.active ? 'bg-ssp-navy' : 'bg-gray-300'}`}>
                       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${item.active ? 'right-1' : 'left-1'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sistema' && (
            <div className="p-10 space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-red-50 border border-red-200 p-8 rounded-3xl space-y-4">
                 <h3 className="text-ssp-red font-black uppercase text-sm flex items-center gap-2">
                    <Trash2 size={20} /> Área de Perigo
                 </h3>
                 <p className="text-[11px] text-gray-600 font-bold uppercase tracking-wider leading-relaxed">As ações abaixo são irreversíveis e afetam todo o banco de dados do sistema AtivoControl.</p>
                 <div className="flex flex-wrap gap-4 pt-4">
                    <button className="bg-white border border-red-200 text-ssp-red px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all">Limpar Histórico de Auditoria</button>
                    <button className="bg-ssp-red text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-red-700 transition-all">Resetar Banco de Dados</button>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};