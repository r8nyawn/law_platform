import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('public'); // По умолчанию обычный пользователь
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { 
            email: formData.email, 
            password: formData.password 
          }
        : { 
            email: formData.email, 
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            userType: userType
          };

      console.log('Отправка запроса на:', url, 'с данными:', body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });

      console.log('Статус ответа:', response.status);

      const data = await response.json();
      console.log('Ответ сервера:', data);

      if (!response.ok) {
        throw new Error(data.error || `Ошибка ${response.status}`);
      }

      // Сохраняем данные
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Перенаправляем на главную
      alert(isLogin ? 'Вход выполнен успешно!' : 'Регистрация завершена!');
      window.location.href = '/';

    } catch (err) {
      console.error('Ошибка:', err);
      setError(err.message || 'Ошибка сервера. Проверьте консоль для подробностей.');
    } finally {
      setLoading(false);
    }
  };

  // Функция для быстрого входа
  const quickLogin = async (email, password) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Ошибка ${response.status}`);
      }

      // Сохраняем данные
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Перенаправляем на главную
      alert('Вход выполнен успешно!');
      window.location.href = '/';

    } catch (err) {
      console.error('Ошибка быстрого входа:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 140px)',
      padding: '40px 20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '500px',
        padding: '40px'
      }}>
        {/* Логотип */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#c00',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 15px'
          }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '24px' }}>ПТ</span>
          </div>
          <h2 style={{ fontSize: '28px', color: '#212529', marginBottom: '8px' }}>
            {isLogin ? 'Вход в систему' : 'Регистрация'}
          </h2>
          <p style={{ color: '#6c757d', fontSize: '16px' }}>
            {isLogin 
              ? 'Войдите в свой аккаунт' 
              : 'Создайте аккаунт для доступа ко всем функциям'}
          </p>
        </div>

        {/* Переключение входа/регистрации */}
        <div style={{
          display: 'flex',
          marginBottom: '30px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #dee2e6'
        }}>
          <button
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1,
              padding: '15px',
              backgroundColor: isLogin ? '#c00' : 'white',
              color: isLogin ? 'white' : '#495057',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: isLogin ? '600' : '400'
            }}
          >
            Вход
          </button>
          <button
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1,
              padding: '15px',
              backgroundColor: !isLogin ? '#c00' : 'white',
              color: !isLogin ? 'white' : '#495057',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: !isLogin ? '600' : '400'
            }}
          >
            Регистрация
          </button>
        </div>

        {/* Сообщение об ошибке */}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            ❌ {error}
          </div>
        )}

        {/* Форма */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isLogin && (
            <>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#212529' }}>
                    Фамилия *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#212529' }}>
                    Имя *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#212529' }}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#212529' }}>
              Пароль *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#212529' }}>
                Тип аккаунта *
              </label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
              >
                <option value="public">👤 Обычный пользователь</option>
                <option value="lawyer">👨‍⚖️ Юрист / Адвокат</option>
                <option value="journalist">📰 Журналист / Редактор</option>
                <option value="activist">🌐 Общественный деятель</option>
              </select>
            </div>
          )}

          {!isLogin && userType !== 'public' && (
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ color: '#c00', fontSize: '20px' }}>⚠️</span>
                <strong style={{ color: '#c00' }}>Требуется верификация</strong>
              </div>
              <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
                Для доступа к функциям форума и выставления оценок потребуется подтверждение профессионального статуса.
                После регистрации вы сможете загрузить подтверждающие документы.
              </p>
            </div>
          )}

          {!isLogin && userType === 'public' && (
            <div style={{
              backgroundColor: '#e7f5ff',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #cfe2ff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ color: '#0d6efd', fontSize: '20px' }}>ℹ️</span>
                <strong style={{ color: '#0d6efd' }}>Обычный пользователь</strong>
              </div>
              <p style={{ fontSize: '14px', color: '#084298', margin: 0 }}>
                Вы можете читать статьи и просматривать профили, но для участия в форуме и выставления оценок 
                потребуется выбрать профессиональный тип аккаунта и пройти верификацию.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? '#6c757d' : '#c00',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginTop: '10px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Загрузка...' : (isLogin ? 'Войти в аккаунт' : 'Создать аккаунт')}
          </button>
        </form>

        {/* Дополнительные ссылки */}
        <div style={{ textAlign: 'center', marginTop: '25px' }}>
          <p style={{ color: '#6c757d', fontSize: '14px' }}>
            {isLogin ? 'Еще нет аккаунта? ' : 'Уже есть аккаунт? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({ email: '', password: '', firstName: '', lastName: '' });
              }}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: '#c00',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                padding: 0,
                fontSize: '14px'
              }}
            >
              {isLogin ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </div>

        {/* Тестовые аккаунты */}
        <div style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #e9ecef'
        }}>
          <h4 style={{ color: '#212529', marginBottom: '15px' }}>Быстрый вход:</h4>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => quickLogin('lawyer@pravo.tv', 'lawyer123')}
              disabled={loading}
              style={{
                backgroundColor: '#c00',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                minWidth: '120px'
              }}
            >
              👨‍⚖️ Юрист
            </button>
            
            <button
              onClick={() => quickLogin('journalist@pravo.tv', 'journalist123')}
              disabled={loading}
              style={{
                backgroundColor: '#0d6efd',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                minWidth: '120px'
              }}
            >
              📰 Журналист
            </button>
            
            <button
              onClick={() => quickLogin('admin@pravo.tv', 'admin123')}
              disabled={loading}
              style={{
                backgroundColor: '#212529',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                minWidth: '120px'
              }}
            >
              👑 Админ
            </button>
            
            {/* НОВАЯ КНОПКА: Обычный пользователь */}
            <button
              onClick={() => quickLogin('user@pravo.tv', 'user123')}
              disabled={loading}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                minWidth: '120px'
              }}
            >
              👤 Обычный пользователь
            </button>
          </div>
          
          <div style={{ 
            fontSize: '12px', 
            color: '#6c757d', 
            marginTop: '15px',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            padding: '10px',
            borderRadius: '6px'
          }}>
            <div><strong>Тестовые аккаунты (пароль: 123):</strong></div>
            <div style={{ marginTop: '5px' }}>
              • Юрист: lawyer@pravo.tv / lawyer123<br/>
              • Журналист: journalist@pravo.tv / journalist123<br/>
              • Админ: admin@pravo.tv / admin123<br/>
              • Пользователь: user@pravo.tv / user123
            </div>
          </div>
        </div>

        {/* Информация о правах */}
        <div style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #e9ecef'
        }}>
          <h4 style={{ color: '#212529', marginBottom: '10px' }}>Различия в правах:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#6c757d', fontSize: '14px' }}>
            <li><strong>Обычные пользователи:</strong> просмотр статей и профилей</li>
            <li><strong>Верифицированные эксперты:</strong> + публикация статей, форум, выставление оценок</li>
            <li><strong>Администраторы:</strong> + модерация, верификация пользователей</li>
          </ul>
        </div>

        {/* Информация о верификации */}
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #e9ecef'
        }}>
          <h4 style={{ color: '#212529', marginBottom: '10px' }}>О верификации:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#6c757d', fontSize: '14px' }}>
            <li>Юристам: удостоверение адвоката/нотариуса</li>
            <li>Журналистам: пресс-карта или подтверждение от СМИ</li>
            <li>Общественным деятелям: документы организации</li>
            <li>Проверка занимает 1-3 рабочих дня</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;