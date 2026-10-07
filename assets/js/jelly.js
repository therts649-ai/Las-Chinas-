/*
 * Jelly: hace que la foto real de una gelatina tiemble como gelatina.
 * Usa un solo contexto WebGL compartido: cada foto activa se dibuja en él
 * y se copia a un canvas 2D encima de la imagen. Cuando la foto se queda
 * quieta, el canvas se oculta y se ve la imagen original.
 *
 *   const j = Jelly.attach(hostElement);   // host contiene un <img>
 *   j.poke(x, y, fuerza)                    // x, y de 0 a 1 dentro de la foto
 */
(function () {
  const VERT = `
    attribute vec2 aUv;
    uniform float uTime, uAmp, uHoverAmt;
    uniform vec2 uPoint, uHover;
    varying vec2 vUv;
    varying float vShade;
    void main() {
      vec2 uv = aUv;
      vec2 p = uv;
      // La base (abajo) queda fija; lo de arriba se mueve más, como gelatina en su plato
      float w = pow(1.0 - uv.y, 1.4);
      float near = exp(-pow(distance(uv, uPoint) * 1.6, 2.0));
      float decay = exp(-3.2 * uTime) * uAmp;
      float sway = sin(uTime * 17.0) * decay;
      p.x += sway * 0.045 * w * (0.5 + near);
      p.y += sin(uTime * 17.0 + 1.7) * decay * 0.03 * w;
      // Onda que sale desde donde la tocaste
      float r = distance(uv, uPoint);
      float ripple = sin(r * 28.0 - uTime * 22.0) * exp(-uTime * 4.0) * exp(-r * 5.0) * uAmp;
      p += normalize(uv - uPoint + 1e-4) * ripple * 0.01;
      // El cursor empuja suavemente la superficie
      vec2 d = uv - uHover;
      float bulge = uHoverAmt * exp(-dot(d, d) * 18.0);
      p -= d * bulge * 0.06;
      vUv = uv;
      vShade = sway * w;
      vec2 clip = (p * 1.04 - 0.02) * 2.0 - 1.0;
      gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
    }`;
  const FRAG = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    uniform sampler2D uTex;
    uniform vec2 uScale, uOffset, uHover;
    uniform float uHoverAmt;
    varying vec2 vUv;
    varying float vShade;
    void main() {
      vec2 t = vUv * uScale + uOffset;
      vec4 c = texture2D(uTex, t);
      // Brillo húmedo que sigue al cursor y destello que viaja con el movimiento
      float spot = pow(max(0.0, 1.0 - length((vUv - uHover) * vec2(1.4, 1.0)) * 2.4), 3.0);
      float sweep = abs(vShade) * 0.9;
      c.rgb += vec3(1.0, 0.92, 0.95) * (spot * 0.22 * uHoverAmt + sweep * 0.25);
      gl_FragColor = c;
    }`;

  let gl = null, glCanvas = null, prog = null, loc = {}, count = 0, failed = false;
  const items = new Set();
  let frame = 0;

  function init() {
    if (gl || failed) return !!gl;
    try {
      glCanvas = document.createElement('canvas');
      gl = glCanvas.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: true });
      if (!gl) throw new Error('sin WebGL');
      const sh = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      };
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      // Malla de 40x40 cuadros
      const N = 40, uv = [], idx = [];
      for (let y = 0; y <= N; y++) for (let x = 0; x <= N; x++) uv.push(x / N, y / N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const a = y * (N + 1) + x, b = a + 1, c = a + N + 1, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
      count = idx.length;
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
      const aUv = gl.getAttribLocation(prog, 'aUv');
      gl.enableVertexAttribArray(aUv);
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
      for (const n of ['uTime', 'uAmp', 'uHoverAmt', 'uPoint', 'uHover', 'uTex', 'uScale', 'uOffset']) loc[n] = gl.getUniformLocation(prog, n);
      return true;
    } catch (e) {
      failed = true;
      gl = null;
      return false;
    }
  }

  function attach(host) {
    const img = host.querySelector('img');
    if (!img || !init()) return fallback(host);
    const canvas = document.createElement('canvas');
    canvas.className = 'jelly-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const st = { host, img, canvas, ctx, tex: null, texSrc: '', amp: 0, poked: 0, point: [0.5, 0.5], hover: [0.5, 0.4], hoverT: [0.5, 0.4], hoverAmt: 0, hoverAmtT: 0, active: false };

    const local = (e) => {
      const r = host.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
    };
    host.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { st.hoverAmtT = 1; poke(...local(e), 0.6); } });
    host.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { st.hoverT = local(e); wake(); } });
    host.addEventListener('pointerleave', () => { st.hoverAmtT = 0; wake(); });
    host.addEventListener('pointerdown', (e) => poke(...local(e), 1.2));

    function poke(x = 0.5, y = 0.35, force = 1) {
      st.point = [x, y];
      st.amp = Math.min(1.6, st.amp * Math.exp(-3.2 * (performance.now() - st.poked) / 1000) + force);
      st.poked = performance.now();
      wake();
    }
    function wake() {
      if (!items.has(st)) items.add(st);
      if (!frame) frame = requestAnimationFrame(tick);
    }
    st.poke = poke;
    return { poke };
  }

  function texture(st) {
    if (st.tex && st.texSrc === st.img.currentSrc) return st.tex;
    if (!st.img.complete || !st.img.naturalWidth) return null;
    const t = st.tex || gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, st.img);
    } catch (e) {
      // Imagen sin permiso de lectura (por ejemplo, abierta como archivo local): sin efecto
      return null;
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    st.tex = t;
    st.texSrc = st.img.currentSrc;
    return t;
  }

  function draw(st, now) {
    const tex = texture(st);
    if (!tex) return false;
    const r = st.host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
    if (st.canvas.width !== W || st.canvas.height !== H) { st.canvas.width = W; st.canvas.height = H; }
    if (glCanvas.width !== W || glCanvas.height !== H) { glCanvas.width = W; glCanvas.height = H; }
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Recorte tipo object-fit: cover respetando object-position
    const iw = st.img.naturalWidth, ih = st.img.naturalHeight;
    const boxA = r.width / r.height, imgA = iw / ih;
    let sx = 1, sy = 1;
    if (imgA > boxA) sx = boxA / imgA; else sy = imgA / boxA;
    const pos = getComputedStyle(st.img).objectPosition.split(' ').map((v) => parseFloat(v) / 100);
    const ox = (1 - sx) * (isNaN(pos[0]) ? 0.5 : pos[0]);
    const oy = (1 - sy) * (isNaN(pos[1]) ? 0.5 : pos[1]);
    gl.uniform2f(loc.uScale, sx, sy);
    gl.uniform2f(loc.uOffset, ox, oy);
    gl.uniform1f(loc.uTime, (now - st.poked) / 1000);
    gl.uniform1f(loc.uAmp, st.amp);
    gl.uniform2f(loc.uPoint, st.point[0], st.point[1]);
    gl.uniform2f(loc.uHover, st.hover[0], st.hover[1]);
    gl.uniform1f(loc.uHoverAmt, st.hoverAmt);
    gl.uniform1i(loc.uTex, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
    st.ctx.clearRect(0, 0, W, H);
    st.ctx.drawImage(glCanvas, 0, 0);
    return true;
  }

  function tick(now) {
    frame = 0;
    for (const st of items) {
      st.hover[0] += (st.hoverT[0] - st.hover[0]) * 0.15;
      st.hover[1] += (st.hoverT[1] - st.hover[1]) * 0.15;
      st.hoverAmt += (st.hoverAmtT - st.hoverAmt) * 0.1;
      const energy = st.amp * Math.exp(-3.2 * (now - st.poked) / 1000);
      const busy = energy > 0.01 || Math.abs(st.hoverAmtT - st.hoverAmt) > 0.005 || st.hoverAmt > 0.01;
      if (busy && draw(st, now)) {
        st.canvas.classList.add('is-on');
      } else {
        st.canvas.classList.remove('is-on');
        if (!busy) { st.amp = 0; items.delete(st); }
      }
    }
    if (items.size) frame = requestAnimationFrame(tick);
  }

  // Sin WebGL: un temblor con CSS sobre la misma foto
  function fallback(host) {
    const img = host.querySelector('img');
    const poke = () => {
      if (!img || !img.animate) return;
      img.animate([
        { transform: 'scale(1,1)' }, { transform: 'scale(1.04,.96)' }, { transform: 'scale(.98,1.03)' },
        { transform: 'scale(1.01,.99)' }, { transform: 'scale(1,1)' },
      ], { duration: 700, easing: 'ease-out' });
    };
    host.addEventListener('pointerdown', poke);
    return { poke };
  }

  window.Jelly = { attach };
})();
