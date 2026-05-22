import { Download, FileBarChart, Shield, Target, Calendar, ClipboardList, Printer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Table } from '../components/Table';
import { api } from '../services/api';

interface AuditLog {
  id: string;
  tipo: string;
  data: string;
  armament?: { tipo: string; numSerie: string };
  responsible?: { nome: string };
}

export const Relatorios = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/movimentacoes');
      setLogs(response.data.slice(0, 10)); // Pega os 10 mais recentes para auditoria rápida
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleGenerateReport = (tipo: string) => {
    alert(`Gerando relatório de ${tipo}...\nEsta funcionalidade requer integração com biblioteca de PDF/Excel.\nOs dados atuais já estão carregados no log de auditoria abaixo.`);
  };

  const relatorios = [
    { 
      title: 'Inventário de Armamentos', 
      desc: 'Dossiê completo de ativos bélicos, incluindo numeração, calibre e status operacional.',
      icon: Shield,
      color: 'text-ssp-gold',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    },
    { 
      title: 'Histórico de Fluxo', 
      desc: 'Rastreabilidade total de cargas e descargas realizadas por agentes autorizados.',
      icon: Calendar,
      color: 'text-ssp-red',
      bg: 'bg-red-50',
      border: 'border-red-200'
    },
    { 
      title: 'Consumo de Munições', 
      desc: 'Controle de lotes, calibres e saldo remanescente em estoque na armaria central.',
      icon: Target,
      color: 'text-ssp-navy',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-ssp-navy tracking-tighter uppercase flex items-center gap-3">
            <FileBarChart className="text-ssp-red" />
            Auditoria e Relatórios
          </h1>
          <p className="text-gray-500 text-[10px] font-bold mt-1 tracking-[0.2em] uppercase">Inteligência e Gestão de Dados Bélicos</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-gray-100 hover:bg-white text-gray-700 px-6 py-3.5 rounded-xl flex items-center gap-3 transition-all border border-gray-200 font-black uppercase tracking-widest text-[11px] shadow-sm"
        >
          <Printer size={18} />
          Imprimir Tela Atual
        </button>
      </div>

      {/* Cards de Opções de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {relatorios.map((rel, i) => (
          <div key={i} className={`bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden border-t-8`} style={{ borderTopColor: rel.color === 'text-ssp-gold' ? '#D4AF37' : rel.color === 'text-ssp-red' ? '#C8102E' : '#1B365D' }}>
            <div className={`w-14 h-14 ${rel.bg} ${rel.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm border ${rel.border}`}>
              <rel.icon size={28} />
            </div>
            
            <h3 className="text-lg font-black text-ssp-navy uppercase tracking-tight mb-2">{rel.title}</h3>
            <p className="text-xs text-gray-500 font-bold leading-relaxed mb-10 h-12 uppercase opacity-80">{rel.desc}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleGenerateReport(rel.title)}
                className="bg-ssp-navy hover:bg-ssp-navy/90 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border-b-4 border-ssp-red transition-all active:translate-y-0.5 shadow-md"
              >
                <Download size={14} className="text-ssp-gold" /> PDF
              </button>
              <button 
                onClick={() => handleGenerateReport(rel.title)}
                className="bg-gray-50 hover:bg-white text-gray-700 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-gray-200 transition-all active:translate-y-0.5 shadow-sm"
              >
                <Download size={14} className="text-gray-400" /> Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Log de Auditoria Recente */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardList className="text-ssp-red" size={24} />
          <h2 className="text-xl font-black text-ssp-navy uppercase tracking-widest">Logs de Auditoria Recente</h2>
        </div>
        
        <Table headers={['Identificador Log', 'Ativo Bélico', 'Agente Responsável', 'Operação', 'Data e Hora']}>
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
              <td className="px-6 py-5">
                <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">#{log.id.slice(-6)}</span>
              </td>
              <td className="px-6 py-5">
                <p className="text-sm font-black text-ssp-navy uppercase">{log.armament?.tipo}</p>
                <p className="text-[10px] text-ssp-gold font-mono font-bold">{log.armament?.numSerie}</p>
              </td>
              <td className="px-6 py-5">
                <p className="text-xs font-bold text-gray-700 uppercase">{log.responsible?.nome}</p>
              </td>
              <td className="px-6 py-5">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                  log.tipo === 'RETIRADA' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                  log.tipo === 'DEVOLUCAO' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                }`}>
                  {log.tipo}
                </span>
              </td>
              <td className="px-6 py-5">
                <p className="text-xs font-bold text-gray-500">{new Date(log.data).toLocaleString('pt-BR')}</p>
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhuma movimentação auditada no momento.</td>
            </tr>
          )}
        </Table>
      </div>

      {/* Alerta de Auditoria */}
      <div className="p-8 bg-gray-100 border-l-8 border-ssp-red rounded-3xl shadow-sm">
        <div className="flex items-start gap-5">
          <div className="p-3 bg-white rounded-2xl text-ssp-red shadow-sm border border-gray-200">
            <Shield size={28} />
          </div>
          <div>
            <h4 className="text-ssp-navy font-black uppercase tracking-widest text-sm">Aviso de Segurança e Auditoria Integrada</h4>
            <p className="text-gray-500 text-[11px] mt-2 max-w-3xl leading-relaxed font-bold uppercase opacity-80">
              A geração de relatórios de material bélico é uma atividade estritamente restrita e monitorada. Todas as consultas, exportações de dados e tentativas de acesso são registradas com carimbo de tempo (timestamp), endereço IP e credencial funcional do agente operador. O uso indevido destas informações está sujeito a sanções disciplinares e penais conforme diretrizes da SSP-BA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};