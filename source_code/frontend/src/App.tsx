// source_code/frontend/src/App.tsx
import { useState } from 'react';
import { api } from './api/client';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data = await api.login(username, password);
      setUser(data);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  // If logged in, show a temporary dashboard
  if (user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gym-bg">
        <div className="bg-white p-8 rounded-xl shadow-2xl border-t-8 border-gym-maroon text-center max-w-md w-full">
          <h1 className="text-3xl font-black text-gym-maroon mb-2 uppercase tracking-wide">
            Gymmetry Dashboard
          </h1>
          <p className="text-gray-600 mb-6">Welcome back, <span className="font-bold text-gym-black">{user.name}</span></p>
          <div className="bg-gray-100 p-4 rounded text-left mb-6">
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>User ID:</strong> {user.personId}</p>
          </div>
          <button 
            onClick={() => setUser(null)}
            className="w-full bg-gym-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Otherwise, show the Login Screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gym-maroon relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-gym-crimson rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gym-crimson rounded-full blur-3xl"></div>
      </div>

      <div className="bg-gym-bg p-10 rounded-2xl shadow-2xl w-full max-w-md z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gym-black tracking-tighter mb-2">
            GYM<span className="text-gym-crimson">METRY</span>
          </h1>
          <p className="text-gray-500 font-medium">Power and Strength Starts Here</p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-gym-crimson text-red-700 p-4 mb-6 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gym-black mb-2 uppercase tracking-wide">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gym-crimson focus:border-transparent transition-all"
              placeholder="Enter username"
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gym-black mb-2 uppercase tracking-wide">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gym-crimson focus:border-transparent transition-all"
              placeholder="••••••••"
              required 
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-gym-crimson text-white py-3 rounded-lg font-bold text-lg hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl mt-4"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;