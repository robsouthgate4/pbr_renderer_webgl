import * as twgl from 'twgl.js';
import Stats from 'Stats.js';
import PBR from './shaders/pbr/pbr.js';
import PassThrough from './shaders/passthrough/passthrough.js';

import ControlKit from 'controlkit';

import roughnessMap from '../assets/textures/broken_tiles_high/roughness.png';
//import metallicMap from '../assets/textures/broken_tiles_high/grimy-metal-metalness.png';
import albedoMap from '../assets/textures/broken_tiles_high/albedo.png';
import normalMap from '../assets/textures/broken_tiles_high/normals.png';
//import aoMap from '../assets/textures/stylised_rock/stylized-cliff1-ao.png';
import heightMap from '../assets/textures/broken_tiles_high/displacement.png';

import rnx from '../assets/textures/radiance/nx.png';
import rny from '../assets/textures/radiance/ny.png';
import rnz from '../assets/textures/radiance/nz.png';
import rpx from '../assets/textures/radiance/px.png';
import rpy from '../assets/textures/radiance/py.png';
import rpz from '../assets/textures/radiance/pz.png';

import irnx from '../assets/textures/town_env/irradiance/output_iem_negx.png';
import irny from '../assets/textures/town_env/irradiance/output_iem_negy.png';
import irnz from '../assets/textures/town_env/irradiance/output_iem_negz.png';
import irpx from '../assets/textures/town_env/irradiance/output_iem_posx.png';
import irpy from '../assets/textures/town_env/irradiance/output_iem_posy.png';
import irpz from '../assets/textures/town_env/irradiance/output_iem_posz.png';

import nx from '../assets/textures/town_env/env/output_skybox_negx.png';
import ny from '../assets/textures/town_env/env/output_skybox_negy.png';
import nz from '../assets/textures/town_env/env/output_skybox_negz.png';
import px from '../assets/textures/town_env/env/output_skybox_posx.png';
import py from '../assets/textures/town_env/env/output_skybox_posy.png';
import pz from '../assets/textures/town_env/env/output_skybox_posz.png';



twgl.setDefaults({ attribPrefix: "a_" }); // !important !!!


const m4 = twgl.m4;


const gl = document.getElementById( 'c' ).getContext( 'webgl' );

var available_extensions = gl.getSupportedExtensions();
gl.getExtension('EXT_shader_texture_lod');
gl.getExtension('OES_standard_derivatives');


const quadProgramInfo = twgl.createProgramInfo( gl, [ PassThrough.vertexShader, PassThrough.fragmentShader ] );

const shapes = [
    twgl.primitives.createPlaneBufferInfo( gl, 100, 100, 128, 128 ),
    twgl.primitives.createSphereBufferInfo( gl, 1, 64, 64 )
];

const screenArrays = {
    position: { numComponents: 3, data: [
        -1, -1, 0, 
       -1,  4, 0, 
        4, -1, 0
    ], },
    indices:  { numComponents: 3, data: [2, 1, 0], }
};

const screenBufferInfo = twgl.createBufferInfoFromArrays( 
    gl, screenArrays
);

const fbSizeX = gl.canvas.clientWidth;
const fbSizeY = gl.canvas.clientHeight;
const framebufferInfo = twgl.createFramebufferInfo(gl, undefined, fbSizeX, fbSizeY);

const screenUniforms = {
    u_texture: framebufferInfo.attachments[0],
    u_resolution: [ gl.canvas.clientWidth, gl.canvas.clientHeight]
};

function rand( min, max ) {
    return min + Math.random() * ( max - min );
}

const obj = { tiling: 10.0, range: [ 1.0, 10.0 ] };

const controlKit = new ControlKit();
    controlKit.addPanel()
        .addGroup()
            .addSubGroup()
                .addSlider( obj, 'tiling', 'range', {
                    onChange: ( index ) => {
                        
                        console.log( obj.tiling )

                    }
                } )
                

// Shared values
const lightWorldPosition = [ 1, 8, -10 ];
const lightColor = [ 1, 1, 1, 1 ];
const camera = m4.identity();
const view = m4.identity();
const viewProjection = m4.identity();
const viewDirection = m4.identity();
const viewDirectionProjection = m4.identity();
const viewDirectionProjectionInverse = m4.identity();

const PBRprogramInfo = twgl.createProgramInfo( gl, [ PBR.vertexShader, PBR.fragmentShader ] );

const tex = twgl.createTexture(gl, {

    min: gl.NEAREST,
    mag: gl.NEAREST,
    src: [
        255, 255, 255, 255,
        192, 192, 192, 255,
        192, 192, 192, 255,
        255, 255, 255, 255,
    ]

});

const pbrTextures = twgl.createTextures( gl, {
  
    roughness: { src: roughnessMap },
    metallic: [1,1,1,1],
    albedo: { src: albedoMap },
    normal: { src: normalMap },
    ao: [1,1,1,1],
    height: { src: heightMap },
    skybox: {
        target: gl.TEXTURE_CUBE_MAP,
        src: [
            px, nx, py, ny, pz, nz
        ],
        mag: gl.LINEAR_MIPMAP_LINEAR,
        min: gl.LINEAR_MIPMAP_LINEAR
    },
    radiance: {
        target: gl.TEXTURE_CUBE_MAP,
        src: [
            rpx, rnx, rpy, rny, rpz, rnz
        ]
    },
    irradiance: {
        target: gl.TEXTURE_CUBE_MAP,
        src: [
            irpx, irnx, irpy, irny, irpz, irnz
        ]
    }

});

const objects = [];
const drawObjects = [];
const numObjects = 1;

for (let ii = 0; ii < numObjects; ii++ ) {
	
    const PBRuniforms = {

        u_lightWorldPos: lightWorldPosition,
        u_lightColor: lightColor,
        u_diffuseMult: [ 0.5, 0.5, 0.5, 1.0 ],
        u_roughness: 1.0,
		u_metallic: 0.0,
		u_specular: 1.0,
		u_baseColor: [0.4, 0.3, 0.45],
        u_specularFactor: 1, 
        u_exposure: 1.0,
        u_tiling: obj.tiling,
        u_gamma: 2.2,
        u_roughnessMap: pbrTextures.roughness,
        u_metallicMap: pbrTextures.metallic,
        u_normalMap: pbrTextures.normal,
        u_albedoMap: pbrTextures.albedo,
        u_skybox: pbrTextures.skybox,
        u_radiance: pbrTextures.radiance,
        u_irradiance: pbrTextures.irradiance,
        u_aoMap: pbrTextures.ao,
        u_heightMap: pbrTextures.height,
        u_viewInverse: camera,
        u_view: view,
        u_world: m4.identity(),
        u_worldInverseTranspose: m4.identity(),
		u_worldViewProjection: m4.identity()
		
	};
	
    drawObjects.push({
        programInfo: PBRprogramInfo,
        bufferInfo: shapes[ 0 ],
        uniforms: PBRuniforms,
	});
	
    objects.push({
        translation: [ 0, 0, 0 ],
        ySpeed: 0.1,
        zSpeed: 0,
        uniforms: PBRuniforms,
    });
	
}

//stats
let stats = new Stats();
document.body.appendChild( stats.domElement );

let fps, fpsInterval, startTime, now, then, elapsed;

fps = 144;

fpsInterval = 1000 / fps;
then = Date.now();
startTime = then;

let useFrameBuffer = true;

function render( time ) {

    time *= 0.001;
    
    stats.begin();

    now = Date.now();
    elapsed = now - then;

    // if enough time has elapsed, draw the next frame

    let aspect = 1;

    if ( elapsed > fpsInterval ) {

        then = now - ( elapsed % fpsInterval );

        // Put your drawing code here
		
        if ( twgl.resizeCanvasToDisplaySize( gl.canvas ) ){

            twgl.resizeFramebufferInfo( gl, framebufferInfo );

        }

        if ( useFrameBuffer ) {

            twgl.bindFramebufferInfo(gl, framebufferInfo);
            aspect = 1;

        } else {

            twgl.bindFramebufferInfo(gl, null);
            aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

        }        

		gl.viewport( 0, 0, gl.canvas.width, gl.canvas.height );

        gl.cullFace(gl.BACK)
		gl.enable( gl.DEPTH_TEST );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        gl.clearColor(0, 0, 0, 0);

		const projection    = m4.perspective( 45 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 100 );
        const eye           = [ Math.sin( time * 0.2 ) * 3, 3, Math.cos( time * 0.2 ) * 3 ];
        const target        = [ 0, 0, 0 ];
        const up            = [ 0, 1, 0 ];

		m4.lookAt( eye, target, up, camera );
		m4.inverse( camera, view );
        m4.multiply( projection, view, viewProjection );        

		objects.forEach( ( object ) => {

			const uni = object.uniforms;
            const world = uni.u_world;

            uni.u_tiling = obj.tiling;
            
			m4.identity( world );
            m4.translate( world, object.translation, world );
            //m4.axisRotation( [0, 1, 0], (time * 10) * Math.PI /180, world );
			m4.transpose( m4.inverse( world, uni.u_worldInverseTranspose), uni.u_worldInverseTranspose );
            m4.multiply( viewProjection, uni.u_world, uni.u_worldViewProjection );
            
		});

        twgl.drawObjectList( gl, drawObjects );

        // fbo stuff here

        if ( useFrameBuffer ) {

            twgl.bindFramebufferInfo(gl, null);
            gl.clearColor(0.0, 0.0, 0.0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.useProgram( quadProgramInfo.program );

            twgl.setBuffersAndAttributes(gl, quadProgramInfo, screenBufferInfo );
            twgl.setUniforms( quadProgramInfo, screenUniforms );
            twgl.drawBufferInfo( gl, screenBufferInfo );

        }


    }

    stats.end();
	
	requestAnimationFrame( render );

	

}

requestAnimationFrame( render );
