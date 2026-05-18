let audioCtx;
let keys = { w:0, a:0, s:0, d:0, q:0, e:0 };
let speed = 0;
let carAngle = 0;
let carX = 2000, carY = 3200; // Centered position on map coordinates
let steerWheelAngle = 0;
let activeVehicle = '';
let currentViewMode = 'driving'; // Modes: 'driving' or 'walking'

// Complex Track Architecture Arrays (Curves, Shifts, Crossroads)
let trackGrid = [
    { x: 1850, y: 1000, w: 300, h: 2500, type: 'straight-highway' }, // Main vertical strip
    { x: 1000, y: 1850, w: 2000, h: 300, type: 'cross-junction' },  // Lateral twisting street intersection
    { x: 1000, y: 1000, w: 300, h: 1000, type: 'left-loop' }        // Parallel secondary route side street
];

let urbanBlocks = [
    { x: 1600, y: 1400, w: 120, h: 120, z: 240, icon: '🏢' },
    { x: 2200, y: 1400, w: 140, h: 140, z: 300, icon: '🏢' },
    { x: 1550, y: 2300, w: 110, h: 110, z: 180, icon: '🏠' },
    { x: 2250, y: 2300, w: 130, h: 130, z: 260, icon: '🏨' }
];

let trafficUnits = [
    { x: 1950, y: 1200, speed: 4, w: 45, l: 85, color: '#e91e63' },
    { x: 2020, y: 2400, speed: -3, w: 45, l: 85, color: '#009688' }
];

let walkers = [
    { x: 1800, y: 1950, dx: 2, dy: 0, state: 'normal', rot: 0 },
    { x: 2100, y: 2000, dx: 0, dy: 1.5, state: 'normal', rot: 0 }
];

let radioStations = ["98.2 CRASH FM", "ROAD RAGE RADIO", "SYNTHWAVE DRIVE", "ENGINE ASMR"];
let currentStationIdx = 0;

window.selectVehicle = function(type) {
    activeVehicle = type;
    document.getElementById('menu-view').style.display = 'none';
    document.getElementById('game-viewport').style.display = 'block';
    
    // Unify unique HUD layout values configuration metrics
    document.getElementById('gauge-type').innerText = type.toUpperCase();
    adjustVehicleProperties(type);
    
    // Bind device audio and context systems listener loops
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    document.getElementById('radio-display').innerText = radioStations[currentStationIdx];

    window.addEventListener('keydown', (e) => processInputs(e, true));
    window.addEventListener('keyup', (e) => processInputs(e, false));
    
    build3DWorldElements();
    requestAnimationFrame(engineFrameUpdate);
};

function adjustVehicleProperties(type) {
    let internalChassis = document.getElementById('cockpit-frame');
    if (type === 'Motorcycle') {
        internalChassis.style.paddingLeft = "42%"; // Centers handlebars realistically
        document.getElementById('gauge-type').innerText = "BIKE";
    } else if (type === 'Lorry' || type === 'Bus') {
        internalChassis.style.paddingLeft = "5%"; // Set wider cabin offset perspective
    } else {
        internalChassis.style.paddingLeft = "12%";
    }
}

function processInputs(e, isPressed) {
    const bit = isPressed ? 1 : 0;
    if (e.key === 'w' || e.key === 'ArrowUp') keys.w = bit;
    if (e.key === 's' || e.key === 'ArrowDown') keys.s = bit;
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = bit;
    if (e.key === 'd' || e.key === 'ArrowRight') keys.d = bit;

    if (isPressed && currentViewMode === 'driving') {
        if (e.key === 'r' || e.key === 'R') {
            currentStationIdx = (currentStationIdx + 1) % radioStations.length;
            document.getElementById('radio-display').innerText = radioStations[currentStationIdx];
            triggerAudioTone(440, 0.05);
        }
    }
}

window.exitVehicleToggle = function() {
    let btn = document.getElementById('exit-car-btn');
    let footLayer = document.getElementById('foot-view');
    let cabin = document.getElementById('cockpit-frame');
    
    if (currentViewMode === 'driving') {
        currentViewMode = 'walking';
        btn.innerText = "Enter Vehicle";
        btn.style.background = "#4caf50";
        footLayer.style.display = "block";
        cabin.style.transform = "translateY(100%)"; // Smoothly lowers dash frame away
        speed = 0;
    } else {
        currentViewMode = 'driving';
        btn.innerText = "Leave Vehicle";
        btn.style.background = "#e91e63";
        footLayer.style.display = "none";
        cabin.style.transform = "translateY(0)";
    }
    triggerAudioTone(520, 0.08);
};

function triggerAudioTone(freq, duration) {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration - 0.01);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}

function build3DWorldElements() {
    let world = document.getElementById('world-3d-scene');
    world.innerHTML = ''; // Flush previous tree nodes
    
    // Inject Multi-directional Road strips network architecture geometry
    trackGrid.forEach(r => {
        let seg = document.createElement('div');
        seg.className = 'road-segment';
        seg.style.left = `${r.x}px`;
        seg.style.top = `${r.y}px`;
        seg.style.width = `${r.w}px`;
        seg.style.height = `${r.h}px`;
        world.appendChild(seg);
    });

    // Inject Skyscraper architectural blocks
    urbanBlocks.forEach((b, idx) => {
        let box = document.createElement('div');
        box.className = 'building-3d';
        box.id = `build-${idx}`;
        box.style.left = `${b.x}px`;
        box.style.top = `${b.y}px`;
        box.style.width = `${b.w}px`;
        box.style.height = `${b.h}px`;
        box.style.lineHeight = `${b.z}px`;
        box.innerHTML = b.icon;
        world.appendChild(box);
    });

    // Inject Active Traffic Simulation nodes
    trafficUnits.forEach((t, i) => {
        let car = document.createElement('div');
        car.className = 'traffic-npc';
        car.id = `npc-${i}`;
        car.style.width = `${t.w}px`;
        car.style.height = `${t.l}px`;
        car.style.background = t.color;
        world.appendChild(car);
    });

    // Inject Mobile pedestrians
    walkers.forEach((w, i) => {
        let human = document.createElement('div');
        human.className = 'pedestrian-3d';
        human.id = `ped-${i}`;
        world.appendChild(human);
    });
}

function engineFrameUpdate() {
    // Process Motion System Physics Matrix relative to view state
    if (currentViewMode === 'driving') {
        if (keys.w) speed += 0.4;
        else if (keys.s) speed -= 0.6;
        else speed *= 0.96;
        speed = Math.max(-5, Math.min(speed, 120));

        if (keys.a) { carAngle += 0.025 * (speed/60); steerWheelAngle = Math.max(-140, steerWheelAngle - 9); }
        else if (keys.d) { carAngle -= 0.025 * (speed/60); steerWheelAngle = Math.min(140, steerWheelAngle + 9); }
        else { steerWheelAngle *= 0.8; }
    } else {
        // Character Foot Motion Controls configuration
        if (keys.w) { carX -= Math.sin(carAngle) * 3; carY -= Math.cos(carAngle) * 3; }
        if (keys.s) { carX += Math.sin(carAngle) * 3; carY += Math.cos(carAngle) * 3; }
        if (keys.a) carAngle += 0.04;
        if (keys.d) carAngle -= 0.04;
        speed = 0;
    }

    // Step driving translation position vectors tracking curves accurately
    carY -= Math.cos(carAngle) * (speed * 0.15);
    carX -= Math.sin(carAngle) * (speed * 0.15);

    // Apply dashboard structural updates
    document.getElementById('physical-wheel').style.transform = `rotate(${steerWheelAngle}deg)`;
    document.getElementById('gauge-speed').innerText = Math.round(Math.abs(speed));

    // Update World Transformation Layer perspective
    let viewHeightOffset = currentViewMode === 'walking' ? -130 : -180;
    let lookPitchRotation = currentViewMode === 'walking' ? 82 : 72;
    
    document.getElementById('world-container').style.transform = `rotateX(${lookPitchRotation}deg) rotateZ(${carAngle}rad) translateX(${-carX}px) translateY(${-carY}px) translateZ(${viewHeightOffset}px)`;

    // Process Traffic Loop Calculations
    trafficUnits.forEach((t, i) => {
        t.y += t.speed;
        if (t.y > 3500) t.y = 1000;
        if (t.y < 1000) t.y = 3500;

        let el = document.getElementById(`npc-${i}`);
        if(el) {
            el.style.left = `${t.x}px`;
            el.style.top = `${t.y}px`;
        }

        // Test spatial radius coordinates for safe cutoffs proximity honking alert checks
        let distance = Math.hypot(carX - t.x, carY - t.y);
        if (distance < 130 && currentViewMode === 'driving' && Math.random() < 0.02) {
            triggerAudioTone(380, 0.2); // Proximity Alert horn audio snap
        }
    });

    // Process Walker AI and collision dynamics
    walkers.forEach((w, i) => {
        if (w.state === 'normal') {
            w.x += w.dx;
            w.y += w.dy;
            if (w.x > 2400 || w.x < 1600) w.dx *= -1;
            if (w.y > 2400 || w.y < 1600) w.dy *= -1;

            let hitDist = Math.hypot(carX - w.x, carY - w.y);
            if (hitDist < 45 && currentViewMode === 'driving' && Math.abs(speed) > 10) {
                w.state = 'ragdoll';
                triggerAudioTone(180, 0.4);
            }
        } else {
            w.rot += 0.25;
            w.y -= Math.cos(carAngle) * 5;
            w.x -= Math.sin(carAngle) * 5;
        }

        let el = document.getElementById(`ped-${i}`);
        if(el) {
            el.style.left = `${w.x}px`;
            el.style.top = `${w.y}px`;
            el.style.transform = `rotateX(-90deg) rotateY(${w.rot}deg)`;
        }
    });

    // Functional Rear/Side View Mirror Reflection Screen Matrix Computations
    let mirrorScrollY = (carY * 0.1) % 100;
    let mirrorScrollX = (carX * 0.1) % 100;
    document.getElementById('reflect-center').style.backgroundPosition = `${mirrorScrollX}px ${mirrorScrollY}px`;
    document.getElementById('reflect-left').style.backgroundPosition = `${mirrorScrollX + 20}px ${mirrorScrollY}px`;

    requestAnimationFrame(engineFrameUpdate);
}
