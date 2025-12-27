import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f8f9fa'
    }}>
      <Navbar />
      <main style={{
        flex: '1',
        padding: '20px 0'
      }}>
        <Outlet />
      </main>
      <footer style={{
        backgroundColor: '#2d3748',
        color: 'white',
        padding: '30px 20px',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
            Право<span style={{ color: '#c00' }}>ТВ</span>
          </div>
          <p>Платформа для профессионального сообщества юристов, журналистов и общественных деятелей</p>
          <div style={{ marginTop: '20px', color: '#a0aec0', fontSize: '14px' }}>
            © 2024 Кино-телекомпания "Право ТВ". Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;