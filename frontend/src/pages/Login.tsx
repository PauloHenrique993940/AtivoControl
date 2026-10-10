import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ShieldCheck, Lock, User, Crosshair, Activity } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      login(token, user);
      navigate('/');
    } catch (error) {
      alert('Falha na autenticação. Verifique seu e-mail e senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Decorativo: Grade Tática mais nítida */}
      <div className="absolute inset-0 opacity-[0.1] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#1B365D 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Linha de Escaneamento Animada - Mais visível */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-[2px] bg-ssp-navy/20 absolute top-0 animate-[scan_5s_linear_infinite]"></div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>

      {/* Elementos HUD nas extremidades (Cores mais sólidas) */}
      <div className="absolute top-10 left-10 text-ssp-navy/50 uppercase text-[10px] tracking-[0.3em] font-mono hidden md:block font-bold">
        <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 bg-ssp-red animate-pulse rounded-full"></div> SYSTEM: ONLINE</div>
        <p>ENCRYPTION: AES-256-GCM</p>
        <p>NODE: SSP-BA-SRV-01</p>
      </div>
      
      <div className="absolute bottom-10 right-10 text-ssp-navy/50 uppercase text-[10px] tracking-[0.3em] font-mono hidden md:block text-right font-bold">
        <p>TERMINAL: T-800-AUTH</p>
        <p>SESSION: {new Date().getHours()}:{new Date().getMinutes()}:SECURED</p>
        <p>DATE: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Cabeçalho do Arsenal */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            {/* Círculos de Retículo (Mais definidos) */}
            <div className="absolute -inset-4 border-2 border-ssp-navy/20 rounded-full animate-spin-slow"></div>
            <div className="absolute -inset-8 border border-ssp-red/20 border-dashed rounded-full animate-reverse-spin-slow"></div>
            
            <div className="w-24 h-24 bg-ssp-navy border-4 border-white rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(27,54,93,0.3)] relative z-10">
              <Crosshair className="text-ssp-gold" size={48} />
            </div>
          </div>
          
          <h1 className="text-5xl font-black text-ssp-navy tracking-tighter uppercase">
            SSP<span className="text-ssp-red">BAHIA</span>
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-[2px] w-8 bg-ssp-red"></div>
            <p className="text-ssp-navy text-xs font-black uppercase tracking-[0.5em]">Sistema de Gestão de Meios</p>
            <div className="h-[2px] w-8 bg-ssp-red"></div>
          </div>
        </div>

        {/* Card de Login (Bordas nítidas e sombras fortes) */}
        <div className="bg-white border-2 border-ssp-navy p-10 rounded-none shadow-[20px_20px_0px_rgba(27,54,93,0.1)] relative overflow-hidden">
          {/* Detalhes Industriais nos Cantos */}
          <div className="absolute top-0 left-0 w-8 h-8 bg-ssp-navy"></div>
          <div className="absolute top-0 left-0 w-8 h-8 flex items-center justify-center text-white text-[10px] font-bold">01</div>
          
          <div className="mb-10 flex items-center justify-between border-b-2 border-ssp-navy/10 pb-6">
            <div>
              <h2 className="text-ssp-navy text-xl font-black flex items-center gap-3 tracking-tighter">
                <ShieldCheck className="text-ssp-red" size={24} />
                AUTH REQUIRED
              </h2>
              <p className="text-ssp-navy/40 text-[11px] mt-1 uppercase font-bold tracking-widest">Protocolo de Segurança Nível 4</p>
            </div>
            <div className="w-12 h-12 border-2 border-ssp-red/20 rounded flex items-center justify-center">
              <Activity className="text-ssp-red animate-pulse" size={24} />
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-ssp-navy uppercase tracking-widest flex items-center gap-2">
                <User size={14} className="text-ssp-red" /> Credencial do Agente
              </label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border-2 border-ssp-navy/20 text-ssp-navy px-6 py-4 rounded-none focus:border-ssp-navy focus:ring-0 outline-none transition-all placeholder:text-gray-300 font-bold text-base"
                  placeholder="NOME.SOBRENOME"
                  required
                />
                <div className="absolute bottom-0 left-0 h-1 bg-ssp-red w-0 group-focus-within:w-full transition-all duration-300"></div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-ssp-navy uppercase tracking-widest flex items-center gap-2">
                <Lock size={14} className="text-ssp-red" /> Chave de Acesso
              </label>
              <div className="relative group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-2 border-ssp-navy/20 text-ssp-navy px-6 py-4 rounded-none focus:border-ssp-navy focus:ring-0 outline-none transition-all placeholder:text-gray-300 font-bold text-base"
                  placeholder="••••••••"
                  required
                />
                <div className="absolute bottom-0 left-0 h-1 bg-ssp-red w-0 group-focus-within:w-full transition-all duration-300"></div>
              </div>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-ssp-navy hover:bg-ssp-dark text-white font-black py-5 px-6 rounded-none shadow-xl transition-all active:translate-y-1 uppercase tracking-[0.3em] mt-6 disabled:opacity-50 flex items-center justify-center gap-3 group"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  VALIDANDO...
                </div>
              ) : (
                <>
                  EFETUAR LOGIN
                  <ShieldCheck size={20} className="group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 p-4 border-2 border-ssp-red/10 bg-ssp-red/5">
            <p className="text-[10px] text-ssp-navy font-bold uppercase tracking-tighter leading-tight text-center">
              ADVERTÊNCIA: O USO DESTE SISTEMA É EXCLUSIVO PARA FINS OFICIAIS. TODAS AS ATIVIDADES SÃO MONITORADAS POR IP E BIOMETRIA DIGITAL.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        .animate-reverse-spin-slow {
          animation: spin-reverse 12s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
};
