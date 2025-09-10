import React from 'react';

const InformesTecnicosPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Informes Técnicos
          </h1>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  📋 Página de informes técnicos en desarrollo
                </p>
                <p className="mt-1 text-sm text-blue-600">
                  Esta página mostrará todos los informes técnicos disponibles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InformesTecnicosPage;
