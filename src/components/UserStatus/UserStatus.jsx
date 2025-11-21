import './UserStatus.scss';

export const UserStatus = ({ status = 'offline' }) => {
  const getStatusClass = () => {
    switch (status) {
      case 'online': return 'status-online';
      case 'away': return 'status-away';
      case 'busy': return 'status-busy';
      default: return 'status-offline';
    }
  };

  return <span className={`user-status ${getStatusClass()}`} title={status} />;
};

