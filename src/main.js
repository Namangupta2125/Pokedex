import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as CANNON from "cannon-es";
import gsap from "gsap";
import * as Yuka from "yuka";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import * as dat from "dat.gui";
import { convertColorSpace } from "three/tsl";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";

// Character Database
const characterDatabase = {
  "Pokemon_Pikachu": {
    name: "Pikachu",
    type: "Pokémon",
    species: "Electric Mouse",
    power: "Thunder Shock",
    element: "Electric",
    rarity: "Common",
    habitat: "Forests"
  },
  "Pokemon_Charmander": {
    name: "Charmander",
    type: "Pokémon", 
    species: "Fire Lizard",
    power: "Ember",
    element: "Fire",
    rarity: "Starter",
    habitat: "Mountains"
  },
  "Pokemon_Electrode": {
    name: "Electrode",
    type: "Pokémon",
    species: "Ball Pokémon",
    power: "Self-Destruct",
    element: "Electric",
    rarity: "Uncommon",
    habitat: "Power Plants"
  },
  "Pokemon_Balbasaur": {
    name: "Bulbasaur",
    type: "Pokémon",
    species: "Seed Pokémon", 
    power: "Vine Whip",
    element: "Grass/Poison",
    rarity: "Starter",
    habitat: "Grasslands"
  },
  "Pokemon_Squirtle": {
    name: "Squirtle",
    type: "Pokémon",
    species: "Tiny Turtle",
    power: "Water Gun",
    element: "Water",
    rarity: "Starter", 
    habitat: "Lakes"
  },
  "Pokemon_Giglipuff": {
    name: "Jigglypuff",
    type: "Pokémon",
    species: "Balloon Pokémon",
    power: "Sing",
    element: "Normal/Fairy",
    rarity: "Common",
    habitat: "Meadows"
  },
  "Pokemon_Pritish": {
    name: "Pritish",
    type: "Human",
    species: "Trainer",
    power: "Brain Power",
    element: "Psychic",
    rarity: "Legendary",
    habitat: "Research Labs"
  },
  "Pokemon_Priyank": {
    name: "Priyank", 
    type: "Human",
    species: "Trainer",
    power: "Brain Power",
    element: "Strategic",
    rarity: "Legendary",
    habitat: "Battle Arenas"
  },
  "Pokemon_Ansh": {
    name: "Ansh",
    type: "Human",
    species: "Trainer", 
    power: "Brain Power",
    element: "Analytical",
    rarity: "Legendary",
    habitat: "Tech Centers"
  },
  "Pokemon_Lakshya": {
    name: "Lakshya",
    type: "Human",
    species: "Trainer",
    power: "Brain Power", 
    element: "Creative",
    rarity: "Legendary",
    habitat: "Art Studios"
  },
  "Pokemon_Play_Glalie": {
    name: "Glalie",
    type: "Pokémon",
    species: "Face Pokémon",
    power: "Ice Beam",
    element: "Ice",
    rarity: "Rare",
    habitat: "Frozen Caves"
  },
  "Pokemon_Play_Magnemite": {
    name: "Magnemite",
    type: "Pokémon",
    species: "Magnet Pokémon", 
    power: "Magnet Bomb",
    element: "Electric/Steel",
    rarity: "Common",
    habitat: "Power Plants"
  }
};

// Loading Management
let loadedModels = 0;
const totalModels = 13;
const loadingScreen = document.getElementById('loading-screen');
const loadingProgress = document.getElementById('loading-progress');

function updateLoadingProgress() {
  loadedModels++;
  const progress = Math.round((loadedModels / totalModels) * 100);
  loadingProgress.textContent = `${progress}%`;
  
  if (loadedModels >= totalModels) {
    setTimeout(() => {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }, 500);
  }
}

// Info Button Functionality
const infoButton = document.getElementById('info-button');
const controlsInfo = document.getElementById('controls-info');
let isControlsVisible = false;

infoButton.addEventListener('click', () => {
  isControlsVisible = !isControlsVisible;
  controlsInfo.style.display = isControlsVisible ? 'block' : 'none';
});

// Character Modal Functionality
const characterModal = document.getElementById('character-modal');
const characterName = document.getElementById('character-name');
const characterInfo = document.getElementById('character-info');
const closeModal = document.getElementById('close-modal');
let modalTimeout;

function showCharacterInfo(characterKey) {
  const character = characterDatabase[characterKey];
  if (!character) return;

  characterName.textContent = character.name;
  
  characterInfo.innerHTML = `
    <div class="info-item">
      <span class="info-label">Type:</span>
      <span class="info-value">${character.type}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Species:</span>
      <span class="info-value">${character.species}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Power:</span>
      <span class="info-value">${character.power}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Element:</span>
      <span class="info-value">${character.element}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Rarity:</span>
      <span class="info-value">${character.rarity}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Habitat:</span>
      <span class="info-value">${character.habitat}</span>
    </div>
  `;

  characterModal.style.display = 'flex';
  
  // Clear existing timeout
  if (modalTimeout) {
    clearTimeout(modalTimeout);
  }
  
  // Auto-close after 5 seconds
  modalTimeout = setTimeout(() => {
    hideCharacterInfo();
  }, 5000);
}

function hideCharacterInfo() {
  characterModal.style.display = 'none';
  if (modalTimeout) {
    clearTimeout(modalTimeout);
    modalTimeout = null;
  }
}

closeModal.addEventListener('click', hideCharacterInfo);
characterModal.addEventListener('click', (e) => {
  if (e.target === characterModal) {
    hideCharacterInfo();
  }
});

const clock = new THREE.Clock();

//--------------------Main------------------//
let labelShow = false;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.innerWidth / window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMappingExposure = 1.3;

const scene = new THREE.Scene();

const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(-30, 70, 20);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.bias = -0.0005;
scene.add(directionalLight);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);
scene.add(camera);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableRotate = false;

//--------------------Main  ENDS ------------------//

let girl;
const loader = new GLTFLoader();

// Camera follow settings
let orbitAngle = 0;
const orbitRadius = 25;
const orbitHeight = 13;
let isMoving = false;
let moveDirection = new THREE.Vector3();

const cameraFollowPivot = new THREE.Object3D();
scene.add(cameraFollowPivot);

// loading scene
loader.load("./Pokedex_Ground.glb", (gltf) => {
  const model = gltf.scene;
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  girl = model.getObjectByName("Girl");

  if (girl) {
    cameraFollowPivot.position.copy(girl.position);

    const targetPos = new THREE.Vector3();
    girl.getWorldPosition(targetPos);
    const offset = new THREE.Vector3(15, 13, 25);
    camera.position.copy(targetPos.clone().add(offset));
    camera.lookAt(targetPos);

    controls.target.copy(targetPos);
    controls.minPolarAngle = controls.maxPolarAngle =
      THREE.MathUtils.degToRad(55);
    updateCameraPosition(true);
  }

  scene.add(model);
  updateLoadingProgress();
});

// Control movement around girl
controls.enableZoom = false;

window.addEventListener("keydown", (e) => {
  if (!girl) return;

  if (e.code === "KeyA") {
    orbitAngle -= Math.PI / 6;
    updateCameraPosition(true);
  } else if (e.code === "KeyD") {
    orbitAngle += Math.PI / 6;
    updateCameraPosition(true);
  }
});

// Function to update camera position based on orbit angle
function updateCameraPosition(withAnimation = false) {
  if (!girl) return;

  const center = new THREE.Vector3();
  girl.getWorldPosition(center);

  const newX = center.x + orbitRadius * Math.cos(orbitAngle);
  const newZ = center.z + orbitRadius * Math.sin(orbitAngle);
  const newY = center.y + orbitHeight;

  if (withAnimation) {
    gsap.to(camera.position, {
      x: newX,
      y: newY,
      z: newZ,
      duration: 0.8,
      ease: "power2.out",
      onUpdate: () => {
        camera.lookAt(center);
        controls.target.copy(center);
      },
    });
  } else {
    camera.position.set(newX, newY, newZ);
    camera.lookAt(center);
    controls.target.copy(center);
  }
}

const stepSize = 2;
const moveDuration = 0.4;
let currentAnimation = null;

const keysPressed = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
};

window.addEventListener("keydown", (event) => {
  if (
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.code)
  ) {
    keysPressed[event.code] = true;
    updateMovement();
  }
});

window.addEventListener("keyup", (event) => {
  if (
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.code)
  ) {
    keysPressed[event.code] = false;
    updateMovement();
  }
});

function updateMovement() {
  if (!girl) return;

  moveDirection.set(0, 0, 0);

  if (keysPressed.ArrowLeft) moveDirection.z += 1;
  if (keysPressed.ArrowRight) moveDirection.z -= 1;
  if (keysPressed.ArrowUp) moveDirection.x -= 1;
  if (keysPressed.ArrowDown) moveDirection.x += 1;

  if (moveDirection.length() > 0) {
    moveDirection.normalize();
    isMoving = true;

    if (girl) {
      if (keysPressed.ArrowRight) {
        girl.rotation.y = Math.PI;
      } else if (keysPressed.ArrowLeft) {
        girl.rotation.y = 0;
      } else if (keysPressed.ArrowUp) {
        girl.rotation.y = -Math.PI / 2;
      } else if (keysPressed.ArrowDown) {
        girl.rotation.y = Math.PI / 2;
      }

      if (keysPressed.ArrowRight && keysPressed.ArrowUp) {
        girl.rotation.y = (-Math.PI * 3) / 4;
      } else if (keysPressed.ArrowRight && keysPressed.ArrowDown) {
        girl.rotation.y = (Math.PI * 3) / 4;
      } else if (keysPressed.ArrowLeft && keysPressed.ArrowUp) {
        girl.rotation.y = -Math.PI / 4;
      } else if (keysPressed.ArrowLeft && keysPressed.ArrowDown) {
        girl.rotation.y = Math.PI / 4;
      }
    }
  } else {
    isMoving = false;
  }
}

function updateCharacterAndCamera(delta) {
  if (!girl) return;

  if (isMoving) {
    const moveStep = stepSize * delta * 4;
    const targetPosition = girl.position
      .clone()
      .add(moveDirection.clone().multiplyScalar(moveStep));

    girl.position.copy(targetPosition);

    cameraFollowPivot.position.lerp(girl.position, 0.1);
  } else {
    cameraFollowPivot.position.lerp(girl.position, 0.1);
  }

  updateCameraPositionWithPivot();
}

function updateCameraPositionWithPivot() {
  const center = cameraFollowPivot.position.clone();

  const newX = center.x + orbitRadius * Math.cos(orbitAngle);
  const newZ = center.z + orbitRadius * Math.sin(orbitAngle);
  const newY = center.y + orbitHeight;

  camera.position.lerp(new THREE.Vector3(newX, newY, newZ), 0.1);
  camera.lookAt(center);
  controls.target.copy(center);
}

// mixer setter
const clickableMeshes = [];
const setMixersAndAction = (mixers, gltf, name) => {
  clickableMeshes.push(gltf.scene);
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      clickableMeshes.push(child);
    }
  });
  const mixer = new THREE.AnimationMixer(gltf.scene);
  const action = mixer.clipAction(gltf.animations[0]);
  mixers[name] = {
    mixer: mixer,
    action: action,
  };
};

const mixers = {};
const labels = {};
const sounds = {};

//audio loading
const listener = new THREE.AudioListener();
camera.add(listener);

// label renderer
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0px";
labelRenderer.domElement.style.pointerEvents = "none";
document.body.appendChild(labelRenderer.domElement);

//loading pokemons
loader.load("./Pokemons/Pokemon_Pikachu.glb", (gltf) => {
  setMixersAndAction(mixers, gltf, "Pokemon_Pikachu");
  const sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("PokemonSounds/Pokemon_Pikachu.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setVolume(0.5);
    sounds["Pokemon_Pikachu"] = sound;
  });

  scene.add(gltf.scene);
  updateLoadingProgress();
});

loader.load("./Pokemons/Pokemon_Charmander.glb", (gltf) => {
  setMixersAndAction(mixers, gltf, "Pokemon_Charmander");
  const sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("PokemonSounds/Pokemon_Charmander.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setVolume(0.5);
    sounds["Pokemon_Charmander"] = sound;
  });
  scene.add(gltf.scene);
  updateLoadingProgress();
});

loader.load("./Pokemons/Pokemon_Electrode.glb", (gltf) => {
  setMixersAndAction(mixers, gltf, "Pokemon_Electrode");
  const sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("PokemonSounds/Pokemon_Electrode.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setVolume(0.5);
    sounds["Pokemon_Electrode"] = sound;
  });
  scene.add(gltf.scene);
  updateLoadingProgress();
});

loader.load("./Pokemons/Pokemon_Balbasaur.glb", (gltf) => {
  setMixersAndAction(mixers, gltf, "Pokemon_Balbasaur");
  const sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("PokemonSounds/Pokemon_Balbasaur.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setVolume(0.5);
    sounds["Pokemon_Balbasaur"] = sound;
  });
  scene.add(gltf.scene);
  updateLoadingProgress();
});

loader.load("./Pokemons/Pokemon_Squirtle.glb", (gltf) => {
  setMixersAndAction(mixers, gltf, "Pokemon_Squirtle");
  const sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("PokemonSounds/Pokemon_Squirtle.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setVolume(0.5);
    sounds["Pokemon_Squirtle"] = sound;
  });
  scene.add(gltf.scene);
  updateLoadingProgress();
});

loader.load("./Pokemons/Pokemon_Giglipuff.glb", (gltf) => {
  setMixersAndAction(mixers, gltf, "Pokemon_Giglipuff");
  const sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("PokemonSounds/Pokemon_Giglipuff.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setVolume(0.5);
    sounds["Pokemon_Giglipuff"] = sound;
  });
  scene.add(gltf.scene);
  updateLoadingProgress();
});

loader.load("./Pokemons/Pokemon_Pritish.glb", (gltf) => {
  clickableMeshes.push(gltf.scene);
  const sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("PokemonSounds/Pokemon_Pritish.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setVolume(0.5);
    sounds["Pokemon_Pritish"] = sound;
  });
  scene.add(gltf.scene);
  updateLoadingProgress();
});

loader.load("./Pokemons/Pokemon_Priyank.glb", (gltf) => {
  clickableMeshes.push(gltf.scene);
  const sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("PokemonSounds/Pokemon_Priyank.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setVolume(0.5);
    sounds["Pokemon_Priyank"] = sound;
  });
  scene.add(gltf.scene);
  updateLoadingProgress();
});

loader.load("./Pokemons/Pokemon_Ansh.glb", (gltf) => {
  clickableMeshes.push(gltf.scene);
  const sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("PokemonSounds/Pokemon_Ansh.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setVolume(0.5);
    sounds["Pokemon_Ansh"] = sound;
  });
  scene.add(gltf.scene);
  updateLoadingProgress();
});

loader.load("./Pokemons/Pokemon_Lakshya.glb", (gltf) => {
  clickableMeshes.push(gltf.scene);
  const sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("PokemonSounds/Pokemon_Lakshya.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setVolume(0.5);
    sounds["Pokemon_Lakshya"] = sound;
  });
  scene.add(gltf.scene);
  updateLoadingProgress();
});

loader.load("./Pokemons/Pokemon_Play_Glalie.glb", (gltf) => {
  setMixersAndAction(mixers, gltf, "Pokemon_Play_Glalie");
  // sound
  const sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("PokemonSounds/Pokemon_Play_Glalie.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setVolume(0.5);
    sounds["Pokemon_Play_Glalie"] = sound;
  });

  //animations
  const action = mixers["Pokemon_Play_Glalie"].action;
  action.play();
  action.setLoop(THREE.LoopRepeat);
  scene.add(gltf.scene);
  updateLoadingProgress();
});

loader.load("./Pokemons/Pokemon_Play_Magnemite.glb", (gltf) => {
  setMixersAndAction(mixers, gltf, "Pokemon_Play_Magnemite");
  //sound
  const sound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load(
    "PokemonSounds/Pokemon_Play_Magnemite.mp3",
    function (buffer) {
      sound.setBuffer(buffer);
      sound.setVolume(0.5);
      sounds["Pokemon_Play_Magnemite"] = sound;
    }
  );
  //animation
  const action = mixers["Pokemon_Play_Magnemite"].action;
  action.play();
  action.setLoop(THREE.LoopRepeat);
  scene.add(gltf.scene);
  updateLoadingProgress();
});

// raycaster on click method
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const onMouseClick = (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableMeshes);

  if (intersects.length > 0) {
    const parent = intersects[0].object.parent;
    const name = parent.name;

    if (!name.startsWith("Pokemon_Play")) {
      const action = mixers[name]?.action;
      if (action) {
        action.stop();
        action.setLoop(THREE.LoopOnce);
        action.play();
      }
    }

    // Play sound
    if (sounds[name]) {
      sounds[name].play();
    }

    showCharacterInfo(name);

    if (!labelShow) {
      labelShow = true;
      const div = document.createElement("div");
      div.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
      div.style.padding = "4px 8px";
      div.style.borderRadius = "8px";
      div.style.color = "#fff";
      div.style.fontSize = "12px";
      div.style.fontFamily = "Arial, sans-serif";
      div.style.display = "flex";
      div.style.alignItems = "center";
      div.style.gap = "4px";
      div.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";

      const span = document.createElement("span");
      span.textContent = characterDatabase[name]?.name || name;

      const img = document.createElement("img");
      img.src = "./infoicon.svg";
      img.width = 16;
      img.height = 16;
      img.style.cursor = "pointer";
      img.setAttribute("data-character", name); 

      div.appendChild(span);
      div.appendChild(img);

      const label = new CSS2DObject(div);
      const worldPos = new THREE.Vector3();
      parent.getWorldPosition(worldPos);
      label.position.copy(worldPos.add(new THREE.Vector3(0, 4, 0)));

      // Make the label clickable
      label.element.style.pointerEvents = "auto";

      scene.add(label);

      setTimeout(() => {
        scene.remove(label);
        labelShow = false;
      }, 2000);
    }
  }
};

window.addEventListener("click", onMouseClick, false);

const onInfoIconClick = (event) => {
  if (event.target.src && event.target.src.includes("infoicon.svg")) {
    event.stopPropagation();

    const labelDiv = event.target.parentElement;
    const characterNameSpan = labelDiv.querySelector("span");
    const characterName = characterNameSpan.textContent;

    const characterKey = Object.keys(characterDatabase).find(
      (key) => characterDatabase[key].name === characterName
    );

    if (characterKey) {
      showCharacterInfo(characterKey);
    }
  }
};

document.addEventListener("click", onInfoIconClick, false);

//----------------FOOTER----------------------//

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.innerWidth / window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  camera.updateProjectionMatrix();
});

const animate = () => {
  const delta = clock.getDelta();
  for (const key in mixers) {
    mixers[key].mixer.update(delta);
  }
  updateCharacterAndCamera(delta);
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
};

renderer.setAnimationLoop(animate);
