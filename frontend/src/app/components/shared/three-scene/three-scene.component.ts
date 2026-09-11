import { Component, ElementRef, OnInit, OnDestroy, ViewChild, NgZone, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';

@Component({
  selector: 'app-three-scene',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="three-scene-container" #containerRef>
      <canvas #canvasRef class="three-canvas"></canvas>
    </div>
  `,
  styles: [`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }
    .three-scene-container {
      width: 100%;
      height: 100%;
      position: relative;
    }
    .three-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  `]
})
export class ThreeSceneComponent implements OnInit, OnDestroy {
  @ViewChild('containerRef', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasRef', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animationFrameId: number | null = null;

  // Meshes
  private particleSystem!: THREE.Points;
  private geometricRing!: THREE.Mesh;
  private innerPolyhedron!: THREE.Mesh;

  // Mouse interaction
  private mouseX = 0;
  private mouseY = 0;
  private targetX = 0;
  private targetY = 0;

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.initThree();
  }

  private initThree() {
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.z = 30;

    // 3. Renderer with alpha transparency
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const amberLight = new THREE.PointLight(0xF59E0B, 3, 50);
    amberLight.position.set(-15, 10, 15);
    this.scene.add(amberLight);

    const emeraldLight = new THREE.PointLight(0x10B981, 2.5, 50);
    emeraldLight.position.set(15, -10, 15);
    this.scene.add(emeraldLight);

    const cyanLight = new THREE.PointLight(0x06B6D4, 2, 40);
    cyanLight.position.set(0, 15, -10);
    this.scene.add(cyanLight);

    // 5. 3D Floating Particle Cloud (Bio-Quantum Agro Spores)
    const particleCount = 450;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorHarvest = new THREE.Color(0xF59E0B);
    const colorEmerald = new THREE.Color(0x10B981);
    const colorCyan = new THREE.Color(0x38BDF8);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 60;
      positions[i + 1] = (Math.random() - 0.5) * 50;
      positions[i + 2] = (Math.random() - 0.5) * 40;

      // Color variation
      const rand = Math.random();
      const chosenColor = rand > 0.6 ? colorHarvest : (rand > 0.3 ? colorEmerald : colorCyan);
      colors[i] = chosenColor.r;
      colors[i + 1] = chosenColor.g;
      colors[i + 2] = chosenColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Canvas circular particle texture
    const particleTexture = this.createCircleTexture();

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.55,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      map: particleTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particleSystem = new THREE.Points(geometry, particleMaterial);
    this.scene.add(this.particleSystem);

    // 6. Interactive 3D Hologram Ring (Floating in left/center space)
    const ringGeo = new THREE.TorusGeometry(8, 0.15, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      wireframe: true,
      roughness: 0.3,
      metalness: 0.9,
      emissive: 0xB45309,
      emissiveIntensity: 0.4
    });
    this.geometricRing = new THREE.Mesh(ringGeo, ringMat);
    this.geometricRing.position.set(-14, 0, -5);
    this.geometricRing.rotation.x = Math.PI / 4;
    this.scene.add(this.geometricRing);

    // 7. Inner Crystal Polyhedron
    const polyGeo = new THREE.IcosahedronGeometry(3.5, 1);
    const polyMat = new THREE.MeshStandardMaterial({
      color: 0x10B981,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x064E3B,
      emissiveIntensity: 0.5
    });
    this.innerPolyhedron = new THREE.Mesh(polyGeo, polyMat);
    this.innerPolyhedron.position.copy(this.geometricRing.position);
    this.scene.add(this.innerPolyhedron);

    // Run animation outside Angular zone for max FPS
    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  private createCircleTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.7)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  @HostListener('window:mousemove', ['$event'])
  onWindowMouseMove(e: MouseEvent) {
    this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (!this.renderer || !this.camera || !this.containerRef) return;
    const width = this.containerRef.nativeElement.clientWidth || window.innerWidth;
    const height = this.containerRef.nativeElement.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Mouse Lerp
    this.targetX += (this.mouseX - this.targetX) * 0.04;
    this.targetY += (this.mouseY - this.targetY) * 0.04;

    this.camera.position.x = this.targetX * 3;
    this.camera.position.y = -this.targetY * 3;
    this.camera.lookAt(0, 0, 0);

    // Animate Particles
    if (this.particleSystem) {
      this.particleSystem.rotation.y += 0.0008;
      this.particleSystem.rotation.x += 0.0004;
    }

    // Animate 3D Holograms
    if (this.geometricRing) {
      this.geometricRing.rotation.x += 0.004;
      this.geometricRing.rotation.y += 0.006;
    }

    if (this.innerPolyhedron) {
      this.innerPolyhedron.rotation.x -= 0.005;
      this.innerPolyhedron.rotation.y -= 0.007;
    }

    this.renderer.render(this.scene, this.camera);
  };

  ngOnDestroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
