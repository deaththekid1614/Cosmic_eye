import { memo, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { AlertCircle, Clock3, Maximize2, Minimize2, Pause, Play, RotateCcw, Search, Sun, Telescope } from 'lucide-react';
import { fetchJson } from '../api/client';

type OrbitRecord = {
  id: string; name: string; type: 'planet' | 'moon' | 'asteroid';
  parent_id?: string; parent_name?: string; spkid?: string;
  epoch_jd: number; a_au: number; e: number; inclination_deg: number;
  ascending_node_deg: number; argument_periapsis_deg: number;
  mean_anomaly_deg: number; mean_motion_deg_day?: number; period_days?: number;
  rotation_hours?: number | null; radius_km?: number | null;
  axial_tilt_deg?: number; color?: string; rings?: boolean;
  absolute_magnitude?: number | null;
};
type ModelResponse = {
  epoch_utc: string; epoch_jd: number; planets: OrbitRecord[]; moons: OrbitRecord[];
  asteroids: OrbitRecord[]; asteroid_count: number; sources: string[]; notes: string[];
  spacecraft: { semi_major_axis_km: number; eccentricity: number; inclination_deg: number; ascending_node_deg: number; period_minutes: number; phase_is_telemetry: boolean };
};

const AU_KM = 149_597_870.7;
const DEG = Math.PI / 180;
const TWO_PI = Math.PI * 2;

function solveKepler(meanAnomaly: number, eccentricity: number) {
  let estimate = meanAnomaly;
  for (let i = 0; i < 8; i += 1) estimate -= (estimate - eccentricity * Math.sin(estimate) - meanAnomaly) / (1 - eccentricity * Math.cos(estimate));
  return estimate;
}

function orbitalVector(body: OrbitRecord, jd: number) {
  const motion = body.mean_motion_deg_day ?? 360 / (body.period_days || 365.25 * body.a_au ** 1.5);
  const mean = (body.mean_anomaly_deg + motion * (jd - body.epoch_jd)) * DEG;
  const eccentric = solveKepler(mean, Math.min(0.9999, Math.max(0, body.e)));
  const xOrbital = body.a_au * (Math.cos(eccentric) - body.e);
  const yOrbital = body.a_au * Math.sqrt(1 - body.e * body.e) * Math.sin(eccentric);
  const arg = body.argument_periapsis_deg * DEG;
  const node = body.ascending_node_deg * DEG;
  const inclination = body.inclination_deg * DEG;
  const xPlane = xOrbital * Math.cos(arg) - yOrbital * Math.sin(arg);
  const yPlane = xOrbital * Math.sin(arg) + yOrbital * Math.cos(arg);
  const x = xPlane * Math.cos(node) - yPlane * Math.cos(inclination) * Math.sin(node);
  const y = xPlane * Math.sin(node) + yPlane * Math.cos(inclination) * Math.cos(node);
  const z = yPlane * Math.sin(inclination);
  return new THREE.Vector3(x, z, -y);
}

function mapPosition(auVector: THREE.Vector3) {
  const distance = auVector.length();
  if (distance < 1e-12) return new THREE.Vector3();
  const mappedDistance = 1.8 + Math.log1p(distance * 5.6) * 3.5;
  return auVector.multiplyScalar(mappedDistance / distance);
}

function moonOrbitScale(body: OrbitRecord) {
  const distanceKm = body.a_au * AU_KM;
  return 0.28 + Math.log1p(distanceKm / 12_000) * 0.33;
}

function orbitPoints(body: OrbitRecord, scale: number, jd: number, parentPosition?: THREE.Vector3) {
  const positions: THREE.Vector3[] = [];
  for (let i = 0; i <= 160; i += 1) {
    const phaseBody = { ...body, mean_anomaly_deg: i * 360 / 160, epoch_jd: jd };
    const point = orbitalVector(phaseBody, jd);
    if (body.type === 'moon') {
      const length = point.length();
      point.multiplyScalar(length > 0 ? scale / length : 1);
      if (parentPosition) point.add(parentPosition);
    } else {
      positions.push(mapPosition(point));
      continue;
    }
    positions.push(point);
  }
  return positions;
}

function bodyRadius(body: OrbitRecord) {
  if (body.type === 'asteroid') return 0.028;
  if (body.type === 'moon') return 0.045 + Math.min(0.09, Math.log1p((body.radius_km ?? 100) / 150) * 0.035);
  return 0.13 + Math.min(0.26, Math.log1p((body.radius_km ?? 6000) / 6000) * 0.095);
}

function surfaceTexture(body: OrbitRecord) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = body.color ?? '#a9b4c2';
  context.fillRect(0, 0, canvas.width, canvas.height);
  // Stylized longitude detail makes rotation visible. These are explicitly
  // illustrative surface patterns, not spacecraft photographs.
  const gasGiant = ['Jupiter', 'Saturn', 'Uranus', 'Neptune'].includes(body.name);
  if (gasGiant) {
    for (let y = 0; y < canvas.height; y += 16) {
      context.globalAlpha = y % 32 === 0 ? 0.24 : 0.1;
      context.fillStyle = y % 32 === 0 ? '#fff2d6' : '#15233c';
      context.fillRect(0, y, canvas.width, 9);
    }
    if (body.name === 'Jupiter') {
      context.globalAlpha = 0.6;
      context.fillStyle = '#a94e39';
      context.beginPath(); context.ellipse(350, 157, 31, 13, 0, 0, TWO_PI); context.fill();
    }
  } else {
    let seed = Number(body.id.replace(/\D/g, '').slice(-6)) || 37;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < (body.type === 'moon' ? 36 : 60); i += 1) {
      const x = random() * canvas.width, y = random() * canvas.height;
      const radius = 1.5 + random() * (body.type === 'moon' ? 8 : 5);
      context.globalAlpha = 0.08 + random() * 0.14;
      context.fillStyle = i % 2 ? '#fff' : '#08101d';
      context.beginPath(); context.arc(x, y, radius, 0, TWO_PI); context.fill();
    }
  }
  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function glowTexture(color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 64);
  gradient.addColorStop(0, `${color}bb`);
  gradient.addColorStop(0.28, `${color}55`);
  gradient.addColorStop(1, `${color}00`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function SolarSystemCanvas({ model, offsetDays, anchorMs, playing, speed, selectedId, focusedId, onSelect, onHover, followObserver, showAsteroids, showMoons }: {
  model: ModelResponse; offsetDays: number; selectedId: string | null; focusedId: string | null; onSelect: (id: string) => void; onHover: (body: OrbitRecord | null, x: number, y: number) => void;
  anchorMs: number; playing: boolean; speed: number; followObserver: boolean; showAsteroids: boolean; showMoons: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef({ offsetDays, anchorMs, playing, speed, selectedId, focusedId, followObserver, showAsteroids, showMoons, onSelect, onHover });
  interactionRef.current = { offsetDays, anchorMs, playing, speed, selectedId, focusedId, followObserver, showAsteroids, showMoons, onSelect, onHover };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' }); }
    catch { host.dataset.webglUnavailable = 'true'; return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x050a13, 1);
    host.dataset.webglUnavailable = 'false';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 0.01, 200);
    let yaw = -0.42;
    let pitch = 0.82;
    let zoom = 34;
    let overviewZoom = zoom;
    let zoomOffset = 0;
    let lastFocusId: string | null | undefined;
    const cameraTarget = new THREE.Vector3();
    const desiredTarget = new THREE.Vector3();
    let wasFollowingObserver = false;
    const ambient = new THREE.AmbientLight(0x8aa5cc, 1.45);
    scene.add(ambient);
    const sunLight = new THREE.PointLight(0xffe5ad, 150, 0, 1.2);
    scene.add(sunLight);

    const starPositions = new Float32Array(1800 * 3);
    let seed = 93041;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 1800; i += 1) {
      const radius = 52 + random() * 30;
      const theta = random() * TWO_PI;
      const z = random() * 2 - 1;
      const ring = Math.sqrt(1 - z * z);
      starPositions[i * 3] = radius * ring * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * z;
      starPositions[i * 3 + 2] = radius * ring * Math.sin(theta);
    }
    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xc7dbff, size: 0.12, transparent: true, opacity: 0.8, sizeAttenuation: true })));

    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 28), new THREE.MeshBasicMaterial({ color: 0xffc85a }));
    sun.userData.bodyId = 'sun';
    sun.name = 'Sun';
    scene.add(sun);
    const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#ffb942'), transparent: true, opacity: 0.72, depthWrite: false }));
    sunGlow.scale.set(5.2, 5.2, 1);
    sun.add(sunGlow);

    const planetById = new Map<string, OrbitRecord>();
    const planetGroups = new Map<string, THREE.Group>();
    const bodyObjects = new Map<string, THREE.Object3D>();
    const planetPositions = new Map<string, THREE.Vector3>();
    const asteroidPositions = new Map<string, THREE.Vector3>();
    const planetOrbitLines = new Map<string, THREE.LineLoop>();
    const moonOrbitLines = new Map<string, THREE.LineLoop>();
    for (const planet of model.planets) {
      planetById.set(planet.id, planet);
      const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(orbitPoints(planet, 1, planet.epoch_jd)), new THREE.LineBasicMaterial({ color: 0x59769e, transparent: true, opacity: 0.27 }));
      line.userData.bodyId = planet.id;
      planetOrbitLines.set(planet.id, line);
      scene.add(line);
      const group = new THREE.Group();
      group.userData.bodyId = planet.id;
      const radius = bodyRadius(planet);
      const material = new THREE.MeshStandardMaterial({ map: surfaceTexture(planet), color: '#ffffff', roughness: 0.82, metalness: 0.02 });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 24), material);
      mesh.userData.bodyId = planet.id;
      mesh.rotation.z = (planet.axial_tilt_deg ?? 0) * DEG;
      group.add(mesh);
      bodyObjects.set(planet.id, mesh);
      if (planet.rings) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 1.35, radius * 2.15, 64), new THREE.MeshBasicMaterial({ color: 0xc8b887, side: THREE.DoubleSide, transparent: true, opacity: 0.67 }));
        ring.rotation.x = Math.PI / 2;
        ring.rotation.z = (planet.axial_tilt_deg ?? 0) * DEG;
        group.add(ring);
      }
      planetGroups.set(planet.id, group);
      scene.add(group);
    }

    const moonObjects = new Map<string, THREE.Object3D>();
    const moonRecords = model.moons.filter((moon) => planetById.has(moon.parent_id ?? ''));
    for (const moon of moonRecords) {
      const radius = bodyRadius(moon);
      const orbitScale = moonOrbitScale(moon);
      const orbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(orbitPoints(moon, orbitScale, moon.epoch_jd)), new THREE.LineBasicMaterial({ color: 0x9ab8d9, transparent: true, opacity: 0.3 }));
      orbit.userData.bodyId = moon.id;
      moonOrbitLines.set(moon.id, orbit);
      scene.add(orbit);
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 16), new THREE.MeshStandardMaterial({ map: surfaceTexture(moon), color: '#ffffff', roughness: 0.9 }));
      mesh.userData.bodyId = moon.id;
      moonObjects.set(moon.id, mesh);
      bodyObjects.set(moon.id, mesh);
      scene.add(mesh);
    }

    const asteroidGeometry = new THREE.SphereGeometry(0.026, 5, 4);
    const asteroidMaterial = new THREE.MeshBasicMaterial({ color: 0xe3a56c });
    const asteroidPoints = new THREE.InstancedMesh(asteroidGeometry, asteroidMaterial, model.asteroids.length);
    asteroidPoints.userData.bodyKind = 'asteroids';
    asteroidPoints.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(asteroidPoints);
    const dummy = new THREE.Object3D();

    // Published nominal SPHEREx orbit around Earth. Its phase is intentionally
    // illustrative because this app has no spacecraft telemetry feed.
    const observerOrbit = new THREE.Group();
    observerOrbit.rotation.set(model.spacecraft.inclination_deg * DEG, 0, model.spacecraft.ascending_node_deg * DEG);
    const observerOrbitLine = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 97 }, (_, i) => {
      const phase = i / 96 * TWO_PI;
      return new THREE.Vector3(Math.cos(phase) * 0.83, Math.sin(phase) * 0.83, 0);
    })), new THREE.LineBasicMaterial({ color: 0x4ee4e4, transparent: true, opacity: 0.55 }));
    observerOrbit.add(observerOrbitLine);
    const observer = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 1), new THREE.MeshBasicMaterial({ color: 0x55f5ed }));
    observer.userData.bodyId = 'spherex';
    const observerHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#55f5ed'), transparent: true, opacity: 0.9, depthWrite: false }));
    observerHalo.scale.set(0.6, 0.6, 1);
    observer.add(observerHalo);
    observerOrbit.add(observer);
    scene.add(observerOrbit);

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.3 };
    const pointer = new THREE.Vector2();
    let downX = 0, downY = 0, lastX = 0, lastY = 0, dragging = false;
    let hoveredId: string | null = null;
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      downX = lastX = event.clientX; downY = lastY = event.clientY; dragging = true;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (dragging) {
        yaw += (event.clientX - lastX) * 0.006;
        pitch = THREE.MathUtils.clamp(pitch + (event.clientY - lastY) * 0.006, -1.35, 1.35);
        lastX = event.clientX; lastY = event.clientY;
        return;
      }
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([...bodyObjects.values(), sun, asteroidPoints], false)[0];
      const id = hit ? hit.object === asteroidPoints && hit.instanceId !== undefined ? model.asteroids[hit.instanceId]?.id ?? null : String(hit.object.userData.bodyId ?? 'sun') : null;
      renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
      if (id !== hoveredId) {
        hoveredId = id;
        const body = model.planets.find((item) => item.id === id) ?? model.moons.find((item) => item.id === id) ?? model.asteroids.find((item) => item.id === id) ?? null;
        interactionRef.current.onHover(body, event.clientX - rect.left, event.clientY - rect.top);
      }
    };
    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([...bodyObjects.values(), sun, asteroidPoints], false)[0];
      if (!hit) { interactionRef.current.onHover(null, 0, 0); return; }
      if (hit.object === asteroidPoints && hit.instanceId !== undefined) interactionRef.current.onSelect(model.asteroids[hit.instanceId]?.id ?? null);
      else interactionRef.current.onSelect(String(hit.object.userData.bodyId ?? 'sun'));
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomOffset = THREE.MathUtils.clamp(zoomOffset + event.deltaY * 0.006, -8, 28);
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    const resize = () => {
      const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
      camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false);
    };
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(host); resize();
    let frame = 0;
    const updateOrbitalPositions = (jd: number, offsetDays: number) => {
      for (const planet of model.planets) {
        const position = mapPosition(orbitalVector(planet, jd));
        planetPositions.set(planet.id, position);
        const group = planetGroups.get(planet.id);
        if (group) group.position.copy(position);
      }
      for (const moon of moonRecords) {
        const parentPosition = planetPositions.get(moon.parent_id!);
        if (!parentPosition) continue;
        const relative = orbitalVector(moon, jd);
        const orbitScale = moonOrbitScale(moon);
        relative.multiplyScalar(orbitScale / Math.max(relative.length(), 1e-10));
        moonObjects.get(moon.id)?.position.copy(parentPosition.clone().add(relative));
        const orbitLine = moonOrbitLines.get(moon.id);
        if (orbitLine) orbitLine.position.copy(parentPosition);
      }
      for (let i = 0; i < model.asteroids.length; i += 1) {
        const asteroid = model.asteroids[i];
        const position = mapPosition(orbitalVector(asteroid, jd));
        asteroidPositions.set(asteroid.id, position);
        dummy.position.copy(position);
        dummy.scale.setScalar(1 + Math.min(1.8, Math.max(0, ((asteroid.absolute_magnitude ?? 20) * -0.035 + 0.7))));
        dummy.updateMatrix();
        asteroidPoints.setMatrixAt(i, dummy.matrix);
      }
      asteroidPoints.instanceMatrix.needsUpdate = true;

      const earthPosition = planetPositions.get('399') ?? new THREE.Vector3();
      const phase = (offsetDays * 24 * 60 / model.spacecraft.period_minutes) * TWO_PI;
      observerOrbit.position.copy(earthPosition);
      observer.position.set(Math.cos(phase) * 0.83, 0, Math.sin(phase) * 0.83);
    };
    let lastPositionUpdate = 0;
    let lastPositionOffset = Number.NaN;
    let lastSelectedId: string | null = null;
    let lastAsteroidsVisible = true;
    let lastMoonsVisible = true;
    const render = (now: number) => {
      const state = interactionRef.current;
      const offsetDays = state.offsetDays + (state.playing ? (Date.now() - state.anchorMs) / 1000 * state.speed : 0);
      if (lastFocusId !== state.focusedId) {
        lastFocusId = state.focusedId;
        zoomOffset = 0;
      }
      if (state.followObserver !== wasFollowingObserver) {
        if (state.followObserver) { overviewZoom = zoom; zoom = 2.6; }
        else zoom = overviewZoom;
        wasFollowingObserver = state.followObserver;
      }
      if (now - lastPositionUpdate > 120 || Math.abs(offsetDays - lastPositionOffset) > 0.02) {
        updateOrbitalPositions(model.epoch_jd + offsetDays, offsetDays);
        lastPositionUpdate = now;
        lastPositionOffset = offsetDays;
      }
      if (state.followObserver || state.focusedId === 'spherex') desiredTarget.copy(observerOrbit.position).add(observer.position);
      else if (state.focusedId === 'sun') desiredTarget.set(0, 0, 0);
      else if (state.focusedId && asteroidPositions.has(state.focusedId)) desiredTarget.copy(asteroidPositions.get(state.focusedId)!);
      else if (state.focusedId && bodyObjects.has(state.focusedId)) bodyObjects.get(state.focusedId)!.getWorldPosition(desiredTarget);
      else desiredTarget.set(0, 0, 0);
      const focusBody = model.planets.find((body) => body.id === state.focusedId) ?? model.moons.find((body) => body.id === state.focusedId) ?? model.asteroids.find((body) => body.id === state.focusedId);
      const desiredZoom = (state.followObserver || state.focusedId === 'spherex' ? 2.6 : state.focusedId ? state.focusedId === 'sun' ? 9 : focusBody?.type === 'moon' ? 3.2 : focusBody?.type === 'asteroid' ? 3.6 : 5.5 : overviewZoom) + zoomOffset;
      zoom += (desiredZoom - zoom) * 0.055;
      cameraTarget.lerp(desiredTarget, 0.09);
      const horizontal = Math.cos(pitch) * zoom;
      camera.position.set(cameraTarget.x + Math.sin(yaw) * horizontal, cameraTarget.y + Math.sin(pitch) * zoom, cameraTarget.z + Math.cos(yaw) * horizontal);
      camera.lookAt(cameraTarget);

      const hours = offsetDays * 24;
      for (const planet of model.planets) {
        const mesh = bodyObjects.get(planet.id);
        if (mesh && planet.rotation_hours) mesh.rotation.y = (hours / planet.rotation_hours) * TWO_PI;
      }
      for (const moon of moonRecords) {
        const mesh = bodyObjects.get(moon.id);
        if (mesh && moon.rotation_hours) mesh.rotation.y = (hours / moon.rotation_hours) * TWO_PI;
      }
      if (lastSelectedId !== state.selectedId) {
        bodyObjects.forEach((object, id) => object.scale.setScalar(id === state.selectedId ? 1.55 : 1));
        sun.scale.setScalar(state.selectedId === 'sun' ? 1.4 : 1);
        moonOrbitLines.forEach((line, id) => {
          const moon = moonRecords.find((record) => record.id === id);
          line.visible = state.showMoons && (id === state.selectedId || moon?.parent_id === state.selectedId);
        });
        planetOrbitLines.forEach((line, id) => {
          const material = line.material as THREE.LineBasicMaterial;
          material.color.set(id === state.selectedId ? 0x79aaff : 0x59769e);
          material.opacity = id === state.selectedId ? 0.78 : 0.2;
        });
        lastSelectedId = state.selectedId;
      }
      if (lastAsteroidsVisible !== state.showAsteroids) {
        asteroidPoints.visible = state.showAsteroids;
        lastAsteroidsVisible = state.showAsteroids;
      }
      if (lastMoonsVisible !== state.showMoons) {
        moonObjects.forEach((moon) => { moon.visible = state.showMoons; });
        if (!state.showMoons) moonOrbitLines.forEach((line) => { line.visible = false; });
        else moonOrbitLines.forEach((line, id) => {
          const moon = moonRecords.find((record) => record.id === id);
          line.visible = id === state.selectedId || moon?.parent_id === state.selectedId;
        });
        lastMoonsVisible = state.showMoons;
      }
      try { renderer.render(scene, camera); }
      catch { host.dataset.webglUnavailable = 'true'; return; }
      frame = window.requestAnimationFrame(render);
    };
    const onContextLost = (event: Event) => { event.preventDefault(); window.cancelAnimationFrame(frame); host.dataset.webglUnavailable = 'true'; };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame); resizeObserver?.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      scene.traverse((object) => {
        if (object instanceof THREE.Sprite) {
          object.material.map?.dispose();
          object.material.dispose();
        } else if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.LineLoop || object instanceof THREE.Points) {
          object.geometry.dispose();
          const material = object.material;
          (Array.isArray(material) ? material : [material]).forEach((item) => {
            if (item instanceof THREE.MeshStandardMaterial) item.map?.dispose();
            item?.dispose();
          });
        }
      });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [model]);

    return <div ref={hostRef} className="solar-system-canvas" aria-label="Interactive animated 3D solar system. Hover over objects for labels, click to focus, drag to rotate and scroll to zoom." />;
}

const SolarBodyList = memo(function SolarBodyList({ bodies, selectedId, onSelect }: {
  bodies: OrbitRecord[]; selectedId: string | null; onSelect: (id: string) => void;
}) {
  return <div className="solar-body-list">
    {bodies.map((body) => <button key={body.id} type="button" className={selectedId === body.id ? 'active' : ''} onClick={() => onSelect(body.id)}><i style={{ backgroundColor: body.color ?? '#e3a56c' }} /><span><strong>{body.name}</strong><small>{body.type === 'moon' ? `Moon of ${body.parent_name}` : body.type === 'asteroid' ? 'Main-belt asteroid' : `Orbital period ${body.period_days?.toFixed(1) ?? '—'} days`}</small></span></button>)}
    {!bodies.length && <p className="solar-empty">No bodies match that search.</p>}
  </div>;
});

export default function SolarSystemExplorer({ onMapMode }: { onMapMode: (mode: 'sky' | 'solar-system') => void }) {
  const [model, setModel] = useState<ModelResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1 / 24);
  const [offsetDays, setOffsetDays] = useState(0);
  const [selectedId, setSelectedId] = useState('399');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [hoveredBody, setHoveredBody] = useState<{ body: OrbitRecord; x: number; y: number } | null>(null);
  const [followObserver, setFollowObserver] = useState(false);
  const [showMoons, setShowMoons] = useState(true);
  const [showAsteroids, setShowAsteroids] = useState(true);
  const [category, setCategory] = useState<'all' | 'planet' | 'moon' | 'asteroid'>('planet');
  const [search, setSearch] = useState('');
  const anchor = useRef(Date.now());

  useEffect(() => {
    fetchJson<ModelResponse>('/api/v1/observations/solar-system-model')
      .then((data) => setModel(data))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load JPL solar-system data.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!playing) { anchor.current = Date.now(); return; }
    const timer = window.setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = (now - anchor.current) / 1000;
      anchor.current = now;
      setOffsetDays((days) => days + elapsedSeconds * speed);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing, speed]);

  const bodies = useMemo(() => model ? [...model.planets, ...model.moons, ...model.asteroids] : [], [model]);
  const selected = bodies.find((body) => body.id === selectedId) ?? model?.planets.find((body) => body.id === selectedId) ?? null;
  const selectBody = (id: string) => { setSelectedId(id); setFocusedId(id); setFollowObserver(false); };
  const visibleBodies = useMemo(() => bodies.filter((body) => (category === 'all' || body.type === category) && body.name.toLowerCase().includes(search.trim().toLowerCase())), [bodies, category, search]);
  const modelDate = model ? new Date(new Date(model.epoch_utc).getTime() + offsetDays * 86_400_000) : new Date();
  const now = () => { setOffsetDays((Date.now() - new Date(model?.epoch_utc ?? Date.now()).getTime()) / 86_400_000); };
  const fullscreen = () => {
    const container = document.querySelector('.skymap-content');
    if (document.fullscreenElement === container) void document.exitFullscreen();
    else if (container instanceof HTMLElement) void container.requestFullscreen().catch(() => undefined);
  };

  const togglePlayback = () => {
    const time = Date.now();
    if (playing) setOffsetDays((days) => days + (time - anchor.current) / 1000 * speed);
    anchor.current = time;
    setPlaying((value) => !value);
  };

  return (
    <section className="solar-system-explorer">
      <div className="solar-system-stage">
        {model && <SolarSystemCanvas model={model} offsetDays={offsetDays} anchorMs={anchor.current} playing={playing} speed={speed} selectedId={selectedId} focusedId={focusedId} onSelect={selectBody} onHover={(body, x, y) => setHoveredBody(body ? { body, x, y } : null)} followObserver={followObserver} showAsteroids={showAsteroids} showMoons={showMoons} />}
        {hoveredBody && <div className="solar-hover-label" style={{ left: hoveredBody.x, top: hoveredBody.y }}><strong>{hoveredBody.body.name}</strong><span>{hoveredBody.body.type === 'moon' ? `Moon of ${hoveredBody.body.parent_name}` : hoveredBody.body.type === 'asteroid' ? 'Main-belt asteroid' : 'Planet'}</span><small>Click to focus</small></div>}
        {(loading || error) && <div className={`solar-system-state${error ? ' error' : ''}`}>{error ? <><AlertCircle size={18} />{error}</> : 'Loading the current solar-system map…'}</div>}

        <header className="solar-map-toolbar">
          <div className="solar-map-title"><Sun size={17} /><span><strong>Solar System</strong><small>{model ? `${model.asteroid_count} JPL asteroids · JPL epoch ${modelDate.toISOString().slice(0, 10)}` : 'Loading current JPL orbital data'}</small></span></div>
          <div className="solar-map-actions">
            <button type="button" onClick={() => onMapMode('sky')} title="Return to the deep-sky map"><Telescope size={14} /> Deep sky</button>
            <button type="button" className="solar-control-primary" onClick={togglePlayback}>{playing ? <Pause size={14} /> : <Play size={14} />}{playing ? 'Pause' : 'Play'}</button>
            <label>Speed<select value={speed} onChange={(event) => { const time = Date.now(); if (playing) setOffsetDays((days) => days + (time - anchor.current) / 1000 * speed); anchor.current = time; setSpeed(Number(event.target.value)); }}><option value={1 / 24}>1 hour / sec</option><option value={1}>1 day / sec</option><option value={7}>7 days / sec</option><option value={30}>30 days / sec</option></select></label>
            <button type="button" onClick={() => { setOffsetDays(0); setPlaying(true); anchor.current = Date.now(); }}><RotateCcw size={14} /> Epoch</button>
            <button type="button" onClick={now}><Clock3 size={14} /> Now</button>
            <button type="button" onClick={fullscreen}>{document.fullscreenElement ? <Minimize2 size={14} /> : <Maximize2 size={14} />}{document.fullscreenElement ? 'Exit' : 'Full screen'}</button>
            <button type="button" onClick={() => { setFocusedId(null); setFollowObserver(false); setHoveredBody(null); }}><RotateCcw size={14} /> Overview</button>
            <button type="button" className={followObserver ? 'active' : ''} onClick={() => setFollowObserver((value) => !value)}><Telescope size={14} /> {followObserver ? 'Following SPHEREx' : 'Follow SPHEREx'}</button>
            <label className="solar-toggle"><input type="checkbox" checked={showMoons} onChange={(event) => setShowMoons(event.target.checked)} /> Moons</label>
            <label className="solar-toggle"><input type="checkbox" checked={showAsteroids} onChange={(event) => setShowAsteroids(event.target.checked)} /> Asteroids</label>
          </div>
        </header>

        <aside className="solar-system-panel">
          <div className="solar-panel-header"><h3>Explore objects</h3><span>{visibleBodies.length}</span></div>
          <div className="solar-category-tabs">{(['planet', 'moon', 'asteroid', 'all'] as const).map((value) => <button key={value} className={category === value ? 'active' : ''} type="button" onClick={() => setCategory(value)}>{value === 'all' ? 'All' : `${value[0].toUpperCase()}${value.slice(1)}s`}</button>)}</div>
          <label className="solar-body-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search mapped objects" /></label>
          <SolarBodyList bodies={visibleBodies} selectedId={selectedId} onSelect={selectBody} />
          {selected && <div className="solar-selected-body"><span className={`solar-type-pill ${selected.type}`}>{selected.type}</span><h3>{selected.name}</h3><dl><div><dt>Orbit</dt><dd>{selected.type === 'moon' ? `${(selected.a_au * AU_KM).toLocaleString(undefined, { maximumFractionDigits: 0 })} km` : `${selected.a_au.toFixed(3)} AU`}</dd></div><div><dt>Period</dt><dd>{selected.period_days ? selected.period_days > 365 ? `${(selected.period_days / 365.25).toFixed(2)} years` : `${selected.period_days.toFixed(2)} days` : '—'}</dd></div><div><dt>Spin</dt><dd>{selected.rotation_hours ? `${Math.abs(selected.rotation_hours).toFixed(1)} h${selected.rotation_hours < 0 ? ' · retrograde' : ''}` : 'Not cataloged'}</dd></div><div><dt>Inclination</dt><dd>{selected.inclination_deg.toFixed(2)}°</dd></div></dl><button type="button" className="solar-focus-button" onClick={() => selectBody(selected.id)}>Focus on {selected.name}</button></div>}
          {!selected && selectedId === 'sun' && <div className="solar-selected-body"><span className="solar-type-pill">Star</span><h3>Sun</h3><p>Central star of the Solar System. Select a planet, moon, or asteroid to inspect its orbit and rotation.</p><button type="button" className="solar-focus-button" onClick={() => selectBody('sun')}>Focus on the Sun</button></div>}
          {!selected && selectedId === 'spherex' && <div className="solar-selected-body"><span className="solar-type-pill">Observer</span><h3>SPHEREx</h3><p>Illustrative spacecraft marker following its nominal Earth orbit. The displayed orbital phase is not live telemetry.</p><button type="button" className="solar-focus-button" onClick={() => { setFollowObserver(true); setFocusedId('spherex'); }}>Follow SPHEREx</button></div>}
        </aside>

        <div className="solar-map-legend"><span><i className="solar-dot sun" />Sun</span><span><i className="solar-dot planet" />Planets</span><span><i className="solar-dot moon" />Moons</span><span><i className="solar-dot asteroid" />Asteroid belt</span><span><i className="solar-dot observer" />SPHEREx</span></div>
        {model && <div className="solar-system-caveat">Current orbital elements from JPL. Distances and sizes are adjusted for visibility; the displayed SPHEREx orbital phase is illustrative.</div>}
        {!!model?.notes.length && <div className="solar-model-note">Partial upstream catalog response: {model.notes.join(' · ')}</div>}
      </div>
    </section>
  );
}
