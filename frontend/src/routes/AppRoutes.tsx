import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Dashboard } from '../pages/Dashboard';
import { Login } from '../pages/Login';
import { Armamentos } from '../pages/Armamentos';
import { Municoes } from '../pages/Municoes';
import { Coletes } from '../pages/Coletes';
import { Movimentacoes } from '../pages/Movimentacoes';
import { Responsaveis } from '../pages/Responsaveis';
import { Relatorios } from '../pages/Relatorios';
import { Configuracoes } from '../pages/Configuracoes';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, ready } = useAuth();
  if (!ready) return <div role="status" className="p-8">Verificando sessão...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/armamentos" element={<PrivateRoute><Armamentos /></PrivateRoute>} />
      <Route path="/municoes" element={<PrivateRoute><Municoes /></PrivateRoute>} />
      <Route path="/coletes" element={<PrivateRoute><Coletes /></PrivateRoute>} />
      <Route path="/movimentacoes" element={<PrivateRoute><Movimentacoes /></PrivateRoute>} />
      <Route path="/responsaveis" element={<PrivateRoute><Responsaveis /></PrivateRoute>} />
      <Route path="/relatorios" element={<PrivateRoute><Relatorios /></PrivateRoute>} />
      <Route path="/configuracoes" element={<PrivateRoute><Configuracoes /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
