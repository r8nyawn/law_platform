import { Link } from 'react-router-dom';
import AuthStatus from './AuthStatus';

const Navbar = () => {
  return (
    <nav style={{
      backgroundColor: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      padding: '0 20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '70px'
      }}>
        {/* Логотип */}
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
          color: 'inherit'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#c00',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '10px'
          }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>ПТ</span>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              Право<span style={{ color: '#c00' }}>ТВ</span>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Профессиональное сообщество</div>
          </div>
        </Link>

        {/* Навигация */}
        <div style={{
          display: 'flex',
          gap: '30px',
          alignItems: 'center'
        }}>
          <Link to="/" style={{
            textDecoration: 'none',
            color: '#333',
            fontWeight: '500',
            fontSize: '16px'
          }}>
            Главная
          </Link>
          <Link to="/forum" style={{
            textDecoration: 'none',
            color: '#333',
            fontWeight: '500',
            fontSize: '16px'
          }}>
            Форум
          </Link>
          <Link to="/profile" style={{
            textDecoration: 'none',
            color: '#333',
            fontWeight: '500',
            fontSize: '16px'
          }}>
            Профиль
          </Link>
          <AuthStatus />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;