// input.js - Mouse raycasting, keyboard shortcuts
import * as THREE from 'three';
import { GRID } from './config.js';

const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();
const _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -GRID.TERRAIN_HEIGHT);
const _intersection = new THREE.Vector3();

export class InputManager {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.camera = camera;

    this.mouseGrid = { col: -1, row: -1 };
    this.mouseWorld = new THREE.Vector3();
    this.clicked = false;
    this.rightClicked = false;
    this.keys = {};

    // Hover highlight
    const hoverGeo = new THREE.BoxGeometry(GRID.CELL_SIZE, 0.05, GRID.CELL_SIZE);
    this.validMat = new THREE.MeshBasicMaterial({
      color: 0x44ffcc,
      transparent: true,
      opacity: 0.3,
    });
    this.invalidMat = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.3,
    });
    this.hoverMesh = new THREE.Mesh(hoverGeo, this.validMat);
    this.hoverMesh.position.y = GRID.TERRAIN_HEIGHT + 0.03;
    this.hoverMesh.visible = false;

    canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
    canvas.addEventListener('click', (e) => this._onClick(e));
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.rightClicked = true;
    });
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  _onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    _raycaster.setFromCamera(_mouse, this.camera);
    if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
      this.mouseWorld.copy(_intersection);
      this.mouseGrid.col = Math.floor(_intersection.x / GRID.CELL_SIZE);
      this.mouseGrid.row = Math.floor(_intersection.z / GRID.CELL_SIZE);
    }
  }

  _onClick(e) {
    // Don't trigger if clicking on UI elements
    if (e.target !== this.canvas) return;
    this.clicked = true;
  }

  updateHover(grid, selectedTower) {
    const { col, row } = this.mouseGrid;
    if (col < 0 || col >= grid.cols || row < 0 || row >= grid.rows) {
      this.hoverMesh.visible = false;
      return;
    }

    if (selectedTower) {
      this.hoverMesh.visible = true;
      this.hoverMesh.position.x = col * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5;
      this.hoverMesh.position.z = row * GRID.CELL_SIZE + GRID.CELL_SIZE * 0.5;

      const canPlace = grid.canPlace(col, row);
      this.hoverMesh.material = canPlace ? this.validMat : this.invalidMat;
    } else {
      this.hoverMesh.visible = false;
    }
  }

  consumeClick() {
    const was = this.clicked;
    this.clicked = false;
    return was;
  }

  consumeRightClick() {
    const was = this.rightClicked;
    this.rightClicked = false;
    return was;
  }

  isKeyDown(key) {
    return !!this.keys[key.toLowerCase()];
  }
}
