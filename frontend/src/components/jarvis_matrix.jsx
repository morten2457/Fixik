import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Effects } from '@react-three/drei';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';

extend({ UnrealBloomPass });

const ParticleSwarm = () => {
  const meshRef = useRef();
  const count = 20000;
  const speedMult = 1;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pColor = useMemo(() => new THREE.Color(), []);
  const color = pColor; // Alias for user code compatibility
  
  const positions = useMemo(() => {
     const pos = [];
     for(let i=0; i<count; i++) pos.push(new THREE.Vector3((Math.random()-0.5)*100, (Math.random()-0.5)*100, (Math.random()-0.5)*100));
     return pos;
  }, []);

  // Material & Geom
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff }), []);
  const geometry = useMemo(() => new THREE.TetrahedronGeometry(0.25), []);

  const PARAMS = useMemo(() => ({"radius":90,"activity":4,"complexity":24,"shellWidth":5}), []);
  const addControl = (id, l, min, max, val) => {
      return PARAMS[id] !== undefined ? PARAMS[id] : val;
  };
  const setInfo = () => {};
  const annotate = () => {};

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime() * speedMult;
    const THREE_LIB = THREE;

    if(material.uniforms && material.uniforms.uTime) {
         material.uniforms.uTime.value = time;
    }

    for (let i = 0; i < count; i++) {
        // USER CODE START
        const radius = addControl("radius", "Core Radius", 50, 150, 90);
        const activity = addControl("activity", "Neural Activity", 0.5, 10.0, 4.0);
        const complexity = addControl("complexity", "Data Density", 1, 50, 24);
        const shellWidth = addControl("shellWidth", "Shell Depth", 1, 20, 5);
        
        if (i === 0) {
            setInfo("J.A.R.V.I.S. Neural Matrix", "Advanced natural language UI and tactical processing core.");
            annotate("origin", new THREE.Vector3(0, 0, 0), "Neural Singularity");
        }
        
        const n = i / count;
        const phi = Math.acos(1.0 - 2.0 * n);
        const theta = Math.sqrt(count * Math.PI) * phi;
        
        const pulse = Math.sin(time * 2.5) * 2.0;
        const dataFlow = Math.sin(theta * complexity + time * activity);
        const neuralSpike = Math.pow(Math.abs(Math.sin(phi * 10.0 + time * 0.5)), 10.0) * 15.0;
        
        const r = radius + pulse + (dataFlow * shellWidth) + neuralSpike;
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        
        target.set(x, y, z);
        
        const isSpike = neuralSpike > 5.0;
        const baseHue = 0.08; 
        const hueVariation = dataFlow * 0.02;
        const finalHue = baseHue + hueVariation + (isSpike ? 0.02 : 0);
        
        const saturation = 0.9 + (0.1 * dataFlow);
        const brightness = isSpike ? 0.9 : (0.5 + 0.3 * dataFlow);
        
        color.setHSL(finalHue, saturation, brightness);
        // USER CODE END

        positions[i].lerp(target, 0.1);
        dummy.position.copy(positions[i]);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, pColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
};

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas camera={{ position: [0, 0, 100], fov: 60 }}>
        <fog attach="fog" args={['#000000', 0.01]} />
        <ParticleSwarm />
        <OrbitControls autoRotate={true} />
        <Effects disableGamma>
            <unrealBloomPass threshold={0} strength={1.8} radius={0.4} />
        </Effects>
      </Canvas>
    </div>
  );
}