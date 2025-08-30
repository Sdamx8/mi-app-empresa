import React from 'react';

const NoticiasTest2 = ({ userRole, userName }) => {
  console.log('NoticiasTest2 renderizando con:', { userRole, userName });
  
  return (
    <div style={{
      backgroundColor: 'red',
      color: 'white',
      padding: '20px',
      margin: '20px 0',
      borderRadius: '8px',
      textAlign: 'center',
      fontSize: '18px',
      fontWeight: 'bold'
    }}>
      🚨 COMPONENTE DE PRUEBA SIMPLE 🚨
      <br />
      Usuario: {userName || 'No definido'}
      <br />
      Rol: {userRole || 'No definido'}
      <br />
      ¡Si ves este mensaje, el problema está en NoticiasCompensar!
    </div>
  );
};

export default NoticiasTest2;
