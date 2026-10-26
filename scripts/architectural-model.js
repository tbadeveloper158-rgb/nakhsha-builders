/* A true, procedural 3D architectural study. All surfaces are geometry; no tower image.
 * No private animation loop or remote textures. The site's shared ticker calls
 * setProgress(progress,pointer,time), then render(). Units are architectural study units.
 */
(() => {
  'use strict';
  window.createArchitecturalModel = async function createArchitecturalModel({ THREE, canvas, container, reducedMotion = false }) {
    if (!THREE || !canvas || !container) throw new Error('The architectural stage needs Three.js, a canvas and a container.');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0xF5F1EA, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.15 : 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = window.innerWidth >= 768;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.debug.onShaderError = () => { throw new Error('This device could not prepare the architectural materials.'); };
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-5.8, 5.8, 5.8, -5.8, .1, 70);
    const model = new THREE.Group();
    model.name = 'Nakhsha procedural commercial architecture study';
    scene.add(model);
    const resources = new Set(), materials = new Set();
    const track = geometry => { resources.add(geometry); return geometry; };
    const mat = settings => { const m = new THREE.MeshPhysicalMaterial(settings); materials.add(m); return m; };
    const stone = mat({ color: '#E8DFD0', roughness: .48, metalness: .035, clearcoat: .12, envMapIntensity: .55 });
    const edgeStone = mat({ color: '#F3ECE0', roughness: .38, metalness: .025, envMapIntensity: .5 });
    const glass = mat({ color: '#514C44', roughness: .17, metalness: .24, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: .9 });
    const lobbyGlass = mat({ color: '#766B59', roughness: .16, metalness: .23, clearcoat: 1, envMapIntensity: 1.05 });
    const bronze = mat({ color: '#8D7354', roughness: .32, metalness: .6, envMapIntensity: .6 });
    const darkBronze = mat({ color: '#77624C', roughness: .42, metalness: .38, envMapIntensity: .4 });
    const planterStone = mat({ color: '#C4B59E', roughness: .85, metalness: 0 });
    const green = mat({ color: '#58694C', roughness: .95, metalness: 0 });
    const greenLight = mat({ color: '#798A65', roughness: .95, metalness: 0 });
    const timber = mat({ color: '#897558', roughness: 1, metalness: 0 });
    const glow = mat({ color: '#C5B18D', emissive: '#C1A678', emissiveIntensity: .2, roughness: .4, metalness: .18 });
    const warmPane = mat({ color: '#B9A98F', emissive: '#9D8054', emissiveIntensity: .08, roughness: .38, metalness: .3 });

    function roundedShape(width, depth, radius) {
      const s = new THREE.Shape(), x = -width / 2, z = -depth / 2;
      const r = Math.min(radius, width / 2, depth / 2);
      s.moveTo(x + r, z); s.lineTo(x + width - r, z);
      s.quadraticCurveTo(x + width, z, x + width, z + r);
      s.lineTo(x + width, z + depth - r);
      s.quadraticCurveTo(x + width, z + depth, x + width - r, z + depth);
      s.lineTo(x + r, z + depth);
      s.quadraticCurveTo(x, z + depth, x, z + depth - r);
      s.lineTo(x, z + r); s.quadraticCurveTo(x, z, x + r, z);
      return s;
    }
    function plateGeometry(width, depth, thickness, radius, bevel = .018) {
      const geometry = new THREE.ExtrudeGeometry(roundedShape(width, depth, radius), {
        depth: thickness, steps: 1, bevelEnabled: bevel > 0,
        bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 10
      });
      geometry.rotateX(-Math.PI / 2);
      geometry.computeVertexNormals();
      return track(geometry);
    }
    function mesh(geometry, material, x, y, z, parent = model) {
      const m = new THREE.Mesh(geometry, material);
      m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
      parent.add(m); return m;
    }
    const dummy = new THREE.Object3D();
    function setMatrix(instance, index, x, y, z, sx = 1, sy = 1, sz = 1, ry = 0) {
      dummy.position.set(x, y, z); dummy.rotation.set(0, ry, 0); dummy.scale.set(sx, sy, sz); dummy.updateMatrix();
      instance.setMatrixAt(index, dummy.matrix);
    }
    function instances(geometry, material, count, name) {
      const instanced = new THREE.InstancedMesh(geometry, material, count);
      instanced.name = name; instanced.castShadow = true; instanced.receiveShadow = true;
      instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      model.add(instanced); return instanced;
    }

    // Three stepped, genuinely volumetric podium levels, with a sheltered arrival.
    mesh(plateGeometry(5.65, 3.9, .11, .46), stone, 0, .03, 0);
    mesh(plateGeometry(5.35, 3.65, .52, .42, .006), lobbyGlass, 0, .16, 0);
    mesh(plateGeometry(5.68, 3.92, .095, .46), edgeStone, 0, .69, 0);
    mesh(plateGeometry(4.83, 3.22, .47, .4, .006), lobbyGlass, -.18, .80, -.18);
    mesh(plateGeometry(5.12, 3.52, .09, .45), edgeStone, -.18, 1.28, -.18);
    mesh(plateGeometry(4.10, 2.85, .28, .38, .006), glass, -.05, 1.39, -.22);
    mesh(plateGeometry(4.40, 3.12, .085, .4), edgeStone, -.05, 1.68, -.22);
    const entry = new THREE.Group(); model.add(entry);
    mesh(track(new THREE.BoxGeometry(1.0, .54, .045)), glass, .2, .43, 1.85, entry);
    mesh(track(new THREE.BoxGeometry(1.28, .065, .72)), stone, .2, .78, 2.03, entry);
    const entryFrames = instances(track(new THREE.BoxGeometry(.028, .55, .035)), bronze, 5, 'Arrival door and glazing frames');
    [-.31, .2, .71, -1.7, 1.8].forEach((x, i) => setMatrix(entryFrames, i, x, .43, 1.88));
    const podiumColumns = instances(track(new THREE.CylinderGeometry(.047, .047, 1.02, 10)), stone, 8, 'Podium columns');
    [-2.15,-1.45,-.75,.65,1.35,2.05].forEach((x,i)=>setMatrix(podiumColumns,i,x,.67,1.65));
    setMatrix(podiumColumns,6,-2.4,.67,.5);setMatrix(podiumColumns,7,2.4,.67,.5);
    const podiumMullions = [];
    for (let x = -2.40; x <= 2.41; x += .24) { podiumMullions.push([x,.43,1.82],[x,.43,-1.82]); }
    for (let z = -1.45; z <= 1.46; z += .24) { podiumMullions.push([-2.66,.43,z],[2.66,.43,z]); }
    const podiumFrame = instances(track(new THREE.BoxGeometry(.019, .50, .022)), bronze, podiumMullions.length, 'Fine podium mullions');
    podiumMullions.forEach((p,i)=>setMatrix(podiumFrame,i,...p));

    // A compact shared geometry set creates the entire tower, not a photographic plane.
    const floors = 23, storey = .325, towerBase = 1.80, tx = .18, tz = -.17;
    const slabs = instances(plateGeometry(3.50, 2.63, .065, .51, .022), edgeStone, floors + 1, 'Ivory curved floor fins');
    const glazing = instances(plateGeometry(3.22, 2.37, .248, .43, .002), glass, floors, 'Volumetric smoked bronze glazing');
    const mullionPoints = [];
    for (let x = -1.10; x <= 1.101; x += .20) { mullionPoints.push([x,1.19], [x,-1.19]); }
    for (let z = -.75; z <= .751; z += .20) { mullionPoints.push([-1.61,z], [1.61,z]); }
    // Corner mullions follow the curve rather than cutting across the glass.
    for (let corner = 0; corner < 4; corner++) {
      const sx = corner === 0 || corner === 3 ? 1 : -1, sz = corner < 2 ? 1 : -1;
      for (let n = 1; n < 4; n++) {
        const a = n * Math.PI / 8;
        mullionPoints.push([sx*(1.18+.43*Math.cos(a)),sz*(.755+.43*Math.sin(a))]);
      }
    }
    const mullions = instances(track(new THREE.BoxGeometry(.014, .25, .017)), bronze, floors * mullionPoints.length, 'Curtain wall mullions');
    const lights = instances(track(new THREE.BoxGeometry(2.20, .009, .011)), glow, floors * 2, 'Subtle interior light ribbons');
    const panes = instances(track(new THREE.BoxGeometry(.18, .16, .006)), warmPane, floors * 3, 'Office glazing variation');
    const floorYs = [];
    let priorExplode = -1;
    function updateFloors(explode) {
      if (Math.abs(explode - priorExplode) < .0003) return;
      priorExplode = explode;
      for (let floor = 0; floor <= floors; floor++) {
        const y = towerBase + floor * storey + explode * floor / floors;
        floorYs[floor] = y;
        const setback = Math.max(0, floor - 18) * .008;
        setMatrix(slabs, floor, tx, y, tz, 1-setback, 1, 1-setback);
        if (floor === floors) continue;
        setMatrix(glazing, floor, tx, y+.071, tz, 1-setback, 1, 1-setback);
        mullionPoints.forEach(([x,z],i)=>setMatrix(mullions,floor*mullionPoints.length+i,tx+x*(1-setback),y+.197,tz+z*(1-setback)));
        setMatrix(lights,floor*2,tx,y+.289,tz+1.183*(1-setback));
        setMatrix(lights,floor*2+1,tx,y+.289,tz-1.183*(1-setback));
        for(let n=0;n<3;n++) {
          const x=-.8+n*.64+(floor%2)*.08;
          setMatrix(panes,floor*3+n,tx+x,y+.198,tz+1.19*(1-setback),1,1,1);
        }
      }
      for(const batch of [slabs,glazing,mullions,lights,panes]) { batch.instanceMatrix.needsUpdate=true; batch.computeBoundingSphere(); }
      roof.position.y=floorYs[floors]+.085;
    }

    // Roof landscape and mechanical pavilion are actual objects that can be viewed from above.
    const roof = new THREE.Group(); roof.name='Roof terrace and service pavilion';model.add(roof);
    mesh(plateGeometry(2.60,1.70,.10,.33,.01),planterStone,tx,.0,tz,roof);
    mesh(plateGeometry(.76,.64,.40,.11,.008),stone,tx-.35,.10,tz-.24,roof);
    mesh(track(new THREE.BoxGeometry(.85,.045,.72)),edgeStone,tx-.35,.53,tz-.24,roof);
    const rooftopSlats= new THREE.InstancedMesh(track(new THREE.BoxGeometry(.65,.014,.018)),bronze,7);
    roof.add(rooftopSlats);for(let i=0;i<7;i++)setMatrix(rooftopSlats,i,tx-.35,.555,tz-.48+i*.08);
    rooftopSlats.instanceMatrix.needsUpdate=true;
    const roofRail = new THREE.Group();roof.add(roofRail);
    mesh(track(new THREE.BoxGeometry(2.55,.12,.025)),bronze,tx,.15,tz+.85,roofRail);
    mesh(track(new THREE.BoxGeometry(2.55,.12,.025)),bronze,tx,.15,tz-.85,roofRail);
    mesh(track(new THREE.BoxGeometry(.025,.12,1.7)),bronze,tx-1.28,.15,tz,roofRail);
    mesh(track(new THREE.BoxGeometry(.025,.12,1.7)),bronze,tx+1.28,.15,tz,roofRail);

    const foliagePositions=[];
    for(let n=0;n<13;n++)foliagePositions.push([-2.12+n*.335,1.39,1.30,.13+(n%3)*.018]);
    for(let n=0;n<6;n++)foliagePositions.push([-2.32,.81,-1.2+n*.43,.12]);
    for(let n=0;n<6;n++)foliagePositions.push([2.07,.81,-1.2+n*.43,.12]);
    const planters=instances(track(new THREE.BoxGeometry(.30,.115,.28)),planterStone,foliagePositions.length,'Terrace planters');
    const treeTrunks=instances(track(new THREE.CylinderGeometry(.012,.015,.16,6)),timber,foliagePositions.length,'Terrace planting stems');
    const foliage=instances(track(new THREE.IcosahedronGeometry(1,1)),green,foliagePositions.length*3,'Podium terrace planting');
    foliagePositions.forEach(([x,y,z,r],i)=>{setMatrix(planters,i,x,y-.06,z);setMatrix(treeTrunks,i,x,y+.04,z);for(let n=0;n<3;n++)setMatrix(foliage,i*3+n,x+(n-1)*.065,y+.13+(n===1?.055:0),z+Math.sin(i+n)*.035,r,r*.8,r*.8)});
    const roofPlants=new THREE.InstancedMesh(track(new THREE.IcosahedronGeometry(1,1)),greenLight,12);roof.add(roofPlants);
    for(let i=0;i<12;i++)setMatrix(roofPlants,i,tx-1.02+(i%6)*.4,.21,tz+(i<6?.64:-.64),.14,.14,.12);
    roofPlants.instanceMatrix.needsUpdate=true;
    for(const batch of [entryFrames,podiumColumns,podiumFrame,planters,treeTrunks,foliage]){batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere()}
    updateFloors(0);

    // Soft contact and directional shadows keep the object seated in the cream page.
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=256;
    const sc=shadowCanvas.getContext('2d');
    if(sc){const gradient=sc.createRadialGradient(128,128,14,128,128,124);gradient.addColorStop(0,'rgba(112,87,58,.26)');gradient.addColorStop(.48,'rgba(134,107,76,.11)');gradient.addColorStop(1,'rgba(134,107,76,0)');sc.fillStyle=gradient;sc.fillRect(0,0,256,256)}
    const shadowTexture=new THREE.CanvasTexture(shadowCanvas);resources.add(shadowTexture);
    const shadowMat=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,color:'#D0BA9B'});materials.add(shadowMat);
    const shadow=mesh(track(new THREE.PlaneGeometry(10,7)),shadowMat,0,-.035,0,scene);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
    const groundMaterial=new THREE.ShadowMaterial({color:'#8D7657',opacity:.075});materials.add(groundMaterial);
    const ground=mesh(track(new THREE.PlaneGeometry(18,18)),groundMaterial,0,-.015,0,scene);ground.rotation.x=-Math.PI/2;ground.castShadow=false;ground.receiveShadow=true;
    const hemi=new THREE.HemisphereLight('#FFF6E9','#C6B69C',1.25);scene.add(hemi);
    const key=new THREE.DirectionalLight('#FFF8EC',2.6);key.position.set(-5,18,6);key.castShadow=renderer.shadowMap.enabled;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=12;key.shadow.camera.bottom=-3;key.shadow.camera.near=.1;key.shadow.camera.far=32;key.shadow.normalBias=.025;key.shadow.bias=-.0002;scene.add(key);
    const rim=new THREE.DirectionalLight('#E7D6BA',1.25);rim.position.set(6,8,-5);scene.add(rim);
    const fill=new THREE.DirectionalLight('#F8F1E6',.65);fill.position.set(4,4,10);scene.add(fill);
    const environment=new THREE.Scene();environment.background=new THREE.Color('#CFC4B2');
    const envResources=[];
    function lightCard(x,y,z,w,h,color,ry=0,rx=0){const g=new THREE.PlaneGeometry(w,h),m=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide});const card=new THREE.Mesh(g,m);card.position.set(x,y,z);card.rotation.set(rx,ry,0);environment.add(card);envResources.push(g,m)}
    lightCard(-7,6,2,5,14,'#FFF8ED',Math.PI/2);
    lightCard(6,7,-1,3,13,'#EAD9BA',-Math.PI/2);
    lightCard(0,13,0,15,10,'#FFF9F0',0,Math.PI/2);
    lightCard(0,5,-8,12,12,'#A29177');
    const pmrem=new THREE.PMREMGenerator(renderer);pmrem.compileCubemapShader();
    const environmentTarget=pmrem.fromScene(environment,.04,.1,50);scene.environment=environmentTarget.texture;
    envResources.forEach(r=>r.dispose());pmrem.dispose();

    const poses=[
      {turn:-.30,target:4.65,zoom:1.0,elevation:6.7,explode:0,x:0},
      {turn:.25,target:4.2,zoom:.98,elevation:5.6,explode:0,x:.12},
      {turn:.92,target:4.95,zoom:.96,elevation:7.0,explode:1.15,x:-.10},
      {turn:1.38,target:4.75,zoom:1.0,elevation:10.2,explode:0,x:0}
    ];
    const lerp=(a,b,t)=>a+(b-a)*t, smooth=t=>t*t*(3-2*t);let currentProgress=0,disposed=false;
    const target=new THREE.Vector3();
    function setProgress(p, pointer={x:0,y:0}, time=0){
      if(disposed)return;
      currentProgress=Math.min(1,Math.max(0,p||0));
      const range=currentProgress*(poses.length-1),segment=Math.min(poses.length-2,Math.floor(range)),t=smooth(range-segment),a=poses[segment],b=poses[segment+1];
      const px=reducedMotion?0:Math.min(.5,Math.max(-.5,pointer.x||0)),py=reducedMotion?0:Math.min(.5,Math.max(-.5,pointer.y||0));
      const breathe=reducedMotion?0:Math.sin(time*.00043)*.012;
      model.rotation.y=lerp(a.turn,b.turn,t)+px*.055;
      model.position.set(lerp(a.x,b.x,t),breathe,0);
      updateFloors(lerp(a.explode,b.explode,t));
      target.set(0,lerp(a.target,b.target,t)+py*.08,0);
      camera.position.set(13+px*.45,target.y+lerp(a.elevation,b.elevation,t),18);
      camera.zoom=lerp(a.zoom,b.zoom,t);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);
      // Keep the entire geometry inside the canvas at every scroll pose and aspect.
      let extent=0;const top=floorYs[floors]+.67;
      for(const x of [-2.92,2.92])for(const y of [-.04,top])for(const z of [-2.05,2.43]){const corner=new THREE.Vector3(x,y,z).applyMatrix4(model.matrixWorld).project(camera);extent=Math.max(extent,Math.abs(corner.x),Math.abs(corner.y))}
      if(extent>.965){camera.zoom*=.965/extent;camera.updateProjectionMatrix();camera.updateMatrixWorld(true)}
      canvas.dataset.pose=String(Math.min(3,Math.round(range)));
      canvas.dataset.progress=currentProgress.toFixed(4);
    }
    function resize(){if(disposed)return;const r=container.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height),aspect=w/h;renderer.setSize(w,h,false);camera.left=-5.8*aspect;camera.right=5.8*aspect;camera.top=5.8;camera.bottom=-5.8;camera.updateProjectionMatrix()}
    resize();setProgress(0);
    if(renderer.extensions.has('KHR_parallel_shader_compile'))await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);
    renderer.render(scene,camera);
    let meshCount=0,batchCount=0;model.traverse(o=>{if(o.isMesh)meshCount++;if(o.isInstancedMesh)batchCount++});
    const stats={kind:'procedural-volumetric-architecture',floors,meshObjects:meshCount,instancedBatches:batchCount,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,usesTowerImage:false};
    canvas.dataset.modelType=stats.kind;canvas.dataset.floorCount=String(floors);canvas.dataset.ready='true';canvas.dataset.drawCalls=String(stats.drawCalls);
    const featurePoints=[new THREE.Vector3(.18,4.6,1.2),new THREE.Vector3(.2,.62,1.9),new THREE.Vector3(1.7,6.4,-.17),new THREE.Vector3(.18,9.45,-.17)];
    function projectFeature(stageIndex=0){const point=featurePoints[Math.min(3,Math.max(0,stageIndex))].clone();point.applyMatrix4(model.matrixWorld);point.project(camera);return{x:(point.x+1)/2,y:(1-point.y)/2,visible:point.z>=-1&&point.z<=1&&Math.abs(point.x)<=1&&Math.abs(point.y)<=1}}
    return{resize,setProgress,render(){if(!disposed)renderer.render(scene,camera)},projectFeature,stats,dispose(){if(disposed)return;disposed=true;resources.forEach(r=>r.dispose());materials.forEach(m=>m.dispose());environmentTarget.dispose();renderer.dispose();model.clear();scene.clear()}};
  };
})();
