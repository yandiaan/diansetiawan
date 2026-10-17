import { vertexSource, fragmentSource } from '../lib/hero-shader';

interface Resources {
	program: WebGLProgram;
	buffer: WebGLBuffer;
	shaders: WebGLShader[];
	resolution: WebGLUniformLocation | null;
	pointer: WebGLUniformLocation | null;
	time: WebGLUniformLocation | null;
}

export function initHeroShader(canvas: HTMLCanvasElement): () => void {
	const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
	if (!gl) return () => {};
	const hero = canvas.closest<HTMLElement>('.hero')!;
	const controller = new AbortController();
	const { signal } = controller;
	const reduced = matchMedia('(prefers-reduced-motion: reduce)');
	const mobile = matchMedia('(max-width: 600px)');
	const fine = matchMedia('(hover: hover) and (pointer: fine)');
	const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
	let gpu: Resources | null = null;
	let frame = 0, lastTime = 0, elapsed = 0;
	let inView = true, lost = false;

	function disposeGpu() {
		if (!gpu) return;
		gl!.deleteBuffer(gpu.buffer);
		gl!.deleteProgram(gpu.program);
		gpu.shaders.forEach(shader => gl!.deleteShader(shader));
		gpu = null;
	}
	function createGpu() {
		const shaders: WebGLShader[] = [];
		const program = gl!.createProgram();
		const buffer = gl!.createBuffer();
		try {
			if (!program || !buffer) throw new Error('WebGL allocation failed');
			for (const [type, source] of [[gl!.VERTEX_SHADER, vertexSource], [gl!.FRAGMENT_SHADER, fragmentSource]] as const) {
				const shader = gl!.createShader(type);
				if (!shader) throw new Error('Shader allocation failed');
				shaders.push(shader);
				gl!.shaderSource(shader, source); gl!.compileShader(shader);
				if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(shader) || 'Shader compilation failed');
				gl!.attachShader(program, shader);
			}
			gl!.linkProgram(program);
			if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) throw new Error(gl!.getProgramInfoLog(program) || 'Shader linking failed');
			gl!.useProgram(program);
			gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
			gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl!.STATIC_DRAW);
			const position = gl!.getAttribLocation(program, 'aPosition');
			gl!.enableVertexAttribArray(position);
			gl!.vertexAttribPointer(position, 2, gl!.FLOAT, false, 0, 0);
			gpu = { program, buffer, shaders,
				resolution: gl!.getUniformLocation(program, 'uResolution'),
				pointer: gl!.getUniformLocation(program, 'uPointer'),
				time: gl!.getUniformLocation(program, 'uTime') };
			canvas.dataset.renderer = 'webgl';
		} catch (error) {
			shaders.forEach(shader => gl!.deleteShader(shader));
			if (program) gl!.deleteProgram(program);
			if (buffer) gl!.deleteBuffer(buffer);
			canvas.dataset.renderer = 'fallback';
			console.warn('Hero shader fallback:', error);
		}
	}
	function draw() {
		if (!gpu || lost) return;
		gl!.viewport(0, 0, canvas.width, canvas.height);
		gl!.uniform2f(gpu.resolution, canvas.width, canvas.height);
		gl!.uniform2f(gpu.pointer, pointer.x, pointer.y);
		gl!.uniform1f(gpu.time, elapsed);
		gl!.drawArrays(gl!.TRIANGLES, 0, 3);
		if (!canvas.hasAttribute('data-ready')) canvas.dataset.ready = '';
	}
	function tick(time: number) {
		const interval = 1000 / (mobile.matches ? 24 : 30);
		if (lastTime && time - lastTime < interval - 1) { frame = requestAnimationFrame(tick); return; }
		const delta = lastTime ? Math.min(time - lastTime, 64) : 33;
		lastTime = time;
		elapsed += delta / 1000;
		const ease = 1 - Math.exp(-delta * .004);
		pointer.x += (pointer.targetX - pointer.x) * ease;
		pointer.y += (pointer.targetY - pointer.y) * ease;
		draw();
		frame = requestAnimationFrame(tick);
	}
	function sync() {
		cancelAnimationFrame(frame); frame = lastTime = 0;
		if (!gpu || lost || document.hidden || !inView) return;
		if (reduced.matches) pointer.x = pointer.y = pointer.targetX = pointer.targetY = 0;
		draw();
		if (!reduced.matches) frame = requestAnimationFrame(tick);
	}
	function resize() {
		const w = hero.clientWidth, h = hero.clientHeight;
		if (!w || !h) return;
		const scale = Math.min(mobile.matches ? .6 : .85, Math.sqrt((mobile.matches ? 220000 : 700000) / (w * h)));
		const nextW = Math.max(1, Math.round(w * scale)), nextH = Math.max(1, Math.round(h * scale));
		if (canvas.width !== nextW || canvas.height !== nextH) {
			canvas.width = nextW; canvas.height = nextH;
		}
		sync();
	}
	hero.addEventListener('pointermove', event => {
		if (!fine.matches || reduced.matches || event.pointerType !== 'mouse') return;
		const rect = hero.getBoundingClientRect();
		pointer.targetX = (event.clientX - rect.left) / rect.width * 2 - 1;
		pointer.targetY = 1 - (event.clientY - rect.top) / rect.height * 2;
	}, { passive: true, signal });
	hero.addEventListener('pointerleave', () => { pointer.targetX = pointer.targetY = 0; }, { signal });
	reduced.addEventListener('change', sync, { signal });
	fine.addEventListener('change', () => { pointer.targetX = pointer.targetY = 0; }, { signal });
	document.addEventListener('visibilitychange', sync, { signal });
	canvas.addEventListener('webglcontextlost', event => {
		event.preventDefault(); lost = true; cancelAnimationFrame(frame);
		gpu = null; delete canvas.dataset.ready;
	}, { signal });
	canvas.addEventListener('webglcontextrestored', () => { lost = false; createGpu(); resize(); }, { signal });
	const sizeObserver = new ResizeObserver(resize);
	const visibilityObserver = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
	createGpu();
	sizeObserver.observe(hero); visibilityObserver.observe(hero);
	resize();
	return () => {
		controller.abort(); cancelAnimationFrame(frame);
		sizeObserver.disconnect(); visibilityObserver.disconnect(); disposeGpu();
		delete canvas.dataset.ready; delete canvas.dataset.renderer;
	};
}
