// pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [forumTopics, setForumTopics] = useState([]);
  const [forumLoading, setForumLoading] = useState(false);
  const [stats, setStats] = useState({
    topics: 0,
    comments: 0,
    likes: 0
  });
  const navigate = useNavigate();

  // Загрузка пользователя
  useEffect(() => {
    const fetchFullProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // ВОТ ЭТОГО НЕ ХВАТАЛО:
          // Теперь в переменную user запишутся bio, location и всё остальное
          setUser(data.user); 
          
          // Опционально: обновим и в памяти браузера, чтобы при 
          // следующем входе всё было сразу
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch (error) {
        console.error('Ошибка обновления профиля:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFullProfile();
  }, []);

  // Загрузка тем форума при активации вкладки
  useEffect(() => {
    if (activeTab === 'forum' && user) {
      loadForumTopics();
    }
  }, [activeTab, user]);

  const loadForumTopics = async () => {
    if (!user) return;
    
    setForumLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/forum/user-topics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setForumTopics(data.topics || []);
        setStats(prev => ({
          ...prev,
          topics: data.total || 0,
          comments: data.totalComments || 0,
          likes: data.totalLikes || 0
        }));
      }
    } catch (error) {
      console.error('Ошибка загрузки тем:', error);
    } finally {
      setForumLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/auth');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту тему?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/forum/topics/${topicId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Обновляем список локально, чтобы тема исчезла сразу без перезагрузки
        setForumTopics(prev => prev.filter(t => t.id !== topicId));
        // Обновляем счетчик в статистике
        setStats(prev => ({ ...prev, topics: prev.topics - 1 }));
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при удалении');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось связаться с сервером');
    }
  };
  const getUsername = () => {
    if (user?.username) return user.username;
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email?.split('@')[0] || 'Пользователь';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '20px' }}>Загрузка профиля...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      {/* Шапка профиля */}
      <div style={{
        background: 'linear-gradient(135deg, #c00 0%, #a00 100%)',
        color: 'white',
        padding: '40px',
        borderRadius: '12px',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#c00',
            border: '5px solid rgba(255,255,255,0.2)',
            flexShrink: 0
          }}>
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>
              {getUsername()}
            </h1>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', flexWrap: 'wrap' }}>
              <span style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '6px 15px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {user.userType === 'lawyer' && '👨‍⚖️ Юрист'}
                {user.userType === 'journalist' && '📰 Журналист'}
                {user.userType === 'activist' && '🌐 Общественный деятель'}
                {user.userType === 'admin' && '👑 Администратор'}
                {user.userType === 'public' && '👤 Пользователь'}
              </span>
              
              {user.verificationStatus === 'verified' && (
                <span style={{
                  backgroundColor: '#198754',
                  padding: '6px 15px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  ✓ Проверенный профиль
                </span>
              )}
              
              {user.verificationStatus === 'pending' && (
                <span style={{
                  backgroundColor: '#ffc107',
                  color: '#212529',
                  padding: '6px 15px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  ⏳ На верификации
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '30px', fontSize: '14px', opacity: 0.9 }}>
              <div>
                <div style={{ fontWeight: '600' }}>Email</div>
                <div>{user.email}</div>
              </div>
              {user.phone && (
                <div>
                  <div style={{ fontWeight: '600' }}>Телефон</div>
                  <div>{user.phone}</div>
                </div>
              )}
              <div>
                <div style={{ fontWeight: '600' }}>Рейтинг</div>
                <div>⭐ {user.rating?.average?.toFixed(1) || '0.0'} ({user.rating?.count || 0})</div>
              </div>
              {user.username && (
                <div>
                  <div style={{ fontWeight: '600' }}>Имя пользователя</div>
                  <div>@{user.username}</div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <Link to="/profile/edit">
              <button style={{
                backgroundColor: 'white',
                color: '#c00',
                border: 'none',
                padding: '12px 25px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ✏️ Редактировать
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        {/* Боковая панель */}
        <div style={{ width: '250px', flexShrink: 0 }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              
              {/* Кнопка ОБЗОР */}
              <button
                onClick={() => setActiveTab('overview')}
                style={{
                  padding: '12px 15px',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'overview' ? '#f8f9fa' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: activeTab === 'overview' ? '#c00' : '#495057',
                  fontWeight: activeTab === 'overview' ? '600' : '400',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                👤 Обзор профиля
              </button>

              {/* Кнопка ФОРУМ */}
              <button
                onClick={() => setActiveTab('forum')}
                style={{
                  padding: '12px 15px',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'forum' ? '#f8f9fa' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: activeTab === 'forum' ? '#c00' : '#495057',
                  fontWeight: activeTab === 'forum' ? '600' : '400',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>📝 Мои темы</span>
                <span style={{ 
                  fontSize: '12px', 
                  backgroundColor: activeTab === 'forum' ? '#c00' : '#eee', 
                  color: activeTab === 'forum' ? 'white' : '#666',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {stats.topics}
                </span>
              </button>

              {/* Кнопка запроса верификации (показываем только если статус null) */}
              {user.verificationStatus === null && user.userType !== 'public' && (
                <button
                  onClick={async () => {
                    const token = localStorage.getItem('token');
                    const res = await fetch('http://localhost:5000/api/users/request-verification', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                      alert('Заявка отправлена!');
                      window.location.reload();
                    }
                  }}
                  style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffeeba',
                    borderRadius: '6px',
                    color: '#856404',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  🛡️ Запросить верификацию
                </button>
              )}

              <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '10px 0' }} />

              <button
                onClick={handleLogout}
                style={{
                  padding: '12px 15px',
                  textAlign: 'left',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#dc3545',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🚪 Выйти
              </button>
            </nav>
          </div>
        </div>

        {/* Основной контент (Вкладки) */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            minHeight: '400px'
          }}>
            
            {/* ВКЛАДКА: ОБЗОР */}
            {activeTab === 'overview' && (
              <div>
                <h2 style={{ marginTop: 0 }}>Общая информация</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                  
                  <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>ЛОКАЦИЯ</div>
                    {/* Проверяем оба варианта: напрямую или в объекте profile_data */}
                    <strong>{user.location || user.profile_data?.location || 'Не указана'}</strong>
                  </div>

                  <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>СПЕЦИАЛИЗАЦИЯ</div>
                    <strong>{user.specialization || user.profile_data?.specialization || 'Не указана'}</strong>
                  </div>
                  
                </div>

                <h3>О себе</h3>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', borderLeft: '4px solid #c00', paddingLeft: '15px' }}>
                  {user.bio || user.profile_data?.bio || 'Информация о себе не заполнена. Расскажите сообществу о своем опыте!'}
                </p>
              </div>
            )}

            {/* ВКЛАДКА: ФОРУМ */}
            {activeTab === 'forum' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '22px' }}>Мои темы на форуме</h2>
                  <Link to="/forum/create">
                    <button style={{ padding: '8px 16px', backgroundColor: '#c00', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      + Создать новую
                    </button>
                  </Link>
                </div>

                {forumLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка ваших тем...</div>
                ) : forumTopics.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {forumTopics.map(topic => (
                      <div key={topic.id} style={{ 
                        padding: '20px', 
                        border: '1px solid #eee', 
                        borderRadius: '10px', 
                        position: 'relative' // Добавляем для позиционирования кнопки
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '12px', color: '#6c757d', backgroundColor: '#f1f3f5', padding: '2px 8px', borderRadius: '4px' }}>
                            {topic.category}
                          </span>
                          
                          {/* Кнопка удаления */}
                          <button 
                            onClick={() => handleDeleteTopic(topic.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#dc3545',
                              cursor: 'pointer',
                              fontSize: '18px',
                              padding: '0 5px'
                            }}
                            title="Удалить тему"
                          >
                            &times;
                          </button>
                        </div>

                        <Link to={`/forum/thread/${topic.id}`} style={{ 
                          fontSize: '18px', 
                          fontWeight: '600', 
                          color: '#212529', 
                          textDecoration: 'none',
                          display: 'block'
                        }}>
                          {topic.title}
                        </Link>
                        
                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#adb5bd' }}>
                          {formatDate(topic.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d', border: '2px dashed #eee', borderRadius: '12px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                    <p>Вы еще не создали ни одной темы на форуме.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;