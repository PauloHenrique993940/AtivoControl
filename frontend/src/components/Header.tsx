import { Search, UserCircle, BellRing, Settings, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export const Header = () => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, type: 'critical', title: 'Manutenção Vencida', msg: 'Fuzil IA2 #9902 requer revisão imediata.', time: '2h atrás' },
    { id: 2, type: 'warning', title: 'Estoque Baixo', msg: 'Lote de Munição 9mm abaixo do limite (85 un).', time: '5h atrás' },
    { id: 3, type: 'info', title: 'Nova Carga', msg: 'Agente Silva efetuou retirada de Pistola TH9.', time: '12h atrás' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-8 shadow-sm relative z-50">
      
      {/* Identificação de Área */}
      <div className="flex items-center gap-6">
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-80 focus-within:border-ssp-navy focus-within:bg-white transition-all group shadow-sm">
          <Search className="text-gray-400 group-focus-within:text-ssp-navy" size={18} />
          <input 
            type="text" 
            placeholder="Consultar Registro (Sigma/Sinarm)..." 
            className="bg-transparent border-none outline-none ml-3 w-full text-xs text-gray-700 placeholder:text-gray-400 font-bold tracking-wider uppercase"
          />
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4 border-r border-gray-200 pr-8">
          {/* Botão de Notificações */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2.5 rounded-xl transition-all relative ${showNotifications ? 'bg-ssp-navy text-white' : 'text-gray-400 hover:text-ssp-navy hover:bg-gray-100'}`}
            >
              <BellRing size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-ssp-red rounded-full border-2 border-white"></span>
            </button>

            {/* Painel de Notificações (Dropdown) */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-ssp-navy uppercase tracking-widest">Centro de Alertas</h3>
                  <span className="bg-ssp-red text-white text-[8px] font-black px-2 py-0.5 rounded-full">3 NOVOS</span>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-5 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          notif.type === 'critical' ? 'bg-red-50 text-ssp-red' : 
                          notif.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-ssp-navy'
                        }`}>
                          {notif.type === 'critical' ? <ShieldAlert size={16} /> : <AlertTriangle size={16} />}
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-black text-ssp-navy uppercase tracking-tight">{notif.title}</p>
                          <p className="text-[10px] text-gray-500 font-bold leading-tight">{notif.msg}</p>
                          <div className="flex items-center gap-1 text-[8px] text-gray-400 font-black uppercase mt-2">
                             <Clock size={10} />
                             {notif.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button className="w-full py-4 bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-ssp-navy transition-colors border-t border-gray-100">
                  Marcar todas como lidas
                </button>
              </div>
            )}
          </div>

          <button className="p-2.5 text-gray-400 hover:text-ssp-navy hover:bg-gray-100 rounded-xl transition-all group relative">
            <Settings size={20} />
          </button>
        </div>

        {/* Perfil Agente */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-black text-ssp-navy tracking-widest uppercase">{user?.name || 'Agente Operacional'}</p>
            <p className="text-[10px] text-gray-500 font-bold tracking-tighter uppercase">{user?.role || 'Acesso Restrito'}</p>
          </div>
          <div className="relative group cursor-pointer">
            <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-ssp-navy shadow-sm group-hover:border-ssp-gold transition-all overflow-hidden">
               <UserCircle size={28} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
};