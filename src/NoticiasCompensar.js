import React, { useState, useEffect } from 'react';

const NoticiasCompensar = ({ userRole = 'tecnico', userName = 'Usuario' }) => {
  const [currentNews, setCurrentNews] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  console.log('NoticiasCompensar renderizando con:', { userRole, userName });

  // Noticias reales de Compensar organizadas por relevancia según el rol
  const noticias = {
    // Noticias para todos los roles
    general: [
      {
        id: 1,
        categoria: 'Salud y Bienestar',
        titulo: '💊 Nuevos Servicios de Telemedicina Disponibles',
        contenido: 'Compensar amplía su cobertura de telemedicina 24/7. Consultas médicas desde la comodidad de tu hogar.',
        fecha: '2025-01-20',
        enlace: 'https://www.compensar.com/salud/telemedicina',
        color: '#28a745',
        relevancia: 'alta',
        roles: ['directivo', 'administrativo', 'tecnico']
      },
      {
        id: 2,
        categoria: 'Recreación',
        titulo: '🏖️ Nuevas Tarifas Preferenciales en Hoteles y Centros Recreativos',
        contenido: 'Disfruta de descuentos especiales en todos los centros recreativos y hoteles de Compensar durante 2025.',
        fecha: '2025-01-18',
        enlace: 'https://www.compensar.com/recreacion/centros-recreativos',
        color: '#17a2b8',
        relevancia: 'media',
        roles: ['directivo', 'administrativo', 'tecnico']
      },
      {
        id: 3,
        categoria: 'Educación',
        titulo: '🎓 Becas y Créditos Educativos 2025',
        contenido: 'Compensar ofrece nuevos programas de apoyo educativo para afiliados y sus familias.',
        fecha: '2025-01-15',
        enlace: 'https://www.compensar.com/educacion/becas',
        color: '#6f42c1',
        relevancia: 'alta',
        roles: ['directivo', 'administrativo', 'tecnico']
      }
    ],
    
    // Noticias específicas para directivos y administrativos
    directivo_administrativo: [
      {
        id: 4,
        categoria: 'Empresarial',
        titulo: '📊 Nuevos Servicios Empresariales de Compensar',
        contenido: 'Programas de bienestar laboral y capacitación empresarial. Mejora el ambiente laboral de tu empresa.',
        fecha: '2025-01-19',
        enlace: 'https://www.compensar.com/empresas',
        color: '#007bff',
        relevancia: 'alta',
        roles: ['directivo', 'administrativo']
      },
      {
        id: 5,
        categoria: 'Crédito',
        titulo: '💰 Créditos Empresariales con Tasas Preferenciales',
        contenido: 'Líneas de crédito especiales para empresas afiliadas con tasas competitivas y plazos flexibles.',
        fecha: '2025-01-16',
        enlace: 'https://www.compensar.com/credito/empresarial',
        color: '#fd7e14',
        relevancia: 'alta',
        roles: ['directivo']
      }
    ],
    
    // Noticias específicas para técnicos
    tecnico: [
      {
        id: 6,
        categoria: 'Capacitación',
        titulo: '🔧 Cursos Técnicos Gratuitos en Compensar',
        contenido: 'Nuevos cursos de capacitación técnica en electricidad, mecánica y tecnología. ¡Inscripciones abiertas!',
        fecha: '2025-01-17',
        enlace: 'https://www.compensar.com/educacion/cursos-tecnicos',
        color: '#ffc107',
        relevancia: 'alta',
        roles: ['tecnico']
      },
      {
        id: 7,
        categoria: 'Vivienda',
        titulo: '🏠 Subsidios de Vivienda para Trabajadores',
        contenido: 'Compensar facilita el acceso a vivienda propia con subsidios y créditos preferenciales.',
        fecha: '2025-01-14',
        enlace: 'https://www.compensar.com/vivienda/subsidios',
        color: '#20c997',
        relevancia: 'media',
        roles: ['tecnico', 'administrativo']
      }
    ],
    
    // Noticias de eventos y actividades
    eventos: [
      {
        id: 8,
        categoria: 'Eventos',
        titulo: '🎪 Feria de Salud y Bienestar 2025',
        contenido: 'Del 15 al 17 de febrero. Jornadas gratuitas de salud, vacunación y actividades recreativas familiares.',
        fecha: '2025-01-21',
        enlace: 'https://www.compensar.com/eventos/feria-salud',
        color: '#e83e8c',
        relevancia: 'media',
        roles: ['directivo', 'administrativo', 'tecnico']
      },
      {
        id: 9,
        categoria: 'Deportes',
        titulo: '⚽ Liga Deportiva Compensar 2025',
        contenido: 'Inscripciones abiertas para torneos de fútbol, natación y otros deportes. ¡Participa con tu familia!',
        fecha: '2025-01-13',
        enlace: 'https://www.compensar.com/deporte/liga',
        color: '#dc3545',
        relevancia: 'baja',
        roles: ['directivo', 'administrativo', 'tecnico']
      }
    ]
  };

  // Filtrar noticias según el rol del usuario
  const getFilteredNews = () => {
    // Normalizar el rol a minúsculas para comparación
    const normalizedRole = userRole.toLowerCase();
    
    let allNews = [...noticias.general, ...noticias.eventos];
    
    if (normalizedRole === 'directivo') {
      allNews = [...allNews, ...noticias.directivo_administrativo, ...noticias.tecnico];
    } else if (normalizedRole === 'administrativo') {
      allNews = [...allNews, ...noticias.directivo_administrativo];
    } else if (normalizedRole === 'tecnico') {
      allNews = [...allNews, ...noticias.tecnico];
    }

    return allNews
      .filter(noticia => noticia.roles.includes(normalizedRole))
      .sort((a, b) => {
        const relevanciaOrder = { 'alta': 3, 'media': 2, 'baja': 1 };
        return relevanciaOrder[b.relevancia] - relevanciaOrder[a.relevancia];
      });
  };

  const filteredNews = getFilteredNews();

  console.log('Filtered news count:', filteredNews.length);
  console.log('Current news index:', currentNews);
  console.log('Is visible:', isVisible);
  console.log('First news item:', filteredNews[0]);

  // Cambiar noticia automáticamente cada 10 segundos
  useEffect(() => {
    if (filteredNews.length > 1) {
      const interval = setInterval(() => {
        setCurrentNews(prev => (prev + 1) % filteredNews.length);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [filteredNews.length]);

  if (!isVisible || filteredNews.length === 0) {
    return null;
  }

  const current = filteredNews[currentNews];

  const getRoleTitle = () => {
    const normalizedRole = userRole.toLowerCase();
    switch (normalizedRole) {
      case 'directivo': return 'Noticias Ejecutivas de Compensar';
      case 'administrativo': return 'Información de Compensar para Administrativos';
      case 'tecnico': return 'Noticias Técnicas y Beneficios de Compensar';
      default: return 'Noticias de Compensar';
    }
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '16px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
      border: `3px solid ${current.color}`,
      position: 'relative',
      overflow: 'hidden',
      transform: 'translateX(0)',
      transition: 'all 0.6s ease-out'
    }}>
      {/* Logo y header de Compensar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #f0f0f0'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          backgroundColor: '#0066cc',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '1rem',
          fontSize: '1.8rem',
          color: 'white',
          fontWeight: 'bold'
        }}>
          C
        </div>
        <div>
          <h2 style={{
            margin: 0,
            color: '#0066cc',
            fontSize: '1.4rem',
            fontWeight: '700'
          }}>
            COMPENSAR
          </h2>
          <p style={{
            margin: 0,
            color: '#666',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            {getRoleTitle()}
          </p>
        </div>
        
        {/* Botón cerrar */}
        <button
          onClick={() => setIsVisible(false)}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#999',
            padding: '0.5rem',
            borderRadius: '50%',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f8f9fa';
            e.target.style.color = '#666';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#999';
          }}
        >
          ✕
        </button>
      </div>

      {/* Categoría y fecha */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <span style={{
          backgroundColor: current.color,
          color: 'white',
          padding: '0.4rem 1rem',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: '600',
          textTransform: 'uppercase'
        }}>
          {current.categoria}
        </span>
        <span style={{
          color: '#666',
          fontSize: '0.9rem'
        }}>
          {new Date(current.fecha).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </span>
      </div>

      {/* Título de la noticia */}
      <h3 style={{
        margin: '0 0 1rem 0',
        color: current.color,
        fontSize: '1.3rem',
        fontWeight: '600',
        lineHeight: '1.4'
      }}>
        {current.titulo}
      </h3>

      {/* Contenido */}
      <p style={{
        margin: '0 0 1.5rem 0',
        color: '#555',
        fontSize: '1rem',
        lineHeight: '1.6'
      }}>
        {current.contenido}
      </p>

      {/* Enlace y navegación */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <a
          href={current.enlace}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: current.color,
            color: 'white',
            textDecoration: 'none',
            padding: '0.7rem 1.5rem',
            borderRadius: '25px',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: `0 4px 12px ${current.color}40`
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = `0 6px 16px ${current.color}50`;
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = `0 4px 12px ${current.color}40`;
          }}
        >
          📖 Ver más información
        </a>
        
        {/* Indicadores de navegación */}
        {filteredNews.length > 1 && (
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '0.8rem',
              color: '#666',
              marginRight: '0.5rem'
            }}>
              {currentNews + 1} de {filteredNews.length}
            </span>
            {filteredNews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentNews(index)}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: index === currentNews ? current.color : '#ddd',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mensaje personalizado */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: `${current.color}10`,
        borderRadius: '12px',
        borderLeft: `4px solid ${current.color}`,
        fontSize: '0.9rem',
        color: current.color,
        fontWeight: '500'
      }}>
        💼 {userName}, mantente informado sobre los beneficios y servicios de Compensar para ti y tu familia.
      </div>

      {/* Barra de progreso */}
      {filteredNews.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '4px',
          backgroundColor: current.color,
          transform: 'scaleX(1)',
          transformOrigin: 'left',
          width: '100%'
        }} />
      )}

    </div>
  );
};

export default NoticiasCompensar;
