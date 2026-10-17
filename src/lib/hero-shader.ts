export const vertexSource = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
	vUv = aPosition * .5 + .5;
	gl_Position = vec4(aPosition, 0., 1.);
}`;

export const fragmentSource = `
precision mediump float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;

float hash(vec2 p) {
	vec3 p3 = fract(vec3(p.xyx) * .1031);
	p3 += dot(p3, p3.yzx + 33.33);
	return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
	vec2 i = floor(p), f = fract(p);
	f = f * f * (3. - 2. * f);
	return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
		mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
}
float fbm(vec2 p) {
	float value = 0.;
	float weight = .55;
	mat2 turn = mat2(.8, -.6, .6, .8);
	for (int i = 0; i < 3; i++) {
		value += noise(p) * weight;
		p = turn * p * 2.03 + 7.1;
		weight *= .46;
	}
	return value;
}
void main() {
	float aspect = uResolution.x / uResolution.y;
	vec2 p = (vUv - .5) * vec2(aspect, 1.);
	p += uPointer * vec2(.018, .012);
	float t = uTime;
	float warp = fbm(p * 1.15 + vec2(t * .009, -t * .006));
	float fine = fbm(p * 1.8 + vec2(3.2, t * .008));
	float phase = p.x * 2.3 + p.y * 1.7 + (warp - .45) * 2.7 + fine * .65 - t * .035;
	float fold = sin(phase * 3.1);
	float crest = pow(.5 + .5 * fold, 3.5);
	float shoulder = pow(.5 + .5 * cos(phase * 3.1 + .9), 2.2);
	float center = 1. - smoothstep(.08, .82, length(p * vec2(.75, 1.1)));
	float light = (.07 * shoulder + .2 * crest) * mix(1., .65, center);
	float shadow = .018 * smoothstep(-.7, .6, fold);
	vec3 color = vec3(.07843) - shadow + light * vec3(.96, .985, 1.);
	float vignette = smoothstep(.3, 1.2, length(p * vec2(.62, 1.)));
	color = mix(color, vec3(.07843), vignette * .6);
	// Static dithering prevents visible bands on dark, low-contrast displays.
	color += (hash(gl_FragCoord.xy) - .5) * .002;
	gl_FragColor = vec4(color, 1.);
}`;
