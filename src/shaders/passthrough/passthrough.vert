attribute vec3  a_position;

varying vec2    vUv;

const vec2 EPS = vec2(1.0 / 2048.0, 1.0 / 1024.0);

uniform vec2 side;

void main() {

 	vUv         = vec2( 0.5 ) + ( a_position.xy ) * 0.5;
 	vUv         = vUv + side * EPS * 0.5;
	gl_Position = vec4( a_position.xy, 0.0,  1.0 );
  
}