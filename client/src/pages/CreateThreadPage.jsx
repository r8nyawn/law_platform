import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateThreadPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'discussion',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Проверяем авторизацию
  useEffect(() => {
    const checkAuth = () => {
      console.log('🔍 Проверяем авторизацию...');
      
      const userJson = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      console.log('User from localStorage:', userJson);
      console.log('Token from localStorage:', token ? 'Есть' : 'Нет');
      
      if (!userJson || !token) {
        setError('❌ Вы не авторизованы');
        setTimeout(() => navigate('/auth'), 2000);
        return;
      }
      
      try {
        const parsedUser = JSON.parse(userJson);
        setUser(parsedUser);
        
        // Проверяем верификацию для не-public пользователей
        if (parsedUser.userType !== 'public' && parsedUser.verificationStatus !== 'verified') {
          setError('⚠️ Для создания тем требуется верификация аккаунта');
          setTimeout(() => navigate('/forum'), 3000);
        }
      } catch (err) {
        console.error('Ошибка парсинга пользователя:', err);
        setError('❌ Ошибка данных пользователя');
        localStorage.clear();
        setTimeout(() => navigate('/auth'), 2000);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.title.trim()) {
      setError('Введите заголовок темы');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('Введите содержание темы');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Парсим теги из строки
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      console.log('📤 Отправляем запрос...');
      console.log('Данные:', formData);
      console.log('Токен:', token);
      console.log('Теги:', tagsArray);
      
      const response = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category,
          tags: tagsArray
        })
      });

      console.log('📥 Ответ сервера:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📊 Данные ответа:', data);

      if (!response.ok) {
        throw new Error(data.error || `Ошибка HTTP: ${response.status}`);
      }

      alert('✅ Тема успешно создана!');
      navigate(`/forum/thread/${data.thread.id}`);
      
    } catch (err) {
      console.error('❌ Ошибка создания темы:', err);
      setError(`Ошибка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Показываем загрузку или ошибку
  if (error) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '50px auto',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>
          {error.includes('❌') ? '❌' : '⚠️'}
        </div>
        <h2 style={{ color: '#c00', marginBottom: '15px' }}>Ошибка</h2>
        <p style={{ fontSize: '18px', marginBottom: '30px' }}>{error}</p>
        <button
          onClick={() => navigate('/forum')}
          style={{
            padding: '12px 30px',
            backgroundColor: '#c00',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Вернуться на форум
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '50px auto',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <h2>Проверка авторизации...</h2>
        <p>Пожалуйста, подождите</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Навигация */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => navigate('/forum')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 0',
            fontWeight: '500'
          }}
        >
          ← Вернуться на форум
        </button>
      </div>

      {/* Заголовок */}
      <h1 style={{
        fontSize: '32px',
        color: '#212529',
        marginBottom: '10px'
      }}>
        Создание новой темы
      </h1>
      <p style={{ color: '#666', marginBottom: '30px', fontSize: '16px' }}>
        Заполните форму ниже для создания обсуждения
      </p>

      {/* Форма */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Заголовок */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: '600',
              color: '#212529',
              fontSize: '16px'
            }}>
              Заголовок темы *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Введите заголовок темы"
              style={{
                width: '100%',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              maxLength="200"
              required
              disabled={loading}
            />
            <div style={{
              fontSize: '14px',
              color: '#666',
              marginTop: '5px',
              textAlign: 'right'
            }}>
              {formData.title.length}/200 символов
            </div>
          </div>

          {/* Категория */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: '600',
              color: '#212529',
              fontSize: '16px'
            }}>
              Категория *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
              required
              disabled={loading}
            >
              <option value="legislation">⚖️ Законодательство</option>
              <option value="court">👨‍⚖️ Судебная практика</option>
              <option value="media">📰 Медиа и журналистика</option>
              <option value="ethics">🎓 Профессиональная этика</option>
              <option value="consultation">💬 Консультации</option>
              <option value="discussion">🗣️ Обсуждения</option>
              <option value="news">📢 Новости</option>
            </select>
          </div>

          {/* Теги */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: '600',
              color: '#212529',
              fontSize: '16px'
            }}>
              Теги (через запятую)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="юриспруденция, закон, суд, практика"
              style={{
                width: '100%',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              disabled={loading}
            />
            <div style={{
              fontSize: '14px',
              color: '#666',
              marginTop: '5px'
            }}>
              Укажите ключевые слова через запятую для лучшего поиска
            </div>
          </div>

          {/* Содержание */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: '600',
              color: '#212529',
              fontSize: '16px'
            }}>
              Содержание *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Подробно опишите тему для обсуждения..."
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
                lineHeight: '1.6'
              }}
              required
              disabled={loading}
            />
            <div style={{
              fontSize: '14px',
              color: '#666',
              marginTop: '10px'
            }}>
              Используйте обычный текст. Поддерживаются абзацы и списки.
            </div>
          </div>

          {/* Информация об авторе */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '30px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: '#c00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white'
              }}>
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div>
                <div style={{ fontWeight: '600', color: '#212529', fontSize: '18px' }}>
                  {user.firstName} {user.lastName}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {user.userType === 'lawyer' && '👨‍⚖️ Юрист'}
                  {user.userType === 'journalist' && '📰 Журналист'}
                  {user.userType === 'activist' && '🌐 Общественный деятель'}
                  {user.userType === 'admin' && '👑 Администратор'}
                  {user.userType === 'public' && '👤 Пользователь'}
                  {user.verificationStatus === 'verified' && ' • ✓ Проверенный'}
                </div>
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/forum')}
              style={{
                padding: '12px 25px',
                backgroundColor: 'white',
                color: '#666',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 30px',
                backgroundColor: loading ? '#999' : '#c00',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
              disabled={loading}
            >
              {loading ? 'Создание...' : 'Создать тему'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateThreadPage;