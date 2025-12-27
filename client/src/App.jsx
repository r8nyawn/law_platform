import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ForumPage from './pages/ForumPage';
import ForumThreadPage from './pages/ForumThreadPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import CreateThreadPage from './pages/CreateThreadPage';
import EditProfilePage from './pages/EditProfilePage';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="forum" element={<ForumPage />} />
          <Route path="/forum/thread/:id" element={<ForumThreadPage />} />
          <Route path="auth" element={<AuthPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/forum/create" element={<CreateThreadPage />} />
          <Route path="articles" element={
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
              <h1>Статьи</h1>
              <p>Страница в разработке...</p>
            </div>
          } />
          <Route path="conferences" element={
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
              <h1>Конференции</h1>
              <p>Страница в разработке...</p>
            </div>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;