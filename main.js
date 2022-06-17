'use strict';

let canvas, engine, scene, camera;

window.addEventListener('DOMContentLoaded', () => {
    // il tag canvas che visualizza l'animazione
    canvas = document.getElementById('c');
    // la rotella del mouse serve per fare zoom e non per scrollare la pagina
    canvas.addEventListener('wheel', evt => evt.preventDefault());
    
    // engine & scene
    engine = new BABYLON.Engine(canvas, true);
    scene = new BABYLON.Scene(engine);
    
    // camera
    camera = new BABYLON.ArcRotateCamera('cam', 
            -Math.PI/2, 1.18,
            30, 
            new BABYLON.Vector3(0,0,0), 
            scene);
    camera.attachControl(canvas,true);
    camera.wheelPrecision = 50;
    camera.lowerRadiusLimit = 3;
    camera.upperRadiusLimit = 500;
    camera.fov = 0.3;           
    
    // luce
    let light1 = new BABYLON.PointLight('light1',new BABYLON.Vector3(0,1,0), scene);
    light1.parent = camera;
    
    // aggiungo i vari oggetti
    populateScene(scene);
    
    // main loop
    engine.runRenderLoop(()=>scene.render());

    // resize event
    window.addEventListener("resize", () => engine.resize());
});

let cubeViewer;

function populateScene() {
    createGrid(scene);
    cubeViewer = new CubeViewer();
    scene.registerBeforeRender(() => {
        let t = performance.now() * 0.001;
    });
    change(-1);
}


function createGrid(scene) {
    
    let Color4 = BABYLON.Color4;
    let Vector3 = BABYLON.Vector3;
     
    let m = 100;
    let r = 10;
    let pts = [];
    let colors = [];
    let c1 = new Color4(0.7,0.7,0.7,0.5);
    let c2 = new Color4(0.5,0.5,0.5,0.25);
    let cRed   = new Color4(0.8,0.1,0.1);
    let cGreen = new Color4(0.1,0.8,0.1);
    let cBlue  = new Color4(0.1,0.1,0.8);
    
    let color = c1;
    function line(x0,y0,z0, x1,y1,z1) { 
        pts.push([new Vector3(x0,y0,z0), new Vector3(x1,y1,z1)]); 
        colors.push([color,color]); 
    }
    
    for(let i=0;i<=m;i++) {
        if(i*2==m) continue;
        color = (i%5)==0 ? c1 : c2;
        let x = -r+2*r*i/m;        
        line(x,0,-r, x,0,r);
        line(-r,0,x, r,0,x);
    }
    
    let r1 = r + 1;
    let a1 = 0.2;
    let a2 = 0.5;
    
    // x axis
    color = cRed;
    line(-r1,0,0, r1,0,0); 
    line(r1,0,0, r1-a2,0,a1);
    line(r1,0,0, r1-a2,0,-a1);
        
    // z axis
    color = cBlue;
    line(0,0,-r1, 0,0,r1); 
    line(0,0,r1, a1,0,r1-a2);
    line(0,0,r1,-a1,0,r1-a2);
    
    // y axis
    color = cGreen;
    line(0,-r1,0, 0,r1,0); 
    line(0,r1,0, a1,r1-a2,0);
    line(0,r1,0,-a1,r1-a2,0);
    line(0,r1,0, 0,r1-a2,a1);
    line(0,r1,0, 0,r1-a2,-a1);
    
    const lines = BABYLON.MeshBuilder.CreateLineSystem(
        "lines", {
                lines: pts,
                colors: colors,
                
        }, 
        scene);
    return lines;    
};

function change(dir) {
    const edgeLength = 120.0;
    let value = Math.sqrt(3) * cubeViewer.diagonalScale * edgeLength;
    value = Math.floor(0.5 + value / 5) * 5.0 + 5.0 * dir;
    const minValue = edgeLength * Math.sqrt(3);
    const maxValue = edgeLength * 2.99;
    if(value<minValue) value = minValue;
    else if(value>maxValue) value = maxValue;
    cubeViewer.diagonalScale = value / (edgeLength * Math.sqrt(3));
    cubeViewer.update();
    let s = cubeViewer.diagonalScale;
    document.getElementById('diag0').innerHTML = value.toFixed(1);
    let v = edgeLength * Math.sqrt(1+s*s);
    document.getElementById('diag1').innerHTML = v.toFixed(1);
    v = edgeLength * Math.sqrt(3-s*s);
    document.getElementById('diag2').innerHTML = v.toFixed(1);

}

class CubeViewer {
    constructor() {
        this.cylinderMesh = BABYLON.MeshBuilder.CreateCylinder('c',{diameter:0.15, height:1}, scene);
        this.cylinderMesh.material = new BABYLON.StandardMaterial('cmat', scene);
        this.cylinderMesh.isVisible = false;
        this.cylinderMesh.material.diffuseColor.set(0,1,1);
        this.edgesInstances = [];

        this.sphereMesh = BABYLON.MeshBuilder.CreateSphere('s', {diameter:0.25 }, scene);
        this.sphereMesh.material = new BABYLON.StandardMaterial('smat', scene);
        this.sphereMesh.isVisible = false;
        this.sphereMesh.material.diffuseColor.set(0,0.5,0.5);
        this.edgesInstances = [];

        this.edgeMeshes = [];
        for(let i=0; i<12; i++) 
            this.edgeMeshes.push(this.cylinderMesh.createInstance('e'+i));

        this.sphereMeshes = [];
        for(let i=0; i<8; i++) 
            this.sphereMeshes.push(this.sphereMesh.createInstance('s'+i));
    
        this.pts = [];
        for(let i=0;i<8;i++) this.pts.push(new BABYLON.Vector3());
        this.edgeLength = 3;
        this.innerDiagonalLength = this.edgeLength * Math.sqrt(3);


        // this.label1 = this.createLabel();
        this.update();

    }


    createLabel() {

        let mesh = new BABYLON.Mesh("label-mesh", scene);
        let h = 0.15;
        let vd = new BABYLON.VertexData();
        vd.positions = [-0.5,-h,0, 0.5,-h,0, -0.5,h,0, 0.5,h,0];
        vd.normals = [0,0,1,0,0,1,0,0,1,0,0,1];
        vd.uvs = [0,0,1,0,0,1,1,1];
        vd.indices = [0, 1, 3, 0, 3, 2];
        vd.applyToMesh(mesh, true);

        return mesh;
        let material = mesh.material = new BABYLON.StandardMaterial('label1-mat', scene);
        material.specularColor.set(0.1,0.1,0.1);
        material.diffuseColor.set(1,1,1);
        material.backFaceCulling = false;
        material.twoSidedLighting = true;
        window.mat = material;
        let tex = new BABYLON.DynamicTexture('label1-tex', {width:1024, height:64}, scene);
        // material.diffuseTexture = tex;
        let ctx = tex.getContext();
        ctx.fillStyle='white';
        ctx.fillRect(0,0,1024,1024);
        
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(0,32);ctx.lineTo(1024,32);
        for(let x=0; x<1024; x+=16) { ctx.moveTo(x,32); ctx.lineTo(x,(x>>6)&1 ? 50 : 64); }
        // ctx.stroke();
        tex.update();
        return mesh;
    }

    update() {
        let s2 = Math.pow(this.innerDiagonalLength / this.edgeLength,2) / 3.0;
        let d1 = Math.sqrt(1+s2);
        let d2 = Math.sqrt(3-s2);
        let r = d2 * Math.sqrt(3)/3;
        let h = Math.sqrt(1-r*r);
        const u = this.edgeLength;
        let y0 = h*1.5*u;
        let y1 = h*0.5*u;
        let xzs = [];
        for(let i=0; i<6; i++) {
            let phi = Math.PI*2*i/6;
            let cs = Math.cos(phi), sn = Math.sin(phi);
            xzs.push(r*cs*u, r*sn*u);
        }
        this.pts[0].set(0,-y0,0);
        for(let i=0;i<3;i++) this.pts[1+i].set(xzs[4*i],-y1,xzs[4*i+1]);
        for(let i=0;i<3;i++) this.pts[4+i].set(xzs[4*i+2],y1,xzs[4*i+3]);
        this.pts[7].set(0,y0,0);

        this.net = [[0,1],[0,2],[0,3],[7,4],[7,5],[7,6],[1,4],[4,2],[2,5],[5,3],[3,6],[6,1]];
        const me = this;
        this.pts.forEach((p,i) => {
            this.sphereMeshes[i].position.copyFrom(p);
        })
        this.net.forEach(([a,b], i) => {
            me.placeEdge(me.edgeMeshes[i], me.pts[a], me.pts[b]);
        })

        /*
        let p0 = this.pts[7]
        let p1 = this.pts[5];
        let p2 = this.pts[6];
        let up = BABYLON.Vector3.Cross(p2.subtract(p1),p2.subtract(p0));
        BABYLON.Vector3.LerpToRef(p1,p2,0.5,this.label1.position);
        this.label1.scaling.set(d2*this.edgeLength,1,1);

        this.label1.rotation.x = Math.atan(0.5*r/h);        
        this.label1.rotation.y = Math.PI/6;
        */
    }


    placeEdge(edge, p1, p2) {
        let delta = p2.subtract(p1);
        edge.position.set(0,0,0);
        edge.lookAt(delta);
        edge.rotate(BABYLON.Axis.X, Math.PI/2);
        edge.scaling.set(1,delta.length(),1);
        BABYLON.Vector3.LerpToRef(p1,p2,0.5,edge.position); 
    }

    get diagonalScale() { 
        return this.innerDiagonalLength/(Math.sqrt(3)*this.edgeLength); 
    }
    set diagonalScale(s) {
        this.innerDiagonalLength = s * Math.sqrt(3) * this.edgeLength;
    }

}