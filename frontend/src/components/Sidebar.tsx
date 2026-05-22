import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Shield, Package, ArrowLeftRight, UserCheck, FileBarChart, Power, Target, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { logout } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'Painel Central', path: '/' },
    { icon: Shield, label: 'Arsenal de Armas', path: '/armamentos' },
    { icon: Package, label: 'Lotes de Munição', path: '/municoes' },
    { icon: ArrowLeftRight, label: 'Carga/Descarga', path: '/movimentacoes' },
    { icon: UserCheck, label: 'Agentes Autorizados', path: '/responsaveis' },
    { icon: FileBarChart, label: 'Auditoria e Relatórios', path: '/relatorios' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ];

  return (
    <aside className="w-72 bg-gray-50 text-gray-900 flex flex-col h-full border-r border-gray-200 relative overflow-hidden">
      {/* Detalhe Vermelho Lateral */}
      <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-ssp-red opacity-80"></div>

      <div className="p-8 flex flex-col items-center border-b border-gray-200 bg-white">
        <div className="w-14 h-14 bg-ssp-navy border-2 border-ssp-gold rounded-xl flex items-center justify-center mb-3 shadow-lg group">
          <Target className="text-ssp-gold" size={28} />
        </div>
        <h1 className="text-xl font-black tracking-[0.15em] text-ssp-navy text-center">ATIVOCONTROL</h1>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase">SSP - BAHIA</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-ssp-navy text-white shadow-md' 
                  : 'text-gray-600 hover:text-ssp-navy hover:bg-white border border-transparent hover:border-gray-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={`${isActive ? 'text-ssp-gold' : 'text-gray-400 group-hover:text-ssp-navy'}`} />
                <span className="font-bold text-xs tracking-wide uppercase">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-gray-200 bg-white">
        <div className="mb-4 flex items-center gap-2.5 px-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Sistema Online</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-4 px-5 py-3.5 w-full text-left text-gray-500 hover:bg-red-50 hover:text-ssp-red rounded-xl transition-all duration-200 group border border-transparent hover:border-red-100"
        >
          <Power size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="font-black text-xs uppercase tracking-widest">Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
};