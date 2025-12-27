import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const AuthStatus = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '35px',
          height: '35px',
          borderRadius: '50%',
          backgroundColor: '#c00',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold'
        }}>
          {user.firstName?.[0]}{user.lastName?.[0]}
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>
            {user.firstName} {user.lastName}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {user.userType === 'lawyer' && '👨‍⚖️ Юрист'}
            {user.userType === 'journalist' && '📰 Журналист'}
            {user.userType === 'admin' && '👑 Админ'}
            {user.userType === 'public' && '👤 Пользователь'}
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#f8f9fa',
            color: '#495057',
            border: '1px solid #dee2e6',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
        >
          Выйти
        </button>
      </div>
    );
  }

  return (
    <Link to="/auth" style={{ textDecoration: 'none' }}>
      <button style={{
        backgroundColor: '#c00',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '6px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer'
      }}>
        Войти
      </button>
    </Link>
  );
};

export default AuthStatus;