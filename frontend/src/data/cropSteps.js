export const cropSteps = {
  'Lechuga': [
    { title: 'Preparación del suelo', description: 'Preparar sustrato con buen drenaje y pH 6.0-7.0', duration: '1 día', tips: 'Mezclar tierra con compost' },
    { title: 'Siembra', description: 'Sembrar semillas a 1cm de profundidad, separadas 15cm', duration: '1 día', tips: 'Regar suavemente después de sembrar' },
    { title: 'Germinación', description: 'Mantener humedad constante, temperatura 15-20°C', duration: '5-7 días', tips: 'Cubrir con plástico para mantener humedad' },
    { title: 'Primer riego', description: 'Riego ligero cuando aparezcan los primeros brotes', duration: '1 día', tips: 'Usar regadera con agujeros finos' },
    { title: 'Trasplante', description: 'Trasplantar plántulas cuando tengan 4-5 hojas verdaderas', duration: '1 día', tips: 'Hacerlo en horas frescas del día' },
    { title: 'Establecimiento', description: 'Riego regular cada 2-3 días, evitar encharcamiento', duration: '10 días', tips: 'Observar signos de estrés en las plantas' },
    { title: 'Crecimiento vegetativo', description: 'Fertilización ligera cada 15 días', duration: '20 días', tips: 'Usar fertilizante rico en nitrógeno' },
    { title: 'Formación de cabeza', description: 'Reducir riego, las hojas se compactan', duration: '15 días', tips: 'Evitar mojar las hojas' },
    { title: 'Cosecha', description: 'Cosechar cuando las hojas estén firmes y compactas', duration: '1 día', tips: 'Cortar en la mañana temprano' }
  ],
  
  'Tomate': [
    { title: 'Preparación del suelo', description: 'Suelo rico en materia orgánica, pH 6.0-6.8', duration: '1 día', tips: 'Agregar compost y humus de lombriz' },
    { title: 'Siembra en semillero', description: 'Sembrar en bandejas de germinación a 0.5cm profundidad', duration: '1 día', tips: 'Usar sustrato específico para semilleros' },
    { title: 'Germinación', description: 'Mantener temperatura 20-25°C y humedad constante', duration: '7-10 días', tips: 'Colocar en lugar cálido y luminoso' },
    { title: 'Cuidado de plántulas', description: 'Riego suave y luz indirecta', duration: '15 días', tips: 'Evitar corrientes de aire' },
    { title: 'Trasplante', description: 'Trasplantar cuando tengan 15cm y 6-8 hojas', duration: '1 día', tips: 'Endurecer las plantas 1 semana antes' },
    { title: 'Entutorado', description: 'Colocar tutores de 1.5m para soporte', duration: '1 día', tips: 'Usar estacas de madera o bambú' },
    { title: 'Crecimiento inicial', description: 'Riego profundo cada 3-4 días', duration: '20 días', tips: 'Mulching para conservar humedad' },
    { title: 'Poda de chupones', description: 'Eliminar brotes laterales semanalmente', duration: '1 día', tips: 'Hacerlo en la mañana con manos limpias' },
    { title: 'Floración', description: 'Aparición de primeras flores, reducir nitrógeno', duration: '15 días', tips: 'Aumentar fósforo y potasio' },
    { title: 'Cuajado de frutos', description: 'Polinización y formación de frutos pequeños', duration: '15 días', tips: 'Mantener humedad constante' },
    { title: 'Desarrollo de frutos', description: 'Crecimiento y llenado de tomates', duration: '30 días', tips: 'Riego regular, evitar estrés hídrico' },
    { title: 'Maduración', description: 'Los frutos cambian de color verde a rojo', duration: '15 días', tips: 'Reducir riego para concentrar sabores' },
    { title: 'Cosecha continua', description: 'Recolectar tomates maduros cada 2-3 días', duration: '60 días', tips: 'Cosechar en punto óptimo de madurez' }
  ],

  'Zanahoria': [
    { title: 'Preparación del suelo', description: 'Suelo suelto, profundo, sin piedras, pH 6.0-6.8', duration: '1 día', tips: 'Labrar a 30cm de profundidad' },
    { title: 'Siembra directa', description: 'Sembrar semillas a 1cm profundidad en surcos', duration: '1 día', tips: 'Mezclar semillas con arena para mejor distribución' },
    { title: 'Germinación', description: 'Mantener suelo húmedo, temperatura 15-25°C', duration: '10-15 días', tips: 'Riego con aspersión fina' },
    { title: 'Aclareo', description: 'Eliminar plántulas débiles, dejar 5cm entre plantas', duration: '1 día', tips: 'Hacerlo cuando tengan 2-3cm de altura' },
    { title: 'Primer aporque', description: 'Cubrir ligeramente la base con tierra', duration: '1 día', tips: 'Evitar que se vean las raíces' },
    { title: 'Crecimiento vegetativo', description: 'Riego regular, fertilización cada 20 días', duration: '45 días', tips: 'Evitar exceso de nitrógeno' },
    { title: 'Desarrollo de raíz', description: 'La raíz se engrosa y alarga', duration: '30 días', tips: 'Mantener suelo suelto y húmedo' },
    { title: 'Segundo aporque', description: 'Cubrir más la base para evitar verdeo', duration: '1 día', tips: 'Solo cubrir el cuello de la raíz' },
    { title: 'Maduración', description: 'Las hojas amarillean, la raíz está lista', duration: '15 días', tips: 'Reducir riego gradualmente' },
    { title: 'Cosecha', description: 'Extraer zanahorias cuando tengan buen tamaño', duration: '1 día', tips: 'Cosechar en suelo húmedo para facilitar extracción' }
  ],

  'Papa': [
    { title: 'Selección de semilla', description: 'Elegir papas semilla certificadas y sanas', duration: '1 día', tips: 'Verificar ausencia de enfermedades' },
    { title: 'Pre-brotado', description: 'Exponer papas a luz indirecta 2-3 semanas', duration: '20 días', tips: 'Brotes de 1-2cm son ideales' },
    { title: 'Preparación del suelo', description: 'Suelo suelto, bien drenado, pH 5.0-6.5', duration: '1 día', tips: 'Incorporar materia orgánica' },
    { title: 'Siembra', description: 'Plantar a 10cm profundidad, separadas 30cm', duration: '1 día', tips: 'Brotes hacia arriba' },
    { title: 'Emergencia', description: 'Aparición de primeros brotes sobre el suelo', duration: '15-20 días', tips: 'Mantener suelo húmedo pero no encharcado' },
    { title: 'Primer aporque', description: 'Cubrir plantas cuando tengan 15cm altura', duration: '1 día', tips: 'Dejar solo las puntas verdes visibles' },
    { title: 'Crecimiento vegetativo', description: 'Desarrollo de follaje y sistema radicular', duration: '30 días', tips: 'Riego regular y fertilización' },
    { title: 'Segundo aporque', description: 'Repetir aporque cuando plantas tengan 25cm', duration: '1 día', tips: 'Formar camellones altos' },
    { title: 'Floración', description: 'Aparición de flores, inicio de tuberización', duration: '15 días', tips: 'Aumentar riego, las papas se están formando' },
    { title: 'Llenado de tubérculos', description: 'Crecimiento y engrosamiento de papas', duration: '45 días', tips: 'Mantener humedad constante' },
    { title: 'Maduración', description: 'Follaje amarillea y se seca', duration: '15 días', tips: 'Reducir riego gradualmente' },
    { title: 'Cosecha', description: 'Extraer papas cuando follaje esté seco', duration: '1 día', tips: 'Cosechar en día seco, dejar secar al sol 2 horas' }
  ],

  'Cebolla': [
    { title: 'Preparación del suelo', description: 'Suelo bien drenado, rico en materia orgánica', duration: '1 día', tips: 'pH entre 6.0-7.0' },
    { title: 'Siembra en semillero', description: 'Sembrar semillas densamente en almácigo', duration: '1 día', tips: 'Cubrir ligeramente con tierra fina' },
    { title: 'Germinación', description: 'Mantener humedad constante, 15-20°C', duration: '10-15 días', tips: 'Riego con aspersión muy fina' },
    { title: 'Crecimiento en almácigo', description: 'Desarrollo de plántulas hasta 15cm', duration: '60 días', tips: 'Fertilización ligera cada 15 días' },
    { title: 'Trasplante', description: 'Trasplantar cuando tengan grosor de lápiz', duration: '1 día', tips: 'Separar 10cm entre plantas' },
    { title: 'Establecimiento', description: 'Adaptación al terreno definitivo', duration: '15 días', tips: 'Riego frecuente pero ligero' },
    { title: 'Crecimiento vegetativo', description: 'Desarrollo de hojas y sistema radicular', duration: '60 días', tips: 'Fertilización rica en nitrógeno' },
    { title: 'Bulbificación', description: 'Inicio de formación del bulbo', duration: '30 días', tips: 'Reducir nitrógeno, aumentar potasio' },
    { title: 'Engrosamiento', description: 'Crecimiento del bulbo de cebolla', duration: '45 días', tips: 'Riego regular, evitar encharcamiento' },
    { title: 'Maduración', description: 'Hojas amarillean y se doblan', duration: '15 días', tips: 'Suspender riego cuando hojas se doblen' },
    { title: 'Curado', description: 'Dejar secar en campo 1 semana', duration: '7 días', tips: 'Voltear bulbos para secado uniforme' },
    { title: 'Cosecha', description: 'Recolectar cuando estén completamente secas', duration: '1 día', tips: 'Almacenar en lugar seco y ventilado' }
  ]
};

export const getCropSteps = (cropName) => {
  return cropSteps[cropName] || [
    { title: 'Preparación', description: 'Preparar el terreno para el cultivo', duration: '1 día', tips: 'Verificar condiciones del suelo' },
    { title: 'Siembra', description: 'Sembrar las semillas o plántulas', duration: '1 día', tips: 'Seguir espaciamiento recomendado' },
    { title: 'Germinación', description: 'Cuidado durante la germinación', duration: '7-14 días', tips: 'Mantener humedad adecuada' },
    { title: 'Crecimiento', description: 'Cuidados durante el crecimiento', duration: '30-60 días', tips: 'Riego y fertilización regular' },
    { title: 'Mantenimiento', description: 'Podas, aporques y cuidados', duration: '15-30 días', tips: 'Observar signos de plagas o enfermedades' },
    { title: 'Cosecha', description: 'Recolección del cultivo maduro', duration: '1-7 días', tips: 'Cosechar en el momento óptimo' }
  ];
};