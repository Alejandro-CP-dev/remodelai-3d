import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Scene as SceneType, Object3DItem, LightingPreset, CameraPreset } from '../../types';

interface SceneCanvasProps {
  scene: SceneType;
  selectedObjectId: string | null;
  onSelectObject: (objectId: string | null) => void;
  onObjectTransformChange?: (objectId: string, newPos: { x: number; y: number; z: number }) => void;
  lightingPreset: LightingPreset;
  cameraPreset: CameraPreset;
  isReadOnly?: boolean;
  onCanvasReady?: (
    exportFn: (format: 'PNG' | 'JPG' | 'WEBP', resolution: '1080p' | '2K' | '4K') => Promise<string>,
    captureThumbnail: () => string
  ) => void;
}

export const SceneCanvas: React.FC<SceneCanvasProps> = ({
  scene,
  selectedObjectId,
  onSelectObject,
  lightingPreset,
  cameraPreset,
  isReadOnly = false,
  onCanvasReady
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    roomGroup: THREE.Group;
    objectsGroup: THREE.Group;
    lightsGroup: THREE.Group;
    selectionBox: THREE.BoxHelper | null;
    isOrbiting: boolean;
    isPanning: boolean;
    mousePrev: { x: number; y: number };
    spherical: { radius: number; phi: number; theta: number };
    target: THREE.Vector3;
  } | null>(null);

  // Set camera view based on preset
  const applyCameraPreset = useCallback((preset: CameraPreset) => {
    if (!threeRef.current) return;
    const { spherical, target, camera } = threeRef.current;
    const maxDim = Math.max(scene.dimensions.width, scene.dimensions.length, scene.dimensions.height);
    const dist = maxDim * 1.8;

    target.set(0, scene.dimensions.height * 0.35, 0);

    switch (preset) {
      case 'superior':
        spherical.radius = dist * 1.1;
        spherical.phi = 0.05; // almost top-down
        spherical.theta = 0;
        break;
      case 'frontal':
        spherical.radius = dist;
        spherical.phi = Math.PI / 2.2;
        spherical.theta = 0;
        break;
      case 'lateral':
        spherical.radius = dist;
        spherical.phi = Math.PI / 2.2;
        spherical.theta = Math.PI / 2;
        break;
      case 'isometrica':
        spherical.radius = dist * 1.3;
        spherical.phi = Math.PI / 3;
        spherical.theta = Math.PI / 4;
        break;
      case 'perspectiva':
      default:
        spherical.radius = dist * 1.2;
        spherical.phi = Math.PI / 2.6;
        spherical.theta = Math.PI / 5;
        break;
    }

    camera.position.setFromSphericalCoords(spherical.radius, spherical.phi, spherical.theta).add(target);
    camera.lookAt(target);
  }, [scene.dimensions]);

  // Apply Lighting Preset
  const applyLighting = useCallback((preset: LightingPreset) => {
    if (!threeRef.current) return;
    const { lightsGroup, scene: threeScene } = threeRef.current;

    // Clear old lights
    while (lightsGroup.children.length > 0) {
      lightsGroup.remove(lightsGroup.children[0]);
    }

    const { width, length, height } = scene.dimensions;

    switch (preset) {
      case 'dia': {
        threeScene.background = new THREE.Color(0xf1f5f9);
        const amb = new THREE.AmbientLight(0xffffff, 0.7);
        lightsGroup.add(amb);

        const dir = new THREE.DirectionalLight(0xfffaed, 1.2);
        dir.position.set(width * 1.2, height * 2.2, length * 1.5);
        dir.castShadow = true;
        dir.shadow.mapSize.width = 2048;
        dir.shadow.mapSize.height = 2048;
        lightsGroup.add(dir);

        const fill = new THREE.DirectionalLight(0xe0f2fe, 0.4);
        fill.position.set(-width, height, -length);
        lightsGroup.add(fill);
        break;
      }
      case 'atardecer': {
        threeScene.background = new THREE.Color(0x311a28);
        const amb = new THREE.AmbientLight(0xfed7aa, 0.45);
        lightsGroup.add(amb);

        const sun = new THREE.DirectionalLight(0xf97316, 1.4);
        sun.position.set(width * 1.8, height * 0.8, -length * 0.4);
        sun.castShadow = true;
        lightsGroup.add(sun);

        const sky = new THREE.HemisphereLight(0x7c2d12, 0x1e1b4b, 0.4);
        lightsGroup.add(sky);
        break;
      }
      case 'noche': {
        threeScene.background = new THREE.Color(0x090d16);
        const amb = new THREE.AmbientLight(0x1e293b, 0.25);
        lightsGroup.add(amb);

        // Ceiling downlight & warm glow
        const moon = new THREE.DirectionalLight(0x38bdf8, 0.2);
        moon.position.set(width, height * 2, length);
        lightsGroup.add(moon);

        // Warm focal lamp light in the center
        const roomLamp = new THREE.PointLight(0xf59e0b, 1.5, 8);
        roomLamp.position.set(0, height * 0.75, 0);
        roomLamp.castShadow = true;
        lightsGroup.add(roomLamp);
        break;
      }
      case 'natural': {
        threeScene.background = new THREE.Color(0xf8fafc);
        const amb = new THREE.AmbientLight(0xffffff, 0.85);
        lightsGroup.add(amb);

        const softDir = new THREE.DirectionalLight(0xfef9c3, 0.8);
        softDir.position.set(width * 0.8, height * 2, length * 1.2);
        softDir.castShadow = true;
        lightsGroup.add(softDir);
        break;
      }
      case 'estandar':
      default: {
        threeScene.background = new THREE.Color(0x0f172a);
        const amb = new THREE.AmbientLight(0xffffff, 0.6);
        lightsGroup.add(amb);

        const main = new THREE.DirectionalLight(0xffffff, 1.0);
        main.position.set(width * 1.5, height * 2, length * 1.5);
        main.castShadow = true;
        lightsGroup.add(main);

        const rim = new THREE.DirectionalLight(0x93c5fd, 0.5);
        rim.position.set(-width * 1.5, height * 1.2, -length * 1.5);
        lightsGroup.add(rim);
        break;
      }
    }
  }, [scene.dimensions]);

  // Build Procedural 3D Object Group
  const createObjectMesh = useCallback((obj: Object3DItem): THREE.Group => {
    const group = new THREE.Group();
    group.name = obj.id;
    group.userData = { id: obj.id, objectData: obj };

    const color = new THREE.Color(obj.color || '#e2e8f0');

    // Create procedural high quality styled mesh based on object type
    switch (obj.type) {
      case 'bed': {
        // Base frame
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x5a3e2b, roughness: 0.7 });
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 2.0), frameMat);
        frame.position.y = 0.125;
        frame.castShadow = true;
        frame.receiveShadow = true;
        group.add(frame);

        // Mattress
        const mattressMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 1.9), mattressMat);
        mattress.position.y = 0.35;
        mattress.castShadow = true;
        group.add(mattress);

        // Headboard
        const headMat = new THREE.MeshStandardMaterial({ color: 0x452a1a, roughness: 0.8 });
        const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.9, 0.12), headMat);
        headboard.position.set(0, 0.5, -0.95);
        headboard.castShadow = true;
        group.add(headboard);

        // Pillows
        const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
        const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.35), pillowMat);
        pillow1.position.set(-0.4, 0.52, -0.65);
        const pillow2 = pillow1.clone();
        pillow2.position.x = 0.4;
        group.add(pillow1, pillow2);

        // Blanket fold
        const blanketMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.9 });
        const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.05, 1.1), blanketMat);
        blanket.position.set(0, 0.51, 0.4);
        group.add(blanket);
        break;
      }
      case 'desk': {
        const topMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.7), topMat);
        top.position.y = 0.72;
        top.castShadow = true;
        group.add(top);

        // Metal legs
        const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
        const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.7, 16);
        const positions = [
          [-0.62, 0.35, -0.28],
          [0.62, 0.35, -0.28],
          [-0.62, 0.35, 0.28],
          [0.62, 0.35, 0.28]
        ];
        positions.forEach(([x, y, z]) => {
          const leg = new THREE.Mesh(legGeo, legMat);
          leg.position.set(x, y, z);
          leg.castShadow = true;
          group.add(leg);
        });

        // Laptop on desk
        const laptopBaseMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
        const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.015, 0.22), laptopBaseMat);
        laptopBase.position.set(0, 0.76, 0);
        const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.012), laptopBaseMat);
        laptopScreen.position.set(0, 0.86, -0.1);
        laptopScreen.rotation.x = -0.3;
        group.add(laptopBase, laptopScreen);
        break;
      }
      case 'chair': {
        const seatMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.48), seatMat);
        seat.position.y = 0.48;
        seat.castShadow = true;
        group.add(seat);

        // Backrest
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.5, 0.06), seatMat);
        back.position.set(0, 0.74, -0.22);
        back.castShadow = true;
        group.add(back);

        // Center post and base
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.44, 16), poleMat);
        pole.position.y = 0.22;
        group.add(pole);

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 5), poleMat);
        base.position.y = 0.02;
        group.add(base);
        break;
      }
      case 'wardrobe': {
        const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.1, 0.6), bodyMat);
        body.position.y = 1.05;
        body.castShadow = true;
        group.add(body);

        // Door divider line
        const lineMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.015, 2.05, 0.01), lineMat);
        line.position.set(0, 1.05, 0.305);
        group.add(line);

        // Handles
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
        const h1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8), handleMat);
        h1.position.set(-0.06, 1.05, 0.32);
        const h2 = h1.clone();
        h2.position.x = 0.06;
        group.add(h1, h2);
        break;
      }
      case 'sofa': {
        const fabricMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
        // Base & Seat
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.8), fabricMat);
        base.position.y = 0.2;
        base.castShadow = true;
        group.add(base);

        // Backrest
        const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.25), fabricMat);
        back.position.set(0, 0.6, -0.28);
        back.castShadow = true;
        group.add(back);

        // Armrests
        const arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.8), fabricMat);
        arm1.position.set(-0.8, 0.5, 0);
        const arm2 = arm1.clone();
        arm2.position.x = 0.8;
        group.add(arm1, arm2);
        break;
      }
      case 'table': {
        const woodMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
        const top = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.5), woodMat);
        top.position.y = 0.52;
        top.castShadow = true;
        group.add(top);

        const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 12);
        const legOffsets = [
          [-0.2, 0.25, -0.2],
          [0.2, 0.25, -0.2],
          [-0.2, 0.25, 0.2],
          [0.2, 0.25, 0.2]
        ];
        legOffsets.forEach(([x, y, z]) => {
          const leg = new THREE.Mesh(legGeo, woodMat);
          leg.position.set(x, y, z);
          group.add(leg);
        });
        break;
      }
      case 'shelf': {
        const frameMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
        // Sides
        const side1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.8, 0.35), frameMat);
        side1.position.set(-0.43, 0.9, 0);
        const side2 = side1.clone();
        side2.position.x = 0.43;
        group.add(side1, side2);

        // 4 Shelves
        for (let i = 0; i < 4; i++) {
          const sh = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.03, 0.35), frameMat);
          sh.position.set(0, 0.25 + i * 0.45, 0);
          sh.castShadow = true;
          group.add(sh);

          // Random books on shelf
          const bookMat = new THREE.MeshStandardMaterial({
            color: [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b][i % 4],
            roughness: 0.7
          });
          const books = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.25), bookMat);
          books.position.set(-0.2 + (i % 2) * 0.3, 0.25 + i * 0.45 + 0.12, 0);
          group.add(books);
        }
        break;
      }
      case 'lamp': {
        // Base
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 24), brassMat);
        base.position.y = 0.015;
        group.add(base);

        // Pole
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.4, 16), brassMat);
        pole.position.y = 0.7;
        group.add(pole);

        // Lampshade
        const shadeMat = new THREE.MeshStandardMaterial({
          color: 0xfffbeb,
          roughness: 0.3,
          emissive: 0xfef08a,
          emissiveIntensity: 0.4
        });
        const shade = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.3, 24, 1, true), shadeMat);
        shade.position.y = 1.35;
        group.add(shade);

        // Point light emitted from lamp
        const light = new THREE.PointLight(0xfef08a, 0.8, 4);
        light.position.y = 1.3;
        group.add(light);
        break;
      }
      case 'plant': {
        // Terracotta pot
        const potMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.8 });
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.14, 0.32, 20), potMat);
        pot.position.y = 0.16;
        pot.castShadow = true;
        group.add(pot);

        // Soil
        const soilMat = new THREE.MeshStandardMaterial({ color: 0x271911, roughness: 1.0 });
        const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 16), soilMat);
        soil.position.y = 0.31;
        group.add(soil);

        // Foliage leaves
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
        for (let i = 0; i < 6; i++) {
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), leafMat);
          leaf.scale.set(1.4, 0.2, 0.8);
          const angle = (i / 6) * Math.PI * 2;
          leaf.position.set(Math.cos(angle) * 0.18, 0.45 + (i % 3) * 0.08, Math.sin(angle) * 0.18);
          leaf.rotation.set(0.3, angle, 0.4);
          leaf.castShadow = true;
          group.add(leaf);
        }
        break;
      }
      case 'painting': {
        // Frame
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.04), frameMat);
        frame.castShadow = true;
        group.add(frame);

        // Canvas artwork
        const canvasMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
        const canvas = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.62), canvasMat);
        canvas.position.z = 0.022;
        group.add(canvas);
        break;
      }
      case 'rug': {
        const rugMat = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
        const rug = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.015, 1.5), rugMat);
        rug.receiveShadow = true;
        group.add(rug);
        break;
      }
      case 'mirror': {
        const frameMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 });
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.05), frameMat);
        group.add(frame);

        const mirrorMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          metalness: 0.98,
          roughness: 0.05
        });
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 1.42), mirrorMat);
        glass.position.z = 0.028;
        group.add(glass);
        break;
      }
      case 'door': {
        const woodMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.1, 0.1), woodMat);
        frame.castShadow = true;
        group.add(frame);

        const knobMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), knobMat);
        knob.position.set(0.35, 0, 0.06);
        group.add(knob);
        break;
      }
      case 'window': {
        const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 0.08), frameMat);
        group.add(frame);

        const glassMat = new THREE.MeshStandardMaterial({
          color: 0x93c5fd,
          transparent: true,
          opacity: 0.35,
          roughness: 0.1,
          metalness: 0.5
        });
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 1.08), glassMat);
        glass.position.z = 0.042;
        group.add(glass);
        break;
      }
      case 'column': {
        const colMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.35, scene.dimensions.height, 0.35), colMat);
        col.position.y = scene.dimensions.height / 2;
        col.castShadow = true;
        col.receiveShadow = true;
        group.add(col);
        break;
      }
      default: {
        const genericMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), genericMat);
        box.position.y = 0.4;
        box.castShadow = true;
        group.add(box);
        break;
      }
    }

    // Set position, rotation & scale
    group.position.set(obj.position.x, obj.position.y, obj.position.z);
    group.rotation.set(
      THREE.MathUtils.degToRad(obj.rotation.x),
      THREE.MathUtils.degToRad(obj.rotation.y),
      THREE.MathUtils.degToRad(obj.rotation.z)
    );
    group.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);

    return group;
  }, [scene.dimensions]);

  // Rebuild the 3D Room Enclosure (floor, walls, ceiling)
  const rebuildRoom = useCallback(() => {
    if (!threeRef.current) return;
    const { roomGroup } = threeRef.current;

    while (roomGroup.children.length > 0) {
      roomGroup.remove(roomGroup.children[0]);
    }

    const { width, length, height } = scene.dimensions;
    const { wallColor, floorColor, ceilingColor, ceilingVisible } = scene.materials;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(width, length);
    const floorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(floorColor || '#92400e'),
      roughness: 0.45,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Floor grid lines
    const grid = new THREE.GridHelper(Math.max(width, length), Math.round(Math.max(width, length)), 0x64748b, 0x334155);
    grid.position.y = 0.002;
    roomGroup.add(grid);

    // Walls (thickness = 0.1m)
    const wallThick = 0.1;
    const wallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(wallColor || '#f8fafc'),
      roughness: 0.85,
      side: THREE.DoubleSide
    });

    // Back Wall (-Z)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, wallThick), wallMat);
    backWall.position.set(0, height / 2, -length / 2 - wallThick / 2);
    backWall.receiveShadow = true;
    roomGroup.add(backWall);

    // Left Wall (-X)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, height, length), wallMat);
    leftWall.position.set(-width / 2 - wallThick / 2, height / 2, 0);
    leftWall.receiveShadow = true;
    roomGroup.add(leftWall);

    // Right Wall (+X)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, height, length), wallMat);
    rightWall.position.set(width / 2 + wallThick / 2, height / 2, 0);
    rightWall.receiveShadow = true;
    roomGroup.add(rightWall);

    // Skirting baseboards
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.02), baseboardMat);
    b1.position.set(0, 0.04, -length / 2 + 0.01);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, length), baseboardMat);
    b2.position.set(-width / 2 + 0.01, 0.04, 0);
    const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, length), baseboardMat);
    b3.position.set(width / 2 - 0.01, 0.04, 0);
    roomGroup.add(b1, b2, b3);

    // Optional Ceiling
    if (ceilingVisible) {
      const ceilGeo = new THREE.PlaneGeometry(width, length);
      const ceilMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(ceilingColor || '#ffffff'),
        roughness: 0.9,
        side: THREE.DoubleSide
      });
      const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.y = height;
      roomGroup.add(ceiling);
    }
  }, [scene.dimensions, scene.materials]);

  // Rebuild Objects in Scene
  const rebuildObjects = useCallback(() => {
    if (!threeRef.current) return;
    const { objectsGroup } = threeRef.current;

    while (objectsGroup.children.length > 0) {
      objectsGroup.remove(objectsGroup.children[0]);
    }

    scene.objects.forEach(obj => {
      if (obj.visible !== false) {
        const mesh = createObjectMesh(obj);
        objectsGroup.add(mesh);
      }
    });

    // Update selection highlight box
    updateSelectionHighlight();
  }, [scene.objects, createObjectMesh]);

  // Update visual selection box around currently active object
  const updateSelectionHighlight = useCallback(() => {
    if (!threeRef.current) return;
    const { scene: threeScene, objectsGroup } = threeRef.current;

    if (threeRef.current.selectionBox) {
      threeScene.remove(threeRef.current.selectionBox);
      threeRef.current.selectionBox = null;
    }

    if (!selectedObjectId) return;

    const target = objectsGroup.children.find(c => c.name === selectedObjectId);
    if (target) {
      const box = new THREE.BoxHelper(target, 0x3b82f6);
      threeRef.current.selectionBox = box;
      threeScene.add(box);
    }
  }, [selectedObjectId]);

  // Main Three.js Initialization
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    // Scene, Camera, Renderer
    const threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const roomGroup = new THREE.Group();
    const objectsGroup = new THREE.Group();
    const lightsGroup = new THREE.Group();

    threeScene.add(roomGroup);
    threeScene.add(objectsGroup);
    threeScene.add(lightsGroup);

    const spherical = { radius: 7.5, phi: Math.PI / 2.8, theta: Math.PI / 4 };
    const target = new THREE.Vector3(0, 1.0, 0);

    threeRef.current = {
      renderer,
      scene: threeScene,
      camera,
      roomGroup,
      objectsGroup,
      lightsGroup,
      selectionBox: null,
      isOrbiting: false,
      isPanning: false,
      mousePrev: { x: 0, y: 0 },
      spherical,
      target
    };

    // Apply lighting & camera
    applyLighting(lightingPreset);
    applyCameraPreset(cameraPreset);
    rebuildRoom();
    rebuildObjects();

    // High quality export capability
    if (onCanvasReady) {
      onCanvasReady(async (format, resolution) => {
        if (!threeRef.current) return '';
        const { renderer: r, scene: s, camera: c } = threeRef.current;

        // Resolution multipliers
        let targetWidth = 1920;
        let targetHeight = 1080;
        if (resolution === '2K') {
          targetWidth = 2560;
          targetHeight = 1440;
        } else if (resolution === '4K') {
          targetWidth = 3840;
          targetHeight = 2160;
        }

        const prevAspect = c.aspect;
        c.aspect = targetWidth / targetHeight;
        c.updateProjectionMatrix();

        r.setSize(targetWidth, targetHeight, false);
        r.render(s, c);

        const mime = format === 'WEBP' ? 'image/webp' : format === 'JPG' ? 'image/jpeg' : 'image/png';
        const dataUrl = r.domElement.toDataURL(mime, 0.95);

        // Reset to preview size
        c.aspect = (container.clientWidth || 800) / (container.clientHeight || 550);
        c.updateProjectionMatrix();
        r.setSize(container.clientWidth || 800, container.clientHeight || 550);

        return dataUrl;
      }, () => {
        // Lightweight dashboard-card thumbnail: reuse whatever is already on
        // screen at preview resolution (no resize, no extra render pass) so
        // this can run silently on every autosave without any visible flicker.
        if (!threeRef.current) return '';
        return threeRef.current.renderer.domElement.toDataURL('image/jpeg', 0.7);
      });
    }

    // Interactive Raycasting for object selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      const state = threeRef.current;
      if (!state) return;

      state.mousePrev = { x: e.clientX, y: e.clientY };
      if (e.button === 0) {
        state.isOrbiting = true;
      } else if (e.button === 2) {
        state.isPanning = true;
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      const state = threeRef.current;
      if (!state) return;

      const dx = e.clientX - state.mousePrev.x;
      const dy = e.clientY - state.mousePrev.y;
      state.mousePrev = { x: e.clientX, y: e.clientY };

      if (state.isOrbiting) {
        state.spherical.theta -= dx * 0.006;
        state.spherical.phi = Math.max(0.08, Math.min(Math.PI / 2 - 0.04, state.spherical.phi - dy * 0.006));
        state.camera.position.setFromSphericalCoords(state.spherical.radius, state.spherical.phi, state.spherical.theta).add(state.target);
        state.camera.lookAt(state.target);
      } else if (state.isPanning) {
        const panSpeed = 0.003 * state.spherical.radius;
        const forward = new THREE.Vector3().subVectors(state.target, state.camera.position).normalize();
        const right = new THREE.Vector3().crossVectors(forward, state.camera.up).normalize();
        state.target.addScaledVector(right, -dx * panSpeed);
        state.target.y += dy * panSpeed;
        state.camera.position.setFromSphericalCoords(state.spherical.radius, state.spherical.phi, state.spherical.theta).add(state.target);
        state.camera.lookAt(state.target);
      }
    };

    const handlePointerUp = (e: MouseEvent) => {
      const state = threeRef.current;
      if (!state) return;

      const dx = Math.abs(e.clientX - state.mousePrev.x);
      const dy = Math.abs(e.clientY - state.mousePrev.y);

      // Click detection (small movement)
      if (dx < 3 && dy < 3 && e.button === 0 && !isReadOnly) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(objectsGroup.children, true);

        if (intersects.length > 0) {
          let topObj: THREE.Object3D | null = intersects[0].object;
          while (topObj && topObj.parent && topObj.parent !== objectsGroup) {
            topObj = topObj.parent;
          }
          if (topObj && topObj.name) {
            onSelectObject(topObj.name);
          }
        } else {
          // Deselect on empty canvas click
          onSelectObject(null);
        }
      }

      state.isOrbiting = false;
      state.isPanning = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const state = threeRef.current;
      if (!state) return;

      state.spherical.radius = Math.max(2.5, Math.min(22, state.spherical.radius + e.deltaY * 0.005));
      state.camera.position.setFromSphericalCoords(state.spherical.radius, state.spherical.phi, state.spherical.theta).add(state.target);
      state.camera.lookAt(state.target);
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    const canvasEl = renderer.domElement;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('[WebGL] Contexto perdido temporalmente, esperando restauración...');
    };

    const handleContextRestored = () => {
      console.info('[WebGL] Contexto restaurado exitosamente');
      rebuildRoom();
      rebuildObjects();
    };

    canvasEl.addEventListener('webglcontextlost', handleContextLost, false);
    canvasEl.addEventListener('webglcontextrestored', handleContextRestored, false);

    canvasEl.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    canvasEl.addEventListener('wheel', handleWheel, { passive: false });
    canvasEl.addEventListener('contextmenu', handleContextMenu);

    // Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (threeRef.current?.selectionBox) {
        threeRef.current.selectionBox.update();
      }
      renderer.render(threeScene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      canvasEl.removeEventListener('webglcontextlost', handleContextLost);
      canvasEl.removeEventListener('webglcontextrestored', handleContextRestored);
      canvasEl.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      canvasEl.removeEventListener('wheel', handleWheel);
      canvasEl.removeEventListener('contextmenu', handleContextMenu);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update room when dimensions or materials change
  useEffect(() => {
    rebuildRoom();
  }, [rebuildRoom]);

  // Update objects when scene.objects changes
  useEffect(() => {
    rebuildObjects();
  }, [rebuildObjects]);

  // Update selection highlight when selectedObjectId changes
  useEffect(() => {
    updateSelectionHighlight();
  }, [updateSelectionHighlight]);

  // Update lighting preset when changed
  useEffect(() => {
    applyLighting(lightingPreset);
  }, [lightingPreset, applyLighting]);

  // Update camera preset when changed
  useEffect(() => {
    applyCameraPreset(cameraPreset);
  }, [cameraPreset, applyCameraPreset]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Subtle overlay instructions */}
      <div className="absolute bottom-3 left-3 pointer-events-none flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800/80 text-[11px] text-slate-400">
        <span>Clic izq: Rotar orbital</span>
        <span className="text-slate-600">•</span>
        <span>Clic der: Desplazar</span>
        <span className="text-slate-600">•</span>
        <span>Rueda: Zoom</span>
        {!isReadOnly && (
          <>
            <span className="text-slate-600">•</span>
            <span className="text-indigo-400 font-medium">Clic en objeto: Seleccionar</span>
          </>
        )}
      </div>
    </div>
  );
};
