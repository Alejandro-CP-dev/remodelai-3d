import { useState } from 'react';
import { RoomDimensions, Scene, AIGeneration } from '../types';
import { AIService } from '../services/aiService';
import { StorageService } from '../services/storage';

export type AIGenerationErrorState = { type: 'CRITICAL' | 'TIMEOUT' | 'RECOVERABLE'; msg: string };

export interface StartGenerationParams {
  prompt: string;
  dimensions: RoomDimensions;
  imageUrl?: string;
  simulateTimeout: boolean;
  simulateCriticalError: boolean;
  simulateRecoverableError: boolean;
}

// Application-layer pipeline for the AI room generator: orchestrates AIService,
// tracks progress/error UI state, and persists generation history — leaving
// AIGeneratorModal to own only its form inputs (prompt text, dimensions, etc).
export function useAIGeneration(projectId: string, userId: string) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageMessage, setStageMessage] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [errorState, setErrorState] = useState<AIGenerationErrorState | null>(null);
  const [pendingScene, setPendingScene] = useState<Scene | null>(null);

  const cancelGeneration = (prompt: string, dimensions: RoomDimensions) => {
    if (abortController) {
      abortController.abort();
    }
    setIsProcessing(false);
    setProgress(0);
    setStageMessage('Generación cancelada por el usuario.');

    StorageService.saveAIGeneration({
      id: `gen-canc-${Date.now()}`,
      projectId,
      userId,
      prompt,
      roomDimensions: dimensions,
      status: 'CANCELLED',
      progressPercent: progress,
      stageMessage: 'Cancelado por el usuario',
      provider: 'Gemini 2.5 Flash',
      model: 'gemini-2.5-flash',
      startedAt: new Date().toISOString(),
      durationMs: 4500,
      createdAt: new Date().toISOString()
    });
  };

  const startGeneration = async (params: StartGenerationParams): Promise<{ success: boolean; scene?: Scene }> => {
    setIsProcessing(true);
    setProgress(5);
    setStageMessage('Encolando petición a la IA...');
    setErrorState(null);
    setPendingScene(null);

    const controller = new AbortController();
    setAbortController(controller);
    const startTime = Date.now();

    try {
      const result = await AIService.generateRoom({
        projectId,
        userId,
        prompt: params.prompt,
        dimensions: params.dimensions,
        imageUrl: params.imageUrl,
        shouldSimulateTimeout: params.simulateTimeout,
        shouldSimulateCriticalError: params.simulateCriticalError,
        shouldSimulateRecoverableError: params.simulateRecoverableError,
        abortSignal: controller.signal,
        onProgress: (pct, msg) => {
          setProgress(pct);
          setStageMessage(msg);
        }
      });

      const durationMs = Date.now() - startTime;

      if (result.isRecoverableError) {
        setPendingScene(result.scene);
        setErrorState({
          type: 'RECOVERABLE',
          msg: result.message || 'La IA generó una escena con información incompleta. Puedes revisar y ajustar las dimensiones detectadas.'
        });

        StorageService.saveAIGeneration({
          id: `gen-${Date.now()}`,
          projectId,
          userId,
          prompt: params.prompt,
          roomDimensions: params.dimensions,
          status: 'SUCCESS',
          progressPercent: 100,
          stageMessage: 'Completado con advertencia de dimensiones',
          provider: 'Gemini 2.5 Flash',
          model: 'gemini-2.5-flash',
          startedAt: new Date(startTime).toISOString(),
          durationMs,
          resultScene: result.scene,
          createdAt: new Date().toISOString()
        });

        return { success: false };
      }

      StorageService.saveAIGeneration({
        id: `gen-${Date.now()}`,
        projectId,
        userId,
        prompt: params.prompt,
        roomDimensions: params.dimensions,
        status: 'SUCCESS',
        progressPercent: 100,
        stageMessage: 'Escena 3D generada exitosamente',
        provider: 'Gemini 2.5 Flash',
        model: 'gemini-2.5-flash',
        startedAt: new Date(startTime).toISOString(),
        durationMs,
        resultScene: result.scene,
        createdAt: new Date().toISOString()
      });

      return { success: true, scene: result.scene };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      if (err.message === 'GENERATION_CANCELLED') {
        return { success: false };
      }

      if (err.message.includes('TIMEOUT')) {
        setErrorState({
          type: 'TIMEOUT',
          msg: 'El procesamiento superó los 60 segundos límite. El servidor no respondió a tiempo.'
        });
        StorageService.saveAIGeneration({
          id: `gen-${Date.now()}`,
          projectId,
          userId,
          prompt: params.prompt,
          roomDimensions: params.dimensions,
          status: 'TIMEOUT',
          progressPercent: progress,
          stageMessage: 'Tiempo de espera agotado (60s)',
          provider: 'Gemini 2.5 Flash',
          model: 'gemini-2.5-flash',
          startedAt: new Date(startTime).toISOString(),
          durationMs,
          errorCode: 'TIMEOUT_60S',
          errorMessage: 'Timeout en pipeline de IA',
          createdAt: new Date().toISOString()
        });
      } else {
        setErrorState({
          type: 'CRITICAL',
          msg: 'No fue posible generar el modelo 3D con la información proporcionada. La descripción es ambigua o los datos son inconsistentes.'
        });
        StorageService.saveAIGeneration({
          id: `gen-${Date.now()}`,
          projectId,
          userId,
          prompt: params.prompt,
          roomDimensions: params.dimensions,
          status: 'FAILED',
          progressPercent: progress,
          stageMessage: 'Error crítico en generación',
          provider: 'Gemini 2.5 Flash',
          model: 'gemini-2.5-flash',
          startedAt: new Date(startTime).toISOString(),
          durationMs,
          errorCode: 'CRITICAL_ERROR',
          errorMessage: err.message,
          createdAt: new Date().toISOString()
        });
      }
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  };

  const loadHistory = (): AIGeneration[] => StorageService.getAIGenerations(projectId);

  return {
    isProcessing,
    progress,
    stageMessage,
    errorState,
    setErrorState,
    pendingScene,
    startGeneration,
    cancelGeneration,
    loadHistory
  };
}
