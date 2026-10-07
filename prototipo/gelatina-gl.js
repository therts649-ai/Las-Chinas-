/*
 * Etapas 1 y 2 del inicio:
 *  1. Gelatina líquida: simulación de fluido en WebGL2 que reacciona al dedo/mouse.
 *  2. Lente de gelatina: la escena del inicio vista a través de gelatina translúcida;
 *     al "atravesarla" se desvanece y queda la página.
 *
 *   const g = GelatinaGL.start(canvas, { image: 'ruta.webp' });
 *   g.splat(x, y, dx, dy)  g.setMix(0..1)  g.setThrough(0..1)  g.stop()
 */
(function () {
  const BASE_VS = `#version 300 es
    precision highp float;
    in vec2 aPos;
    out vec2 vUv, vL, vR, vT, vB;
    uniform vec2 texel;
    void main() {
      vUv = aPos * 0.5 + 0.5;
      vL = vUv - vec2(texel.x, 0.0); vR = vUv + vec2(texel.x, 0.0);
      vT = vUv + vec2(0.0, texel.y); vB = vUv - vec2(0.0, texel.y);
      gl_Position = vec4(aPos, 0.0, 1.0);
    }`;
  const HEAD = `#version 300 es
    precision highp float; precision highp sampler2D;
    in vec2 vUv, vL, vR, vT, vB;
    out vec4 o;
  `;
  const FS = {
    splat: HEAD + `
      uniform sampler2D uTarget; uniform float aspect, radius; uniform vec3 color; uniform vec2 point;
      void main() {
        vec2 p = vUv - point; p.x *= aspect;
        vec3 s = exp(-dot(p, p) / radius) * color;
        o = vec4(texture(uTarget, vUv).xyz + s, 1.0);
      }`,
    advect: HEAD + `
      uniform sampler2D uVelocity, uSource; uniform vec2 texel; uniform float dt, dissipation;
      void main() {
        vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texel;
        o = texture(uSource, coord) / (1.0 + dissipation * dt);
      }`,
    divergence: HEAD + `
      uniform sampler2D uVelocity;
      void main() {
        float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x;
        float T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y;
        o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
      }`,
    curl: HEAD + `
      uniform sampler2D uVelocity;
      void main() {
        float L = texture(uVelocity, vL).y, R = texture(uVelocity, vR).y;
        float T = texture(uVelocity, vT).x, B = texture(uVelocity, vB).x;
        o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
      }`,
    vorticity: HEAD + `
      uniform sampler2D uVelocity, uCurl; uniform float curl, dt;
      void main() {
        float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x;
        float T = texture(uCurl, vT).x, B = texture(uCurl, vB).x, C = texture(uCurl, vUv).x;
        vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        f /= length(f) + 0.0001; f *= curl * C; f.y *= -1.0;
        o = vec4(texture(uVelocity, vUv).xy + f * dt, 0.0, 1.0);
      }`,
    pressure: HEAD + `
      uniform sampler2D uPressure, uDivergence;
      void main() {
        float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
        float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
        o = vec4((L + R + B + T - texture(uDivergence, vUv).x) * 0.25, 0.0, 0.0, 1.0);
      }`,
    gradient: HEAD + `
      uniform sampler2D uPressure, uVelocity;
      void main() {
        float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
        float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
        o = vec4(texture(uVelocity, vUv).xy - vec2(R - L, T - B), 0.0, 1.0);
      }`,
    scale: HEAD + `
      uniform sampler2D uTex; uniform float value;
      void main() { o = value * texture(uTex, vUv); }`,
    // Pantalla final: gelatina líquida brillante + lente de gelatina sobre la foto
    display: HEAD + `
      uniform sampler2D uDye, uImage; uniform vec2 texel, imgScale, imgOffset;
      uniform float mixLens, through, time, hasImage, aspect;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        // --- Gelatina líquida: color del tinte con relieve y brillo ---
        vec3 c = texture(uDye, vUv).rgb;
        float hL = length(texture(uDye, vL).rgb), hR = length(texture(uDye, vR).rgb);
        float hT = length(texture(uDye, vT).rgb), hB = length(texture(uDye, vB).rgb);
        vec3 n = normalize(vec3(hL - hR, hB - hT, 0.35));
        vec3 light = normalize(vec3(-0.4, 0.6, 0.7));
        float spec = pow(max(dot(reflect(-light, n), vec3(0.0, 0.0, 1.0)), 0.0), 18.0);
        vec3 base = vec3(0.23, 0.03, 0.13);
        vec3 liquid = base + c * (0.65 + 0.5 * max(dot(n, light), 0.0)) + spec * 0.55 * min(length(c) * 2.0, 1.0);

        // --- Lente: la escena vista a través de gelatina roja translúcida ---
        vec2 uv = (vUv - 0.5) / (1.0 + through * 1.6) + 0.5;
        vec2 w = vec2(
          sin(uv.y * 11.0 + time * 1.3) + sin((uv.x + uv.y) * 7.0 - time * 0.9),
          cos(uv.x * 9.0 - time * 1.1) + sin((uv.x - uv.y) * 6.0 + time * 0.7)
        ) * (0.010 + through * 0.06);
        // Burbujas que suben
        float bub = 0.0; vec2 bOff = vec2(0.0);
        for (int i = 0; i < 9; i++) {
          float fi = float(i);
          vec2 bp = vec2(hash(vec2(fi, 1.0)), fract(hash(vec2(fi, 2.0)) + time * (0.03 + 0.03 * hash(vec2(fi, 3.0)))));
          float r = 0.015 + 0.03 * hash(vec2(fi, 4.0));
          vec2 d = (uv - bp) * vec2(aspect, 1.0);
          float k = smoothstep(r, r * 0.6, length(d));
          bub += k * smoothstep(r * 0.4, r, length(d - vec2(-r, r) * 0.35));
          bOff += d * k * 0.6;
        }
        vec2 iuv = (uv + w + bOff) * imgScale + imgOffset;
        vec3 img = hasImage > 0.5 ? texture(uImage, iuv).rgb : vec3(0.9, 0.5, 0.6);
        // Restos del tinte líquido flotando dentro de la gelatina
        vec3 dyeIn = texture(uDye, vUv + w * 2.0).rgb;
        vec3 tint = vec3(1.0, 0.42, 0.52);
        vec3 jelly = mix(img, img * tint + vec3(0.10, 0.0, 0.03), 0.55 * (1.0 - through));
        jelly += dyeIn * 0.35 * (1.0 - through);
        float band = pow(max(0.0, sin((vUv.x * 0.7 + vUv.y) * 3.0 - time * 0.6)), 24.0);
        jelly += vec3(1.0, 0.9, 0.95) * (band * 0.18 + bub * 0.35) * (1.0 - through);
        float vig = smoothstep(1.15, 0.35, length((vUv - 0.5) * vec2(aspect, 1.0)));
        jelly *= mix(0.75, 1.0, vig);

        vec3 col = mix(liquid, jelly, mixLens);
        float alpha = 1.0 - smoothstep(0.55, 1.0, through);
        o = vec4(col, alpha);
      }`,
  };

  function start(canvas, opts = {}) {
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl || !gl.getExtension('EXT_color_buffer_float')) return null;
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    const SIM = small ? 96 : 128, DYE = small ? 512 : 1024;

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, BASE_VS);
    const progs = {};
    for (const [name, src] of Object.entries(FS)) {
      const p = gl.createProgram();
      gl.attachShader(p, vs);
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, src));
      gl.bindAttribLocation(p, 0, 'aPos');
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const u = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
      progs[name] = { p, u };
    }

    const fbo = (w, h, internal, format) => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { tex, fb, w, h };
    };
    const double = (w, h, internal, format) => {
      let a = fbo(w, h, internal, format), b = fbo(w, h, internal, format);
      return { get read() { return a; }, get write() { return b; }, swap() { [a, b] = [b, a]; }, w, h };
    };
    const ratio = () => (canvas.clientWidth || window.innerWidth) / Math.max(1, canvas.clientHeight || window.innerHeight);
    const dims = (res) => {
      const r = ratio();
      return r > 1 ? [Math.round(res * r), res] : [res, Math.round(res / r)];
    };
    let [sw, sh] = dims(SIM), [dw, dh] = dims(DYE);
    const velocity = double(sw, sh, gl.RG16F, gl.RG);
    const dye = double(dw, dh, gl.RGBA16F, gl.RGBA);
    const divergence = fbo(sw, sh, gl.R16F, gl.RED);
    const curlF = fbo(sw, sh, gl.R16F, gl.RED);
    const pressure = double(sw, sh, gl.R16F, gl.RED);

    // Foto para la lente
    const imgTex = gl.createTexture();
    let hasImage = 0, imgAspect = 1;
    if (opts.image) {
      const img = new Image();
      img.onload = () => {
        try {
          gl.bindTexture(gl.TEXTURE_2D, imgTex);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          imgAspect = img.naturalWidth / img.naturalHeight;
          hasImage = 1;
        } catch (e) { hasImage = 0; }
      };
      img.src = opts.image;
    }

    const blit = (target) => {
      if (target) { gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb); gl.viewport(0, 0, target.w, target.h); }
      else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); }
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    let unit = 0;
    const use = (name, texel) => {
      const pr = progs[name];
      gl.useProgram(pr.p);
      unit = 0;
      if (pr.u.texel) gl.uniform2f(pr.u.texel, texel[0], texel[1]);
      return pr.u;
    };
    const bindTex = (loc, tex) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(loc, unit++);
    };

    const PALETTE = [[1.0, 0.25, 0.55], [0.95, 0.1, 0.35], [1.0, 0.5, 0.7], [0.85, 0.15, 0.6], [1.0, 0.35, 0.3]];
    function splat(x, y, dx, dy, color) {
      const st = [1 / sw, 1 / sh];
      let u = use('splat', st);
      bindTex(u.uTarget, velocity.read.tex);
      gl.uniform1f(u.aspect, ratio());
      gl.uniform2f(u.point, x, y);
      gl.uniform3f(u.color, dx, dy, 0);
      gl.uniform1f(u.radius, 0.0028);
      blit(velocity.write); velocity.swap();
      u = use('splat', [1 / dw, 1 / dh]);
      bindTex(u.uTarget, dye.read.tex);
      gl.uniform1f(u.aspect, ratio());
      gl.uniform2f(u.point, x, y);
      const c = color || PALETTE[(Math.random() * PALETTE.length) | 0];
      const k = small ? 0.42 : 0.7;
      gl.uniform3f(u.color, c[0] * k, c[1] * k, c[2] * k);
      gl.uniform1f(u.radius, 0.006);
      blit(dye.write); dye.swap();
    }

    let mixLens = 0, through = 0, running = true, last = performance.now(), dyeFade = 0.55;
    const t0 = performance.now();
    function step(dt) {
      const st = [1 / sw, 1 / sh];
      let u = use('curl', st); bindTex(u.uVelocity, velocity.read.tex); blit(curlF);
      u = use('vorticity', st); bindTex(u.uVelocity, velocity.read.tex); bindTex(u.uCurl, curlF.tex);
      gl.uniform1f(u.curl, 22); gl.uniform1f(u.dt, dt); blit(velocity.write); velocity.swap();
      u = use('divergence', st); bindTex(u.uVelocity, velocity.read.tex); blit(divergence);
      u = use('scale', st); bindTex(u.uTex, pressure.read.tex); gl.uniform1f(u.value, 0.8); blit(pressure.write); pressure.swap();
      u = use('pressure', st); bindTex(u.uDivergence, divergence.tex);
      for (let i = 0; i < 18; i++) { bindTex(u.uPressure, pressure.read.tex); unit = 1; blit(pressure.write); pressure.swap(); }
      u = use('gradient', st); bindTex(u.uPressure, pressure.read.tex); bindTex(u.uVelocity, velocity.read.tex); blit(velocity.write); velocity.swap();
      u = use('advect', st); bindTex(u.uVelocity, velocity.read.tex); bindTex(u.uSource, velocity.read.tex);
      gl.uniform1f(u.dt, dt); gl.uniform1f(u.dissipation, 0.25); blit(velocity.write); velocity.swap();
      u = use('advect', st); bindTex(u.uVelocity, velocity.read.tex); bindTex(u.uSource, dye.read.tex);
      gl.uniform1f(u.dt, dt); gl.uniform1f(u.dissipation, dyeFade); blit(dye.write); dye.swap();
    }
    function render(time) {
      const W = Math.round(canvas.clientWidth * Math.min(devicePixelRatio, 1.5));
      const H = Math.round(canvas.clientHeight * Math.min(devicePixelRatio, 1.5));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      const u = use('display', [1 / dw, 1 / dh]);
      bindTex(u.uDye, dye.read.tex);
      bindTex(u.uImage, imgTex);
      // Recorte tipo "cover" de la foto
      const sa = W / H;
      let sx = 1, sy = 1;
      if (imgAspect > sa) sx = sa / imgAspect; else sy = imgAspect / sa;
      gl.uniform2f(u.imgScale, sx, sy);
      gl.uniform2f(u.imgOffset, (1 - sx) / 2, (1 - sy) * 0.35);
      gl.uniform1f(u.mixLens, mixLens);
      gl.uniform1f(u.through, through);
      gl.uniform1f(u.time, time);
      gl.uniform1f(u.hasImage, hasImage);
      gl.uniform1f(u.aspect, sa);
      gl.disable(gl.BLEND);
      blit(null);
    }
    function frame(now) {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (mixLens < 1) step(dt);
      render((now - t0) / 1000);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // Interacción: el dedo o el mouse empujan la gelatina
    let lastP = null;
    const toUv = (e) => {
      const r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    };
    const onMove = (e) => {
      const p = toUv(e);
      if (lastP) {
        const dx = (p[0] - lastP[0]) * 6000, dy = (p[1] - lastP[1]) * 6000;
        if (Math.abs(dx) + Math.abs(dy) > 1) splat(p[0], p[1], dx, dy);
      }
      lastP = p;
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', (e) => {
      lastP = toUv(e);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        splat(lastP[0], lastP[1], Math.cos(a) * 900, Math.sin(a) * 900);
      }
    });
    canvas.addEventListener('pointerleave', () => { lastP = null; });

    return {
      splat,
      setMix(v) { mixLens = v; },
      setThrough(v) { through = v; },
      setDyeFade(v) { dyeFade = v; },
      stop() { running = false; },
    };
  }

  window.GelatinaGL = { start };
})();
