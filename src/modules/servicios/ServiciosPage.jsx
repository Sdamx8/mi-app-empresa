import React from 'react';
import ServiciosList from './components/ServiciosList';
import { motion } from 'framer-motion';

const ServiciosPage = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ background: '#F8F9FA', minHeight: '100vh', padding: 32 }}>
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ color: '#5DADE2', fontFamily: 'Poppins, Roboto, sans-serif', fontWeight: 700, fontSize: 32, marginBottom: 24 }}>
        Catálogo de servicios
      </h1>
      <ServiciosList />
    </div>
  </motion.div>
);

export default ServiciosPage;
