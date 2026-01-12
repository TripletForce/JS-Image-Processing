/**
 * Here how this works: 
 * 
 * The program relies on a buffer as a base. Execute a program, and it will write to the buffer. Use a mask to apply to certain section.
 * When done, send it to the canvas for display. All the programs execute on the same buffer. Trade that buffer out to do more interesting things.
 * 
 * You can save / load buffers, as well as loading images.
*/
import { Program, Buffer, loadImage } from "./Core.js";
import DependencyForge from "./DependencyForge.js";

function ShaderPipeline(gl, canvasWidth, canvasHeight){
  this.gl = gl;
  this.w = canvasWidth;
  this.h = canvasHeight;

  // The setup uses ping pong buffers.
  this.currentbuffer = null;
  this.buffers = {};

  // The programs, which can be cached.
  this.df = new DependencyForge();
  this.buildCache = {};

  // The pass through program
  this._passProgram = new Program(this.gl, this.df.build('pass'));

  // This is for saving / loading buffers
  this.savedBuffers = {};
}

ShaderPipeline.prototype.addDependency = function(code){
  this.df.registerShaderDependency(code);
}

ShaderPipeline.prototype.executeProgram = function(program, uniforms={}, mask=null){
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
  if(mask) throw new NotImplementedError("Masking not yet implemented in ShaderPipeline.");

  // Run the program
  let outputBuffer = new Buffer(this.gl, this.w, this.h);
  programObject.execute(this.currentbuffer, outputBuffer, this.w, this.h, uniforms);
  this.currentbuffer = outputBuffer;
}

ShaderPipeline.prototype.loadImage = async function(src){
  this.currentbuffer = await loadImage(this.gl, src);
}

ShaderPipeline.prototype.sendToCanvas = function(){
  this._passProgram.execute(this.currentbuffer, null, this.w, this.h);
}

ShaderPipeline.prototype.bufferSave = function(name){
  this.savedBuffers[name] = this.currentbuffer;
}

ShaderPipeline.prototype.bufferLoad = function(name){
  if(!Object.keys(this.savedBuffers).includes(name)){
    throw new Error(`No saved buffer with name ${name}`);
  }
  this.currentbuffer = this.savedBuffers[name];
}


export default new Proxy(ShaderPipeline, {
  construct(target, args, newTarget) {
    function createQueuedPipeline(pipeline) {
      const queue = [];

      return new Proxy(pipeline, {
        get(target, prop, receiver) {

          // submit executes immediately
          if (prop === "submit") {
            return async function () {
              for (const task of queue) {
                await task();
              }
              queue.length = 0;
            };
          }

          const value = target[prop];

          // allow normal property access
          if (typeof value !== "function") {
            return value;
          }

          // queue method calls
          return function (...args) {
            queue.push(() => value.apply(target, args));
            return receiver;
          };
        }
      });
    }

    const instance = Reflect.construct(target, args, newTarget);
    return createQueuedPipeline(instance);
  }
});
