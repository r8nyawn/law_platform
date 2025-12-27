import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const ForumThreadPage = () => {
  const { id } = useParams();
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [deletingPostId, setDeletingPostId] = useState(null);
  const navigate = useNavigate();

  // Функция для нормализации тегов
  const normalizeTags = useCallback((tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    return [];
  }, []);

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
    loadThread();
  }, [id]);

  const loadThread = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/forum/threads/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Тема не найдена');
        }
        throw new Error(`Ошибка загрузки темы: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Нормализуем теги
      if (data.thread) {
        data.thread.tags = normalizeTags(data.thread.tags);
        
        // Нормализуем теги для всех сообщений
        if (data.thread.posts && Array.isArray(data.thread.posts)) {
          data.thread.posts = data.thread.posts.map(post => ({
            ...post,
            tags: normalizeTags(post.tags)
          }));
        }
      }
      
      setThread(data.thread);
    } catch (error) {
      console.error('Ошибка загрузки темы:', error);
      setError(error.message);
      setThread(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Для отправки сообщения необходимо войти в систему');
      navigate('/auth');
      return;
    }

    if (!newPost.trim()) {
      alert('Введите текст сообщения');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/forum/threads/${id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newPost
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка отправки сообщения');
      }

      // Добавляем новый пост в существующий список без перезагрузки страницы
      const newPostData = {
        ...data.post,
        author: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          user_type: user.userType || user.user_type,
          verification_status: user.verificationStatus || 'not_verified'
        },
        createdAt: new Date().toISOString()
      };

      // Обновляем состояние темы
      setThread(prev => ({
        ...prev,
        posts: [...(prev.posts || []), newPostData]
      }));
      
      setNewPost('');
      
      // Прокручиваем к новому сообщению
      setTimeout(() => {
        const postsContainer = document.getElementById('posts-container');
        if (postsContainer) {
          postsContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 100);
      
    } catch (error) {
      alert('Ошибка: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ФУНКЦИЯ УДАЛЕНИЯ КОММЕНТАРИЯ
  const handleDeletePost = async (postId, postIndex) => {
    if (!user) {
      alert('Для удаления сообщения необходимо войти в систему');
      return;
    }

    // Проверяем, является ли пользователь автором комментария или администратором
    const post = thread.posts[postIndex];
    const isAuthor = user.id === post.author?.id;
    const isAdmin = user.userType === 'admin' || user.user_type === 'admin';
    
    if (!isAuthor && !isAdmin) {
      alert('Вы можете удалять только свои собственные сообщения');
      return;
    }

    const confirmDelete = window.confirm(
      'Вы уверены, что хотите удалить этот комментарий? Это действие нельзя отменить.'
    );
    
    if (!confirmDelete) return;

    try {
      setDeletingPostId(postId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/forum/threads/${id}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка удаления сообщения');
      }

      // Удаляем пост из состояния без перезагрузки страницы
      setThread(prev => ({
        ...prev,
        posts: prev.posts.filter((post, index) => index !== postIndex)
      }));

      alert('Сообщение успешно удалено');
      
    } catch (error) {
      console.error('Ошибка удаления комментария:', error);
      alert('Ошибка: ' + error.message);
    } finally {
      setDeletingPostId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'недавно';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} минут назад`;
    } else if (diffHours < 24) {
      return `${diffHours} часов назад`;
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дней назад`;
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getCategoryName = (category) => {
    const categories = {
      'legislation': 'Законодательство',
      'court': 'Судебная практика',
      'media': 'Медиа и журналистика',
      'ethics': 'Профессиональная этика',
      'consultation': 'Консультации',
      'discussion': 'Обсуждения',
      'news': 'Новости'
    };
    return categories[category] || category;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'legislation': '#c00',
      'court': '#0d6efd',
      'media': '#198754',
      'ethics': '#ffc107',
      'consultation': '#6f42c1',
      'discussion': '#20c997',
      'news': '#fd7e14'
    };
    return colors[category] || '#6c757d';
  };

  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '50px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{ fontSize: '20px', color: '#6c757d' }}>Загрузка темы...</div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '50px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>😞</div>
        <div style={{ fontSize: '24px', color: '#c00', marginBottom: '20px' }}>
          {error || 'Тема не найдена'}
        </div>
        <p style={{ color: '#6c757d', marginBottom: '30px', fontSize: '16px' }}>
          Возможно, тема была удалена или у вас нет доступа к её просмотру.
        </p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <Link to="/forum">
            <button style={{
              backgroundColor: '#c00',
              color: 'white',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: '600'
            }}>
              Вернуться к списку тем
            </button>
          </Link>
          <Link to="/">
            <button style={{
              backgroundColor: 'white',
              color: '#495057',
              border: '2px solid #dee2e6',
              padding: '12px 30px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: '600'
            }}>
              На главную
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
      {/* Хлебные крошки */}
      <div style={{ marginBottom: '30px' }}>
        <Link to="/" style={{ color: '#6c757d', textDecoration: 'none' }}>Главная</Link>
        <span style={{ margin: '0 10px', color: '#6c757d' }}>›</span>
        <Link to="/forum" style={{ color: '#6c757d', textDecoration: 'none' }}>Форум</Link>
        <span style={{ margin: '0 10px', color: '#6c757d' }}>›</span>
        <span style={{ color: '#212529', fontWeight: '500' }}>{thread.title}</span>
      </div>

      {/* Заголовок темы */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              {thread.isPinned && (
                <span style={{
                  backgroundColor: '#ffc107',
                  color: '#212529',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  📌 Закреплено
                </span>
              )}
              {thread.isClosed && (
                <span style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  🔒 Закрыта
                </span>
              )}
              <span style={{
                backgroundColor: getCategoryColor(thread.category),
                color: 'white',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {getCategoryName(thread.category)}
              </span>
            </div>
            
            <h1 style={{ fontSize: '28px', color: '#212529', marginBottom: '15px', lineHeight: '1.4' }}>
              {thread.title}
            </h1>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>
              👁️ {thread.views || 0} просмотров
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              💬 {thread.posts?.length || 0} ответов
            </div>
          </div>
        </div>

        {/* Автор и дата */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '25px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#e9ecef',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#495057',
            flexShrink: 0
          }}>
            {thread.author?.first_name?.[0]}{thread.author?.last_name?.[0]}
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
              <span style={{ fontWeight: '600', color: '#212529' }}>
                {thread.author?.first_name} {thread.author?.last_name}
              </span>
              {thread.author?.verification_status === 'verified' && (
                <span style={{
                  backgroundColor: '#d1e7dd',
                  color: '#0f5132',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  ✓ Проверенный эксперт
                </span>
              )}
              <span style={{
                backgroundColor: '#e7f5ff',
                color: '#0d6efd',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {thread.author?.user_type === 'lawyer' && '👨‍⚖️ Юрист'}
                {thread.author?.user_type === 'journalist' && '📰 Журналист'}
                {thread.author?.user_type === 'activist' && '🌐 Общественный деятель'}
                {thread.author?.user_type === 'admin' && '👑 Администратор'}
                {thread.author?.user_type === 'public' && '👤 Пользователь'}
              </span>
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              Создано: {formatDate(thread.createdAt)}
              {thread.lastActivity !== thread.createdAt && (
                <span> • Последнее сообщение: {formatDate(thread.lastActivity)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Содержание темы */}
        <div style={{
          padding: '25px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '30px',
          lineHeight: '1.6',
          fontSize: '16px',
          color: '#212529'
        }}>
          {thread.content.split('\n').map((paragraph, index) => (
            <p key={index} style={{ marginBottom: paragraph ? '15px' : '0' }}>
              {paragraph || <br />}
            </p>
          ))}
        </div>

        {/* Теги */}
        {thread.tags && Array.isArray(thread.tags) && thread.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {thread.tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: '#e9ecef',
                  color: '#495057',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '14px'
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Сообщения */}
      <div id="posts-container" style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '24px', color: '#212529', marginBottom: '20px' }}>
          Ответы ({thread.posts?.length || 0})
        </h2>
        
        {(!thread.posts || thread.posts.length === 0) ? (
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#6c757d',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>💭</div>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>Пока нет ответов</div>
            <div style={{ fontSize: '14px' }}>Будьте первым, кто оставит комментарий!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {thread.posts.map((post, index) => (
              <div
                key={post.id || index}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '25px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  position: 'relative'
                }}
              >
                {/* Индикатор автора темы */}
                {post.author?.id === thread.author?.id && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: '#c00',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    Автор темы
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '15px' }}>
                  {/* Аватар автора */}
                  <div style={{ flexShrink: 0 }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: '#e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#495057'
                    }}>
                      {post.author?.first_name?.[0]}{post.author?.last_name?.[0]}
                    </div>
                  </div>

                  {/* Контент сообщения */}
                  <div style={{ flex: 1 }}>
                    {/* Заголовок сообщения */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                          <span style={{ fontWeight: '600', color: '#212529' }}>
                            {post.author?.first_name} {post.author?.last_name}
                          </span>
                          {post.author?.verification_status === 'verified' && (
                            <span style={{
                              backgroundColor: '#d1e7dd',
                              color: '#0f5132',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              ✓ Проверенный
                            </span>
                          )}
                          <span style={{
                            backgroundColor: '#e7f5ff',
                            color: '#0d6efd',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {post.author?.user_type === 'lawyer' && 'Юрист'}
                            {post.author?.user_type === 'journalist' && 'Журналист'}
                            {post.author?.user_type === 'activist' && 'Общественный деятель'}
                            {post.author?.user_type === 'admin' && 'Администратор'}
                            {post.author?.user_type === 'public' && 'Пользователь'}
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#6c757d' }}>
                          {formatDate(post.createdAt)}
                          {post.isEdited && (
                            <span style={{ marginLeft: '10px', fontStyle: 'italic' }}>
                              (изменено)
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => {
                            alert('Функция лайка скоро будет добавлена!');
                          }}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#6c757d',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          👍 {post.likes?.length || 0}
                        </button>
                        
                        {/* Кнопки управления для автора и администратора */}
                        {(user?.id === post.author?.id || user?.userType === 'admin' || user?.user_type === 'admin') && (
                          <>
                            {user?.id === post.author?.id && (
                              <button
                                onClick={() => {
                                  const newContent = prompt('Редактировать сообщение:', post.content);
                                  if (newContent && newContent !== post.content) {
                                    alert('Редактирование сообщений скоро будет доступно!');
                                  }
                                }}
                                style={{
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  color: '#6c757d',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                ✏️
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeletePost(post.id || index, index)}
                              disabled={deletingPostId === (post.id || index)}
                              style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: deletingPostId === (post.id || index) ? '#adb5bd' : '#dc3545',
                                cursor: deletingPostId === (post.id || index) ? 'not-allowed' : 'pointer',
                                fontSize: '14px'
                              }}
                              title="Удалить комментарий"
                            >
                              {deletingPostId === (post.id || index) ? '🗑️ Удаление...' : '🗑️'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Текст сообщения */}
                    <div style={{
                      lineHeight: '1.6',
                      fontSize: '16px',
                      color: '#212529'
                    }}>
                      {post.content.split('\n').map((paragraph, pIndex) => (
                        <p key={pIndex} style={{ marginBottom: paragraph ? '10px' : '0' }}>
                          {paragraph || <br />}
                        </p>
                      ))}
                    </div>

                    {/* Теги сообщения */}
                    {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '15px', flexWrap: 'wrap' }}>
                        {post.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            style={{
                              backgroundColor: '#f8f9fa',
                              color: '#495057',
                              padding: '4px 8px',
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ФОРМА ДЛЯ НОВОГО СООБЩЕНИЯ - ТОЛЬКО ОДНА ФОРМА */}
      {thread.isClosed ? (
        <div style={{
          backgroundColor: '#f8d7da',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #f5c6cb',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '24px' }}>🔒</div>
            <div>
              <h4 style={{ color: '#721c24', marginBottom: '5px' }}>
                Тема закрыта
              </h4>
              <p style={{ color: '#721c24', fontSize: '14px', margin: 0 }}>
                Новые сообщения в этой теме не принимаются.
              </p>
            </div>
          </div>
        </div>
      ) : user ? (
        // УБРАНА ПРОВЕРКА НА ВЕРИФИКАЦИЮ - теперь любой авторизованный пользователь может писать
        // Форма показывается ВСЕМ авторизованным пользователям
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h3 style={{ fontSize: '20px', color: '#212529', marginBottom: '20px' }}>
            Добавить ответ
          </h3>
          
          <form onSubmit={handleSubmitPost}>
            <div style={{ marginBottom: '20px' }}>
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Напишите ваш ответ здесь..."
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '15px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                disabled={submitting}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>
                Вы отвечаете как: {user.firstName || user.first_name} {user.lastName || user.last_name}
              </div>
              
              <button
                type="submit"
                disabled={submitting || !newPost.trim()}
                style={{
                  backgroundColor: submitting ? '#6c757d' : '#c00',
                  color: 'white',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: submitting || !newPost.trim() ? 'not-allowed' : 'pointer',
                  opacity: submitting || !newPost.trim() ? 0.7 : 1
                }}
              >
                {submitting ? 'Отправка...' : 'Отправить ответ'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#e7f5ff',
          padding: '25px',
          borderRadius: '12px',
          border: '1px solid #cfe2ff',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔒</div>
          <h3 style={{ color: '#084298', marginBottom: '10px' }}>
            Войдите для участия в обсуждении
          </h3>
          <p style={{ color: '#084298', fontSize: '15px', marginBottom: '20px' }}>
            Только авторизованные пользователи могут оставлять сообщения на форуме.
            {/* Убрано упоминание о верификации */}
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <Link to="/auth">
              <button style={{
                backgroundColor: '#c00',
                color: 'white',
                border: 'none',
                padding: '12px 25px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Войти в систему
              </button>
            </Link>
            <Link to="/auth">
              <button style={{
                backgroundColor: 'white',
                color: '#495057',
                border: '2px solid #dee2e6',
                padding: '12px 25px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Зарегистрироваться
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Навигация */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #e9ecef'
      }}>
        <Link to="/forum">
          <button style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ← Вернуться к списку тем
          </button>
        </Link>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {thread.isClosed ? (
            <span style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '8px 15px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              🚫 Тема закрыта
            </span>
          ) : user?.userType === 'admin' && (
            <button
              onClick={() => {
                const confirmClose = window.confirm(
                  thread.isClosed 
                    ? 'Открыть тему для обсуждения?'
                    : 'Закрыть тему для новых сообщений?'
                );
                if (confirmClose) {
                  alert('Функция закрытия темы скоро будет добавлена!');
                }
              }}
              style={{
                backgroundColor: thread.isClosed ? '#198754' : '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {thread.isClosed ? '📂 Открыть тему' : '🚫 Закрыть тему'}
            </button>
          )}
          
          {user?.userType === 'admin' && (
            <button
              onClick={() => {
                const confirmPin = window.confirm(
                  thread.isPinned 
                    ? 'Открепить тему?' 
                    : 'Закрепить тему вверху списка?'
                );
                if (confirmPin) {
                  alert('Функция закрепления тем скоро будет добавлена!');
                }
              }}
              style={{
                backgroundColor: thread.isPinned ? '#6c757d' : '#ffc107',
                color: thread.isPinned ? 'white' : '#212529',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {thread.isPinned ? '📌 Открепить' : '📌 Закрепить'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForumThreadPage;