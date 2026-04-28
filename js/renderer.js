// renderer.js - Camera, lights, optional bloom
import * as THREE from 'three';
import { CAMERA, GRID, COLORS } from './config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;

    // WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(COLORS.SKY_TOP);
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(COLORS.SKY_TOP, 0.012);

    // Orthographic camera (isometric)
    const aspect = window.innerWidth / window.innerHeight;
    const zoom = CAMERA.ZOOM;
    this.camera = new THREE.OrthographicCamera(
      -zoom * aspect, zoom * aspect,
      zoom, -zoom,
      0.1, 100
    );
    this.camera.position.set(...CAMERA.POSITION);
    this.camera.lookAt(new THREE.Vector3(...CAMERA.LOOK_AT));

    // Lights
    const ambient = new THREE.AmbientLight(0x9988cc, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 0.9);
    dirLight.position.set(15, 20, 10);
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xccddff, 0.3);
    fillLight.position.set(-10, 10, -5);
    this.scene.add(fillLight);

    // Background gradient plane
    this._buildBackground();

    // Clouds
    this._buildClouds();

    // Bloom - try to load, fall back gracefully
    this.composer = null;
    this.bloomEnabled = false;
    this._tryInitBloom();

    // Resize handler
    window.addEventListener('resize', () => this.onResize());
  }

  _buildBackground() {
    const bgGeo = new THREE.PlaneGeometry(200, 200);
    const bgMat = new THREE.ShaderMaterial({
      uniforms: {
        colorTop: { value: new THREE.Color(COLORS.SKY_TOP) },
        colorBottom: { value: new THREE.Color(COLORS.SKY_BOTTOM) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 colorTop;
        uniform vec3 colorBottom;
        varying vec2 vUv;
        void main() {
          gl_FragColor = vec4(mix(colorBottom, colorTop, vUv.y), 1.0);
        }
      `,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    bg.position.set(12, 0, 8);
    bg.lookAt(this.camera.position);
    bg.position.add(this.camera.position.clone().sub(bg.position).normalize().multiplyScalar(-50));
    bg.renderOrder = -1;
    this.scene.add(bg);
  }

  _buildClouds() {
    const cloudMat = new THREE.MeshBasicMaterial({
      color: COLORS.CLOUD_WHITE,
      transparent: true,
      opacity: 0.15,
    });
    for (let i = 0; i < 6; i++) {
      const s = 2 + Math.random() * 3;
      const geo = new THREE.BoxGeometry(s, 0.4, s * 0.6);
      const cloud = new THREE.Mesh(geo, cloudMat);
      cloud.position.set(
        Math.random() * 40 - 10,
        8 + Math.random() * 4,
        Math.random() * 30 - 5
      );
      cloud.userData.speed = 0.1 + Math.random() * 0.15;
      cloud.userData.isCloud = true;
      this.scene.add(cloud);
    }
  }

  async _tryInitBloom() {
    // Bloom requires addons - we'll skip if import fails
    try {
      const { EffectComposer } = await import('https://cdn.jsdelivr.net/npm/three@0.171.0/examples/jsm/postprocessing/EffectComposer.js');
      const { RenderPass } = await import('https://cdn.jsdelivr.net/npm/three@0.171.0/examples/jsm/postprocessing/RenderPass.js');
      const { UnrealBloomPass } = await import('https://cdn.jsdelivr.net/npm/three@0.171.0/examples/jsm/postprocessing/UnrealBloomPass.js');

      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));

      const bloom = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.5, 0.4, 0.85
      );
      this.composer.addPass(bloom);
      this.bloomEnabled = true;
    } catch (e) {
      console.warn('Bloom not available, using standard rendering', e);
    }
  }

  onResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const zoom = CAMERA.ZOOM;
    this.camera.left = -zoom * aspect;
    this.camera.right = zoom * aspect;
    this.camera.top = zoom;
    this.camera.bottom = -zoom;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.composer) {
      this.composer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  // Camera shake
  shakeIntensity = 0;
  shakeDuration = 0;
  shakeTimer = 0;
  _basePosition = null;

  shake(intensity = 0.3, duration = 0.3) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
    if (!this._basePosition) {
      this._basePosition = this.camera.position.clone();
    }
  }

  updateClouds(dt) {
    this.scene.traverse(obj => {
      if (obj.userData.isCloud) {
        obj.position.x += obj.userData.speed * dt;
        if (obj.position.x > 40) obj.position.x = -15;
      }
    });
  }

  updateShake(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const t = this.shakeTimer / this.shakeDuration;
      const intensity = this.shakeIntensity * t;
      this.camera.position.set(
        this._basePosition.x + (Math.random() - 0.5) * intensity,
        this._basePosition.y + (Math.random() - 0.5) * intensity,
        this._basePosition.z + (Math.random() - 0.5) * intensity
      );
    } else if (this._basePosition) {
      this.camera.position.copy(this._basePosition);
      this._basePosition = null;
    }
  }

  render() {
    if (this.bloomEnabled && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
