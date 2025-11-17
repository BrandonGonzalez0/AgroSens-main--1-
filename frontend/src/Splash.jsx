import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Splash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 2600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <motion.img
          src="/logo.svg"
          alt="AgroSens"
          className="w-20 h-20 md:w-24 md:h-24 drop-shadow-lg"
          initial={{ rotate: -8, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
        <motion.h1
          className="mt-6 text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          AgroSens
        </motion.h1>
        <motion.p
          className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          Inteligencia para tus cultivos
        </motion.p>
      </motion.div>

      <div className="mt-10 w-64 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-green-500 to-blue-500"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 2.2, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}
