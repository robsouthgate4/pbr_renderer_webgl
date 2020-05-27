/**
PBRShader
 */

import vertexShader from './pbr.vert'
import fragmentShader from './pbr.frag'


const PBRShader = {

	uniforms: {
		time: { type: 'f', value: 0.0 },
		resolution: { type: 'v2', value: 0.0 }		
	},

	vertexShader,
	fragmentShader
};

export default PBRShader;
