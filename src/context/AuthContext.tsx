import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import api from '../services/api';
import { connectWebSocket, disconnectWebSocket } from '../services/websocket';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (nom: string, prenom: string, email: string, password: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Vérifier le token au démarrage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.verifyToken().catch(() => {
        // Token invalide, déconnecter
        logout();
      });
    }
  }, []);

  // Connecter WebSocket quand l'utilisateur est connecté
  useEffect(() => {
    if (user?.id) {
      connectWebSocket(user.id);
    } else {
      disconnectWebSocket();
    }
    
    return () => {
      // Ne pas déconnecter ici car d'autres composants peuvent utiliser le WebSocket
    };
  }, [user?.id]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      setUser(response.user);
      return Promise.resolve();
    } catch (error: any) {
      return Promise.reject(error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const register = async (nom: string, prenom: string, email: string, password: string) => {
    try {
      const response = await api.register(nom, prenom, email, password);
      setUser(response.user);
      return Promise.resolve();
    } catch (error: any) {
      return Promise.reject(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: (newUser) => {
          setUser(newUser);
          if (newUser) {
            localStorage.setItem('user', JSON.stringify(newUser));
          } else {
            localStorage.removeItem('user');
          }
        },
        login,
        logout,
        register,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

