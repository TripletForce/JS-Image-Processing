//Get the svg
let svg = document.getElementById("svg");
let svgns = "http://www.w3.org/2000/svg";

// Class elements
const DRAGGABLE_ELEMENT = "draggable-element"
const PROJECT_ROOT = "project-root"
const SNAP_SIZE = 6; //px
const SNAP_LINES_GROUP = "snap-lines"

///View Box///
//GLOBALS
const Center = 500;   //X and Y values are same (square)
let scale  = 200;   //Scale at which the svg is viewed
let position = {x: 0, y:0, z:0}; //Edit for screen position

//Sets the View box Area
function updateView(){
    //Set the Viewing Area
    let topRight   = Center-scale;
    let bottomLeft = 2*scale;
    let viewBox = [
        topRight+position.x, 
        topRight+position.y,
        bottomLeft,
        bottomLeft
    ];
    svg.setAttribute("viewBox", viewBox.join(" ")); 
}
updateView(); //initalize

//Zoom with scrolling (Works with Trackpad!)
const ScrollSencitivity = 0.1;
const DefaultScreenSize = 200;
function clamp(number, min, max){
    if(number<min)return(min);
    if(number>max)return(max);
    return(number);
}
window.onwheel = function (e) {
    e.preventDefault();
    //Use e.deltaY to affect scale
    scale = clamp(e.deltaY * ScrollSencitivity + scale, 10, Center+100);
    //Update the view
    updateView();
}



//Returns an {x, y} of where the a coordinate was
function transformSvgCoordinate(coord){
    const pt = svg.createSVGPoint();
    // pass coordinates
    pt.x = coord.x || 0;
    pt.y = coord.y || 0;
    return(pt.matrixTransform(svg.getScreenCTM().inverse()));
}

//Returns an {x, y} of where the click was
function getSvgCoordinate(e){
    const pt = svg.createSVGPoint();
    // pass event coordinates
    pt.x = e.clientX;
    pt.y = e.clientY;
    // transform to SVG coordinates
    return(pt.matrixTransform(svg.getScreenCTM().inverse()));
}


function getSnapValues(ignoreElement){
    let snapX = [];
    let snapY = [];

    for(let element of document.getElementById(PROJECT_ROOT).children){
        if(element === ignoreElement) continue;

        // Enter in all sides
        const rect = element.getBoundingClientRect();
        snapX.push(rect.left);
        snapX.push(rect.right);
        snapY.push(rect.top);
        snapY.push(rect.bottom);
    }

    return {snapX, snapY}
}

function detectSnap(edgePosition, snapValues){
    for(let snapEdge of snapValues){
        if(Math.abs(edgePosition - snapEdge) < SNAP_SIZE) return snapEdge;
    }
    return null;
}

let mouseDown = false;
let origionalMouse;			//Coordinates of mouse down
let cursor = null;
let dragElement = null;
let elementStartingPosition = null;

let snapPositions;

svg.onmousedown = e => {
    //Update mouse vars
    mouseDown = true;
    var click = getSvgCoordinate(e);
    origionalMouse = click;

    //If a movable object was hit, let the event listners do its part.
    if(e.target.classList.contains(DRAGGABLE_ELEMENT)){
        dragElement = e.target;
        elementStartingPosition = {x: parseFloat(dragElement.style.left), y: parseFloat(dragElement.style.top)};

        snapPositions = getSnapValues(e.target);
    }
}

svg.onmouseup = svg.onmouseleave = e => {
    mouseDown = false;
    dragElement = null;

    // Remove all snap lines
    let gridLines = document.getElementById(SNAP_LINES_GROUP);
    gridLines.replaceChildren();
}

svg.onmousemove = e => {
    cursor = getSvgCoordinate(e);
    if(!mouseDown) return;

    // Remove all snap lines
    let gridLines = document.getElementById(SNAP_LINES_GROUP);
    gridLines.replaceChildren();

    // Move the object
    if(dragElement !== null){
        dragElement.style.left = elementStartingPosition.x - (origionalMouse.x-cursor.x) + 'px';
        dragElement.style.top = elementStartingPosition.y - (origionalMouse.y-cursor.y) + 'px';

        // If the object is close to another object, snap the object border's together
        const rect = dragElement.getBoundingClientRect();
        let svgLines = ''

        // X Snap
        let leftSnap = detectSnap(rect.left, snapPositions.snapX);
        if(leftSnap !== null) {
            let xCoord = transformSvgCoordinate({x: leftSnap}).x;
            svgLines += `<path d="M ${xCoord} 0 L ${xCoord} 1000" stroke="lightblue" stroke-width="1" />`;
            dragElement.style.left = xCoord + 'px';
        }

        let rightSnap = detectSnap(rect.right, snapPositions.snapX);
        if(rightSnap !== null) {
            let xCoord = transformSvgCoordinate({x: rightSnap}).x;
            svgLines += `<path d="M ${xCoord} 0 L ${xCoord} 1000" stroke="lightblue" stroke-width="1" />`;
            dragElement.style.left = (xCoord - dragElement.clientWidth) + 'px';
        }

        // Y Snap
        let topSnap = detectSnap(rect.top, snapPositions.snapY);
        if(topSnap !== null) {
            let yCoord = transformSvgCoordinate({y: topSnap}).y
            svgLines += `<path d="M 0 ${yCoord} L 1000 ${yCoord}" stroke="lightblue" stroke-width="1" />`;
            dragElement.style.top = yCoord + 'px';
        }

        let bottomSnap = detectSnap(rect.bottom, snapPositions.snapY);
        if(bottomSnap !== null) {
            let yCoord = transformSvgCoordinate({y: bottomSnap}).y
            svgLines += `<path d="M 0 ${yCoord} L 1000 ${yCoord}" stroke="lightblue" stroke-width="1" />`;
            dragElement.style.top = (yCoord - dragElement.clientHeight) + 'px';
        }

        gridLines.innerHTML = svgLines;
    }

    // Move the position of the screen.
    else {
        position.x += origionalMouse.x-cursor.x;
        position.y += origionalMouse.y-cursor.y;
        updateView();
    }
}

const root = document.getElementById("project-root");

window.addEventListener('paste', (e) => {
  // Access items inside the clipboard
  const items = e.clipboardData.items;

  for (let i = 0; i < items.length; i++) {
    // Check if the pasted item is an image
    if (items[i].type.indexOf('image') !== -1) {
      // Prevent default browser paste behavior
      e.preventDefault();

      // Convert the item into a file object
      const imageFile = items[i].getAsFile();

      // Create a temporary local URL for the image file
      const imageUrl = URL.createObjectURL(imageFile);

      // Inject the image into your HTML page
      onPasteImage(imageUrl);

      break; // Stop looking once the image is found
    }
  }
});


function onPasteImage(imageUrl){
    const imgElement = document.createElement('img');
    imgElement.src = imageUrl;

    imgElement.onload = () => {
        // Set the image to the cursor of the mouse
        let {x, y} = cursor;
        imgElement.style.position = "absolute"
        imgElement.style.left = (x - imgElement.clientWidth / 2) + "px";
        imgElement.style.top = (y - imgElement.clientHeight / 2) + "px";
        imgElement.classList.add(DRAGGABLE_ELEMENT);

        imgElement.draggable = false;
        imgElement.style.userSelect = "none";
        imgElement.style.webkitUserDrag = "none";
    }

    root.appendChild(imgElement);
}


