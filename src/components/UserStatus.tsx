import { useState, useEffect } from 'react';
import '../styles/UserStatus.css';

interface UserStatusProps {
  userId: string;
  size?: 'small' | 'medium' | 'large';
}

export const UserStatus = ({ userId, size = 'small' }: UserStatusProps) => {
  const [status, setStatus] = useState<'online' | 'away' | 'busy' | 'offline'>('online');

  useEffect(() => {
    // Récupérer le statut depuis localStorage ou simuler
    try {
      const users = localStorage.getItem('monDrive_users');
      if (users) {
        const usersData = JSON.parse(users);
        const user = usersData.find((u: any) => u.id === userId);
        if (user) {
          setStatus(user.status || 'online');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
    }
  }, [userId]);

  const statusColors = {
    online: '#4caf50',
    away: '#ff9800',
    busy: '#f44336',
    offline: '#999',
  };

  return (
    <span 
      className={`user-status user-status-${size}`}
      style={{ backgroundColor: statusColors[status] }}
      title={status === 'online' ? 'En ligne' : status === 'away' ? 'Absent' : status === 'busy' ? 'Occupé' : 'Hors ligne'}
    />
  );
};

