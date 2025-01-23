const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('parallax-container').appendChild(renderer.domElement);

// Audio setup
const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

camera.position.z = 3; // Riduci la distanza
camera.lookAt(0, 0, 0);

// Layer textures
const layers = [
    { path: 'img/layer5.png', shift: 0.06 },
    { path: 'img/layer4.png', shift: 0.03 },
    { path: 'img/layer3.png', shift: 0.06 },
    { path: 'img/layer2.png', shift: 0.12 },
    { 
        path: 'img/layer1.png', 
        shift: 0.10, 
        interactive: true // Layer interattivo
    },
    { path: 'img/background.jpg', shift: 0 }
];

const layerMeshes = [];

layers.forEach((layerData, index) => {
    const texture = new THREE.TextureLoader().load(layerData.path);
	const aspectRatio = 2048 / 907; // Rapporto d'aspetto delle immagini
	const height = 5; // Altezza comune per tutti i layer
	const width = height * aspectRatio; // Larghezza calcolata in base al rapporto

const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true,
        depthWrite: false // Gestione corretta della sovrapposizione
    });
    const mesh = new THREE.Mesh(geometry, material);

	mesh.position.z = -index * 0.05; // Distanza uniforme tra i layer


    if (layerData.interactive) {
        mesh.userData.interactive = true;
    }

    scene.add(mesh);
    layerMeshes.push(mesh);
});


// Mouse movement parallax
let targetMouseX = 0, targetMouseY = 0; // Posizione target
let currentMouseX = 0, currentMouseY = 0; // Posizione attuale

function onMouseMove(event) {
    targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

// Crea un canvas nascosto per leggere i pixel
const hiddenCanvas = document.createElement('canvas');
const hiddenContext = hiddenCanvas.getContext('2d');

function isPixelTransparent(layer, uv) {
    // Carica l'immagine sul canvas nascosto
    const texture = new THREE.TextureLoader().load(layer.path, (image) => {
        hiddenCanvas.width = image.image.width;
        hiddenCanvas.height = image.image.height;
        hiddenContext.drawImage(image.image, 0, 0);
    });

    // Converte le coordinate UV in coordinate del canvas
    const x = Math.floor(uv.x * hiddenCanvas.width);
    const y = Math.floor((1 - uv.y) * hiddenCanvas.height); // Inverti l'asse Y

    // Ottieni il pixel (RGBA)
    const pixel = hiddenContext.getImageData(x, y, 1, 1).data;

    // Se il canale alfa è 0, il pixel è trasparente
    return pixel[3] === 0;
}


// Click interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    intersects.forEach(intersect => {
        if (intersect.object.userData.interactive) {
            const uv = intersect.uv; // Coordinate UV del punto cliccato
            if (!isPixelTransparent(layers[4], uv)) { // Verifica trasparenza
                console.log('Oggetto cliccabile nel Layer 1');
                audioLoader.load('audio/amazzonia.wav', function(buffer) {
                    sound.setBuffer(buffer);
                    sound.setLoop(false);
                    sound.setVolume(0.5);
                    sound.play();
                });
            } else {
                console.log('Click ignorato: Pixel trasparente');
            }
        }
    });
}

window.addEventListener('mousemove', onMouseMove);
window.addEventListener('click', onMouseClick);


function animate() {
    requestAnimationFrame(animate);

    // Interpolazione per movimenti fluidi
    currentMouseX += (targetMouseX - currentMouseX) * 0.1;
    currentMouseY += (targetMouseY - currentMouseY) * 0.1;

    layerMeshes.forEach((mesh, index) => {
        const shift = layers[index].shift;
        mesh.position.x = currentMouseX * shift * 4;
        mesh.position.y = currentMouseY * shift * 4;
    });

    renderer.render(scene, camera);
}
animate();


// Responsive handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
