import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { FeaturedTarget } from '../types/observation';
import brightStars from '../catalogs/hipparcos_bright_stars.json';

type Props = {
  targets: FeaturedTarget[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  resetSignal: number;
  showGrid: boolean;
  showConstellations: boolean;
  focusedTarget: { ra: number; dec: number } | null;
  onHover: (id: string | null) => void;
};

const SPHERE_RADIUS = 48;
type BrightStar = [number, number, number, number];
const CONSTELLATION_PATHS = [
  { name: 'Orion', paths: [[27989, 25336, 25930, 26311, 26727, 27366, 24436, 27989]] },
  { name: 'Ursa Major', paths: [[54061, 53910, 58001, 59774, 54061], [59774, 62956, 65378, 67301]] },
  { name: 'Cassiopeia', paths: [[746, 3179, 4427, 6686, 8886]] },
  { name: 'Cygnus', paths: [[102098, 100453, 9640], [100453, 102488, 97165]] },
  { name: 'Leo', paths: [[49669, 50583, 54879, 54872, 50335, 49669]] },
];
const GALACTIC_TO_EQUATORIAL = new THREE.Matrix3().set(
  -0.0548755604, 0.4941094279, -0.8676661490,
  -0.8734370902, -0.4448296300, -0.1980763734,
  -0.4838350155, 0.7469822445, 0.4559837762,
);

function skyPosition(raDegrees: number, decDegrees: number, radius = SPHERE_RADIUS) {
  const ra = THREE.MathUtils.degToRad(raDegrees);
  const dec = THREE.MathUtils.degToRad(decDegrees);
  return new THREE.Vector3(
    -radius * Math.cos(dec) * Math.sin(ra),
    radius * Math.sin(dec),
    radius * Math.cos(dec) * Math.cos(ra),
  );
}

function galacticPosition(longitudeDegrees: number, latitudeDegrees: number, radius: number) {
  const longitude = THREE.MathUtils.degToRad(longitudeDegrees);
  const latitude = THREE.MathUtils.degToRad(latitudeDegrees);
  const equatorial = new THREE.Vector3(
    Math.cos(latitude) * Math.cos(longitude),
    Math.cos(latitude) * Math.sin(longitude),
    Math.sin(latitude),
  ).applyMatrix3(GALACTIC_TO_EQUATORIAL).normalize();
  const ra = THREE.MathUtils.radToDeg(Math.atan2(equatorial.y, equatorial.x) + Math.PI * 2) % 360;
  const dec = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(equatorial.z, -1, 1)));
  return skyPosition(ra, dec, radius);
}

function createSpiralGalaxyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return null;

  const glow = context.createRadialGradient(64, 64, 3, 64, 64, 56);
  glow.addColorStop(0, 'rgba(255,255,255,.9)');
  glow.addColorStop(.18, 'rgba(150,205,255,.58)');
  glow.addColorStop(1, 'rgba(90,155,255,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 128, 128);
  context.save();
  context.translate(64, 64);
  context.rotate(-.38);
  for (let arm = 0; arm < 2; arm += 1) {
    context.beginPath();
    for (let step = 0; step <= 120; step += 1) {
      const progress = step / 120;
      const angle = arm * Math.PI + progress * Math.PI * 3.6;
      const radius = 5 + progress * 48;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * .58;
      if (step === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = 'rgba(235,247,255,.92)';
    context.lineWidth = 4.2;
    context.lineCap = 'round';
    context.shadowColor = 'rgba(110,180,255,.9)';
    context.shadowBlur = 9;
    context.stroke();
  }
  context.restore();
  context.beginPath();
  context.arc(64, 64, 5, 0, Math.PI * 2);
  context.fillStyle = '#ffffff';
  context.shadowColor = '#c4e5ff';
  context.shadowBlur = 12;
  context.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function targetColor(type: string) {
  if (/nebula|star-forming|complex|remnant/i.test(type)) return 0xd892ff;
  if (/planet|exoplanet/i.test(type)) return 0xff8066;
  if (/galaxy/i.test(type)) return 0x75b7ff;
  if (/star|stellar|cluster|association/i.test(type)) return 0xffd166;
  return 0x7ee7d3;
}

function targetKind(type: string) {
  if (/nebula|star-forming|complex|remnant/i.test(type)) return 'nebula';
  if (/planet|exoplanet/i.test(type)) return 'planet';
  if (/moon|satellite/i.test(type)) return 'moon';
  if (/galaxy/i.test(type)) return 'galaxy';
  if (/star|stellar|cluster|association/i.test(type) && !/star-forming/i.test(type)) return 'star';
  return 'other';
}

function createTargetIconTexture(kind: string) {
  if (kind === 'galaxy') return createSpiralGalaxyTexture();
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.fillStyle = '#ffffff';
  context.strokeStyle = '#ffffff';
  context.lineWidth = 4;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  if (kind === 'nebula') {
    context.shadowColor = '#ffffff';
    context.shadowBlur = 9;
    context.beginPath();
    context.arc(25, 35, 12, 0, Math.PI * 2);
    context.arc(37, 30, 13, 0, Math.PI * 2);
    context.arc(42, 40, 9, 0, Math.PI * 2);
    context.fill();
  } else if (kind === 'star') {
    context.beginPath();
    for (let point = 0; point < 10; point += 1) {
      const angle = -Math.PI / 2 + point * Math.PI / 5;
      const radius = point % 2 === 0 ? 25 : 11;
      const x = 32 + Math.cos(angle) * radius;
      const y = 32 + Math.sin(angle) * radius;
      if (point === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.fill();
  } else if (kind === 'planet') {
    context.beginPath();
    context.ellipse(32, 32, 28, 10, -0.35, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(32, 32, 15, 0, Math.PI * 2);
    context.fill();
  } else if (kind === 'moon') {
    context.beginPath();
    context.arc(32, 32, 23, 0, Math.PI * 2);
    context.fill();
    context.globalCompositeOperation = 'destination-out';
    context.beginPath();
    context.arc(43, 24, 20, 0, Math.PI * 2);
    context.fill();
  } else {
    context.beginPath();
    context.moveTo(32, 6);
    context.lineTo(58, 32);
    context.lineTo(32, 58);
    context.lineTo(6, 32);
    context.closePath();
    context.fill();
    context.globalCompositeOperation = 'destination-out';
    context.beginPath();
    context.arc(32, 32, 5, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addArc(group: THREE.Group, points: THREE.Vector3[], color: number, opacity: number) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: false,
  }));
  line.renderOrder = 1;
  group.add(line);
}

function addConstellationLabel(group: THREE.Group, name: string, positions: THREE.Vector3[]) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 80;
  const context = canvas.getContext('2d');
  if (!context || positions.length === 0) return;

  context.beginPath();
  context.roundRect(3, 3, 314, 74, 18);
  context.fillStyle = 'rgba(7, 13, 24, 0.9)';
  context.fill();
  context.strokeStyle = 'rgba(241, 201, 138, 0.78)';
  context.lineWidth = 3;
  context.stroke();
  context.beginPath();
  context.arc(34, 40, 7, 0, Math.PI * 2);
  context.fillStyle = '#f1c98a';
  context.shadowColor = 'rgba(241, 201, 138, 0.8)';
  context.shadowBlur = 12;
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = '#f5ead7';
  context.font = '600 30px Inter, sans-serif';
  context.textBaseline = 'middle';
  context.fillText(name, 56, 41);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: true }));
  const center = positions.reduce((sum, position) => sum.add(position), new THREE.Vector3()).normalize();
  label.position.copy(center.multiplyScalar(SPHERE_RADIUS - 0.55));
  label.scale.set(8.2, 2.05, 1);
  label.renderOrder = 5;
  group.add(label);
}

export default function SkyMapGlobe({ targets, selectedId, onSelect, resetSignal, showGrid, showConstellations, focusedTarget, onHover }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const markerMap = useRef(new Map<string, THREE.Object3D>());
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const targetIconTextures = useRef(new Map<string, THREE.CanvasTexture>());
  const viewRef = useRef<{ reset: () => void; focus: (ra: number, dec: number) => void } | null>(null);
  const gridRef = useRef<THREE.Group | null>(null);
  const constellationsRef = useRef<THREE.Group | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const selectRef = useRef(onSelect);
  const hoverRef = useRef(onHover);
  selectRef.current = onSelect;
  hoverRef.current = onHover;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      host.dataset.webglUnavailable = 'true';
      return;
    }
    host.dataset.webglUnavailable = 'false';
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x050a13, 0);
    renderer.domElement.setAttribute('aria-label', 'Interactive all-sky view from SPHEREx. Drag to look around, scroll to zoom, and select a catalog target.');
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(78, 1, 0.1, 120);
    camera.position.set(0, 0, 0);
    camera.rotation.order = 'YXZ';
    camera.rotation.set(0, Math.PI, 0, 'YXZ');

    const globe = new THREE.Group();
    scene.add(globe);

    const grid = new THREE.Group();
    grid.visible = showGrid;
    gridRef.current = grid;
    globe.add(grid);
    // Equatorial coordinate grid: RA meridians every 30° and declination parallels every 15°.
    for (let ra = 0; ra < 360; ra += 30) {
      const points: THREE.Vector3[] = [];
      for (let dec = -90; dec <= 90; dec += 2) points.push(skyPosition(ra, dec, SPHERE_RADIUS + 0.15));
      addArc(grid, points, 0x5d8dbd, ra % 90 === 0 ? 0.34 : 0.19);
    }
    for (let dec = -75; dec <= 75; dec += 15) {
      const points: THREE.Vector3[] = [];
      for (let ra = 0; ra <= 360; ra += 2) points.push(skyPosition(ra, dec, SPHERE_RADIUS + 0.15));
      addArc(grid, points, dec === 0 ? 0x8bbcff : 0x5d8dbd, dec === 0 ? 0.45 : 0.2);
    }

    // Real bright-star directions from the Hipparcos catalog form the subtle sky backdrop.
    const starPositions: number[] = [];
    const brightPositions: number[] = [];
    const starPositionsById = new Map<number, THREE.Vector3>();
    for (const [hip, ra, dec, magnitude] of brightStars as BrightStar[]) {
      const pos = skyPosition(ra, dec, SPHERE_RADIUS - 0.35);
      starPositionsById.set(hip, pos);
      if (magnitude < 2.2) brightPositions.push(pos.x, pos.y, pos.z);
      else starPositions.push(pos.x, pos.y, pos.z);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    // A cool white star field with the brightest guide stars given a larger point size.
    const starMaterial = new THREE.PointsMaterial({ color: 0xb8d5ff, size: 0.12, sizeAttenuation: true, transparent: true, opacity: 0.74, depthWrite: false });
    const starPoints = new THREE.Points(starGeometry, starMaterial);
    globe.add(starPoints);
    const brightGeometry = new THREE.BufferGeometry();
    brightGeometry.setAttribute('position', new THREE.Float32BufferAttribute(brightPositions, 3));
    const brightPoints = new THREE.Points(brightGeometry, new THREE.PointsMaterial({ color: 0xffd166, size: 0.28, sizeAttenuation: true, transparent: true, opacity: 0.98, depthWrite: false }));
    globe.add(brightPoints);

    // This dotted band follows the ICRS galactic plane; its points are illustrative, not archive pixels.
    let randomSeed = 700700;
    const random = () => {
      randomSeed = (1664525 * randomSeed + 1013904223) >>> 0;
      return randomSeed / 4294967296;
    };
    const milkyWayPositions: number[] = [];
    for (let index = 0; index < 7200; index += 1) {
      const longitude = random() < .36 ? ((random() + random() + random()) / 3 - .5) * 90 : random() * 360;
      const latitude = (random() + random() + random() + random() - 2) * 3.8;
      const position = galacticPosition(longitude, latitude, SPHERE_RADIUS - .5);
      milkyWayPositions.push(position.x, position.y, position.z);
    }
    const milkyWayGeometry = new THREE.BufferGeometry();
    milkyWayGeometry.setAttribute('position', new THREE.Float32BufferAttribute(milkyWayPositions, 3));
    const milkyWayStars = new THREE.Points(milkyWayGeometry, new THREE.PointsMaterial({
      color: 0xbba9ff,
      size: .095,
      sizeAttenuation: true,
      transparent: true,
      opacity: .38,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    milkyWayStars.renderOrder = 1;
    globe.add(milkyWayStars);

    const constellations = new THREE.Group();
    constellations.visible = showConstellations;
    constellationsRef.current = constellations;
    for (const constellation of CONSTELLATION_PATHS) {
      const constellationStars = new Map<number, THREE.Vector3>();
      for (const path of constellation.paths) {
        const points = path.map((hip) => {
          const position = starPositionsById.get(hip);
          if (position) constellationStars.set(hip, position);
          return position;
        }).filter((point): point is THREE.Vector3 => Boolean(point));
        if (points.length > 1) addArc(constellations, points.map((point) => point.clone().normalize().multiplyScalar(SPHERE_RADIUS - 0.12)), 0xf1c98a, 0.56);
      }
      addConstellationLabel(constellations, constellation.name, [...constellationStars.values()]);
    }
    globe.add(constellations);

    const markers = new THREE.Group();
    markerGroupRef.current = markers;
    globe.add(markers);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    let lastX = 0;
    let lastY = 0;
    let yaw = 0;
    let pitch = 0;
    let dragging = false;
    let focusAngles: { yaw: number; pitch: number } | null = null;
    const targetAtPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(markers.children, false).find((item) => item.object.userData.targetId);
      return hit?.object.userData.targetId ? String(hit.object.userData.targetId) : null;
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      downX = lastX = event.clientX;
      downY = lastY = event.clientY;
      dragging = true;
      focusAngles = null;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 5) return;
      const id = targetAtPointer(event);
      if (id) selectRef.current(id);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (dragging) {
        yaw += (event.clientX - lastX) * 0.0045;
        pitch = THREE.MathUtils.clamp(pitch + (event.clientY - lastY) * 0.0045, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
        camera.rotation.set(pitch, Math.PI + yaw, 0, 'YXZ');
        lastX = event.clientX;
        lastY = event.clientY;
        hoverRef.current(null);
        return;
      }
      const id = targetAtPointer(event);
      renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
      if (id !== hoveredRef.current) {
        hoveredRef.current = id;
        hoverRef.current(id);
      }
    };
    const onPointerLeave = () => {
      if (!dragging) {
        hoveredRef.current = null;
        hoverRef.current(null);
      }
      renderer.domElement.style.cursor = 'grab';
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.fov = THREE.MathUtils.clamp(camera.fov + Math.sign(event.deltaY) * 3.5, 34, 104);
      camera.updateProjectionMatrix();
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(host);
    resize();

    viewRef.current = {
      reset: () => {
        yaw = 0;
        pitch = 0;
        focusAngles = null;
        camera.fov = 78;
        camera.rotation.set(0, Math.PI, 0, 'YXZ');
        camera.updateProjectionMatrix();
      },
      focus: (ra, dec) => {
        const direction = skyPosition(ra, dec, 1);
        focusAngles = { yaw: Math.atan2(direction.x, direction.z), pitch: Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1)) };
      },
    };

    let frame = 0;
    let contextLost = false;
    const clock = new THREE.Clock();
    let previousTime = 0;
    const render = () => {
      if (contextLost) return;
      const elapsed = clock.elapsedTime;
      const delta = elapsed - previousTime;
      previousTime = elapsed;
      if (focusAngles && !dragging) {
        const yawDifference = Math.atan2(Math.sin(focusAngles.yaw - yaw), Math.cos(focusAngles.yaw - yaw));
        yaw += yawDifference * Math.min(1, delta * 3.2);
        pitch += (focusAngles.pitch - pitch) * Math.min(1, delta * 3.2);
        if (Math.abs(yawDifference) < 0.002 && Math.abs(focusAngles.pitch - pitch) < 0.002) focusAngles = null;
      } else if (!dragging) {
        yaw += delta * 0.055;
      }
      camera.rotation.set(pitch, Math.PI + yaw, 0, 'YXZ');
      try {
        renderer.render(scene, camera);
      } catch {
        host.dataset.webglUnavailable = 'true';
        return;
      }
      frame = window.requestAnimationFrame(render);
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      window.cancelAnimationFrame(frame);
      host.dataset.webglUnavailable = 'true';
    };
    const onContextRestored = () => {
      contextLost = false;
      host.dataset.webglUnavailable = 'false';
      frame = window.requestAnimationFrame(render);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
    render();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      viewRef.current = null;
      gridRef.current = null;
      constellationsRef.current = null;
      markerGroupRef.current = null;
      scene.traverse((object) => {
        if (object instanceof THREE.Sprite) {
          object.material.dispose();
        } else if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      targetIconTextures.current.forEach((texture) => texture.dispose());
      targetIconTextures.current.clear();
      markerMap.current.clear();
      hoverRef.current(null);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  // Rebuild only target markers when filters or live solar-system results change;
  // keep the expensive WebGL scene and its context alive between selections.
  useEffect(() => {
    const markers = markerGroupRef.current;
    if (!markers) return;
    for (const child of markers.children) {
      if (child instanceof THREE.Sprite) child.material.dispose();
    }
    markers.clear();
    markerMap.current.clear();

    for (const target of targets) {
      const kind = targetKind(target.type);
      let texture = targetIconTextures.current.get(kind);
      if (!texture) {
        texture = createTargetIconTexture(kind) ?? undefined;
        if (texture) targetIconTextures.current.set(kind, texture);
      }
      if (!texture) continue;
      const marker = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texture,
        color: targetColor(target.type),
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }));
      const baseSize = kind === 'galaxy' ? [1.9, 1.5, 1] : [1.25, 1.25, 1];
      marker.scale.set(baseSize[0], baseSize[1], baseSize[2]);
      marker.userData.baseScale = baseSize;
      marker.position.copy(skyPosition(target.ra, target.dec, SPHERE_RADIUS + 0.4));
      marker.userData.targetId = target.id;
      marker.renderOrder = 3;
      markerMap.current.set(target.id, marker);
      markers.add(marker);
    }
  }, [targets]);

  useEffect(() => {
    if (gridRef.current) gridRef.current.visible = showGrid;
  }, [showGrid]);

  useEffect(() => {
    if (constellationsRef.current) constellationsRef.current.visible = showConstellations;
  }, [showConstellations]);

  useEffect(() => {
    if (!resetSignal) return;
    viewRef.current?.reset();
  }, [resetSignal]);

  useEffect(() => {
    if (focusedTarget) viewRef.current?.focus(focusedTarget.ra, focusedTarget.dec);
  }, [focusedTarget?.ra, focusedTarget?.dec]);

  useEffect(() => {
    for (const [id, marker] of markerMap.current) {
      const selected = id === selectedId;
      const [baseX, baseY, baseZ] = marker.userData.baseScale as [number, number, number];
      const scale = selected ? 1.65 : 1;
      marker.scale.set(baseX * scale, baseY * scale, baseZ * scale);
      const material = (marker as THREE.Sprite).material;
      material.color.set(selected ? 0xffffff : targetColor(targets.find((target) => target.id === id)?.type ?? ''));
    }
  }, [selectedId, targets]);

  return (
    <div ref={hostRef} className="sky-map-globe" aria-label="Interactive three-dimensional sky view from the SPHEREx observer, with Hipparcos stars and SPHEREx-covered targets" />
  );
}
