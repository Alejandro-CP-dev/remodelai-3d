import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Decorative WebGL background: a volumetric grid of cubes lit dynamically by
// a few orbiting colored point lights (inspired by "Lighting Cubes Grid" style
// instanced-lighting demos). Purely decorative — non-interactive, behind content.
const GRID_X = 16;
const GRID_Y = 5;
const GRID_Z = 10;
const SPACING = 0.62;
const CUBE_SIZE = 0.34;

export const LightingCubesGrid: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      // WebGL unavailable on this device/browser — fail silently, keep the plain background.
      return;
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 3.4, 8.5);
    camera.lookAt(0, -0.4, 0);

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Low ambient so unlit cubes stay dim against the dark background —
    // only cubes near a moving light should read as clearly lit.
    scene.add(new THREE.AmbientLight(0x334155, 1.2));

    const gridGroup = new THREE.Group();
    scene.add(gridGroup);

    const cubeGeo = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.6
    });

    const total = GRID_X * GRID_Y * GRID_Z;
    const instanced = new THREE.InstancedMesh(cubeGeo, cubeMat, total);
    const dummy = new THREE.Object3D();

    let i = 0;
    for (let x = 0; x < GRID_X; x++) {
      for (let y = 0; y < GRID_Y; y++) {
        for (let z = 0; z < GRID_Z; z++) {
          dummy.position.set(
            (x - (GRID_X - 1) / 2) * SPACING,
            (y - (GRID_Y - 1) / 2) * SPACING,
            (z - (GRID_Z - 1) / 2) * SPACING
          );
          dummy.updateMatrix();
          instanced.setMatrixAt(i, dummy.matrix);
          i++;
        }
      }
    }
    gridGroup.add(instanced);

    // Orbiting colored point lights that sweep across the grid, brand palette.
    const lightColors = [0x6366f1, 0x8b5cf6, 0xf59e0b];
    const lights = lightColors.map(color => {
      const light = new THREE.PointLight(color, 45, 9, 2);
      gridGroup.add(light);
      return light;
    });

    const halfX = ((GRID_X - 1) * SPACING) / 2;
    const halfY = ((GRID_Y - 1) * SPACING) / 2;
    const halfZ = ((GRID_Z - 1) * SPACING) / 2;

    const positionLights = (t: number) => {
      lights[0].position.set(Math.sin(t * 0.6) * halfX, Math.sin(t * 0.9) * halfY * 0.8, Math.cos(t * 0.6) * halfZ);
      lights[1].position.set(Math.cos(t * 0.45) * halfX * 0.8, Math.cos(t * 0.7) * halfY, Math.sin(t * 0.45) * halfZ * 0.8);
      lights[2].position.set(Math.sin(t * 0.3 + 2) * halfX * 0.6, Math.sin(t * 0.5 + 1) * halfY, Math.cos(t * 0.3 + 2) * halfZ * 0.6);
    };

    positionLights(0);
    gridGroup.rotation.y = 0.35;
    // Draw the first frame synchronously so there's no blank flash while
    // waiting on the next requestAnimationFrame tick (which browsers may
    // throttle heavily on an inactive/background tab).
    renderer.render(scene, camera);

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
          if (prefersReducedMotion) renderer.render(scene, camera);
        }
      }
    });
    resizeObserver.observe(container);

    let animId: number | null = null;

    if (!prefersReducedMotion) {
      const startTime = performance.now();
      const animate = () => {
        animId = requestAnimationFrame(animate);
        const t = (performance.now() - startTime) / 1000;
        positionLights(t);
        gridGroup.rotation.y = Math.sin(t * 0.08) * 0.25;
        renderer.render(scene, camera);
      };
      animate();
    }

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      cubeGeo.dispose();
      cubeMat.dispose();
      instanced.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" aria-hidden="true" />;
};
