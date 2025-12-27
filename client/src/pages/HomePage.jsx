const HomePage = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      {/* Герой-секция */}
      <div style={{
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: '12px',
        padding: '60px 40px',
        textAlign: 'center',
        marginBottom: '50px',
        border: '1px solid #dee2e6'
      }}>
        <h1 style={{ fontSize: '48px', color: '#212529', marginBottom: '20px' }}>
          Профессиональное сообщество 
          <span style={{ color: '#c00', display: 'block' }}>юристов и журналистов</span>
        </h1>
        <p style={{ fontSize: '20px', color: '#495057', maxWidth: '800px', margin: '0 auto 30px' }}>
          Платформа для экспертов, где знания встречаются с репутацией. 
          Верифицированные специалисты, экспертные статьи и профессиональные обсуждения.
        </p>
      </div>

      {/* Статистика */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '50px'
      }}>
        {[
          { label: 'Верифицированных экспертов', value: '0', color: '#c00' },
          { label: 'Профессиональных статей', value: '0', color: '#0d6efd' },
          { label: 'Участников сообщества', value: '0', color: '#198754' },
          { label: 'Средний рейтинг', value: '0', color: '#ffc107' }
        ].map((item, index) => (
          <div key={index} style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: item.color,
              marginBottom: '10px'
            }}>
              {item.value}
            </div>
            <div style={{ color: '#6c757d', fontSize: '16px' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Категории */}
      <div style={{ marginBottom: '50px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', marginBottom: '40px', color: '#212529' }}>
          Ключевые направления
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '25px'
        }}>
          {[
            { title: 'Юристы', desc: 'Адвокаты, нотариусы, правозащитники с верификацией', icon: '⚖️' },
            { title: 'Журналисты', desc: 'Профессиональные СМИ, аналитики, медиа-эксперты', icon: '📰' },
            { title: 'Общественные деятели', desc: 'Активисты, правозащитники, общественные организации', icon: '🌐' }
          ].map((item, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              border: '1px solid #e9ecef',
              transition: 'transform 0.2s'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: '24px', color: '#212529', marginBottom: '15px' }}>
                {item.title}
              </h3>
              <p style={{ color: '#6c757d', lineHeight: '1.6' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;