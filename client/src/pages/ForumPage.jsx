import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ForumPage = () => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories] = useState([
    { id: 'all', name: 'Все темы', color: '#6c757d', icon: '📋' },
    { id: 'legislation', name: 'Законодательство', color: '#c00', icon: '⚖️' },
    { id: 'court', name: 'Судебная практика', color: '#0d6efd', icon: '👨‍⚖️' },
    { id: 'media', name: 'Медиа и журналистика', color: '#198754', icon: '📰' },
    { id: 'ethics', name: 'Профессиональная этика', color: '#ffc107', icon: '🎓' },
    { id: 'consultation', name: 'Консультации', color: '#6f42c1', icon: '💬' },
    { id: 'discussion', name: 'Обсуждения', color: '#20c997', icon: '🗣️' },
    { id: 'news', name: 'Новости', color: '#fd7e14', icon: '📢' }
  ]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [sortBy, setSortBy] = useState('lastActivity');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterClosed, setFilterClosed] = useState(false);
  const [filterPinned, setFilterPinned] = useState(false);
  const navigate = useNavigate();

  // Загрузка пользователя
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Ошибка парсинга пользователя:', err);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Функция для нормализации тегов
  const normalizeTags = useCallback((tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    return [];
  }, []);

  // Загрузка тем с учетом фильтров и сортировки
  const loadThreads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      params.append('sort', sortBy);
      params.append('page', currentPage);
      params.append('limit', 20);
      if (filterClosed) params.append('filterClosed', 'true');
      if (filterPinned) params.append('filterPinned', 'true');

      const response = await fetch(`/api/forum/threads?${params.toString()}`);
      const data = await response.json();
      
      // Нормализуем теги
      const normalizedThreads = (data.threads || []).map(thread => ({
        ...thread,
        tags: normalizeTags(thread.tags)
      }));
      
      setThreads(normalizedThreads);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Ошибка загрузки тем:', error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, sortBy, currentPage, filterClosed, filterPinned, normalizeTags]);

  // Загрузка статистики
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('/api/forum/stats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStats(data.stats || null);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      setStats(null);
    }
  }, []);

  // Загрузка данных при изменении зависимостей
  useEffect(() => {
    loadThreads();
    loadStats();
  }, [loadThreads, loadStats]);

  // Обработчик поиска
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadThreads();
  };

  // Обработчик создания темы
  const handleCreateThread = () => {
    if (!user) {
      alert('Для создания темы необходимо войти в систему');
      navigate('/auth');
      return;
    }

    if (user.userType !== 'public' && user.verificationStatus !== 'verified') {
      alert('Для создания тем на форуме требуется верификация аккаунта');
      return;
    }

    navigate('/forum/create');
  };
  const handleDeleteThread = async (threadId) => {
    if (!window.confirm('Вы действительно хотите удалить эту тему и все сообщения в ней?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token'); // Получаем ваш JWT токен
      const response = await fetch(`http://localhost:5000/api/forum/threads/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Удаляем тему из локального состояния, чтобы она исчезла из списка
        setThreads(prevThreads => prevThreads.filter(t => t.id !== threadId));
        
        // Если у вас есть функция обновления общей статистики (кол-во тем), вызываем её
        if (typeof loadStats === 'function') loadStats();
        
        alert('Тема успешно удалена');
      } else {
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.error || 'Не удалось удалить тему'}`);
      }
    } catch (error) {
      console.error("ПОЛНАЯ ОШИБКА:", error); // Это покажет в консоли F12, что именно не так
      alert('Не удалось отправить комментарий');
    }
  };
  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return 'недавно';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} мин. назад`;
    } else if (diffHours < 24) {
      return `${diffHours} ч. назад`;
    } else if (diffDays === 1) {
      return 'вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дн. назад`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} нед. назад`;
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: diffDays > 365 ? 'numeric' : undefined
      });
    }
  };

  // Получение названия категории
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Получение цвета категории
  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : '#6c757d';
  };

  // Получение иконки категории
  const getCategoryIcon = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.icon : '📋';
  };

  // Сброс фильтров
  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSortBy('lastActivity');
    setFilterClosed(false);
    setFilterPinned(false);
    setCurrentPage(1);
  };

  // Рендеринг пагинации
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          style={{
            padding: '8px 12px',
            backgroundColor: currentPage === i ? '#c00' : 'white',
            color: currentPage === i ? 'white' : '#495057',
            border: `1px solid ${currentPage === i ? '#c00' : '#dee2e6'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: currentPage === i ? '600' : '400',
            transition: 'all 0.2s',
            minWidth: '40px'
          }}
        >
          {i}
        </button>
      );
    }

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        marginTop: '30px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            backgroundColor: 'white',
            color: currentPage === 1 ? '#adb5bd' : '#495057',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.6 : 1
          }}
        >
          ← Назад
        </button>
        
        {pages}
        
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            backgroundColor: 'white',
            color: currentPage === totalPages ? '#adb5bd' : '#495057',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.6 : 1
          }}
        >
          Вперед →
        </button>
      </div>
    );
  };

  // Рендеринг скелетона загрузки
  if (loading && threads.length === 0) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Шапка */}
        <div style={{
          background: 'linear-gradient(135deg, #c00 0%, #a00 100%)',
          color: 'white',
          padding: '40px',
          borderRadius: '12px',
          marginBottom: '30px'
        }}>
          <div style={{
            width: '300px',
            height: '42px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            marginBottom: '15px'
          }} />
          <div style={{
            width: '600px',
            height: '24px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: '6px',
            maxWidth: '80%'
          }} />
          
          {/* Статистика скелетон */}
          <div style={{
            display: 'flex',
            gap: '30px',
            marginTop: '25px',
            flexWrap: 'wrap'
          }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <div style={{
                  width: '60px',
                  height: '28px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  marginBottom: '5px'
                }} />
                <div style={{
                  width: '50px',
                  height: '14px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '4px'
                }} />
              </div>
            ))}
          </div>
        </div>

        {/* Основной контент скелетон */}
        <div style={{ display: 'flex', gap: '30px' }}>
          {/* Боковая панель скелетон */}
          <div style={{ width: '250px', flexShrink: 0 }}>
            <div style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '100px',
                height: '24px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                marginBottom: '15px'
              }} />
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div
                  key={i}
                  style={{
                    height: '40px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    marginBottom: '8px'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Основной контент скелетон */}
          <div style={{ flex: 1 }}>
            {/* Фильтры скелетон */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                width: '100%',
                height: '48px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px'
              }} />
            </div>

            {/* Темы скелетон */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  style={{
                    padding: '20px',
                    borderBottom: '1px solid #e9ecef',
                    display: 'grid',
                    gridTemplateColumns: '1fr 100px 150px',
                    alignItems: 'center',
                    gap: '15px'
                  }}
                >
                  <div>
                    <div style={{
                      width: '200px',
                      height: '24px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px',
                      marginBottom: '10px'
                    }} />
                    <div style={{
                      width: '300px',
                      height: '18px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      marginBottom: '15px'
                    }} />
                  </div>
                  <div style={{
                    width: '60px',
                    height: '36px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    margin: '0 auto'
                  }} />
                  <div style={{
                    width: '100px',
                    height: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    marginLeft: 'auto'
                  }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      {/* Шапка форума */}
      <div style={{
        background: 'linear-gradient(135deg, #c00 0%, #a00 100%)',
        color: 'white',
        padding: '40px',
        borderRadius: '12px',
        marginBottom: '30px'
      }}>
        <h1 style={{ fontSize: '42px', marginBottom: '15px' }}>Профессиональный форум</h1>
        <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '800px' }}>
          Обсуждение актуальных тем, обмен опытом, консультации коллег. 
          Только для верифицированных экспертов и участников сообщества.
        </p>
        
        {stats && (
          <div style={{
            display: 'flex',
            gap: '30px',
            marginTop: '25px',
            flexWrap: 'wrap'
          }}>
            <div style={{ cursor: 'pointer' }} onClick={() => navigate('/forum?category=all')}>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.totalThreads || 0}</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Тем</div>
            </div>
            <div style={{ cursor: 'pointer' }} onClick={() => {
              const activeThread = threads[0];
              if (activeThread) navigate(`/forum/thread/${activeThread.id}`);
            }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.totalPosts || 0}</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Сообщений</div>
            </div>
            <div style={{ cursor: 'pointer' }} onClick={() => navigate('/users')}>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.totalUsers || 0}</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Участников</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.activeToday || 0}</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Онлайн сегодня</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        {/* Боковая панель */}
        <div style={{ width: '100%', maxWidth: '280px', flexShrink: 0 }}>
          {/* Категории */}
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#212529' }}>Категории</h3>
              {(selectedCategory !== 'all' || searchQuery || filterClosed || filterPinned || sortBy !== 'lastActivity') && (
                <button
                  onClick={resetFilters}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#c00',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Сбросить
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '12px 15px',
                    textAlign: 'left',
                    backgroundColor: selectedCategory === category.id ? '#f8f9fa' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: selectedCategory === category.id ? category.color : '#495057',
                    fontWeight: selectedCategory === category.id ? '600' : '400',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderLeft: `4px solid ${selectedCategory === category.id ? category.color : 'transparent'}`
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{category.icon}</span>
                  <span style={{ flex: 1 }}>{category.name}</span>
                  {selectedCategory === category.id && (
                    <span style={{
                      backgroundColor: category.color,
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {threads.filter(t => selectedCategory === 'all' || t.category === category.id).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Дополнительные фильтры */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    id="filterPinned"
                    checked={filterPinned}
                    onChange={(e) => setFilterPinned(e.target.checked)}
                    style={{ marginRight: '10px', cursor: 'pointer' }}
                  />
                  <label htmlFor="filterPinned" style={{ cursor: 'pointer', color: '#495057' }}>
                    📌 Только закрепленные
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id="filterClosed"
                    checked={filterClosed}
                    onChange={(e) => setFilterClosed(e.target.checked)}
                    style={{ marginRight: '10px', cursor: 'pointer' }}
                  />
                  <label htmlFor="filterClosed" style={{ cursor: 'pointer', color: '#495057' }}>
                    🔒 Только закрытые
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '10px', color: '#495057', fontWeight: '500' }}>
                  Сортировка:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <option value="lastActivity">По дате обновления</option>
                  <option value="createdAt">По дате создания</option>
                  <option value="postsCount">По количеству ответов</option>
                  <option value="views">По просмотрам</option>
                </select>
              </div>
            </div>
          </div>

          {/* Кнопка создания темы */}
          <button
            onClick={handleCreateThread}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #c00 0%, #e00 100%)',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '20px',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(192, 0, 0, 0.3)'
            }}
            onMouseOver={(e) => e.target.style.boxShadow = '0 6px 16px rgba(192, 0, 0, 0.4)'}
            onMouseOut={(e) => e.target.style.boxShadow = '0 4px 12px rgba(192, 0, 0, 0.3)'}
          >
            <span style={{ fontSize: '20px' }}>📝</span>
            Новая тема
          </button>

          {/* Быстрые действия */}
          {user && (
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <h4 style={{ color: '#212529', marginBottom: '15px', fontSize: '16px' }}>Ваши действия</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => navigate('/forum/my-threads')}
                  style={{
                    padding: '10px 15px',
                    backgroundColor: '#f8f9fa',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#495057',
                    textAlign: 'left',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#e9ecef'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                >
                  <span>📒</span>
                  Мои темы
                </button>
                <button
                  onClick={() => navigate('/forum/my-posts')}
                  style={{
                    padding: '10px 15px',
                    backgroundColor: '#f8f9fa',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#495057',
                    textAlign: 'left',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#e9ecef'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                >
                  <span>💬</span>
                  Мои сообщения
                </button>
                {user.userType === 'admin' && (
                  <button
                    onClick={() => navigate('/admin/forum')}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#f8f9fa',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#495057',
                      textAlign: 'left',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#e9ecef'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  >
                    <span>⚙️</span>
                    Управление форумом
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Правила форума */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontSize: '14px',
            color: '#6c757d'
          }}>
            <h4 style={{ color: '#212529', marginBottom: '10px', fontSize: '16px' }}>
              📋 Правила форума:
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Уважайте других участников</li>
              <li>Запрещены оскорбления и спам</li>
              <li>Публикация только профессионального контента</li>
              <li>Для создания тем требуется верификация</li>
              <li>Сохраняйте конфиденциальность</li>
            </ul>
            <div style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              fontSize: '12px',
              borderLeft: '3px solid #c00'
            }}>
              💡 Совет: Используйте теги для лучшего поиска тем
            </div>
          </div>
        </div>

        {/* Основной контент */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Поиск и управление */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Поиск по темам и сообщениям..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '12px 15px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '16px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05) inset'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '12px 25px',
                    backgroundColor: '#c00',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#a00'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#c00'}
                >
                  🔍 Найти
                </button>
              </form>
              
              <button
                onClick={() => loadThreads()}
                style={{
                  padding: '12px 15px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px'
                }}
                title="Обновить список"
              >
                🔄
              </button>
            </div>

            {/* Информация о результатах */}
            {(searchQuery || selectedCategory !== 'all' || filterClosed || filterPinned) && (
              <div style={{
                marginTop: '15px',
                padding: '10px 15px',
                backgroundColor: '#e7f5ff',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#084298',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  Найдено тем: <strong>{threads.length}</strong>
                  {searchQuery && (
                    <span> по запросу: <strong>"{searchQuery}"</strong></span>
                  )}
                </div>
                <button
                  onClick={resetFilters}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#084298',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'underline'
                  }}
                >
                  Сбросить фильтры
                </button>
              </div>
            )}
          </div>

          {/* Список тем */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            marginBottom: '30px'
          }}>
            {/* Заголовки колонок */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 100px 150px',
              padding: '15px 20px',
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #e9ecef',
              fontWeight: '600',
              color: '#495057',
              fontSize: '14px'
            }}>
              <div>Тема</div>
              <div style={{ textAlign: 'center' }}>Ответы</div>
              <div style={{ textAlign: 'right' }}>Последнее сообщение</div>
            </div>

            {/* Темы */}
            {threads.length === 0 ? (
              <div style={{ padding: '60px 40px', textAlign: 'center', color: '#6c757d' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>
                  {searchQuery ? '🔍' : '💭'}
                </div>
                <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#495057' }}>
                  {searchQuery ? 'Темы не найдены' : 'Пока нет тем'}
                </h3>
                <p style={{ fontSize: '16px', marginBottom: '25px', maxWidth: '500px', margin: '0 auto 25px' }}>
                  {searchQuery 
                    ? 'Попробуйте изменить поисковый запрос или использовать другие фильтры.'
                    : selectedCategory !== 'all' 
                      ? 'В этой категории пока нет созданных тем.'
                      : 'Будьте первым, кто создаст тему для обсуждения!'
                  }
                </p>
                {(!searchQuery && selectedCategory === 'all') && (
                  <button
                    onClick={handleCreateThread}
                    style={{
                      backgroundColor: '#c00',
                      color: 'white',
                      border: 'none',
                      padding: '12px 30px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#a00'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#c00'}
                  >
                    Создать первую тему
                  </button>
                )}
              </div>
            ) : (
              <>
                {threads.map(thread => (
                  <div
                    key={thread.id}
                    style={{
                      padding: '20px',
                      borderBottom: '1px solid #e9ecef',
                      display: 'grid',
                      gridTemplateColumns: '1fr 100px 150px',
                      alignItems: 'center',
                      gap: '15px',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onClick={() => navigate(`/forum/thread/${thread.id}`)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Индикаторы */}
                    <div style={{
                      position: 'absolute',
                      left: '0',
                      top: '0',
                      bottom: '0',
                      width: '4px',
                      backgroundColor: thread.isClosed ? '#6c757d' : 
                                    thread.isPinned ? '#ffc107' : 
                                    thread.postsCount > 50 ? '#20c997' : 'transparent',
                      borderTopLeftRadius: '12px',
                      borderBottomLeftRadius: '12px'
                    }} />
                    
                    <div style={{ paddingLeft: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        {thread.isPinned && (
                          <span style={{
                            backgroundColor: '#ffc107',
                            color: '#212529',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            📌 Закреплено
                          </span>
                        )}
                        {thread.isClosed && (
                          <span style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            🔒 Закрыта
                          </span>
                        )}
                        <span style={{
                          backgroundColor: getCategoryColor(thread.category),
                          color: 'white',
                          padding: '3px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {getCategoryIcon(thread.category)}
                          {getCategoryName(thread.category)}
                        </span>
                        
                        {(user && (user.id === thread.author?.id || user.id === thread.user_id || user.role === 'admin')) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Остановка всплытия события
                              handleDeleteThread(thread.id);
                            }}
                            style={{
                              backgroundColor: 'white',
                              color: '#dc3545',
                              border: '1px solid #dee2e6',
                              padding: '3px 10px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s',
                              fontWeight: '600'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.borderColor = '#dc3545';
                              e.currentTarget.style.backgroundColor = '#fff5f5';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.borderColor = '#dee2e6';
                              e.currentTarget.style.backgroundColor = 'white';
                            }}
                          >
                            🗑️ Удалить
                          </button>
                        )}
                      </div>
                      
                      <h3 style={{ 
                        fontSize: '18px', 
                        color: '#212529', 
                        marginBottom: '10px',
                        fontWeight: thread.isPinned ? '600' : '500',
                        lineHeight: '1.4'
                      }}>
                        {thread.title}
                        {thread.postsCount > 100 && (
                          <span style={{
                            marginLeft: '8px',
                            backgroundColor: '#20c997',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            🔥 Активно
                          </span>
                        )}
                      </h3>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '14px', color: '#6c757d', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#e9ecef',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#495057',
                            flexShrink: 0
                          }}>
                            {thread.author?.first_name?.[0]}{thread.author?.last_name?.[0]}
                          </div>
                          <span style={{ fontWeight: '500' }}>
                            {thread.author?.first_name} {thread.author?.last_name}
                          </span>
                          {thread.author?.verification_status === 'verified' && (
                            <span style={{
                              backgroundColor: '#d1e7dd',
                              color: '#0f5132',
                              padding: '2px 6px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              ✓ Проверен
                            </span>
                          )}
                        </div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          👁️ {thread.views}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          📅 {formatDate(thread.createdAt)}
                        </span>
                      </div>
                      
                      {thread.excerpt && thread.excerpt.length > 0 && (
                        <div style={{ 
                          fontSize: '14px', 
                          color: '#6c757d', 
                          marginTop: '12px',
                          lineHeight: '1.5',
                          opacity: 0.8
                        }}>
                          {thread.excerpt}
                        </div>
                      )}
                      
                      {thread.tags && Array.isArray(thread.tags) && thread.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                          {thread.tags.map((tag, index) => (
                            <span 
                              key={index}
                              style={{
                                backgroundColor: '#f8f9fa',
                                color: '#495057',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                border: '1px solid #e9ecef'
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '10px',
                        borderRadius: '8px',
                        backgroundColor: thread.postsCount > 0 ? '#f8f9fa' : 'transparent',
                        minWidth: '70px'
                      }}>
                        <div style={{ 
                          fontSize: '20px', 
                          fontWeight: 'bold', 
                          color: thread.postsCount > 0 ? '#c00' : '#6c757d',
                          marginBottom: '4px'
                        }}>
                          {thread.postsCount || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          {thread.postsCount === 1 ? 'ответ' : 
                          thread.postsCount > 1 && thread.postsCount < 5 ? 'ответа' : 'ответов'}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right', paddingRight: '10px' }}>
                      <div style={{ fontSize: '14px', color: '#495057', marginBottom: '4px' }}>
                        {formatDate(thread.lastActivity)}
                      </div>
                      {thread.lastAuthor && (
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#6c757d',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '6px'
                        }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: '#e9ecef',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: '#495057'
                          }}>
                            {thread.lastAuthor?.first_name?.[0]}
                          </div>
                          {thread.lastAuthor?.first_name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {renderPagination()}
              </>
            )}
          </div>

          {/* Информация о правах */}
          {(!user || user.userType === 'public') && (
            <div style={{
              backgroundColor: '#e7f5ff',
              padding: '25px',
              borderRadius: '12px',
              marginTop: '20px',
              border: '1px solid #cfe2ff',
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                backgroundColor: '#0d6efd',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                flexShrink: 0
              }}>
                ℹ️
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ color: '#084298', marginBottom: '8px', fontSize: '18px' }}>
                  Участие в форуме ограничено
                </h4>
                <p style={{ color: '#084298', fontSize: '15px', margin: 0 }}>
                  Для создания тем и участия в обсуждениях требуется 
                  {user ? ' верификация вашего аккаунта.' : ' войти в систему и пройти верификацию.'}
                </p>
                {!user && (
                  <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                    <button
                      onClick={() => navigate('/auth?tab=login')}
                      style={{
                        backgroundColor: '#c00',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Войти
                    </button>
                    <button
                      onClick={() => navigate('/auth?tab=register')}
                      style={{
                        backgroundColor: 'white',
                        color: '#0d6efd',
                        border: '2px solid #0d6efd',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Зарегистрироваться
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Активные пользователи */}
          {stats?.recentUsers && Array.isArray(stats.recentUsers) && stats.recentUsers.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '25px',
              marginTop: '30px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '18px', color: '#212529', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>👥</span> Сейчас на форуме
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                {stats.recentUsers.slice(0, 12).map((user, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 15px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      minWidth: '180px',
                      flex: '1 0 auto'
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#495057'
                    }}>
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: '#212529' }}>
                        {user.first_name} {user.last_name?.[0]}.
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        {user.user_type === 'lawyer' && '👨‍⚖️ Юрист'}
                        {user.user_type === 'journalist' && '📰 Журналист'}
                        {user.user_type === 'activist' && '🌐 Общественный деятель'}
                        {user.user_type === 'admin' && '👑 Админ'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Футер форума */}
      <div style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #e9ecef',
        color: '#6c757d',
        fontSize: '14px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '16px', marginBottom: '10px', color: '#495057' }}>
          Форум Право ТВ • Профессиональное сообщество юристов, журналистов и общественных деятелей
        </p>
        <p style={{ maxWidth: '800px', margin: '0 auto 15px', lineHeight: '1.6' }}>
          Все обсуждения модерируются. Нарушение правил может привести к ограничению доступа. 
          Форум предназначен для профессионального общения и обмена опытом.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', fontSize: '13px', marginTop: '20px' }}>
          <Link to="/rules" style={{ color: '#c00', textDecoration: 'none' }}>
            Правила форума
          </Link>
          <Link to="/faq" style={{ color: '#6c757d', textDecoration: 'none' }}>
            Частые вопросы
          </Link>
          <Link to="/contact" style={{ color: '#6c757d', textDecoration: 'none' }}>
            Контакты модераторов
          </Link>
          <Link to="/privacy" style={{ color: '#6c757d', textDecoration: 'none' }}>
            Политика конфиденциальности
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForumPage;