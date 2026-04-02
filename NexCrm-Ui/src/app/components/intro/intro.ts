import { Component, EventEmitter, Output, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './intro.html',
  styleUrl: './intro.css'
})
export class IntroComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('rendererCanvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  @Output() finished = new EventEmitter<void>();

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private requestRef?: number;
  
  // 3D Objects
  private plexusPoints!: THREE.Points;
  private plexusLines!: THREE.LineSegments;
  private streams!: THREE.Points;

  private textSprite!: THREE.Sprite;
  private textSpriteR!: THREE.Sprite;
  private textSpriteB!: THREE.Sprite;
  private subTextSprite!: THREE.Sprite;
  private hudWidgets: THREE.Sprite[] = [];
  private rocketGroup!: THREE.Group;
  private energyBlast!: THREE.Mesh;

  videoStarted = false;
  textVisible = false;
  rocketArrived = false;
  textFading = false;
  pingFlash = false;

  ngOnInit() {
    // Sequence the logic - Precision 6s Timeline with 5s Solid Visibility
    setTimeout(() => this.videoStarted = true, 500);
    // Rocket flies for 0.8 seconds
    setTimeout(() => {
        this.rocketArrived = true;
        this.textVisible = true;
    }, 800); 
    
    // Solid visibility until 5.7s
    setTimeout(() => this.textFading = true, 5700);
    setTimeout(() => this.pingFlash = true, 5900);
    
    setTimeout(() => {
      this.finished.emit();
    }, 6200); 
  }

  ngAfterViewInit() {
    this.initThree();
    this.animate();
  }

  private initThree() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x00020a); 
    this.scene.fog = new THREE.FogExp2(0x00020a, 0.001);

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 8000);
    this.camera.position.z = 3000; 

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas.nativeElement,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Build Masterpiece Plexus (Dense Spherical Shell)
    this.buildMasterPlexus();
    
    // Build Warp Streams (5000+ particles)
    this.buildWarpStreams();

    // Build Floating HUD Widgets (Charts/Graphs)
    this.buildHUDWidgets();

    // Build Rocket
    this.buildRocket();

    // Energy Blast
    const blastGeo = new THREE.SphereGeometry(20, 32, 32);
    const blastMat = new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0 });
    this.energyBlast = new THREE.Mesh(blastGeo, blastMat);
    this.scene.add(this.energyBlast);

    // Build Branding Sprites
    this.buildBrandingSprites();



    // Add Light to Rocket
    const rocketLight = new THREE.PointLight(0x6366f1, 500, 1000);
    this.rocketGroup.add(rocketLight); // Light follows rocket

    // Add Ambient Light
    const ambient = new THREE.AmbientLight(0x404040, 2);
    this.scene.add(ambient);
  }

  private buildMasterPlexus() {
    const count = 1000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Spherical distribution for a "Data Globe" look
      const r = 1200 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      colors[i * 3] = 0.3; 
      colors[i * 3 + 1] = 0.4; 
      colors[i * 3 + 2] = 0.9;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 8,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.plexusPoints = new THREE.Points(geometry, material);
    this.scene.add(this.plexusPoints);

    // Denser Line connectivity
    const lineMat = new THREE.LineBasicMaterial({ color: 0x4338ca, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
    this.plexusLines = new THREE.LineSegments(geometry, lineMat);
    this.scene.add(this.plexusLines);
  }

  private buildWarpStreams() {
    const count = 6000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8000;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 2,
      color: 0x6366f1,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });

    this.streams = new THREE.Points(geometry, material);
    this.scene.add(this.streams);
  }

  private buildHUDWidgets() {
    // Generate 12 procedural tech widgets
    for (let i = 0; i < 12; i++) {
        const sprite = this.createHUDWidget();
        // Position in a sphere around center
        const r = 800 + Math.random() * 1200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        sprite.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
        sprite.lookAt(0, 0, 0);
        this.hudWidgets.push(sprite);
        this.scene.add(sprite);
    }
  }

  private createHUDWidget(): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512; // Square for pie charts
    const ctx = canvas.getContext('2d')!;
    
    // Draw Frame
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 472, 472);
    
    // Header
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.fillRect(20, 20, 472, 60);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Monospace';
    ctx.fillText('ANALYTICS_' + Math.floor(Math.random()*99), 40, 60);
    
    const type = Math.random();
    if (type > 0.6) {
        // Pie Chart
        const centerX = 256;
        const centerY = 300;
        const radius = 150;
        let startAngle = 0;
        const colors = ['#6366f1', '#22d3ee', '#4338ca', '#1e1b4b'];
        
        [0.4, 0.25, 0.2, 0.15].forEach((p, i) => {
            const endAngle = startAngle + p * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.fillStyle = colors[i];
            ctx.fill();
            startAngle = endAngle;
        });
        // Inner hole for "Donut" feel
        ctx.beginPath();
        ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
        ctx.fillStyle = '#00020a';
        ctx.fill();
    } else {
        // Bar Chart (Pro)
        const startY = 450;
        for (let i = 0; i < 6; i++) {
            const h = 100 + Math.random() * 250;
            const x = 60 + i * 70;
            ctx.fillStyle = '#22d3ee';
            ctx.fillRect(x, startY - h, 40, h);
            // Label
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillRect(x, startY + 10, 40, 10);
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.7 });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(300, 300, 1);
    return sprite;
  }

  private buildRocket() {
    this.rocketGroup = new THREE.Group();
    
    // Body (Futuristic dart shape)
    const bodyGeo = new THREE.ConeGeometry(5, 40, 4);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0x1e1b4b, shininess: 100 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    this.rocketGroup.add(body);

    // Fins
    const finGeo = new THREE.BoxGeometry(15, 1, 10);
    const finMat = new THREE.MeshPhongMaterial({ color: 0x6366f1 });
    const fin1 = new THREE.Mesh(finGeo, finMat);
    fin1.position.z = -15;
    this.rocketGroup.add(fin1);

    const fin2 = fin1.clone();
    fin2.rotation.z = Math.PI / 2;
    this.rocketGroup.add(fin2);

    // Engine Glow
    const engineGeo = new THREE.CylinderGeometry(2, 4, 5);
    const engineMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.z = -22;
    engine.rotation.x = Math.PI / 2;
    this.rocketGroup.add(engine);

    this.rocketGroup.position.z = -5000; // Start far away
    this.scene.add(this.rocketGroup);
  }

  private buildBrandingSprites() {
    // Create "DATA VISTA" Sprite - High Resolution for Clarity
    const canvas = document.createElement('canvas');
    canvas.width = 2048; // High Res
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 220px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Sharp Glow
    ctx.shadowColor = '#6366f1';
    ctx.shadowBlur = 10;
    ctx.fillText('DATA VISTA', 1024, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter; // Sharper
    texture.magFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0 });
    this.textSprite = new THREE.Sprite(material);
    this.textSprite.scale.set(600, 150, 1);
    this.textSprite.position.set(0, 50, 0);
    this.textSprite.renderOrder = 10;
    this.scene.add(this.textSprite);

    // RGB Split Sprites
    const matR = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0, color: 0xff0000, blending: THREE.AdditiveBlending });
    this.textSpriteR = new THREE.Sprite(matR);
    this.textSpriteR.scale.copy(this.textSprite.scale);
    this.textSpriteR.position.copy(this.textSprite.position);
    this.scene.add(this.textSpriteR);

    const matB = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0, color: 0x00ffff, blending: THREE.AdditiveBlending });
    this.textSpriteB = new THREE.Sprite(matB);
    this.textSpriteB.scale.copy(this.textSprite.scale);
    this.textSpriteB.position.copy(this.textSprite.position);
    this.scene.add(this.textSpriteB);

    // Subtext
    const subCanvas = document.createElement('canvas');
    subCanvas.width = 1024;
    subCanvas.height = 128;
    const sCtx = subCanvas.getContext('2d')!;
    sCtx.fillStyle = '#a5b4fc';
    sCtx.font = 'bold 36px Inter, Arial';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText('Premium Tech CRM | Future-Ready Solutions', 512, 64);

    const subTexture = new THREE.CanvasTexture(subCanvas);
    const subMaterial = new THREE.SpriteMaterial({ map: subTexture, transparent: true, opacity: 0 });
    this.subTextSprite = new THREE.Sprite(subMaterial);
    this.subTextSprite.scale.set(800, 100, 1);
    this.subTextSprite.position.set(0, -60, 0);
    this.scene.add(this.subTextSprite);
  }

  private animate = () => {
    this.requestRef = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Snappy Rocket Arrival (0s to 1s)
    if (elapsed < 1.0) {
        const t = elapsed / 1.0;
        this.rocketGroup.position.z = -5000 + (5000 * t);
        this.rocketGroup.rotation.z += delta * 15; // Ultra-speed spin
    } else {
        // Rocket flies past camera 
        this.rocketGroup.position.z += delta * 8000;
        this.rocketGroup.scale.multiplyScalar(0.9); 
        
        // Fast energy blast
        if (elapsed < 2.0) {
            this.energyBlast.scale.addScalar(delta * 60);
            (this.energyBlast.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - (elapsed - 1.0) * 1.5);
        }
    }

    // Precise 6s Dolly-in Camera movement (3000 -> 600)
    // Slower zoom to keep branding stable
    const totalDuration = 6.0;
    const progress = Math.min(1, elapsed / totalDuration);
    this.camera.position.z = 3000 - (2400 * Math.pow(progress, 0.8)); // Power curve for deceleration
    this.camera.lookAt(0, 0, 0);

    // Rotate Plexus & HUD
    this.plexusPoints.rotation.y += delta * 0.15;
    this.plexusPoints.rotation.x += delta * 0.08;
    this.plexusLines.rotation.copy(this.plexusPoints.rotation);
    
    this.hudWidgets.forEach(w => {
        w.rotation.y += delta * 0.2;
        w.material.opacity = 0.4 + Math.sin(elapsed * 2) * 0.2;
    });
    
    // High-density stream movement
    const streamPos = this.streams.geometry.attributes['position'].array as Float32Array;
    for (let i = 0; i < streamPos.length; i += 3) {
      streamPos[i + 2] += delta * 1500; // Super Warp
      if (streamPos[i + 2] > 2000) streamPos[i + 2] = -4000;
    }
    this.streams.geometry.attributes['position'].needsUpdate = true;

    // Move Streams towards center
    const positions = this.streams.geometry.attributes['position'].array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 2] += delta * 800; // Speed forward
      if (positions[i + 2] > 1000) {
        positions[i + 2] = -3000; // Reset to back
      }
    }
    this.streams.geometry.attributes['position'].needsUpdate = true;

    // Branding Reveal logic
    if (this.textVisible) {
        const targetOp = this.textFading ? 0 : 1;
        this.textSprite.material.opacity = THREE.MathUtils.lerp(this.textSprite.material.opacity, targetOp, 0.1);
        this.subTextSprite.material.opacity = THREE.MathUtils.lerp(this.subTextSprite.material.opacity, targetOp * 0.8, 0.1);

        // Precise Glitch (Less frequent for clarity)
        if (Math.random() > 0.95 && !this.textFading) {
            const jitter = (Math.random() - 0.5) * 10;
            const split = Math.random() * 15;
            
            this.textSprite.position.x = jitter;
            this.textSpriteR.position.x = jitter - split;
            this.textSpriteB.position.x = jitter + split;
            
            this.textSpriteR.material.opacity = 0.4;
            this.textSpriteB.material.opacity = 0.4;
        } else {
            this.textSprite.position.x = 0;
            this.textSpriteR.position.x = 0;
            this.textSpriteB.position.x = 0;
            this.textSpriteR.material.opacity = 0;
            this.textSpriteB.material.opacity = 0;
        }

        // Maintain Scale - No shrinking during solid phase
        const scaleVal = this.textFading ? 400 : 600;
        this.textSprite.scale.x = THREE.MathUtils.lerp(this.textSprite.scale.x, scaleVal, 0.1);
        this.textSprite.scale.y = THREE.MathUtils.lerp(this.textSprite.scale.y, scaleVal/4, 0.1);
        this.textSpriteR.scale.copy(this.textSprite.scale);
        this.textSpriteB.scale.copy(this.textSprite.scale);
    }



    this.renderer.render(this.scene, this.camera);
  };

  ngOnDestroy() {
    if (this.requestRef) cancelAnimationFrame(this.requestRef);
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
  }
}
