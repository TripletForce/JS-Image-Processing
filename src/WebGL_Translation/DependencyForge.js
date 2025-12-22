/**
 * Use the following lines of code:
 *  let df = new DependencyForge();
 *  df.registerShaderDependency(code);
 *  df.build(main);
 * 
 * Code is individual functions. Use @export and @import to define modules. The program will remove the annotations and assemble the progam.
 */

import LIBRARIES from './Library.js'

function generateHeader(name, length) {
    const spacingLength = (length - name.length) / 2;
    const spacing = '-'.repeat(Math.floor(spacingLength));
    const evenSpacing = spacingLength === Math.floor(spacingLength);
    return '/*' + spacing + (evenSpacing ? " " : "- ") + name + " " + spacing + '*/\n'
}

class CiruclarDependencyError extends Error {
  constructor(module) {
    super(`Adding "${module.shaderExport}" would cause a circular dependency.`); 
    this.name = "Ciruclar Dependency Error";
    this.module = module;
  }
}

class UndelcaredExportError extends Error {
    constructor(program) {
        const maxLength = Math.max(20, ...program.split('\n').map(line => line.length))+4;
        super(`The following program does not have a export available:\n${generateHeader('Program', maxLength)}\n${program}\n${generateHeader('', maxLength)}`)
    }
}

class ImportDoesNotExist extends Error {
    constructor(module, nonexistantImport) {
        super(`The module "${module.shaderExport}" is expecting "${nonexistantImport}" which does not exist.`);
        this.module = module;
    }
}

const getFragmentShader = (modules, main, exportType, options = {}) => {
    let callExecution = null;
    switch(exportType){
        case 'float':
            callExecution = `\tfloat v = ${main}();\n\tgl_FragColor = vec4(v,v,v,1.0);`
            break;
        case 'vec2':
            callExecution = `vec2 v = ${main}();\n\tgl_FragColor = vec4(v,0.0,1.0);`
        case 'vec2':
            callExecution = `vec2 v = ${main}();\n\tgl_FragColor = vec4(v,1.0);`
        case 'vec4':
            callExecution = `\tgl_FragColor = ${main}();`;
            break;
        case 'boolean':
        case 'int':
        case 'uint':
        default:
            //TODO: throw error
    }

    const maxLength = Math.max(20, ...modules.map(m => m.shaderExport.length))+4;
    const program = modules.map(module => generateHeader(module.shaderExport, maxLength)+module.shaderProgram).join("\n")

    return `
precision ${options.presision || "mediump"} float;
varying vec2 vUV;
${program.includes('uTexture') ? "uniform sampler2D uTexture;" : "" }
\n${program}
void main() {\n${callExecution}\n}
    `.trim();
}

export default function DependencyForge(){
    this.dependencies = {};
   
    for(let lib of LIBRARIES) this.registerShaderDependency(lib);
}

DependencyForge.prototype.registerShaderDependency = function(fSource){
    let lines = fSource.split('\n');

    let shaderExport = null;
    let exportType = null;
    let shaderImport = [];

    // Search for the word "import " or the word "export ", and to the list of dependecies
    lines = lines.map(raw => {
        //Cleanup
        let line = raw.trim();
        if(raw.length===0) return '';

        // use export <functype> <funcname>(<args>){ ... }
        if(line.startsWith('export ')) {
            let exportFuncDecl = line.substring(line.indexOf('export ') + 7, line.length).trim();
            let splitIndex1 = exportFuncDecl.indexOf(' ');
            let splitIndex2 = exportFuncDecl.indexOf('(');
            exportType = exportFuncDecl.substring(0, splitIndex1).trim();
            shaderExport = exportFuncDecl.substring(splitIndex1, splitIndex2).trim();
            return exportFuncDecl;
        }

        // use import <funcname>
        if(line.startsWith('import ')) {
            let importFunc = line.substring(line.indexOf('import ') + 7, line.length).trim();
            shaderImport.push(importFunc);
            return '';
        }

        // use overload <functype> <funcname>(<args>){ ... }
        if(line.startsWith('overload ')){
            return line.substring(line.indexOf('overload ') + 9, line.length).trim();
        }

        return line;
    });

    // Remove leading new lines
    while(lines.length > 0 && lines[0].trim() === '') lines.shift();

    // If missing export module, throw error
    if(shaderExport === null) throw new UndelcaredExportError(fSource);

    // Conflicting export names, throw error
    // TODO: fix
    //if(this.dependencies.includes(shaderExport)) throw new ConflictingExportError(shaderExport);

    // Add the program to the list of dependencies
    this.dependencies[shaderExport] = {
        shaderProgram: lines.join('\n'), 
        shaderExport,
        exportType,
        shaderImport
    }

    // Use the export as the main identifier of what was loaded
    return shaderExport; 
}

DependencyForge.prototype.build = function(main, options={}){
    // Basic Idea: recurisvly insert dependencies depth first - 
    //  To the left: parent & unprocessed peer nodes
    //  To the right: all dependencies

    // Start with the main, recursivly get functions
    let dependencyOrder = [];

    // Recursivly add dependencies
    let fillDependencyOrder = (moduleName, index, parent) => {
        // Check to see if dependency exists
        if(!Object.keys(this.dependencies).includes(moduleName)) throw new ImportDoesNotExist(parent, moduleName);

        // Get the dependency and check for circles
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
            fillDependencyOrder(child, index, module);
        }
    }
    fillDependencyOrder(main, 0, null);

    // Fill in information
    return getFragmentShader(dependencyOrder.reverse(), main, this.dependencies[main].exportType, options);
}