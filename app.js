// Eyedropper support
const hasSupport = () => ('EyeDropper' in window);
const canvas = document.querySelector('.canvas');

// Global Variables
let color = '#000000';
let fillActive = false;
let eraser = false;
let grab = false;
let radial = false;
let shadingSetting = 0;
let shading = 60;
let pixels;
let brushSize = 1;
 
/**
 * control functions
 */

// converting hex to rgba
function colorParse(col = color, alpha = 100) {
    let rgba;
    if (col.length == 7) {
        rgba = col.match(/\w\w/g).map(x => parseInt(x, 16));
    } else {
        rgba = col.match(/[\d.]+/g);  
    } 
    rgba[3] = alpha/100;
    return `rgba(${rgba.join(', ')})`;
}

// shading function
function colorShader(col, shade) {
    let rgba = col.match(/[\d.]+/g);
    for(let i=0; i<3; i++) {
        if(shadingSetting == 1) {
            rgba[i] = (parseInt(rgba[i]) - shade).toString();
        } else {
            rgba[i] = (parseInt(rgba[i]) + shade).toString();
        }  
    }
    return `rgba(${rgba.join(', ')})`;
}

// feather function
function colorFeather(col, distance) {
    col = colorParse(col);
    let rgba = col.match(/[\d.]+/g);
    for(let i=0; i<3; i++) {
        rgba[i] = (parseInt(rgba[i]) + (distance*2)).toString();
    }
    return `rgba(${rgba.join(', ')})`;
}

// color picker handler
const color_input = document.querySelector('#color-picker');
color_input.addEventListener('input', () => {
    if (eraser) {eraser_tool.dispatchEvent(new Event('click'));}
    color = colorParse(color_input.value);
});

// shading button handler 
const shading_btn = document.querySelector('#toggle-shading');
shading_btn.addEventListener('click', () => {
    if (eraser) {eraser_tool.dispatchEvent(new Event('click'));}
    let txt = document.querySelector('#strength_value');
    if(shadingSetting == 0) {
        shadingSetting = 1;
        shading_btn.classList.toggle('darken');
        shading_btn.textContent = 'Darken';
        strength_input.classList.toggle('slider-disabled');
        txt.classList.toggle('disabled');
    } else if (shadingSetting == 1) {
        shadingSetting = 2;
        shading_btn.classList.toggle('lighten');
        shading_btn.classList.toggle('darken');
        shading_btn.textContent = 'Lighten'; 
    } else {
        txt.classList.toggle('disabled');
        strength_input.classList.toggle('slider-disabled');
        shadingSetting = 0;
        shading_btn.classList.toggle('lighten');
        shading_btn.textContent = 'Enable Shading';
        color = colorParse(color_input.value);
    }
});

// strength slider handler
const strength_input = document.querySelector('#strength-slider');
strength_input.addEventListener('change', () => {
    shading = strength_input.value * 0.6;
});

// brush size handler 
const brush_input = document.querySelector('#brush-slider');
brush_input.addEventListener('change', () => {
    brushSize = parseInt(brush_input.value);
});

// toggle grid lines handler
const grid_btn = document.querySelector('#toggle-grid');
grid_btn.addEventListener('click', () => {
    if (grid_btn.innerHTML == 'Hide Grid') {
        grid_btn.textContent = 'Show Grid';
    } else {
        grid_btn.textContent = 'Hide Grid';
    }
    
    canvas.classList.toggle('canvas-borderless');
});

// canvas grid size slider handler
const size_input = document.querySelector('#grid-slider');
size_input.addEventListener('change', () => {
    resetCanvas();
    loadCanvas(size_input.value);
});

// clear button handler
const clear_btn = document.querySelector('#clear');
clear_btn.addEventListener('click', () => {
    resetCanvas();
    loadCanvas();
});


/**
 * tool grid area
 */

// handler to add repeated click event
function onTool(tool, func = () => {null;}) {
    tool.addEventListener('click', () => {
        tool.classList.toggle('clicked');
        func();
    });
}

// fill tool handler
const fill_tool = document.querySelector('#fill');
if (eraser) {eraser_tool.dispatchEvent(new Event('click'));}
onTool(fill_tool, () => {
    if (!fillActive) {
        fillActive = true;
    } else {
        fillActive = false;
    }
});

// eraser tool handler
const eraser_tool = document.querySelector('#eraser');
onTool(eraser_tool, () => {
    if (shadingSetting == 1) {
        shading_btn.dispatchEvent(new Event('click'));
        shading_btn.dispatchEvent(new Event('click'));
    } else if (shadingSetting == 2) {
        shading_btn.dispatchEvent(new Event('click'));
    }
    if (color != 'rgb(255, 255, 255)') {
        eraser = true;
        color = 'rgb(255, 255, 255)';
    } else {
        eraser = false;
        color = colorParse(color_input.value);
    }
});

// color eyedrop tool handler
const eyedrop_tool = document.querySelector('#eyedrop');
onTool(eyedrop_tool, () => {
    if (eraser) {eraser_tool.dispatchEvent(new Event('click'));}
    if(!grab) {
        grab = true;
        if(hasSupport) {
            const eyeDropper = new window.EyeDropper();
            eyeDropper
            .open()
            .then((result) => {
                color = result.sRGBHex;
                color_input.value = color;
                eyedrop_tool.dispatchEvent(new Event('click'));
            })
            .catch( e => {
                console.error(e);
            });
        } else {
            console.warn('No Support: This browser does not support the EyeDropper API yet!');
        }
    } else {
        grab = false;
    }
});

// tool for toggling pixel type - Square or Radial
const pixel_tool = document.querySelector('#pixelType');
pixel_tool.addEventListener('click', () => {
    if (!radial) {
        pixel_tool.setAttribute('data', "radial");
        pixel_tool.src = "src/circle.png";
        radial = true;
    } else {
        pixel_tool.setAttribute('data', "square");
        pixel_tool.src = "src/square.png";
        radial = false;
    }
    document
            .querySelectorAll('.canvas > .pixel')
            .forEach((p) => p.classList.toggle('radial'));
});


 
/**
 * canvas functions
 */

// init canvas with size param
function loadCanvas(size = size_input.value) {
    canvas.style.gridTemplateColumns = `repeat(${size}, auto)`; 
    for (let i=0; i<size**2; i++) {
        createPixel();
    };
    pixels = document.querySelectorAll('.pixel');
    assignPixelCoords();
}

// remove pixels to reset canvas
function resetCanvas() {
    document
        .querySelectorAll('.canvas > .pixel')
        .forEach((p) => p.parentNode.removeChild(p));
}

// clear canvas by resetting pixels to clear
function clearCanvas() {
    document
        .querySelectorAll('.canvas > .pixel')
        .forEach((p) => p.style.backgroundColor = 'rgb(255, 255, 255)');
}

// function to create a pixel element
function createPixel() {
    // create HTML element
    const pixel = document.createElement('div');
    pixel.classList.add('pixel');
    pixel.setAttribute('oncontextmenu', "return false");
    if (radial) {
        pixel.setAttribute('data', 'radial');
        pixel.classList.toggle('radial');
    }
    // events
    addEvents(pixel);
    // append to DOM
    canvas.appendChild(pixel);
}

// function to convert div elements into an array to assign coordinate data
function assignPixelCoords() {
    // convert Pixel NodeList to Array
    let pixelArray = Array.from(pixels);
    // convert 1d Array to 2d Matrix
    let pixel2dArray = [];
    while(pixelArray.length) pixel2dArray.push(pixelArray.splice(0, size_input.value));
    // give each pixel a coordinate 
    
    for(let i=0; i<size_input.value; i++) {
        for(let j=0; j<size_input.value; j++) {
            // coordinate assignment is reversed due to div creation within a grid
            pixel2dArray[i][j].x = j+1;
            pixel2dArray[i][j].y = i+1;
            pixel2dArray[i][j].setAttribute(`data-x`, j+1);
            pixel2dArray[i][j].setAttribute(`data-y`, i+1);    
        };
    };
}

// add click events for the pixels in canvas
function addEvents(pixel) {
    pixel.addEventListener('contextmenu', (e) => {e.preventDefault();});
    ['mouseenter', 'mousedown'].forEach((event) => {
        pixel.addEventListener(event, (e) => {
            e.preventDefault(); // this stops the default browser ability to drag the div
            // check if fill is active
            if (fillActive && e.buttons == 1) {
                fill(pixel);
                fill_tool.dispatchEvent(new Event('click'));
            }
            // find pixels to color in - starts when button a clicked instead of hover
            if (e.buttons) createBrush(pixel, e.buttons);        
        });
    });
}

// function to calculate the distance of tile to the center - checks if tile is inside circle radii
function inside_circle(center, tile, radius) {
    dx = center[0] - tile[0];
    dy = center[1] - tile[1];
    sqr_distance = dx*dx + dy*dy;
    return sqr_distance <= radius*radius;
}

// function to find the pixel coords of the circle with radius ~ brushsize || using bounding box approach
function createBrush(pixel, mouse) {
    let point = [pixel.x, pixel.y];
    let radius = brushSize-1;
    // only loops if brush size != 1
    if (brushSize != 1) {
        // create a bounding box to reduce search area
        let top = point[1] - radius;
        let bottom = point[1] + radius;
        let left = point[0] - radius;
        let right = point[0] + radius;
        // loop through grid to find pixels within the circle radii
        for (let y = top; y <= bottom; y++) {
            for(let x = left; x <= right; x++) {
                if (inside_circle(point, [x, y], radius)) {
                    draw(x, y, mouse);
                };
            };
        };
    // skips loops if brush is 1px
    } else {
        draw(point[0], point[1], mouse);
    }
}

// function to find the pixel coords of the circle with radius ~ brushsize || using bounding circle approach
function boundingCircle(pixel, mouse){
    let point = [pixel.x, pixel.y];
    let radius = brushSize-1;

    let top = point[1] - radius;
    let bottom = point[1] + radius;

    for (let y=top; y <= bottom; y++) {
        let dy = y - point[1];
        let dx = Math.sqrt(radius*radius - dy*dy);
        let left = Math.ceil(point[0] - dx);
        let right = Math.floor(point[0] + dx);
        for (let x = left; x <= right; x++) {
            draw(x, y, mouse);
        }
    }
}

// function to generate the outline of a circle
// function circleOutline(pixel, mouse) {
//     radius = brushSize-1;

//     for(let r = 0; r <= Math.floor(radius * Math.sqrt(0.5)); r++) {
//         let d = Math.floor(Math.sqrt(radius*radius - r*r));
//         draw(pixel.x - d, pixel.y + r, mouse);
//         draw(pixel.x + d, pixel.y + r, mouse);
//         draw(pixel.x - d, pixel.y - r, mouse);
//         draw(pixel.x + d, pixel.y - r, mouse);
//         draw(pixel.x + r, pixel.y - d, mouse);
//         draw(pixel.x + r, pixel.y + d, mouse);
//         draw(pixel.x - r, pixel.y - d, mouse);
//         draw(pixel.x - r, pixel.y + d, mouse);
//     }
// }

// function to draw a specific pixel from a coordinate
function draw(x, y, mouse) {
    // extract pixel div element with data points = the coords
    let pixel = document.querySelector(`.pixel[data-x="${x}"][data-y="${y}"]`);
    // check if shading is active
    if (shadingSetting) {
        try {
            color = colorShader(window.getComputedStyle(pixel).backgroundColor, shading);
        } catch (error) {
            return;
        }   
    }
    // skips elements that return null since they are out of bounds
    if (pixel == null) return;
    // checks if eraser ir right click is active
    if (eraser || mouse == 2) {
        pixel.style.backgroundColor = 'rgb(255,255,255)';
    } else {
        pixel.style.backgroundColor = color;
    }
}

// function to get the valid color style of an HTML element
function getHTMLColor(element) {
    return window.getComputedStyle(element).backgroundColor;
}

// function to create a boolean matrix out of the canvas grid
function gridMatrix(bound) {
    let arr = [];
    for(let i=0; i<bound; i++) {
        arr.push([]);
        arr[i].push(new Array(bound));
        for(let j=0; j<bound; j++){
            arr[i][j] = false;
        };
    };
    return arr;
}


// function to fill an area of the center pixels original color to a new color
function fill(pixel) {
    // color the fill area needs to be
    let originColor = getHTMLColor(pixel);
    // size bound of the grid
    let bound = size_input.value;
    // set starting coords 
    let sx = pixel.x;
    let sy = pixel.y;
    // set boolean matrix for visited points
    let visited = gridMatrix(bound);
    
    // function to check all validities of a point
    function isValid(x, y) {
        // checks if the point is within the bounds of the canvas || whether the point has been visited
        if (x < 1 || y < 1 || x > bound || y > bound || visited[x-1][y-1]) return false;
        // collect the html element for that point
        point = document.querySelector(`.pixel[data-x="${x}"][data-y="${y}"]`);
        // check if the elements color matches the origin color 
        if (getHTMLColor(point) != originColor) return false;
        // otherwise this point is valid for the area
        return true;
    };

    // function to return all the adjacent points in an iterable array
    function getAdjacents(x, y) {
        return [[x - 1, y], [x + 1, y], [x, y-1], [x, y+1]];
    };

    /**
     * BFS algorithm
     */

    // create a queue and push the origin
    let queue = [];
    queue.push([sx, sy]);
    visited[sx-1][sy-1] = true;

    // loops while >0 points are in the queue
    while(queue.length > 0) {
        // pop the first element from queue
        let current = queue.shift();
        // loop through all adjacent points
        getAdjacents(current[0], current[1]).forEach((p) => {
            let x = p[0];
            let y = p[1];
            // check if point is valid for the area
            if(isValid(x, y)){
                // set point to visited
                visited[x-1][y-1] = true;
                // add point to queue
                queue.push([x, y]);
                // color in point
                draw(x, y);
            };
        });
    };
}

// initialize canvas
loadCanvas();