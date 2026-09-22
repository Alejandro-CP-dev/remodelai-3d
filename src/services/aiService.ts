import { Object3DItem, RoomDimensions, Scene, SceneMaterials } from '../types';
import { apiClient } from './apiClient';

export interface GenerateRoomRequest {
  projectId: string;
  userId: string;
  prompt: string;
  dimensions: RoomDimensions;
  imageUrl?: string;
  onProgress?: (progress: number, stageMessage: string) => void;
  shouldSimulateTimeout?: boolean;
  shouldSimulateRecoverableError?: boolean;
  shouldSimulateCriticalError?: boolean;
  abortSignal?: AbortSignal;
}

export interface GenerateRoomResult {
  scene: Scene;
  isRecoverableError?: boolean;
  message?: string;
}

export class AIService {
  /**
   * Synthesizes 3D spatial layout based on dimensions, text prompt and optional image.
   */
  static async generateRoom(req: GenerateRoomRequest): Promise<GenerateRoomResult> {
    const {
      prompt,
      dimensions,
      onProgress,
      shouldSimulateTimeout,
      shouldSimulateRecoverableError,
      shouldSimulateCriticalError,
      abortSignal
    } = req;

    const stages = [
      { at: 15, msg: 'Analizando imagen y proporciones espaciales...' },
      { at: 35, msg: 'Identificando elementos arquitectónicos, ventanas y puertas...' },
      { at: 65, msg: 'Construyendo modelo 3D y distribuyendo mobiliario...' },
      { at: 90, msg: 'Finalizando escena, iluminación y acabados...' },
      { at: 100, msg: '¡Modelo 3D completado con éxito!' }
    ];

    // Check cancellation
    if (abortSignal?.aborted) {
      throw new Error('GENERATION_CANCELLED');
    }

    // Step 1: Analizando
    onProgress?.(15, stages[0].msg);
    await this.delay(700, abortSignal);

    if (shouldSimulateCriticalError) {
      throw new Error('CRITICAL_AI_ERROR: No fue posible generar el modelo 3D con la información proporcionada.');
    }

    // Step 2: Identificando
    onProgress?.(40, stages[1].msg);
    await this.delay(800, abortSignal);

    if (shouldSimulateTimeout) {
      onProgress?.(60, 'Procesando en segundo plano...');
      await this.delay(1200, abortSignal);
      throw new Error('TIMEOUT_60S: El procesamiento superó los 60 segundos límite.');
    }

    // Step 3: Construyendo
    onProgress?.(75, stages[2].msg);
    await this.delay(800, abortSignal);

    // Step 4: Finalizando
    onProgress?.(95, stages[3].msg);
    await this.delay(600, abortSignal);

    onProgress?.(100, stages[4].msg);

    // Try calling server-side Gemini AI pipeline
    try {
      const serverRes = await apiClient.generateRoom({
        projectId: req.projectId,
        userId: req.userId,
        prompt,
        dimensions,
        imageUrl: req.imageUrl,
        shouldSimulateTimeout,
        shouldSimulateRecoverableError,
        shouldSimulateCriticalError
      });
      if (serverRes?.scene) {
        return {
          scene: serverRes.scene,
          isRecoverableError: serverRes.isRecoverableError,
          message: serverRes.message
        };
      }
    } catch (err: any) {
      if (err.message?.includes('TIMEOUT') || err.message?.includes('CRITICAL')) {
        throw err;
      }
      console.warn('Backend AI generation fallback to local heuristic engine:', err);
    }

    // Semantic layout generation based on prompt keywords & dimensions
    const lower = prompt.toLowerCase();
    const width = Math.max(2.5, Math.min(10, dimensions.width || 4.0));
    const length = Math.max(2.5, Math.min(10, dimensions.length || 3.0));
    const height = Math.max(2.2, Math.min(4.5, dimensions.height || 2.6));

    // Determine materials from prompt
    let wallMaterial: SceneMaterials['wallMaterial'] = 'pintura';
    let wallColor = '#f8fafc';
    if (lower.includes('ladrillo')) {
      wallMaterial = 'ladrillo';
      wallColor = '#b91c1c';
    } else if (lower.includes('cemento') || lower.includes('hormigón') || lower.includes('concreto')) {
      wallMaterial = 'cemento';
      wallColor = '#94a3b8';
    } else if (lower.includes('madera')) {
      wallMaterial = 'madera';
      wallColor = '#d97706';
    } else if (lower.includes('marmol') || lower.includes('mármol')) {
      wallMaterial = 'marmol';
      wallColor = '#f1f5f9';
    } else if (lower.includes('azul') || lower.includes('navy')) {
      wallColor = '#1e3a8a';
    } else if (lower.includes('verde') || lower.includes('oliva')) {
      wallColor = '#365314';
    } else if (lower.includes('gris')) {
      wallColor = '#cbd5e1';
    }

    let floorMaterial: SceneMaterials['floorMaterial'] = 'madera';
    let floorColor = '#92400e';
    if (lower.includes('cerámica') || lower.includes('ceramica') || lower.includes('porcelanato')) {
      floorMaterial = 'ceramica';
      floorColor = '#e2e8f0';
    } else if (lower.includes('marmol') || lower.includes('mármol')) {
      floorMaterial = 'marmol';
      floorColor = '#f8fafc';
    } else if (lower.includes('cemento') || lower.includes('microcemento')) {
      floorMaterial = 'cemento';
      floorColor = '#64748b';
    } else if (lower.includes('alfombra')) {
      floorMaterial = 'alfombra';
      floorColor = '#e2e8f0';
    }

    // Determine furniture objects
    const objects: Object3DItem[] = [];
    const sceneId = `scn-ai-${Date.now()}`;

    // Bed placement
    const halfW = width / 2;
    const halfL = length / 2;

    const hasBed = !lower.includes('sin cama') && !lower.includes('solo oficina');
    if (hasBed) {
      const isDoble = lower.includes('doble') || lower.includes('queen') || lower.includes('matrimonial');
      objects.push({
        id: `obj-ai-cama-${Date.now()}`,
        sceneId,
        name: isDoble ? 'Cama Queen Doble' : 'Cama Individual Nórdica',
        category: 'muebles',
        type: 'bed',
        position: { x: halfW - 1.1, y: 0.45, z: 0 },
        rotation: { x: 0, y: -90, z: 0 },
        scale: isDoble ? { x: 1.05, y: 1, z: 1.05 } : { x: 0.8, y: 1, z: 1 },
        color: '#e2e8f0',
        material: 'textil',
        visible: true
      });

      // Mesita de noche
      objects.push({
        id: `obj-ai-mesita-${Date.now()}`,
        sceneId,
        name: 'Mesita de Noche',
        category: 'muebles',
        type: 'table',
        position: { x: halfW - 1.1, y: 0.28, z: 1.3 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.9, y: 0.9, z: 0.9 },
        color: '#b45309',
        material: 'madera',
        visible: true
      });

      // Lámpara
      objects.push({
        id: `obj-ai-lampara-${Date.now()}`,
        sceneId,
        name: 'Lámpara de Noche',
        category: 'decoracion',
        type: 'lamp',
        position: { x: halfW - 1.1, y: 0.65, z: 1.3 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.7, y: 0.7, z: 0.7 },
        color: '#f59e0b',
        material: 'metal_laton',
        visible: true
      });
    }

    // Desk and Chair
    const hasDesk = lower.includes('escritorio') || lower.includes('mesa de trabajo') || lower.includes('oficina') || !hasBed;
    if (hasDesk) {
      objects.push({
        id: `obj-ai-escritorio-${Date.now()}`,
        sceneId,
        name: 'Escritorio con Cajonera',
        category: 'muebles',
        type: 'desk',
        position: { x: -halfW + 0.9, y: 0.38, z: 0.5 },
        rotation: { x: 0, y: 90, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: '#78350f',
        material: 'madera',
        visible: true
      });

      objects.push({
        id: `obj-ai-silla-${Date.now()}`,
        sceneId,
        name: 'Silla Ergonómica',
        category: 'muebles',
        type: 'chair',
        position: { x: -halfW + 1.45, y: 0.48, z: 0.5 },
        rotation: { x: 0, y: -90, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: '#334155',
        material: 'textil',
        visible: true
      });
    }

    // Wardrobe / Closet
    if (lower.includes('armario') || lower.includes('closet') || lower.includes('ropero') || hasBed) {
      objects.push({
        id: `obj-ai-armario-${Date.now()}`,
        sceneId,
        name: 'Armario 2 Puertas',
        category: 'muebles',
        type: 'wardrobe',
        position: { x: 0, y: 1.1, z: halfL - 0.45 },
        rotation: { x: 0, y: 180, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: '#f1f5f9',
        material: 'madera_blanca',
        visible: true
      });
    }

    // Plant & Rug
    objects.push({
      id: `obj-ai-alfombra-${Date.now()}`,
      sceneId,
      name: 'Alfombra Decorativa',
      category: 'decoracion',
      type: 'rug',
      position: { x: 0, y: 0.01, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1.1, y: 1, z: 1.1 },
      color: '#f8fafc',
      material: 'lana',
      visible: true
    });

    objects.push({
      id: `obj-ai-planta-${Date.now()}`,
      sceneId,
      name: 'Planta Interior Monstera',
      category: 'decoracion',
      type: 'plant',
      position: { x: -halfW + 0.6, y: 0.45, z: -halfL + 0.6 },
      rotation: { x: 0, y: 45, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#15803d',
      material: 'organico',
      visible: true
    });

    // Window & Door
    objects.push({
      id: `obj-ai-ventana-${Date.now()}`,
      sceneId,
      name: 'Ventana de Pared',
      category: 'estructura',
      type: 'window',
      position: { x: -halfW + 0.05, y: 1.4, z: 0.5 },
      rotation: { x: 0, y: 90, z: 0 },
      scale: { x: 1.2, y: 1.1, z: 1 },
      color: '#0284c7',
      material: 'cristal_aluminio',
      visible: true
    });

    objects.push({
      id: `obj-ai-puerta-${Date.now()}`,
      sceneId,
      name: 'Puerta Principal de Paso',
      category: 'estructura',
      type: 'door',
      position: { x: 0, y: 1.05, z: -halfL + 0.05 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#78350f',
      material: 'madera',
      visible: true
    });

    // Wall Art
    objects.push({
      id: `obj-ai-cuadro-${Date.now()}`,
      sceneId,
      name: 'Cuadro Abstracto',
      category: 'decoracion',
      type: 'painting',
      position: { x: halfW - 0.05, y: 1.65, z: 0 },
      rotation: { x: 0, y: -90, z: 0 },
      scale: { x: 1.1, y: 1.1, z: 1 },
      color: '#6366f1',
      material: 'lienzo',
      visible: true
    });

    const generatedScene: Scene = {
      id: sceneId,
      projectId: req.projectId,
      version: 1,
      dimensions: { width, length, height },
      materials: {
        wallMaterial,
        wallColor,
        floorMaterial,
        floorColor,
        ceilingColor: '#ffffff',
        ceilingVisible: false
      },
      lightingPreset: lower.includes('atardecer') ? 'atardecer' : lower.includes('noche') ? 'noche' : 'dia',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      objects
    };

    if (shouldSimulateRecoverableError) {
      return {
        scene: generatedScene,
        isRecoverableError: true,
        message: 'La IA generó una escena con información incompleta. Puedes revisar y ajustar las dimensiones detectadas.'
      };
    }

    return {
      scene: generatedScene
    };
  }

  private static delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('GENERATION_CANCELLED'));
        });
      }
    });
  }
}
