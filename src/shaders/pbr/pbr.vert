uniform mat4 u_worldViewProjection;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_view;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;

uniform sampler2D u_heightMap;
uniform float u_tiling;

attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;

varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;
varying vec4 v_worldPosition;
varying vec3 v_eyeDirection;
varying vec3 v_eyePosition;
varying vec3 v_worldNormal;

float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

void main() {

    v_texCoord = a_texcoord;

    v_texCoord *= floor( u_tiling );

    vec4 localPos = a_position;

    float height = texture2D( u_heightMap, v_texCoord ).r;

    localPos.xyz += normalize( a_normal ) * height * 0.1;    

    vec4 worldPosition = u_world * localPos;

    vec4 viewSpacePosition = u_view * worldPosition;   

    v_position = (u_worldViewProjection * localPos);

    v_normal = (u_worldInverseTranspose * vec4(a_normal, 0.)).xyz;

    v_worldNormal = vec3( u_world * vec4( a_normal, 0.0 ) );

    v_surfaceToLight = u_lightWorldPos - (u_world * localPos).xyz;

    v_surfaceToView = (u_viewInverse[3] - (u_world * localPos)).xyz;

    v_worldPosition = worldPosition;
    
    vec4 eyeDirViewSpace = viewSpacePosition - vec4( 0., 0., 0., 1. );

	v_eyePosition = -vec3( u_viewInverse * eyeDirViewSpace );

    gl_Position = v_position;
}