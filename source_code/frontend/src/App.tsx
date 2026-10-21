import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { ChangePassword } from './pages/Changepassword ';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { TrainerDashboard } from './pages/trainer/TrainerDashboard';
import { MemberDashboard } from './pages/member/MemberDashboard';

function App() {
  const { user } = useAuth();

  if (!user) return <Login />;
  if (user.mustChangePassword) return <ChangePassword />; // first-login requirement

  if (user.role === 'ADMIN') return <AdminDashboard />;
  if (user.role === 'TRAINER') return <TrainerDashboard />;
  return <MemberDashboard />;
}

export default App;