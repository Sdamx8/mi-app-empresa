import React from 'react';
import ServiciosList from './components/ServiciosList';
import { motion } from 'framer-motion';

const ServiciosPage = () => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    transition={{ duration: 0.4 }} 
    style={{ minHeight: '100vh' }}
  >
    <ServiciosList />
  </motion.div>
);

export default ServiciosPage;
