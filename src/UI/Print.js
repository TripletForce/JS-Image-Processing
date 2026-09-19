const svg = document.getElementById("svg");
const PROJECT_ROOT = document.getElementById("project-root");

window.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        // Perform enter key action
        print();
    }
});


function getCompleteViewBox(){
    // Get the rect furthest corners
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;

    for(let element of PROJECT_ROOT.children){
        const rect = element.getBoundingClientRect();
        left = Math.min(left, rect.left);
        top = Math.min(top, rect.top);
        right = Math.max(right, rect.right);
        bottom = Math.max(bottom, rect.bottom);
    }


    // Get the 2 points on the rect
    let topLeft = svg.createSVGPoint();
    topLeft.x = left;
    topLeft.y = top;
    
    let bottomRight = svg.createSVGPoint();
    bottomRight.x = right;
    bottomRight.y = bottom;

    // Take the 2 points and convert to svg space
    let topLeftConverted = topLeft.matrixTransform(svg.getScreenCTM().inverse())
    let bottomRightConverted = bottomRight.matrixTransform(svg.getScreenCTM().inverse())

    // Output
    return {
        x: topLeftConverted.x,
        y: topLeftConverted.y,
        width: bottomRightConverted.x - topLeftConverted.x,
        height: bottomRightConverted.y - topLeftConverted.y
    }
}

function splitIntoPages(x, y, width, height){
    let results = [];
    // Assuming 8.5 tiles wide, and 11 tiles tall.
    // The small lines are 10 svg units wide
    for(let i=x; i<x+width; i+=85){
        for(let j=y; j<y+height; j+=110){
            // Set viewbox
            let viewBox = [ i, j, 85, 110 ];
            svg.setAttribute("viewBox", viewBox.join(" ")); 

            // Convert SVG to URL
            const svgData = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([svgData], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);

            //Add to list
            results.push(url);
        }
    }

    return results;
}


function print(){
    let rect = getCompleteViewBox();
    let pages = splitIntoPages(rect.x, rect.y, rect.width, rect.height);

    // Create HTML page if print
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
        <html>
        <head>
            <style>
                @page {
                    size: Letter portrait;
                    margin: 0;
                }

                html, body {
                    margin: 0;
                    padding: 0;
                }

                img {
                    display: block;
                    width: 8.5in;
                    height: 11in;
                }
            </style>
        </head>
        <body>
            ${pages.map(url => "<img src='"+url+"'>").join('')}
        </body>
        </html>
    `);

    // Print the page
    printWindow.document.close();
    printWindow.onload = () => {
        printWindow.print();
    };
    
}