/**
 * Use the following lines of code:
 *  let df = new DependencyForge();
 *  df.registerShaderDependency(code);
 *  df.build(main);
 * 
 * Code is individual functions. Use @export and @import to define modules. The program will remove the annotations and assemble the progam.
 */

class CiruclarDependencyError extends Error {
  constructor(module) {
    super(`Adding "${module.shaderExport}" would cause a circular dependency.`); 
    this.name = "Ciruclar Dependency Error";
    this.module = module;
  }
}

function generateHeader(name, length) {
    const spacingLength = (length - name.length) / 2;
    const spacing = '-'.repeat(Math.floor(spacingLength));
    const evenSpacing = spacingLength === Math.floor(spacingLength);
    return '/*' + spacing + (evenSpacing ? " " : "- ") + name + " " + spacing + '*/\n'
}

const getFragmentShader = (modules, main, options = {}) => {
    const maxLength = Math.max(20, ...modules.map(m => m.shaderExport.length))+4;
    const program = modules.map(module => generateHeader(module.shaderExport, maxLength)+module.shaderProgram).join("\n")

    return `
precision ${options.presision || "mediump"} float;
varying vec2 vUV;


\n${program}
void main() {
    gl_FragColor = ${main}();
}
    `
}

export default function DependencyForge(){
    this.dependencies = {};
}

DependencyForge.prototype.registerShaderDependency = function(fSource){
    const lines = fSource.split('\n');

    // Get all the indecies where the line starts with '@' AKA annotations
    const libNotesIndecies = lines.map((line, index) => line[0] === '@' ? index : -1).filter(v => v !== -1);
    let shaderExport;
    let shaderImport = [];

    // Process the annotations statements
    for(let i of libNotesIndecies.reverse()){
        let annotation = lines.splice(i, 1)[0];
        if(annotation.startsWith('@import ')) shaderImport.push(annotation.substring(8).trim())
        if(annotation.startsWith('@export ')) shaderExport = annotation.substring(8).trim()
    }

    // Remove leading new lines
    while(lines.length > 0 && lines[0].trim() === '') lines.shift();

    // Add the program to the list of dependencies
    this.dependencies[shaderExport] = {
        shaderProgram: lines.join('\n'), 
        shaderExport,
        shaderImport
    }

    // Use the export as the main identifier of what was loaded
    return shaderExport; 
}

DependencyForge.prototype.build = function(main, options={}){
    // Start with the main, recursivly get functions
    let dependencyOrder = [];

    // Recursivly add dependencies
    let fillDependencyOrder = (moduleName, index) => {
        let module = this.dependencies[moduleName];

        let includedIndex = dependencyOrder.indexOf(module)
        if(includedIndex !== -1){
            if(index<includedIndex) return;
            else throw new CiruclarDependencyError(module)
        }

        // Add the module to the list
        dependencyOrder.splice(index+1, 0, module);

        // Loop over all the dependencies
        for(let child of module.shaderImport){
            fillDependencyOrder(child, index+1);
        }
    }
    fillDependencyOrder(main, 0);

    // Fill in information
    return getFragmentShader(dependencyOrder, main, options);
}