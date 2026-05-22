import { ShieldCheck, Wrench, Navigation, Box, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const movimentacoesData = [
  { name: 'Jan', retiradas: 40, devolucoes: 24 },
  { name: 'Fev', retiradas: 30, devolucoes: 13 },
  { name: 'Mar', retiradas: 20, devolucoes: 98 },
  { name: 'Abr', retiradas: 27, devolucoes: 39 },
  { name: 'Mai', retiradas: 18, devolucoes: 48 },
  { name: 'Jun', retiradas: 23, devolucoes: 38 },
];

export const Dashboard = () => {
  const stats = [
    { title: 'Total Arsenal', value: '120', icon: ShieldCheck, color: 'text-white', bg: 'bg-ssp-navy', border: 'border-gray-200' },
    { title: 'Em Operação', value: '80', icon: Navigation, color: 'text-white', bg: 'bg-green-600', border: 'border-gray-200' },
    { title: 'Manutenção', value: '15', icon: Wrench, color: 'text-white', bg: 'bg-ssp-red', border: 'border-gray-200' },
    { title: 'Estoque Munição', value: '5k+', icon: Box, color: 'text-white', bg: 'bg-amber-500', border: 'border-gray-200' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-ssp-navy tracking-tighter flex items-center gap-3 uppercase">
            <Target className="text-ssp-red" />
            Centro de Comando de Ativos
          </h1>
          <p className="text-gray-500 text-xs font-bold mt-1 tracking-[0.2em] uppercase">Monitoramento em Tempo Real - SSP/BA</p>
        </div>
        <div className="bg-gray-100 border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
          <TrendingUp className="text-green-600" size={20} />
          <span className="text-gray-700 text-xs font-bold uppercase tracking-widest">Sincronizado</span>
        </div>
      </div>
      
      {/* Cards de Estatísticas Táticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`bg-white p-6 rounded-2xl border ${stat.border} shadow-sm relative overflow-hidden group hover:shadow-md transition-all border-l-4`} style={{ borderLeftColor: stat.bg.includes('navy') ? '#1B365D' : stat.bg.includes('green') ? '#16a34a' : stat.bg.includes('red') ? '#C8102E' : '#f59e0b' }}>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{stat.title}</p>
                <p className="text-4xl font-black text-ssp-navy">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} shadow-lg shadow-gray-200`}>
                <stat.icon size={24} />
              </div>
            </div>
            {/* Decoração de fundo do card */}
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-gray-900">
               <stat.icon size={100} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Operações */}
        <div className="lg:col-span-2 bg-white border border-gray-200 p-8 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-ssp-navy uppercase tracking-widest flex items-center gap-2 text-sm">
               <TrendingUp className="text-ssp-red" size={20} />
               Fluxo de Carga e Descarga
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-ssp-navy rounded-full"></div>
                <span className="text-[10px] text-gray-500 font-bold uppercase">Saídas Operacionais</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movimentacoesData}>
                <defs>
                  <linearGradient id="colorSsp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B365D" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1B365D" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  itemStyle={{color: '#1B365D', fontSize: '12px', fontWeight: 'bold'}}
                />
                <Area type="monotone" dataKey="retiradas" stroke="#1B365D" strokeWidth={4} fillOpacity={1} fill="url(#colorSsp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alertas Críticos */}
        <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-sm relative">
          <h3 className="font-black text-ssp-navy uppercase tracking-widest mb-6 flex items-center gap-2 text-sm">
            <AlertTriangle className="text-ssp-red" size={20} />
            Alertas de Segurança
          </h3>
          <div className="space-y-4">
             {[
               { id: '3442', msg: 'Manutenção Vencida: Fuzil IA2 #9902', time: '2h atrás', priority: 'high' },
               { id: '1102', msg: 'Baixo Estoque: Munição 9mm', time: '5h atrás', priority: 'medium' },
               { id: '8821', msg: 'Carga Não Devolvida: Agente Silva', time: '12h atrás', priority: 'high' },
             ].map((alert, i) => (
               <div key={i} className={`p-4 rounded-xl border-l-4 ${alert.priority === 'high' ? 'bg-red-50 border-ssp-red' : 'bg-blue-50 border-ssp-navy'} transition-all hover:translate-x-1 cursor-pointer group`}>
                 <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">{alert.time}</p>
                 <p className="text-xs text-gray-800 font-bold tracking-tight group-hover:text-ssp-navy transition-colors">{alert.msg}</p>
               </div>
             ))}
          </div>
          <button className="w-full mt-8 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all border border-gray-200">Ver Todas as Notificações</button>
        </div>
      </div>
    </div>
  );
};