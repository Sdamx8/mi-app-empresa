// components/Financiero/VisualizadorFactura.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { X, Download, Send, Printer, FileText } from 'lucide-react';

const VisualizadorFactura = ({ factura, onCerrar }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDescargarPDF = () => {
    // Implementar generación de PDF
    console.log('Descargando PDF de factura:', factura.numero_factura);
  };

  const handleEnviarEmail = () => {
    // Implementar envío por email
    console.log('Enviando factura por email:', factura.numero_factura);
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onCerrar}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con acciones */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {factura.numero_factura}
              </h2>
              <p className="text-sm text-gray-500">Vista previa de factura</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleDescargarPDF}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
              title="Descargar PDF"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleEnviarEmail}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="Enviar por email"
            >
              <Send className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleImprimir}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              title="Imprimir"
            >
              <Printer className="w-5 h-5" />
            </button>
            
            <button
              onClick={onCerrar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido de la factura */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] print:overflow-visible">
          <div className="p-8 bg-white" id="factura-content">
            {/* Header de la empresa */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <img 
                  src="/images/logo-gms.svg" 
                  alt="Global Mobility Solutions" 
                  className="h-16 mb-4"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="text-gray-600">
                  <h1 className="text-2xl font-bold text-blue-600 mb-2">
                    Global Mobility Solutions
                  </h1>
                  <p>NIT: 900.123.456-1</p>
                  <p>Carrera 45 #123-67, Bogotá D.C.</p>
                  <p>Tel: (601) 234-5678</p>
                  <p>Email: facturacion@gms.com</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-4">
                  <h2 className="text-xl font-bold">FACTURA</h2>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>No. Factura:</strong> {factura.numero_factura}</p>
                  <p><strong>Fecha:</strong> {formatDate(factura.fecha_factura)}</p>
                  <p><strong>Vencimiento:</strong> {formatDate(factura.fecha_vencimiento)}</p>
                  {factura.remision_id && (
                    <p><strong>Remisión:</strong> {factura.remision_id}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Información del cliente */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Facturar a:</h3>
              <div className="text-gray-700">
                <p className="font-medium">{factura.cliente.nombre}</p>
                <p>NIT: {factura.cliente.nit}</p>
                {factura.cliente.direccion && <p>{factura.cliente.direccion}</p>}
                {factura.cliente.email && <p>Email: {factura.cliente.email}</p>}
                {factura.cliente.telefono && <p>Tel: {factura.cliente.telefono}</p>}
              </div>
            </div>

            {/* Tabla de items */}
            <div className="mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Descripción</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Cantidad</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Valor Unitario</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {factura.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">{item.descripcion}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{item.cantidad}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {formatCurrency(item.valor_unitario)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="flex justify-end mb-6">
              <div className="w-64">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(factura.subtotal)}</span>
                  </div>
                  
                  {factura.descuento > 0 && (
                    <div className="flex justify-between py-1 text-red-600">
                      <span>Descuento:</span>
                      <span>-{formatCurrency(factura.descuento)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between py-1">
                    <span>IVA (19%):</span>
                    <span>{formatCurrency(factura.iva)}</span>
                  </div>
                  
                  {factura.retencion > 0 && (
                    <div className="flex justify-between py-1 text-red-600">
                      <span>Retención:</span>
                      <span>-{formatCurrency(factura.retencion)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-300 pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>TOTAL:</span>
                      <span>{formatCurrency(factura.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            {factura.observaciones && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Observaciones:</h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                  {factura.observaciones}
                </div>
              </div>
            )}

            {/* Información de pago */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Información de Pago:</h4>
              <div className="text-sm text-blue-800">
                <p><strong>Banco:</strong> Bancolombia</p>
                <p><strong>Cuenta Corriente:</strong> 123-456789-01</p>
                <p><strong>A nombre de:</strong> Global Mobility Solutions S.A.S.</p>
                <p><strong>NIT:</strong> 900.123.456-1</p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-300 pt-4 text-center text-xs text-gray-500">
              <p>Esta factura es un documento soporte de la transacción comercial.</p>
              <p>Para cualquier consulta, contacte a: facturacion@gms.com | Tel: (601) 234-5678</p>
              <p className="mt-2">
                <strong>Global Mobility Solutions S.A.S.</strong> - Soluciones integrales de movilidad
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VisualizadorFactura;
