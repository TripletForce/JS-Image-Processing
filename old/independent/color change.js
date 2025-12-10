const canvas = document.getElementById("display-canvas");
const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

if (!gl) {
    console.error("WebGL not supported in this browser.");
}

/* Vertex Shader */
const vShader = `
attribute vec4 aVertexPosition;
varying vec2 vUV;

void main() {
    gl_Position = aVertexPosition;
    vUV = (aVertexPosition.xy * 0.5) + 0.5;
}`;

/* Fragment Shader with time uniform */
const fShader = `
precision mediump float;
varying vec2 vUV;
uniform float uTime;

void main() {
    gl_FragColor = vec4(
        vUV.x + 0.5 * sin(uTime),
        vUV.y + 0.5 * cos(uTime),
        0.5 + 0.5 * sin(uTime * 0.5),
        1.0
    );
}`;

/* Shader creation function */
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

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vShader);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program linking error", gl.getProgramInfoLog(program));
}

gl.useProgram(program);

/* Triangle setup */
const positions = new Float32Array([
    -1.0, -1.0,
     3.0, -1.0,
    -1.0,  3.0,
]);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

const aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
gl.enableVertexAttribArray(aVertexPosition);
gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

/* Get the time uniform location */
const uTime = gl.getUniformLocation(program, "uTime");

/* Animation loop */
function render(time) {
    time *= 0.001; // convert to seconds

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Update the time uniform
    gl.uniform1f(uTime, time);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
