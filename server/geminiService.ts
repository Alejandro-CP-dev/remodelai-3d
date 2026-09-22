import { GoogleGenAI } from '@google/genai';
import { Scene, Object3DItem, RoomDimensions, SceneMaterials } from '../src/types';

export interface GenerateRoomServerRequest {
  projectId: string;
  userId: string;
  prompt: string;
  dimensions: RoomDimensions;
  imageUrl?: string;
  shouldSimulateTimeout?: boolean;
  shouldSimulateRecoverableError?: boolean;
  shouldSimulateCriticalError?: boolean;
}

export interface GenerateRoomServerResult {
  scene: Scene;
  isRecoverableError?: boolean;
  message?: string;
  modelUsed: string;
}

export class ServerAIService {
  private static getGenAIClient(): GoogleGenAI | null {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      return null;
    }
    return new GoogleGenAI({ apiKey: key });
  }

  public static async generateRoom(req: GenerateRoomServerRequest): Promise<GenerateRoomServerResult> {
    const {
      projectId,
      prompt,
      dimensions,
      imageUrl,
      shouldSimulateTimeout,
      shouldSimulateRecoverableError,
      shouldSimulateCriticalError
    } = req;

    if (shouldSimulateCriticalError) {
      throw new Error('CRITICAL_AI_ERROR: No fue posible generar el modelo 3D con la información arquitectónica suministrada.');
    }

    if (shouldSimulateTimeout) {
      throw new Error('TIMEOUT_60S: El procesamiento de visión y síntesis espacial superó el límite de tiempo de 60 segundos.');
    }

    const ai = this.getGenAIClient();
    let structuredAnalysis: any = null;
    let modelUsed = 'Architectural-Synthesis-Engine-v2';

    if (ai) {
      try {
        const contents: any[] = [];
        
        // If an image was uploaded as data url or base64
        if (imageUrl && imageUrl.startsWith('data:')) {
          const matches = imageUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            contents.push({
              inlineData: {
                mimeType: matches[1],
                data: matches[2]
              }
            });
          }
        }

        const systemInstruction = `
Eres un arquitecto y diseñador de interiores profesional experto en modelado espacial 3D paramétrico.
Tu objetivo es analizar la descripción y dimensiones del usuario para generar una distribución equilibrada de muebles y elementos arquitectónicos (puertas, ventanas, lámparas, decoración).
Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura:
{
  "width": number (ancho en metros entre 2.5 y 10),
  "length": number (largo en metros entre 2.5 y 10),
  "height": number (alto en metros entre 2.2 y 3.5),
  "wallMaterial": "pintura" | "madera" | "ladrillo" | "cemento" | "marmol",
  "wallColor": string (hex color como #f8fafc),
  "floorMaterial": "madera" | "cemento" | "marmol" | "ceramica",
  "floorColor": string (hex color como #a16207),
  "lightingPreset": "dia" | "atardecer" | "noche",
  "objects": [
    {
      "name": string,
      "category": "muebles" | "decoracion" | "estructura",
      "type": "sofa" | "chair" | "table" | "bed" | "wardrobe" | "desk" | "lamp" | "plant" | "rug" | "door" | "window" | "painting",
      "position": { "x": number, "y": number, "z": number },
      "rotation": { "x": number, "y": number, "z": number },
      "scale": { "x": number, "y": number, "z": number },
      "color": string (hex),
      "material": string
    }
  ]
}
Las posiciones en 'x' deben estar dentro de [-width/2 + 0.3, width/2 - 0.3].
Las posiciones en 'z' deben estar dentro de [-length/2 + 0.3, length/2 - 0.3].
La posición en 'y' es la elevación del centro del objeto desde el suelo (muebles sobre el suelo entre 0.2 y 1.2; puertas a 1.05; cuadros a 1.6; ventanas a 1.3).
Incluye obligatoriamente al menos 1 puerta, 1 ventana y 4 a 7 elementos acordes al tipo de habitación solicitado.
`;

        contents.push({
          text: `Dimensiones propuestas: ancho=${dimensions.width}m, largo=${dimensions.length}m, alto=${dimensions.height}m.
Descripción del usuario: "${prompt}".
Genera la escena 3D completa optimizada.`
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json'
          }
        });

        const responseText = response.text?.trim();
        if (responseText) {
          structuredAnalysis = JSON.parse(responseText);
          modelUsed = 'gemini-3.8-flash';
        }
      } catch (err) {
        console.warn('Gemini API call failed, using expert architectural synthesis fallback:', err);
      }
    }

    // Build scene from Gemini analysis or architectural heuristic engine
    const scene = this.buildSceneFromData(req, structuredAnalysis);

    if (shouldSimulateRecoverableError) {
      return {
        scene,
        isRecoverableError: true,
        message: 'La IA detectó ambigüedad en la perspectiva de la imagen. La escena se construyó con parámetros estándar sugeridos.',
        modelUsed
      };
    }

    return {
      scene,
      modelUsed
    };
  }

  private static buildSceneFromData(req: GenerateRoomServerRequest, analysis: any): Scene {
    const sceneId = `scn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const lower = req.prompt.toLowerCase();

    // Determine dimensions
    const width = Number(analysis?.width) || req.dimensions.width || 4.5;
    const length = Number(analysis?.length) || req.dimensions.length || 3.8;
    const height = Number(analysis?.height) || req.dimensions.height || 2.6;

    // Materials
    let wallMaterial: SceneMaterials['wallMaterial'] = 'pintura';
    let wallColor = '#f1f5f9';
    let floorMaterial: SceneMaterials['floorMaterial'] = 'madera';
    let floorColor = '#a16207';

    if (analysis?.wallMaterial) wallMaterial = analysis.wallMaterial;
    if (analysis?.wallColor) wallColor = analysis.wallColor;
    if (analysis?.floorMaterial) floorMaterial = analysis.floorMaterial;
    if (analysis?.floorColor) floorColor = analysis.floorColor;

    if (!analysis) {
      if (lower.includes('industrial') || lower.includes('ladrillo')) {
        wallMaterial = 'ladrillo';
        wallColor = '#b45309';
        floorMaterial = 'cemento';
        floorColor = '#64748b';
      } else if (lower.includes('marmol') || lower.includes('lujo')) {
        wallMaterial = 'marmol';
        wallColor = '#f8fafc';
        floorMaterial = 'marmol';
        floorColor = '#e2e8f0';
      } else if (lower.includes('nordico') || lower.includes('escandinavo')) {
        wallMaterial = 'pintura';
        wallColor = '#f8fafc';
        floorMaterial = 'madera';
        floorColor = '#ca8a04';
      }
    }

    const objects: Object3DItem[] = [];
    const halfW = width / 2;
    const halfL = length / 2;

    if (analysis?.objects && Array.isArray(analysis.objects) && analysis.objects.length > 0) {
      analysis.objects.forEach((obj: any, idx: number) => {
        const posX = Math.max(-halfW + 0.3, Math.min(halfW - 0.3, Number(obj.position?.x) || 0));
        const posZ = Math.max(-halfL + 0.3, Math.min(halfL - 0.3, Number(obj.position?.z) || 0));
        const posY = Math.max(0.1, Math.min(height - 0.2, Number(obj.position?.y) || 0.5));

        objects.push({
          id: `obj-ai-${idx}-${Date.now()}`,
          sceneId,
          name: obj.name || `Objeto ${idx + 1}`,
          category: obj.category || 'muebles',
          type: obj.type || 'chair',
          position: { x: posX, y: posY, z: posZ },
          rotation: {
            x: Number(obj.rotation?.x) || 0,
            y: Number(obj.rotation?.y) || 0,
            z: Number(obj.rotation?.z) || 0
          },
          scale: {
            x: Number(obj.scale?.x) || 1,
            y: Number(obj.scale?.y) || 1,
            z: Number(obj.scale?.z) || 1
          },
          color: obj.color || '#cbd5e1',
          material: obj.material || 'estandar',
          visible: true,
          locked: false
        });
      });
    } else {
      // Architectural heuristic layout based on room type
      if (lower.includes('dormitorio') || lower.includes('habitacion') || lower.includes('cama')) {
        objects.push({
          id: `obj-cama-${Date.now()}`,
          sceneId,
          name: 'Cama King Size de Roble',
          category: 'muebles',
          type: 'bed',
          position: { x: halfW * 0.45, y: 0.45, z: 0 },
          rotation: { x: 0, y: -90, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          color: '#e2e8f0',
          material: 'textil',
          visible: true
        });
        objects.push({
          id: `obj-mesita-a-${Date.now()}`,
          sceneId,
          name: 'Mesita de Noche A',
          category: 'muebles',
          type: 'side_table',
          position: { x: halfW * 0.45, y: 0.25, z: -1.2 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          color: '#78350f',
          material: 'madera',
          visible: true
        });
        objects.push({
          id: `obj-armario-${Date.now()}`,
          sceneId,
          name: 'Armario de Puertas Correderas',
          category: 'muebles',
          type: 'wardrobe',
          position: { x: -halfW * 0.65, y: 1.1, z: 0 },
          rotation: { x: 0, y: 90, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          color: '#f8fafc',
          material: 'lacado',
          visible: true
        });
      } else if (lower.includes('cocina')) {
        objects.push({
          id: `obj-isla-${Date.now()}`,
          sceneId,
          name: 'Isla de Cocina con Mármol',
          category: 'muebles',
          type: 'table',
          position: { x: 0, y: 0.45, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1.2, y: 1, z: 1 },
          color: '#1e293b',
          material: 'marmol',
          visible: true
        });
        objects.push({
          id: `obj-taburete-1-${Date.now()}`,
          sceneId,
          name: 'Taburete Alto de Cocina',
          category: 'muebles',
          type: 'chair',
          position: { x: 0, y: 0.45, z: 0.8 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.8, y: 1, z: 0.8 },
          color: '#475569',
          material: 'metal',
          visible: true
        });
      } else {
        // Default Living room / Salón
        objects.push({
          id: `obj-sofa-${Date.now()}`,
          sceneId,
          name: 'Sofá Modular 3 Plazas Gris',
          category: 'muebles',
          type: 'sofa',
          position: { x: halfW * 0.35, y: 0.42, z: 0 },
          rotation: { x: 0, y: -90, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          color: '#334155',
          material: 'textil',
          visible: true
        });
        objects.push({
          id: `obj-mesa-centro-${Date.now()}`,
          sceneId,
          name: 'Mesa de Centro Nogal',
          category: 'muebles',
          type: 'table',
          position: { x: 0, y: 0.22, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.9, y: 0.8, z: 0.9 },
          color: '#78350f',
          material: 'madera',
          visible: true
        });
        objects.push({
          id: `obj-butaca-${Date.now()}`,
          sceneId,
          name: 'Butaca Tapizada Beige',
          category: 'muebles',
          type: 'chair',
          position: { x: -halfW * 0.3, y: 0.42, z: halfL * 0.45 },
          rotation: { x: 0, y: -45, z: 0 },
          scale: { x: 0.9, y: 0.9, z: 0.9 },
          color: '#e2e8f0',
          material: 'textil',
          visible: true
        });
      }

      // Plants & Decor
      objects.push({
        id: `obj-planta-${Date.now()}`,
        sceneId,
        name: 'Monstera en Maceta Nórdica',
        category: 'decoracion',
        type: 'plant',
        position: { x: -halfW * 0.7, y: 0.4, z: halfL * 0.7 },
        rotation: { x: 0, y: 45, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: '#15803d',
        material: 'organico',
        visible: true
      });

      // Window & Door
      objects.push({
        id: `obj-ventana-${Date.now()}`,
        sceneId,
        name: 'Ventanal con Vista Exterior',
        category: 'estructura',
        type: 'window',
        position: { x: halfW - 0.05, y: 1.35, z: 0 },
        rotation: { x: 0, y: -90, z: 0 },
        scale: { x: 1.2, y: 1.1, z: 1 },
        color: '#0284c7',
        material: 'cristal_aluminio',
        visible: true
      });

      objects.push({
        id: `obj-puerta-${Date.now()}`,
        sceneId,
        name: 'Puerta Principal de Paso',
        category: 'estructura',
        type: 'door',
        position: { x: 0, y: 1.05, z: -halfL + 0.05 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: '#57534e',
        material: 'madera',
        visible: true
      });
    }

    return {
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
      lightingPreset: analysis?.lightingPreset || (lower.includes('atardecer') ? 'atardecer' : lower.includes('noche') ? 'noche' : 'dia'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      objects
    };
  }
}
