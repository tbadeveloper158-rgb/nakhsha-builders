/* Architectural analogue of the supplied KIMI instrument stage. No private RAF.
 * Usage: const stage=createDraftingCanvas(canvas,{dark:true});
 * stage.resize(); stage.draw(performance.now(),sectionProgress,{x,y,active:true});
 * Pointer x/y are canvas-local CSS pixels. Pass normalized:true for 0..1 values.
 */
function createDraftingCanvas(canvas, options = {}) {
  const context = canvas.getContext('2d');
  const dark = options.dark !== false;
  const cyan = '#02d2e3';
  const ink = dark ? '#f7fafb' : '#090a0b';
  const muted = dark ? '#74828a' : '#7c8a91';
  const ghost = dark ? '#1e282d' : '#dce4e8';
  let width=1440,height=900,dpr=1,scale=1,offsetX=0,offsetY=0;
  let firstVisible = null, disposed=false;
  const cache=document.createElement('canvas');
  const baked=cache.getContext('2d');
  const footprint=[[602,238],[1008,238],[1008,302],[1100,302],[1100,616],[946,616],[946,690],[602,690],[602,590],[540,590],[540,350],[602,350],[602,238]];
  const lengths=[],cumulative=[0];let total=0;
  for(let i=1;i<footprint.length;i++){const a=footprint[i-1],b=footprint[i];const len=Math.hypot(b[0]-a[0],b[1]-a[1]);lengths.push(len);total+=len;cumulative.push(total)}
  const stops=[{fraction:0,label:'01 / BRIEF',x:602,y:238,dx:-18,dy:-20,align:'right'}, {fraction:.25,label:'02 / DESIGN',x:1100,y:354,dx:18,dy:0,align:'left'}, {fraction:.52,label:'03 / BUILD',x:946,y:690,dx:18,dy:28,align:'left'}, {fraction:.80,label:'04 / DELIVER',x:540,y:454,dx:-18,dy:0,align:'right'}];
  const rooms=[{x:624,y:264,w:160,h:132,label:'WORKSPACE 01'},{x:804,y:264,w:180,h:132,label:'WORKSPACE 02'},{x:624,y:506,w:158,h:156,label:'WORKSPACE 03'},{x:804,y:506,w:116,h:156,label:'MEETING'},{x:952,y:326,w:124,h:132,label:'STUDIO'}];
  const rand=(a,b)=>{let h=Math.imul(a,374761393)+Math.imul(b,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295};
  const path=(ctx,points)=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));};
  function text(ctx,value,x,y,color=muted,size=9,align='left') {ctx.font=`${size}px "Space Grotesk",Arial,sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(value,x,y)}
  function cross(ctx,x,y,size=6,color=muted){ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(x-size,y);ctx.lineTo(x+size,y);ctx.moveTo(x,y-size);ctx.lineTo(x,y+size);ctx.stroke()}
  function furniture(ctx){
    ctx.strokeStyle=dark?'#334047':'#b7c6cc';ctx.lineWidth=.8;
    for(const room of rooms){
      const cols=room.w>150?3:2;
      for(let r=0;r<2;r++)for(let c=0;c<cols;c++){
        const x=room.x+22+c*42,y=room.y+35+r*42;
        ctx.strokeRect(x,y,30,17);ctx.beginPath();ctx.arc(x+15,y+22,5,0,Math.PI);ctx.stroke();
      }
    }
  }
  function bake(){
    cache.width=Math.round(width*dpr);cache.height=Math.round(height*dpr);baked.setTransform(dpr,0,0,dpr,0,0);baked.clearRect(0,0,width,height);baked.save();baked.translate(offsetX,offsetY);baked.scale(scale,scale);
    // The static halftone field is rendered only on resize; pointer highlights are separate.
    baked.fillStyle=dark?'#48565d':'#c4d0d5';
    for(let row=0;row<94;row++)for(let col=0;col<155;col++){
      const x=180+col*7.8,y=85+row*7.7;
      const nx=(x-805)/620,ny=(y-457)/410;
      const ellipse=nx*nx+ny*ny;
      if(ellipse>1.02+Math.sin(y*.018)*.11||rand(col,row)<.12)continue;
      // Soft shape keeps the stage architectural rather than geographical.
      baked.globalAlpha=(.11+rand(col+21,row+41)*.25)*(1-Math.max(0,ellipse-.6));
      baked.beginPath();baked.arc(x,y,.86,0,Math.PI*2);baked.fill();
    }
    baked.globalAlpha=1;
    // Construction/grid sheet, corner registration and fine dimension extensions.
    baked.strokeStyle=ghost;baked.lineWidth=.8;
    [204,796,1225].forEach(x=>{baked.beginPath();baked.moveTo(x,-500);baked.lineTo(x,1400);baked.stroke()});
    [178,458,744].forEach(y=>{baked.beginPath();baked.moveTo(-500,y);baked.lineTo(1900,y);baked.stroke()});
    [86,236,328].forEach(radius=>{baked.beginPath();baked.arc(796,458,radius,0,Math.PI*2);baked.stroke()});
    cross(baked,796,458,10,dark?'#495b64':'#a4b7bf');
    [[505,203],[1135,203],[505,725],[1135,725]].forEach(([x,y])=>{baked.fillStyle=muted;baked.globalAlpha=.7;baked.fillRect(x-2,y-2,4,4)});baked.globalAlpha=1;
    // The plan is a conceptual diagram, not a representation of any client's property.
    baked.fillStyle=dark?'#101b20':'#e8eff1';path(baked,footprint);baked.closePath();baked.fill();
    baked.strokeStyle=dark?'#677780':'#8096a1';baked.lineWidth=1;path(baked,footprint);baked.stroke();
    baked.strokeStyle=dark?'#a1aeb5':'#748b96';baked.lineWidth=1.2;
    rooms.forEach(room=>{baked.strokeRect(room.x,room.y,room.w,room.h);text(baked,room.label,room.x+room.w/2,room.y+room.h-13,muted,7.5,'center')});
    furniture(baked);
    // Central circulation, lift core and stair runs.
    baked.strokeStyle=dark?'#84959e':'#8198a3';baked.lineWidth=.9;
    baked.strokeRect(804,418,64,66);baked.strokeRect(881,418,39,66);
    for(let x=810;x<864;x+=7){baked.beginPath();baked.moveTo(x,424);baked.lineTo(x,477);baked.stroke()}
    cross(baked,900,452,7,muted);text(baked,'CORE',904,475,muted,6,'center');
    text(baked,'MAIN CIRCULATION',710,452,muted,7,'center');
    text(baked,'ENTRY',575,465,muted,7,'center');
    // Measurement ticks keep the linework looking like a drafting sheet.
    baked.strokeStyle=dark?'#52656e':'#9badb5';baked.lineWidth=.7;
    path(baked,[[602,209],[602,186],[1008,186],[1008,209]]);baked.stroke();
    [602,703.5,805,906.5,1008].forEach(x=>{path(baked,[[x-4,182],[x+4,190]]);baked.stroke()});
    text(baked,'CONCEPT PLAN / NOT TO SCALE',805,166,muted,8,'center');
    path(baked,[[1130,302],[1150,302],[1150,616],[1124,616]]);baked.stroke();
    [302,459,616].forEach(y=>{path(baked,[[1146,y-4],[1154,y+4]]);baked.stroke()});
    text(baked,'A',592,189,muted,8,'center');text(baked,'B',1018,189,muted,8,'center');
    // North indicator, separate from the active plan path.
    path(baked,[[1206,282],[1222,244],[1238,282],[1222,273],[1206,282]]);baked.stroke();text(baked,'N',1222,226,muted,9,'center');
    text(baked,'SCHEMATIC / 001',1125,766,muted,8,'right');text(baked,'FORM FOLLOWS PURPOSE',506,766,muted,8);
    baked.restore();
  }
  function resize(w,h,ratio){
    width=w||canvas.clientWidth||1440;height=h||canvas.clientHeight||900;dpr=Math.min(ratio||window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    const narrow=width<900;
    scale=narrow?Math.min(width/780,height/700):Math.max(width/1440,height/900);
    offsetX=narrow?(width-780*scale)/2-430*scale:(width-1440*scale)/2;
    offsetY=narrow?(height-700*scale)/2+28*scale:(height-900*scale)/2;
    bake();
  }
  function pointAt(distance){
    for(let i=0;i<lengths.length;i++){if(distance<=cumulative[i+1]){const a=footprint[i],b=footprint[i+1],t=(distance-cumulative[i])/lengths[i];return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]}}
    return footprint[footprint.length-1];
  }
  function trace(ctx,distance){ctx.beginPath();ctx.moveTo(...footprint[0]);for(let i=0;i<lengths.length;i++){if(distance>=cumulative[i+1])ctx.lineTo(...footprint[i+1]);else{ctx.lineTo(...pointAt(distance));break}}}
  function draw(time,progress=1,pointer=null){
    if(disposed||!context)return;
    context.setTransform(dpr,0,0,dpr,0,0);context.clearRect(0,0,width,height);context.drawImage(cache,0,0,cache.width,cache.height,0,0,width,height);
    context.save();context.translate(offsetX,offsetY);context.scale(scale,scale);
    const now=Number.isFinite(time)?time:performance.now();
    if(firstVisible===null&&progress>.025)firstVisible=now;
    const elapsed=firstVisible===null?0:Math.max(0,now-firstVisible);
    const reduced=options.reducedMotion===true;
    const lap=reduced?1:Math.min(1,elapsed/6000);
    // Constant overall six-second journey with a short eased lift off the start line.
    const travel=lap<.08?Math.pow(lap/.08,1.4)*.08:lap;
    const distance=total*travel;
    // Dashed sheet axes drift by precisely one pattern period each seven seconds.
    context.strokeStyle=dark?'#4b5a63':'#98adb8';context.globalAlpha=.35;context.lineWidth=.8;context.setLineDash([8,7]);context.lineDashOffset=reduced?0:-(now%7000)/7000*15;
    [[796,-200,796,1100],[200,458,1450,458]].forEach(([a,b,c,d])=>{path(context,[[a,b],[c,d]]);context.stroke()});context.setLineDash([]);context.globalAlpha=1;
    // Hub ping: the same 4.2 second vocabulary as the reference, slowed by ease-out.
    const ping=reduced?0:((now%4200)/4200);const eased=1-(1-ping)*(1-ping);
    context.strokeStyle=cyan;context.globalAlpha=.3*(1-eased)*(1-eased);context.lineWidth=1;context.beginPath();context.arc(796,458,10+eased*86,0,Math.PI*2);context.stroke();context.globalAlpha=1;
    // Actual outer circulation path, gently lit from brief to completed handover.
    context.strokeStyle=cyan;context.lineWidth=1.7;trace(context,distance);context.shadowColor=cyan;context.shadowBlur=lap<1?14:0;context.stroke();context.shadowBlur=0;
    if(lap>0&&lap<1){const [x,y]=pointAt(distance);context.fillStyle='#ffffff';context.shadowColor=cyan;context.shadowBlur=18;context.beginPath();context.arc(x,y,3,0,Math.PI*2);context.fill();context.shadowBlur=0;}
    stops.forEach((stop,index)=>{const lit=lap>=stop.fraction&&firstVisible!==null;context.strokeStyle=lit?cyan:muted;context.fillStyle=lit?cyan:(dark?'#142128':'#edf3f4');context.lineWidth=1;context.fillRect(stop.x-3,stop.y-3,6,6);context.strokeRect(stop.x-5,stop.y-5,10,10);text(context,stop.label,stop.x+stop.dx,stop.y+stop.dy,lit?cyan:muted,8,stop.align)});
    // The active cursor reticle only arms after the trace finishes, as in the source.
    if(pointer&&pointer.active!==false&&lap>=1&&!reduced){
      let px=pointer.x??pointer.localX,py=pointer.y??pointer.localY;
      if(pointer.normalized){px*=width;py*=height}
      if(Number.isFinite(px)&&Number.isFinite(py)&&px>=0&&px<=width&&py>=0&&py<=height){
        const x=(px-offsetX)/scale,y=(py-offsetY)/scale;
        context.strokeStyle=cyan;context.globalAlpha=.34;context.lineWidth=.7;context.setLineDash([2,7]);path(context,[[x-160,y],[x+160,y]]);context.stroke();path(context,[[x,y-160],[x,y+160]]);context.stroke();context.setLineDash([]);context.globalAlpha=1;
        // Lattice arithmetic: nearby halftone dots square up around the reticle.
        const col=Math.round((x-180)/7.8),row=Math.round((y-85)/7.7);
        for(let r=row-6;r<=row+6;r++)for(let c=col-6;c<=col+6;c++){const dx=180+c*7.8-x,dy=85+r*7.7-y,dist=Math.hypot(dx,dy);if(dist>48)continue;context.globalAlpha=(1-dist/48)*.55;context.fillStyle=(r+c)%2?cyan:ink;context.fillRect(180+c*7.8-1.5,85+r*7.7-1.5,3,3)}context.globalAlpha=1;cross(context,x,y,8,cyan);
      }
    }
    context.restore();
  }
  resize();
  return {resize,draw,dispose(){disposed=true;cache.width=cache.height=0;}};
}
