import { useEffect, useRef } from 'react';
import {
  AdditiveBlending,
  CanvasTexture,
  Clock,
  OrthographicCamera,
  Scene,
  Sprite,
  SpriteMaterial,
  WebGLRenderer,
} from 'three';

type GlowDot = {
  sprite: Sprite;
  vx: number;
  vy: number;
  baseScale: number;
  pulseSpeed: number;
  pulseOffset: number;
};

const LIGHT_COLORS = ['#38bdf8', '#22d3ee', '#60a5fa', '#818cf8'];

function createGlowTexture(color: string) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  const radius = size / 2;
  const gradient = context.createRadialGradient(radius, radius, 0, radius, radius, radius);
  gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
  gradient.addColorStop(0.22, color);
  gradient.addColorStop(0.65, 'rgba(59,130,246,0.16)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function BreathingLightBackground() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const dots: GlowDot[] = [];
    for (let index = 0; index < 5; index += 1) {
      const color = LIGHT_COLORS[index % LIGHT_COLORS.length];
      const texture = createGlowTexture(color);
      if (!texture) {
        continue;
      }

      const material = new SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        opacity: 0.46,
      });

      const sprite = new Sprite(material);
      scene.add(sprite);

      dots.push({
        sprite,
        vx: (Math.random() - 0.5) * 0.36,
        vy: (Math.random() - 0.5) * 0.28,
        baseScale: 0.36 + Math.random() * 0.42,
        pulseSpeed: 0.7 + Math.random() * 1.1,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    let width = 0;
    let height = 0;

    const syncSize = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      if (width <= 0 || height <= 0) return;

      renderer.setSize(width, height, false);
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
    };

    syncSize();

    dots.forEach((dot) => {
      dot.sprite.position.set((Math.random() - 0.5) * width * 0.85, (Math.random() - 0.5) * height * 0.75, 0);
    });

    const clock = new Clock();

    const animate = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const boundX = width * 0.48;
      const boundY = height * 0.45;

      for (const dot of dots) {
        const sprite = dot.sprite;
        sprite.position.x += dot.vx * width * dt;
        sprite.position.y += dot.vy * height * dt;

        if (Math.abs(sprite.position.x) > boundX) {
          dot.vx *= -1;
          sprite.position.x = Math.sign(sprite.position.x) * boundX;
        }

        if (Math.abs(sprite.position.y) > boundY) {
          dot.vy *= -1;
          sprite.position.y = Math.sign(sprite.position.y) * boundY;
        }

        const pulse = 0.72 + 0.28 * Math.sin(t * dot.pulseSpeed + dot.pulseOffset);
        const wanderX = Math.sin(t * 0.28 + dot.pulseOffset) * 0.2;
        const wanderY = Math.cos(t * 0.24 + dot.pulseOffset) * 0.18;
        const glowScale = dot.baseScale * pulse;

        sprite.scale.set(width * glowScale * 0.6, width * glowScale * 0.6, 1);
        sprite.position.x += wanderX;
        sprite.position.y += wanderY;

        const material = sprite.material as SpriteMaterial;
        material.opacity = 0.33 + 0.25 * pulse;
      }

      renderer.render(scene, camera);
      renderer.setAnimationLoop(animate);
    };

    renderer.setAnimationLoop(animate);

    const resizeObserver = new ResizeObserver(() => {
      syncSize();
    });
    resizeObserver.observe(host);

    return () => {
      resizeObserver.disconnect();
      renderer.setAnimationLoop(null);
      dots.forEach((dot) => {
        const material = dot.sprite.material as SpriteMaterial;
        material.map?.dispose();
        material.dispose();
      });
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hostRef} className="breathing-lights-layer" aria-hidden="true" />;
}
