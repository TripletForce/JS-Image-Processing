const canvas = document.getElementById("display-canvas");
const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

if (!gl) {
    console.error("WebGL not supported in this browser.");
}

/* --- Vertex Shader (for both passes) --- */
const vShader = `
attribute vec4 aVertexPosition;
varying vec2 vUV;

void main() {
    gl_Position = aVertexPosition;
    vUV = (aVertexPosition.xy * 0.5) + 0.5;
}`;

/* --- Fragment Shader: first pass (draw something to texture) --- */
const fShader1 = `
precision mediump float;
varying vec2 vUV;
uniform float uTime;

void main() {
    // Animate color over time
    gl_FragColor = vec4(vUV.x + 0.5*sin(uTime), vUV.y + 0.5*cos(uTime), 0.5 + 0.5*sin(uTime*0.5), 1.0);
}`;

/* --- Fragment Shader: second pass (draw texture to screen) --- */
const fShader2 = `
precision mediump float;
varying vec2 vUV;
uniform sampler2D uTexture;

void main() {
    gl_FragColor = texture2D(uTexture, vUV);
}`;

/* --- Shader helpers --- */
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader error", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vSource, fSource) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fSource);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error", gl.getProgramInfoLog(program));
    }
    return program;
}



/* --- Setup first pass program --- */
const program1 = createProgram(gl, vShader, fShader1);
const aVertexPosition1 = gl.getAttribLocation(program1, "aVertexPosition");
const uTime1 = gl.getUniformLocation(program1, "uTime");

/* --- Setup second pass program --- */
const program2 = createProgram(gl, vShader, fShader2);
const aVertexPosition2 = gl.getAttribLocation(program2, "aVertexPosition");
const uTexture2 = gl.getUniformLocation(program2, "uTexture");







/* --- Setup fullscreen quad --- */
const positions = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1,
]);
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);






/* --- Setup framebuffer and texture --- */
function createFrameBufferTextureLinkedObject() {
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0); // mip level 0

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        console.error("Framebuffer not complete!");
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Back to default framebuffer

    // Return both the FBO and the texture object
    return { fbo, texture };
}

const fboTexObject = createFrameBufferTextureLinkedObject();
console.log(fboTexObject.texture); // This is the texture you render into





/* --- Render loop --- */
function render(time) {
    time *= 0.001; // seconds

    // --- First pass: render to texture ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboTexObject.fbo);            // fbo - output
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program1);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(aVertexPosition1);
    gl.vertexAttribPointer(aVertexPosition1, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(uTime1, time);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // --- Second pass: render texture to screen ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);           // null - default output (canvas)
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program2);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(aVertexPosition2);
    gl.vertexAttribPointer(aVertexPosition2, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fboTexObject.texture); // input texture - TEXTURE0
    gl.uniform1i(uTexture2, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
