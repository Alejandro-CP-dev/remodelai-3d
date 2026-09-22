import { LibraryAsset } from '../types';

export const ASSET_LIBRARY: LibraryAsset[] = [
  // MUEBLES
  {
    id: 'mueble-cama-doble',
    name: 'Cama Queen Nórdica',
    category: 'muebles',
    type: 'bed',
    description: 'Cama doble con cabecero tapizado y sábanas de lino',
    thumbnailUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200&auto=format&fit=crop&q=80',
    defaultDimensions: { width: 1.6, height: 0.9, depth: 2.0 },
    defaultColor: '#e2e8f0',
    defaultMaterial: 'textil'
  },
  {
    id: 'mueble-escritorio',
    name: 'Escritorio Minimalista',
    category: 'muebles',
    type: 'desk',
    description: 'Escritorio de roble macizo con patas metálicas negras',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=200&auto=format&fit=crop&q=80',
    defaultDimensions: { width: 1.4, height: 0.75, depth: 0.7 },
    defaultColor: '#b45309',
    defaultMaterial: 'madera'
  },
  {
    id: 'mueble-silla-ergonomica',
    name: 'Silla de Oficina Soft',
    category: 'muebles',
    type: 'chair',
    description: 'Silla ergonómica giratoria tapizada en gris grafito',
    thumbnailUrl: 'https://images.unsplash.com/photo-1580481077190-73613467456b?w=200&auto=format&fit=crop&q=80',
    defaultDimensions: { width: 0.6, height: 0.95, depth: 0.6 },
    defaultColor: '#334155',
    defaultMaterial: 'textil'
  },
  {
    id: 'mueble-armario',
    name: 'Armario Empotrado 2 Puertas',
    category: 'muebles',
    type: 'wardrobe',
    description: 'Armario ropero espacioso con acabados en blanco mate',
    thumbnailUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=200&auto=format&fit=crop&q=80',
    defaultDimensions: { width: 1.5, height: 2.2, depth: 0.65 },
    defaultColor: '#f1f5f9',
    defaultMaterial: 'madera_blanca'
  },
  {
    id: 'mueble-sofa',
    name: 'Sofá Moderno 2 Plazas',
    category: 'muebles',
    type: 'sofa',
    description: 'Sofá escandinavo tapizado con cojines decorativos',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&auto=format&fit=crop&q=80',
    defaultDimensions: { width: 1.8, height: 0.8, depth: 0.85 },
    defaultColor: '#475569',
    defaultMaterial: 'textil'
  },
  {
    id: 'mueble-mesa-noche',
    name: 'Mesita de Noche Japandi',
    category: 'muebles',
    type: 'table',
    description: 'Mesa auxiliar compacta con cajón para dormitorio',
    thumbnailUrl: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=200&auto=format&fit=crop&q=80',
    defaultDimensions: { width: 0.5, height: 0.55, depth: 0.45 },
    defaultColor: '#d97706',
    defaultMaterial: 'madera'
  },
  {
    id: 'mueble-estanteria',
    name: 'Estantería Modular',
    category: 'muebles',
    type: 'shelf',
    description: 'Librería abierta de 4 niveles para libros y decoración',
    thumbnailUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=200&auto=format&fit=crop&q=80',
    defaultDimensions: { width: 0.9, height: 1.8, depth: 0.35 },
    defaultColor: '#1e293b',
    defaultMaterial: 'metal_madera'
  },

  // DECORACIÓN
  {
    id: 'deco-lampara-pie',
    name: 'Lámpara de Pie Arco',
    category: 'decoracion',
    type: 'lamp',
    description: 'Lámpara de pie de diseño contemporáneo con luz cálida',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=200&auto=format&fit=crop&q=80',
    defaultDimensions: { width: 0.45, height: 1.7, depth: 0.45 },
    defaultColor: '#f59e0b',
    defaultMaterial: 'metal_laton'
  },
  {
    id: 'deco-planta-monstera',
    name: 'Planta Monstera en Maceta',
    category: 'decoracion',
    type: 'plant',
    description: 'Monstera Deliciosa en macetero cerámico cilíndrico',
    thumbnailUrl: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=200&auto=format&fit=crop&q=80',
    defaultDimensions: { width: 0.6, height: 0.9, depth: 0.6 },
    defaultColor: '#15803d',
    defaultMaterial: 'organico'
  },
  {
    id: 'deco-cuadro-arte',
    name: 'Cuadro Abstracto Minimalista',
    category: 'decoracion',
    type: 'painting',
    description: 'Lienzo enmarcado con arte geométrico suave',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&auto=format&fit=crop&q=80',
    defaultDimensions: { width: 1.0, height: 0.7, depth: 0.05 },
    defaultColor: '#6366f1',
    defaultMaterial: 'lienzo'
  },
  {
    id: 'deco-alfombra-boho',
    name: 'Alfombra Geométrica Bereber',
    category: 'decoracion',
    type: 'rug',
    description: 'Alfombra de pelo corto con patrones geométricos neutros',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=200&auto=format&fit=crop&q=80',
    defaultDimensions: { width: 2.2, height: 0.02, depth: 1.6 },
    defaultColor: '#f8fafc',
    defaultMaterial: 'lana'
  },
  {
    id: 'deco-espejo-cuerpo',
    name: 'Espejo de Cuerpo Entero',
    category: 'decoracion',
    type: 'mirror',
    description: 'Espejo vertical con marco de bordes redondeados',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=200&auto=format&fit=crop&q=80',
    defaultDimensions: { width: 0.6, height: 1.6, depth: 0.08 },
    defaultColor: '#e2e8f0',
    defaultMaterial: 'cristal'
  },

  // ESTRUCTURA
  {
    id: 'estruc-puerta-roble',
    name: 'Puerta Interior de Madera',
    category: 'estructura',
    type: 'door',
    description: 'Puerta estándar de paso con marco y manija cromada',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=200&auto=format&fit=crop&q=80',
    defaultDimensions: { width: 0.9, height: 2.1, depth: 0.1 },
    defaultColor: '#78350f',
    defaultMaterial: 'madera'
  },
  {
    id: 'estruc-ventana-panoramica',
    name: 'Ventana Doble con Luz Natural',
    category: 'estructura',
    type: 'window',
    description: 'Ventanal abatible de doble acristalamiento y marco blanco',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=200&auto=format&fit=crop&q=80',
    defaultDimensions: { width: 1.5, height: 1.3, depth: 0.12 },
    defaultColor: '#0284c7',
    defaultMaterial: 'cristal_aluminio'
  },
  {
    id: 'estruc-columna-soporte',
    name: 'Columna Estructural Cuadrada',
    category: 'estructura',
    type: 'column',
    description: 'Pilar arquitectónico de soporte para esquinas o división',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=200&auto=format&fit=crop&q=80',
    defaultDimensions: { width: 0.35, height: 2.6, depth: 0.35 },
    defaultColor: '#e2e8f0',
    defaultMaterial: 'concreto'
  }
];
