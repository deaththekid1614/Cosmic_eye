import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { FeaturedTarget } from '../types/observation';
import brightStars from '../catalogs/hipparcos_bright_stars.json';

type Props = {
  targets: FeaturedTarget[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  autoRotate: boolean;
  resetSignal: number;
  showGrid: boolean;
  focusedTarget: { ra: number; dec: number } | null;
  onHover: (id: string | null) => void;
};

const SPHERE_RADIUS = 48;
type BrightStar = [number, number, number, number];

function skyPosition(raDegrees: number, decDegrees: number, radius = SPHERE_RADIUS) {
  const ra = THREE.MathUtils.degToRad(raDegrees);
  const dec = THREE.MathUtils.degToRad(decDegrees);
  return new THREE.Vector3(
    -radius * Math.cos(dec) * Math.sin(ra),
    radius * Math.sin(dec),
    radius * Math.cos(dec) * Math.cos(ra),
  );
}

function targetColor(type: string) {
  if (/galaxy/i.test(type)) return 0x75b7ff;
  if (/cluster/i.test(type)) return 0xffce72;
  if (/nebula|star-forming|complex|remnant/i.test(type)) return 0xd892ff;
  return 0x7ee7d3;
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

export default function SkyMapGlobe({ targets, selectedId, onSelect, autoRotate, resetSignal, showGrid, focusedTarget, onHover }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const markerMap = useRef(new Map<string, THREE.Mesh>());
  const viewRef = useRef<{ reset: () => void; focus: (ra: number, dec: number) => void } | null>(null);
  const gridRef = useRef<THREE.Group | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const autoRotateRef = useRef(autoRotate);
  const selectRef = useRef(onSelect);
  const hoverRef = useRef(onHover);
  selectRef.current = onSelect;
  hoverRef.current = onHover;
  autoRotateRef.current = autoRotate;

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
    for (const [, ra, dec, magnitude] of brightStars as BrightStar[]) {
      const pos = skyPosition(ra, dec, SPHERE_RADIUS - 0.35);
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
    const brightPoints = new THREE.Points(brightGeometry, new THREE.PointsMaterial({ color: 0xffe9c1, size: 0.28, sizeAttenuation: true, transparent: true, opacity: 0.98, depthWrite: false }));
    globe.add(brightPoints);

    const markers = new THREE.Group();
    globe.add(markers);
    const markerGeometry = new THREE.SphereGeometry(0.24, 24, 20);
    const markerMaterials = new Map<number, THREE.MeshBasicMaterial>();
    markerMap.current.clear();
    for (const target of targets) {
      const color = targetColor(target.type);
      let material = markerMaterials.get(color);
      if (!material) {
        material = new THREE.MeshBasicMaterial({ color, depthWrite: false, depthTest: false });
        markerMaterials.set(color, material);
      }
      const marker = new THREE.Mesh(markerGeometry, material);
      marker.position.copy(skyPosition(target.ra, target.dec, SPHERE_RADIUS + 0.4));
      marker.userData.targetId = target.id;
      marker.renderOrder = 3;
      markerMap.current.set(target.id, marker);
      markers.add(marker);

      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 20, 16),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.17, depthWrite: false, depthTest: false }),
      );
      halo.position.copy(marker.position);
      halo.userData.targetId = target.id;
      halo.renderOrder = 2;
      markers.add(halo);
    }

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
    const clock = new THREE.Clock();
    let previousTime = 0;
    const render = () => {
      const elapsed = clock.elapsedTime;
      const delta = elapsed - previousTime;
      previousTime = elapsed;
      if (focusAngles && !dragging) {
        const yawDifference = Math.atan2(Math.sin(focusAngles.yaw - yaw), Math.cos(focusAngles.yaw - yaw));
        yaw += yawDifference * Math.min(1, delta * 3.2);
        pitch += (focusAngles.pitch - pitch) * Math.min(1, delta * 3.2);
        if (Math.abs(yawDifference) < 0.002 && Math.abs(focusAngles.pitch - pitch) < 0.002) focusAngles = null;
      } else if (autoRotateRef.current && !dragging) {
        yaw += delta * 0.055;
      }
      camera.rotation.set(pitch, Math.PI + yaw, 0, 'YXZ');
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener('wheel', onWheel);
      viewRef.current = null;
      gridRef.current = null;
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      markerMap.current.clear();
      hoverRef.current(null);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [targets]);

  useEffect(() => {
    if (gridRef.current) gridRef.current.visible = showGrid;
  }, [showGrid]);

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
      marker.scale.setScalar(selected ? 1.65 : 1);
      const material = marker.material as THREE.MeshBasicMaterial;
      material.color.set(selected ? 0xffffff : targetColor(targets.find((target) => target.id === id)?.type ?? ''));
    }
  }, [selectedId, targets]);

  return (
    <div ref={hostRef} className="sky-map-globe" aria-label="Interactive three-dimensional sky view from the SPHEREx observer, with Hipparcos stars and SPHEREx-covered targets" />
  );
}
