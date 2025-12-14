import { Program, Buffer } from "../../src/WebGL_Translation/core.js";
import DependencyForge from "../../src/WebGL_Translation/dependencyforge.js";

// Opengl Canvas
const canvas = document.getElementById('display-canvas');
const gl = canvas.getContext("webgl");

const fShader1 = `
precision mediump float;
varying vec2 vUV;

void main() {
    gl_FragColor = vec4(1.0,0.0,0.0,1.0);
}`;

const fShader2 = `
precision mediump float;
varying vec2 vUV;
uniform sampler2D uTexture;

void main() {
    gl_FragColor = texture2D(uTexture, vUV);
}`;



const program1 = new Program(gl, fShader1);
const program2 = new Program(gl, fShader2);

const buffer = new Buffer(gl, canvas.width, canvas.height);

program1.execute(null, buffer, canvas.width, canvas.height);
program2.execute(buffer, null, canvas.width, canvas.height);
