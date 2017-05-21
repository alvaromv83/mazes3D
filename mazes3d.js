/*//////////////////////////////////////////////////////////////////////////////

                            -- M A Z E S    3 D --

Asignatura: Gráficos y Visualización en 3D
Autor: Álvaro Moles Vinader

Ubicación de funciones:
- Constructores de juego y nivel------> mazesGameObjects.js
- Constructores de modelos 3D --------> mazesModelsObjects.js
- Laberinto 2D -----------------------> mazes2d.js
- Funciones de dibujado de escena ----> mazesDrawFunctions.js

                         z                 _____i_______
                         |                |         |_| (0,0)
                         |                |    maze   |
        x _______________| (0,0,0)        |     2D    | j
               /maze 3D /                 |           |
             /________/                   |___________|
                    /
                  y

//////////////////////////////////////////////////////////////////////////////*/

var game;

// Shader de vértices
var VSHADER_SOURCE =
  'attribute highp vec3 a_VertexPosition;\n' +
  'attribute highp vec2 a_TextureCoord;\n' +
  'attribute highp vec3 a_VertexNormal;\n' +
  'uniform highp mat4 u_NormalMatrix;\n' +
  'uniform highp mat4 u_MvpMatrix;\n' +
  'uniform highp mat4 u_ModelMatrix;\n' +
//  'uniform highp vec3 u_pointLightPosition;\n' +
  'varying highp vec2 v_TextureCoord;\n' +
  'varying highp vec3 v_Lighting;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * vec4(a_VertexPosition, 1.0);\n' +
  '  v_TextureCoord = a_TextureCoord;\n' +

  '  highp vec3 ambientLight = vec3(0.50, 0.50, 0.40);\n' +
  '  highp vec3 directionalLightColor = vec3(0.15, 0.15, 0.12 );\n' +
  '  highp vec3 pointLightPosition = vec3(15.0, 15.0, 2.0);\n' +

  '  vec4 vertexPosition = u_ModelMatrix * vec4(a_VertexPosition, 1.0);\n' +
  '  highp vec3 lightDirection = normalize(pointLightPosition - vec3(vertexPosition));\n' +
  '  highp vec4 transformedNormal = u_NormalMatrix * vec4(a_VertexNormal, 1.0);\n' +
  '  highp float directionalW = max(dot(transformedNormal.xyz, lightDirection), 0.0);\n' +

  '  v_Lighting = ambientLight + (directionalLightColor * directionalW);\n' +
  '}\n';

// Shader de fragmentos
var FSHADER_SOURCE =
  'varying highp vec3 v_Lighting;\n' +
  'varying highp vec2 v_TextureCoord;\n' +
  'uniform sampler2D u_Sampler;\n' +
  'void main() {\n' +
  '  highp vec4 texelColor = texture2D(u_Sampler, vec2(v_TextureCoord.s, v_TextureCoord.t));\n' +
  '  gl_FragColor = vec4(texelColor.rgb * v_Lighting, texelColor.a);\n' +
  '}\n';

////////////////////////////////////////////////////////////////////////////////
function main() {
  console.log('Inizializing game...')

  var NUM_LEVELS = 3;
  var CUBE_SIZE = 3; // (m)    (*) Nota: la textura de salida está optimizada
                     //            para un tamaño de cubo = 3 m

  // Obtener contexto 2D
  var canvas2d = document.getElementById('2d');
  var ctx_2d = canvas2d.getContext("2d");
  console.log('   Got 2D context')

  // Obtener contexto webGL
  var canvas3d = document.getElementById('webgl');
  var gl = getWebGLContext(canvas3d);
  if (!gl) {
    console.log('   Failed to get the rendering context for WebGL');
    return;
  } else {
    console.log('   Got webGL context')
  }
  // Parámetros del contexto webGL
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Background color
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Inicializar shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('   Failed to intialize shaders');
    return;
  } else {
    console.log('   Initialized shaders');
  }

  // Inicializar parámetros de juego
  game = new Game(canvas2d, ctx_2d, canvas3d, gl, NUM_LEVELS, CUBE_SIZE);
  console.log('Initialized game');

  // Analizar eventos de teclado y ratón
  document.onkeydown = function(ev){ keyHandler(ev, canvas3d, CUBE_SIZE) }
  document.onmousemove = function(ev){ mouseHandler(ev, CUBE_SIZE) };
  console.log('Listening keyboard and mouse events...');

  alert('************ Welcome to Mazes 3D *********** \n\n' +
        "Find the maze exit for every level.\n\n" +
        " General controls:\n" +
        " --------------------\n" +
        " 1 = select player view\n" +
        " 2 = select top player camera\n" +
        " 3 = select video camera at the maze exit\n" +
        " esc = exit game\n\n" +
        " Player controls:\n" +
        " -----------------------\n" +
        " W = move forward\n" +
        " S = move back\n" +
        " A = move left\n" +
        " D = move right\n" +
        " cursor movement = look up/down & turn left/right\n\n" +
        " Video camera controls:\n" +
        " ---------------------------------\n" +
        " keyboard arrows = pan and tilt\n" +
        " V = zoom in\n" +
        " C = zoom out\n\n");

  drawCanvas2dMessage ('Please, use your keyboard to select the game difficulty:' +
                       ' "1" (easy), "2" (normal), "3" (hard), "4" (expert)');
}
////////////////////////////////////////////////////////////////////////////////


//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function keyHandler(ev, canvas3d, cubeSize) {
  switch(ev.keyCode){
    case 49: // "1"
      if (!game.selectedMode) {
        game.selectGameMode('easy');
        game.initLevels(canvas3d, cubeSize);
        break;

      } else if (game.started && !game.win && !game.timeOut && !game.exit) {
        if (game.cameraOn.id != 'playerCam') {
          game.cameraOn = game.levels[game.nLevel-1].getCamera('playerCam');
          console.log('Selected player camera');
        }
      }
    break;
    case 50: // "2"
      if (!game.selectedMode) {
        game.selectGameMode('normal');
        game.initLevels(canvas3d, cubeSize);
        break;

      } else if (game.started && !game.win && !game.timeOut && !game.exit) {
        if (game.cameraOn.id != 'topPlayerCam') {
          game.cameraOn = game.levels[game.nLevel-1].getCamera('topPlayerCam');
          console.log('Selected top player camera');
        }
      }
    break;
    case 51: // "3"
      if (!game.selectedMode) {
        game.selectGameMode('hard');
        game.initLevels(canvas3d, cubeSize);

      } else if (game.started && !game.win && !game.timeOut && !game.exit) {
        if (game.cameraOn.id != 'exitCam') {
          game.cameraOn = game.levels[game.nLevel-1].getCamera('exitCam');
          console.log('Selected exit camera');
        }
      }
    break;
    case 52: // "4"
      if (!game.selectedMode) {
        game.selectGameMode('expert');
        game.initLevels(canvas3d, cubeSize);
      }
    break;
    case 13: // "Enter"
      if (!game.selectedMode) {
        alert('Please, select the game difficulty')
      } else if (!game.started){
        startNewLevel();
        game.started = true;
        console.log('Press "0" to activate/deactivate camera debug')
      }
    break;
    case 27: // "Esc"
      if (game.started && !game.win && !game.timeOut && !game.exit) {
        game.exit = true; // Ver función drawScene() (mazesDrawFunctions.js)
      }
    break;
    case 87: // "W"
      if (game.started && !game.win && !game.timeOut && !game.exit) {
        game.levels[game.nLevel-1].operateCamera('playerCam', 'moveForward', cubeSize, canvas3d);
        if (game.levels[game.nLevel-1].exitMaze) {
          checkEndOfLevel();
        }
      }
    break;
    case 83: // "S"
      if (game.started && !game.win && !game.timeOut && !game.exit) {
        game.levels[game.nLevel-1].operateCamera('playerCam', 'moveBack', cubeSize, canvas3d);
        if (game.levels[game.nLevel-1].exitMaze) {
          checkEndOfLevel();
        }
      }
    break;
    case 65: // "A"
      if (game.started && !game.win && !game.timeOut && !game.exit) {
        game.levels[game.nLevel-1].operateCamera('playerCam', 'moveLeft', cubeSize, canvas3d);
        if (game.levels[game.nLevel-1].exitMaze) {
          checkEndOfLevel();
        }
      }
    break;
    case 68: // "D"
      if (game.started && !game.win && !game.timeOut && !game.exit) {
        game.levels[game.nLevel-1].operateCamera('playerCam', 'moveRight', cubeSize, canvas3d);
        if (game.levels[game.nLevel-1].exitMaze) {
          checkEndOfLevel();
        }
      }
    break;
    case 37: // "Flecha izquierda"
      if (game.started && !game.win && !game.timeOut && !game.exit) {
        game.levels[game.nLevel-1].operateCamera('exitCam', 'panLeft', cubeSize);
        if (game.levels[game.nLevel-1].exitMaze) {
          checkEndOfLevel();
        }
      }
    break;
    case 39: // "Flecha derecha"
      if (game.started && !game.win && !game.timeOut && !game.exit) {
        game.levels[game.nLevel-1].operateCamera('exitCam', 'panRight', cubeSize);
        if (game.levels[game.nLevel-1].exitMaze) {
          checkEndOfLevel();
        }
      }
    break;
    case 38: // "Flecha arriba"
      if (game.started && !game.win && !game.timeOut && !game.exit) {
        game.levels[game.nLevel-1].operateCamera('exitCam', 'tiltUp', cubeSize);
      }
    break;
    case 40: // "Flecha abajo"
      if (game.started && !game.win && !game.timeOut && !game.exit) {
        game.levels[game.nLevel-1].operateCamera('exitCam', 'tiltDown', cubeSize);
      }
    break;
    case 86: // "V"
      if (game.started && !game.win && !game.timeOut && !game.exit) {
        if (game.cameraOn.id === 'exitCam') {
          game.levels[game.nLevel-1].operateCamera('exitCam', 'zoomIn', cubeSize);
        }
      }
    break;
    case 67: // "C"
      if (game.started && !game.win && !game.timeOut && !game.exit) {
        if (game.cameraOn.id === 'exitCam') {
          game.levels[game.nLevel-1].operateCamera('exitCam', 'zoomOut', cubeSize);
        }
      }
    break;
    case 48: // "0"
      if (game.started && !game.win && !game.timeOut && !game.exit) {
        game.camDebugOn = !game.camDebugOn;
        if (game.camDebugOn) {
          console.log('Debug ON')
          cameraMovementDebug(game.cameraOn, cubeSize);
        } else {
          console.log('Debug OFF')
        }
      }
    break;
    default:
    return;
  }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function mouseHandler(event, cubeSize) {
  var mousePosXnow = event.clientX;
  var mousePosYnow = event.clientY;
  var mousePosXdifference = mousePosXnow - game.mousePosX;
  var mousePosYdifference = mousePosYnow - game.mousePosY;
  game.mousePosX = mousePosXnow;
  game.mousePosY = mousePosYnow;

  if (game.started && !game.win && !game.timeOut && !game.exit) {
    if (mousePosXdifference < 0) {
      game.levels[game.nLevel-1].operateCamera('playerCam', 'panLeft', cubeSize);
    } else if (mousePosXdifference > 0) {
      game.levels[game.nLevel-1].operateCamera('playerCam', 'panRight', cubeSize);
    }
    if (game.cameraOn.id != 'topPlayerCam') {
      if (mousePosYdifference < 0) {
        game.levels[game.nLevel-1].operateCamera('playerCam', 'tiltUp', cubeSize);
      } else if (mousePosYdifference > 0) {
        game.levels[game.nLevel-1].operateCamera('playerCam', 'tiltDown', cubeSize);
      }
    }
  }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function handleTextureLoaded(image, texture) {
  game.gl.bindTexture    (game.gl.TEXTURE_2D, texture);
  game.gl.texImage2D     (game.gl.TEXTURE_2D, 0, game.gl.RGBA, game.gl.RGBA, game.gl.UNSIGNED_BYTE, image);
  game.gl.texParameteri  (game.gl.TEXTURE_2D, game.gl.TEXTURE_MAG_FILTER, game.gl.LINEAR);
  game.gl.texParameteri  (game.gl.TEXTURE_2D, game.gl.TEXTURE_MIN_FILTER, game.gl.LINEAR_MIPMAP_NEAREST);
  game.gl.generateMipmap (game.gl.TEXTURE_2D);
  game.gl.bindTexture    (game.gl.TEXTURE_2D, null);
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function startNewLevel() {
  game.nLevel += 1;
  game.levels[game.nLevel-1].initTime();
  game.cameraOn = game.levels[game.nLevel-1].getCamera('playerCam');
  console.log('Selected player camera');

  requestAnimationFrame(drawScene);
  console.log('Drawing the level ' + game.nLevel + ' scene...')
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function checkEndOfLevel() {
  var levelPoints = game.levels[game.nLevel-1].getPoints();
  game.points += levelPoints;

  if (game.nLevel === game.numLevels) {
    game.win = true; // Ver "drawScene()"
  } else {
    alert('You found the exit!\n'+
          "You've got " + levelPoints + " points.\n"+
          "Go to the next level!");
    startNewLevel();
  }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function cameraMovementDebug(camera, cubeSize) {
  var mazeMapPosI = Math.trunc(camera.posX / cubeSize);
  var mazeMapPosJ = Math.trunc(camera.posY / cubeSize);
  var camViewX = camera.viewVector[0] + camera.posX;
  var camViewY = camera.viewVector[1] + camera.posY;
  var camViewZ = camera.viewVector[2] + camera.posZ;
  console.log (
    '--------------------' + camera.id + '----------------------\n' +
    'Position coordinates (x,y,z):  (' + camera.posX.toFixed(2) + ', '
                                       + camera.posY.toFixed(2) + ', '
                                       + camera.posZ.toFixed(2) + ')\n' +
    'Map position         [i,j]:    [' + mazeMapPosI + ', ' + mazeMapPosJ + ']\n' +
    'Pan angle            (rad):     ' + camera.panAngle.toFixed(2) + '\n' +
    'Tilt angle           (rad):     ' + camera.tiltAngle.toFixed(2) + '\n' +
    'View angle           (º):       ' + camera.viewAngle.toFixed(2) + '\n' +
    'View vector          (x,y,z):  (' + camera.viewVector[0].toFixed(2) + ', '
                                       + camera.viewVector[1].toFixed(2) + ', '
                                       + camera.viewVector[2].toFixed(2) + ')\n' +
    'View coordinates     (x,y,z):  (' + camViewX.toFixed(2) + ', '
                                       + camViewY.toFixed(2) + ', '
                                       + camViewZ.toFixed(2) + ')'
  );
}
