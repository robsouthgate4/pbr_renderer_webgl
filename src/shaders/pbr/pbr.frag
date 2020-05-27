#extension GL_EXT_shader_texture_lod : enable
#extension GL_OES_standard_derivatives : enable

precision highp float;
precision highp int;

varying vec4        v_position;
varying vec2        v_texCoord;
varying vec3        v_normal;
varying vec3        v_surfaceToLight;
varying vec3        v_surfaceToView;
varying vec4        v_worldPosition;
varying vec3        v_eyePosition;

uniform vec4        u_lightColor;

uniform sampler2D 	u_normalMap;
uniform sampler2D 	u_roughnessMap;
uniform sampler2D 	u_metallicMap;
uniform sampler2D 	u_albedoMap;
uniform sampler2D 	u_aoMap;

uniform samplerCube u_skybox;
uniform samplerCube u_radiance;
uniform samplerCube u_irradiance;

uniform vec3		u_baseColor;
uniform float		u_roughness;
uniform float		u_metallic;
uniform float		u_specular;

uniform float		u_exposure;
uniform float		u_gamma;

uniform sampler2D 	u_heightMap;

#define saturate(x) clamp(x, 0.0, 1.0)
#define PI 3.1415926535897932384626433832795

vec3 EnvBRDFApprox( vec3 SpecularColor, float Roughness, float NoV )
{

	const vec4 c0 = vec4( -1, -0.0275, -0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, -0.04 );
	vec4 r = Roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( -9.28 * NoV ) ) * r.x + r.y;
	vec2 AB = vec2( -1.04, 1.04 ) * a004 + r.zw;
	return SpecularColor * AB.x + AB.y;

}

vec3 fix_cube_lookup( vec3 v, float cube_size, float lod ) {

	float M = max(max(abs(v.x), abs(v.y)), abs(v.z));
	float scale = 1. - exp2(lod) / cube_size;
	if (abs(v.x) != M) v.x *= scale;
	if (abs(v.y) != M) v.y *= scale;
	if (abs(v.z) != M) v.z *= scale;
	return v;

}

// Normal Blending
// Source adapted from http://blog.selfshadow.com/publications/blending-in-detail/
vec3 blendNormalsUnity( vec3 baseNormal, vec3 detailsNormal )
{
    vec3 n1 = baseNormal;
    vec3 n2 = detailsNormal;
    mat3 nBasis = mat3(
        vec3(n1.z, n1.y, -n1.x), // +90 degree rotation around y axis
        vec3(n1.x, n1.z, -n1.y), // -90 degree rotation around x axis
        vec3(n1.x, n1.y,  n1.z));
    return normalize(n2.x*nBasis[0] + n2.y*nBasis[1] + n2.z*nBasis[2]);

}

vec3 blendNormals( vec3 n1, vec3 n2 )
{

	return blendNormalsUnity( n1, n2 );

}

vec3 decodeRGBE( vec4 hdr ){

	return hdr.rgb * exp2( (hdr.a*255.0)-128.0 );

}

// Filmic tonemapping from
// http://filmicgames.com/archives/75

const float A = 0.15;
const float B = 0.50;
const float C = 0.10;
const float D = 0.20;
const float E = 0.02;
const float F = 0.30;

vec3 Uncharted2Tonemap( vec3 x )
{

	return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;

}

void main() {
    
    vec3 N 				= texture2D( u_normalMap, v_texCoord ).xyz * 2.0 - 1.0;
	N 					= blendNormals( normalize(v_normal), N );

	//vec3 N 				= normalize( v_normal );

	vec3 height			= texture2D( u_heightMap, v_texCoord ).rgb;

    vec3 V 				= normalize( v_surfaceToView );
	vec3 albedo 		= texture2D( u_albedoMap, v_texCoord ).rgb;

	//vec3 albedo = u_baseColor;

    float roughnessMask	= texture2D( u_roughnessMap, v_texCoord ).r;
	float metallicMask	= texture2D( u_metallicMap, v_texCoord ).r;
	float ao  			= texture2D( u_aoMap, v_texCoord ).r;
	

    vec3 diffuseColor	= albedo - albedo * u_metallic * metallicMask;
	vec3 specularColor	= mix( vec3( 0.08 * u_specular ), albedo, u_metallic * metallicMask );

    vec3 color;

    float numMips		= 8.;
	float mip			= numMips - 1. + log2( u_roughness * roughnessMask  );
	vec3 lookup			= normalize( -reflect( V, N ) );

	//lookup = fix_cube_lookup( lookup, 512., mip );

	vec3 radiance		= pow( textureCubeLodEXT( u_skybox, lookup, mip ).rgb, vec3( 2.2 ) );
	vec3 irradiance		= pow( textureCube( u_irradiance, N + vec3( sin( 180. * PI ) ) ).rgb, vec3( 2.2 ));

    float NoV			= saturate( dot( N, V ) );
	vec3 reflectance	= EnvBRDFApprox( specularColor, pow( u_roughness * roughnessMask , 4.0 ), NoV );

    vec3 diffuse  		= diffuseColor * irradiance;
    vec3 specular 		= radiance * reflectance;

	color				= diffuseColor + specular;

	//color *= ao;

	 // apply the tone-mapping
    color				    = Uncharted2Tonemap( color * 4.0 );
    // white balance
    color				    = color * ( 1.0 / Uncharted2Tonemap( vec3( 20.0 ) ) );
    
    //gamma correction
    //color			    	= pow( color, vec3( 1.0 / 2.2 ) );

    
    gl_FragColor 		= vec4( color , 0.0 );


}