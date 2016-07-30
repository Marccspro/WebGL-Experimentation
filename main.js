window.onload = init();

var canvas;
var gl;

var width;
var height;

var shader;
var vbo;

var camera;
var currentKeys = {};

var projectionMatrix;
var modelViewMatrix;

var projectionMatrixLocation;
var modelViewMatrixLocation;
var sampler2DLocation;

var blockTexture;

var blocks;

function init()
{
    canvas = document.getElementById("canvas");
    width = canvas.width;
    height = canvas.height;
    gl = getContext(canvas);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    shader = getShaderProgram();
    blockTexture = gl.createTexture();
    blockTexture.image = new Image();
    blockTexture.image.onload = function() {
        loadTexture(blockTexture)
    }
    blockTexture.image.src = "texture.jpg";

    window.onkeydown = handleKeyDown;
    window.onkeyup = handleKeyUp;

    camera = {
        position:vec3.create(),
        rotation:vec3.create()
    };

    projectionMatrix = mat4.create();
    modelViewMatrix = mat4.create();

    vbo = gl.createBuffer();
    var vertices =
    [
        //FRONT
        1, 0, 0,    1, 0,
        0, 0, 0,    0, 0,
        1, 1, 0,    1, 1,
        1, 1, 0,    1, 1,
        0, 0, 0,    0, 0,
        0, 1, 0,    0, 1,
        //BACK
        0, 0, 1,    0, 0,
        1, 0, 1,    1, 0,
        1, 1, 1,    1, 1,
        0, 0, 1,    0, 0,
        1, 1, 1,    1, 1,
        0, 1, 1,    0, 1,
        //LEFT
        0, 1, 0,    1, 0,
        0, 0, 0,    0, 0,
        0, 1, 1,    1, 1,
        0, 1, 1,    1, 1,
        0, 0, 0,    0, 0,
        0, 0, 1,    0, 1,
        //RIGHT
        1, 0, 0,    0, 0,
        1, 1, 0,    1, 0,
        1, 1, 1,    1, 1,
        1, 0, 0,    0, 0,
        1, 1, 1,    1, 1,
        1, 0, 1,    0, 1,
        //BOTTOM
        0, 0, 0,    0, 0,
        1, 0, 0,    1, 0,
        1, 0, 1,    1, 1,
        0, 0, 0,    0, 0,
        1, 0, 1,    1, 1,
        0, 0, 1,    0, 1,
        //TOP
        1, 1, 0,    1, 0,
        0, 1, 0,    0, 0,
        1, 1, 1,    1, 1,
        1, 1, 1,    1, 1,
        0, 1, 0,    0, 0,
        0, 1, 1,    0, 1
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    projectionMatrixLocation = gl.getUniformLocation(shader, "projectionMatrix");
    modelViewMatrixLocation = gl.getUniformLocation(shader, "modelViewMatrix");
    sampler2DLocation = gl.getUniformLocation(shader, "tex");

    blocks = new Array(3);

    for (var x = 0; x < 10; x++)
    {
        for (var y = 0; y < 10; y++)
        {
            for (var z = 0; z < 10; z++)
            {
                if (Math.random() > 0.5)
                    blocks[x][y][z] = true;
            }
        }
    }

    loop();
}

var before = 0;
function loop()
{
    window.requestAnimFrame(loop, canvas);

    var now = new Date().getTime();
    var elapsed = now - before;

    if (elapsed > 1000.0 / 60.0)
    {
        update();
        before += 1000.0 / 60.0;
    }
    render();
}

var time = 0;
var x = 0;
var y = 0;
var z = 0;
var rx = 0;
var ry = 0;
function update()
{
    time++;

    if (getKey(38)) //UP
        rx -= 0.1;
    if (getKey(40)) //DOWN
        rx += 0.1;
    if (getKey(37)) //LEFT
        ry -= 0.1;
    if (getKey(39)) //RIGHT
        ry += 0.1;

    if (getKey(90)) //Z
    {
        z -= Math.cos(ry) * 0.1;
        x += Math.sin(ry) * 0.1;
    }
    if (getKey(83)) //S
    {
        z += Math.cos(ry) * 0.1;
        x -= Math.sin(ry) * 0.1;
    }
    if (getKey(81)) //Q
    {
        z += Math.cos(ry + Math.PI * 0.5) * 0.1;
        x -= Math.sin(ry + Math.PI * 0.5) * 0.1;
    }
    if (getKey(68)) //D
    {
        z -= Math.cos(ry + Math.PI * 0.5) * 0.1;
        x += Math.sin(ry + Math.PI * 0.5) * 0.1;
    }
    if (getKey(32)) //Q
        y += 0.1;
    if (getKey(17)) //D
        y -= 0.1;

    vec3.set([-x, -y, -z], camera.position);
    vec3.set([rx, ry, 0], camera.rotation);
}

function render()
{
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(90, width / height, 0.1, 100, projectionMatrix);
    mat4.rotate(projectionMatrix, camera.rotation[0], [1, 0, 0]);
    mat4.rotate(projectionMatrix, camera.rotation[1], [0, 1, 0]);
    mat4.translate(projectionMatrix, camera.position);

    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * 4, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * 4, 12);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, blockTexture);
    gl.uniform1i(sampler2DLocation, 0);

    for (var x = 0; x < 10; x++)
    {
        for (var y = 0; y < 10; y++)
        {
            for (var z = 0; z < 10; z++)
            {
                if (blocks[x][y][z])
                    drawBlock([x, y, z], [1, 1, 1]);
            }
        }
    }
}

function drawBlock(pos, size)
{
    mat4.identity(modelViewMatrix);
    mat4.scale(modelViewMatrix, size)
    mat4.translate(modelViewMatrix, pos);

    gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function getKey(key)
{
    return currentKeys[key];
}

function handleKeyDown(event)
{
    currentKeys[event.keyCode] = true;
}

function handleKeyUp(event)
{
    currentKeys[event.keyCode] = false;
}

function loadTexture(texture)
{
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
}
