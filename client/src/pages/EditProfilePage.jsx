import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EditProfilePage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    bio: '',
    specialization: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    if (savedUser) {
      setFormData({
        firstName: savedUser.firstName || '',
        lastName: savedUser.lastName || '',
        phone: savedUser.phone || '',
        location: savedUser.location || '',
        bio: savedUser.bio || '',
        specialization: savedUser.specialization || ''
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT', // Проверь, создан ли у тебя PUT роут на бэкенде!
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Профиль обновлен!');
        navigate('/profile');
      }
    } catch (error) {
      alert('Ошибка при сохранении');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2>Редактирование профиля</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          placeholder="Имя" 
          value={formData.firstName} 
          onChange={e => setFormData({...formData, firstName: e.target.value})}
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
        />
        <input 
          placeholder="Локация" 
          value={formData.location} 
          onChange={e => setFormData({...formData, location: e.target.value})}
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
        />
        <textarea 
          placeholder="О себе" 
          value={formData.bio} 
          onChange={e => setFormData({...formData, bio: e.target.value})}
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '100px' }}
        />
        <button type="submit" style={{ padding: '12px', backgroundColor: '#c00', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Сохранить изменения
        </button>
      </form>
    </div>
  );
};

export default EditProfilePage;