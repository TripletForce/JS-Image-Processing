/**
 * Here how this works: 
 * 
 * The program relies on a buffer as a base. Execute a program, and it will write to the buffer. Use a mask to apply to certain section.
 * When done, send it to the canvas for display. All the programs execute on the same buffer. Trade that buffer out to do more interesting things.
 * 
 * You can save / load buffers, as well as loading images.
*/
import { Program, Buffer } from "./WebGL_Translation/core.js";
import DependencyForge from "./WebGL_Translation/dependencyforge.js";

function ShaderPipeline(gl, width, height){
    this.gl = gl;
    this.w = width;
    this.h = height;

    // The setup uses ping pong buffers.
    this.currentbuffer = new Buffer(gl, width, height);
    this.buffers = {};

    // The programs, which can be cached.
    this.df = new DependencyForge();
    this.buildCache = {};
}

ShaderPipeline.prototype.addDependency = function(code){
    this.df.registerShaderDependency(code);
}

ShaderPipeline.prototype.executeProgram = function(program, uniform={}, mask=null){
    // Get the program
    let programObject = null;
    if(Object.keys(this.buildCache).includes(program)){
        programObject = this.buildCache[program];
    }
    else {
        programObject = new Program(this.gl, this.df.build(program));
        this.buildCache[program] = programObject;
    }
    
    // TODO: Apply mask

    // Run the program
    let outputBuffer = new Buffer(this.gl, this.w, this.h);
    programObject.executeProgram(this.currentbuffer, outputBuffer, this.w, this.h, uniforms);
    this.currentbuffer = outputBuffer;
}

ShaderPipeline.prototype.loadImage = function(src){
    
}

ShaderPipeline.prototype.sendToCanvas = function(){}

ShaderPipeline.prototype.bufferSave = function(name){}
ShaderPipeline.prototype.bufferLoad = function(name){}