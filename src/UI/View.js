const SVG_ELEMENT = document.getElementById("svg");
const PROJECT_ROOT = document.getElementById("project-root");
const DRAGGABLE_ELEMENT = "draggable-element"
const SNAP_LINES_GROUP = "snap-lines"

// Scalar values
const Center = 500;   //X and Y values are same (square)
const ScrollSencitivity = 0.1;
const SNAP_SIZE = 6; //px

export default class View{
    constructor(){
        this.scale  = 200;
        this.x = 0; 
        this.y = 0; 
        this.z = 0;

        // State
        this.mouseDownState = false;
        this.origionalMousePosition = null;
        this.dragElement = null;

        // Event Listner
        SVG_ELEMENT.onwheel = this.onWheel.bind(this);
        SVG_ELEMENT.onmousedown = this.mouseDown.bind(this);
        SVG_ELEMENT.onmousemove = this.mouseMove.bind(this);
        SVG_ELEMENT.onmouseup = this.mouseExit.bind(this);
        SVG_ELEMENT.onmouseleave = this.mouseExit.bind(this);
        window.addEventListener('paste', this.onPaste.bind(this));

        // Update View
        this.updateView();
    }

    updateView(){
        let topRight = Center-this.scale;
        let bottomLeft = 2*this.scale;
        SVG_ELEMENT.setAttribute("viewBox", [
            topRight+this.x, 
            topRight+this.y,
            bottomLeft,
            bottomLeft
        ].join(" ")); 
    }

    // SVG Coordinate of mouse click
    getSvgCoordinate(e){
        const pt = SVG_ELEMENT.createSVGPoint();
        // pass event coordinates
        pt.x = e.clientX;
        pt.y = e.clientY;
        // transform to SVG coordinates
        return(pt.matrixTransform(SVG_ELEMENT.getScreenCTM().inverse()));
    }

    // Coordinate on Screen -> Coordinate on SVG
    transformSvgCoordinate(x, y){
        const pt = SVG_ELEMENT.createSVGPoint();
        pt.x = x;
        pt.y = y;
        return(pt.matrixTransform(SVG_ELEMENT.getScreenCTM().inverse()));
    }

    // Clamp value between 2 numbers
    static _clamp(number, min, max){
        if(number<min)return(min);
        if(number>max)return(max);
        return(number);
    }



    /* Event Listners */
    onWheel(e){
        e.preventDefault();
        this.scale = View._clamp(e.deltaY * ScrollSencitivity + this.scale, 10, Center+100);
        this.updateView();
    }

    mouseDown(e){
        this.mouseDownState = true;
        var click = this.getSvgCoordinate(e);
        this.origionalMousePosition = click;

        // If the element is a draggable element
        if(e.target.classList.contains(DRAGGABLE_ELEMENT)) this.mouseDownDrag(e);
    }

    mouseExit(e){
        this.mouseDownState = false;
        this.dragElement = null;
        this.removeGridLines();
    }

    mouseMove(e){
        this.cursor = this.getSvgCoordinate(e);
        if(!this.mouseDownState) return;

        // If the element is a draggable element
        if(this.dragElement !== null) {
            this.mouseMoveDrag(e);
            return;
        }

        this.x += this.origionalMousePosition.x-this.cursor.x;
        this.y += this.origionalMousePosition.y-this.cursor.y;
        this.updateView();
    }



    /* Moving Elements */
    mouseDownDrag(e){
        this.dragElement = e.target;
        this.elementStartingPosition = {x: parseFloat(this.dragElement.style.left), y: parseFloat(this.dragElement.style.top)};
        this.snapPositions = this.getSnapValues(e.target);
    }

    mouseMoveDrag(e){
        this.dragElement.style.left = this.elementStartingPosition.x - (this.origionalMousePosition.x-this.cursor.x) + 'px';
        this.dragElement.style.top  = this.elementStartingPosition.y - (this.origionalMousePosition.y-this.cursor.y) + 'px';

        // If the object is close to another object, snap the object border's together
        const rect = this.dragElement.getBoundingClientRect();
        let svgLines = '';

        // X Snap
        let leftSnap = this.detectSnap(rect.left, this.snapPositions.snapX);
        if(leftSnap !== null) {
            let xCoord = this.transformSvgCoordinate(leftSnap, 0).x;
            svgLines += `<path d="M ${xCoord} 0 L ${xCoord} 1000" stroke="lightblue" stroke-width="1" />`;
            this.dragElement.style.left = xCoord + 'px';
        }

        let rightSnap = this.detectSnap(rect.right, this.snapPositions.snapX);
        if(rightSnap !== null) {
            let xCoord = this.transformSvgCoordinate(rightSnap, 0).x;
            svgLines += `<path d="M ${xCoord} 0 L ${xCoord} 1000" stroke="lightblue" stroke-width="1" />`;
            this.dragElement.style.left = (xCoord - this.dragElement.clientWidth) + 'px';
        }

        // Y Snap
        let topSnap = this.detectSnap(rect.top, this.snapPositions.snapY);
        if(topSnap !== null) {
            let yCoord = this.transformSvgCoordinate(0, topSnap).y;
            svgLines += `<path d="M 0 ${yCoord} L 1000 ${yCoord}" stroke="lightblue" stroke-width="1" />`;
            this.dragElement.style.top = yCoord + 'px';
        }

        let bottomSnap = this.detectSnap(rect.bottom, this.snapPositions.snapY);
        if(bottomSnap !== null) {
            let yCoord = this.transformSvgCoordinate(0, bottomSnap).y;
            svgLines += `<path d="M 0 ${yCoord} L 1000 ${yCoord}" stroke="lightblue" stroke-width="1" />`;
            this.dragElement.style.top = (yCoord - this.dragElement.clientHeight) + 'px';
        }

        document.getElementById(SNAP_LINES_GROUP).innerHTML = svgLines;
    }



    /* Grid Lines */
    removeGridLines(){
        let gridLines = document.getElementById(SNAP_LINES_GROUP);
        gridLines.replaceChildren();
    }

    getSnapValues(ignoreElement){
        let snapX = [];
        let snapY = [];

        for(let element of PROJECT_ROOT.children){
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

    detectSnap(edgePosition, snapValues){
        for(let snapEdge of snapValues){
            if(Math.abs(edgePosition - snapEdge) < SNAP_SIZE) return snapEdge;
        }
        return null;
    }



    /* Pasting Image */
    onPaste(e){
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
                this.onPasteImage(imageUrl);

                break; // Stop looking once the image is found
            }
        }
    }

    determineScalar(width, height){
        // Determine a size that reasonablly fits on the viewport...
        return this.scale / Math.min(width, height) ;
    }

    onPasteImage(imageUrl){
        const imgElement = document.createElement('img');
        imgElement.src = imageUrl;

        imgElement.onload = () => {
            // CSS Properties
            imgElement.style.position = "absolute"
            imgElement.classList.add(DRAGGABLE_ELEMENT);
            imgElement.draggable = false;
            imgElement.style.userSelect = "none";
            imgElement.style.webkitUserDrag = "none";

            // Set the image to the cursor of the mouse
            let {x, y} = this.cursor;
            let scalar = this.determineScalar(imgElement.clientWidth, imgElement.clientHeight);
            let width = imgElement.clientWidth * scalar;
            let height = imgElement.clientHeight * scalar;
            imgElement.style.left = (x - width / 2) + "px";
            imgElement.style.top = (y - height / 2) + "px";
            imgElement.style.width = width + "px";
            imgElement.style.height = height + "px";
        }

        PROJECT_ROOT.appendChild(imgElement);
    }



    /* Rotating Images */

}