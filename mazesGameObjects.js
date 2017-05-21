function Game (canvas2d, ctx_2d, canvas3d, gl, numLevels, cubeSize) {
  this.canvas2d       = canvas2d;
  this.ctx_2d         = ctx_2d;
  this.gl             = gl;
  this.numLevels      = numLevels;
  this.nLevel         = 0;
  this.points         = 0;
  this.win            = false;
  this.exit           = false;
  this.timeOut        = false;
  this.started        = false;
  this.selectedMode   = false;
  this.mode;
  this.levels;
  this.camDebugOn     = false;
  this.mousePosX      = 0.0;
  this.mousePosY      = 0.0;
  this.cameraOn;
}
Game.prototype.selectGameMode = function(gameMode) {
  this.mode = gameMode;
  this.selectedMode = true;
  console.log(this.mode.toUpperCase() + ' game mode selected')
  drawCanvas2dMessage('                              ' +
                      this.mode.toUpperCase() + ' game mode.   Press "ENTER" to start the game');
}
Game.prototype.initLevels = function(canvas3d, cubeSize) {
  console.log('Initializing game levels...');
  this.levels = [];

  var mazeMapNumFiles = 8;
  var mazeMapViewRadius = 0; // Mapa completo (por defecto)
  var timeLimit = 120; // (seg)
  var maxPoints = this.getMaxPoints();

  var i;
  for (i = 0; i < this.numLevels; i++) {
    var nLevel = i + 1;
    console.log('   Inizializing level ' + nLevel + '...');

    var maxPoints;

    // Nivel 1
    if (i === 0) {
      if (this.mode === 'normal' || this.mode === 'hard' ) {
        mazeMapViewRadius = Math.round(mazeMapNumFiles * 0.5); // Mapa semioculto
      }

    // Resto de niveles
    } else {
      mazeMapNumFiles = this.levels[i-1].mazeMap.sz + 1;
      timeLimit = this.levels[i-1].timeLimit - 30; // (seg)
      maxPoints = 2 * this.levels[i-1].maxPoints;
      if (this.mode === 'hard') {
        if (this.levels[i-1].mazeMap.viewRadius > 2) { // Mínimo radio posible
          mazeMapViewRadius = this.levels[i-1].mazeMap.viewRadius - 1;
        } else {
          mazeMapViewRadius = this.levels[i-1].mazeMap.viewRadius;
        }
      }
    }

    var ceilingImgTextSource     = "resources/level" + nLevel + "-ceiling.jpg";
    var exitCubeImgTextSource    = "resources/level" + nLevel + "-exit.jpg";
    var groundImgTextSource      = "resources/level" + nLevel + "-ground.jpg";
    var genericCubeImgTextSource = "resources/level" + nLevel + "-wall.jpg";

    var level = new Level(nLevel, mazeMapNumFiles, mazeMapViewRadius,
                          maxPoints, timeLimit,
                          ceilingImgTextSource, exitCubeImgTextSource,
                          groundImgTextSource, genericCubeImgTextSource,
                          canvas3d, this.gl, cubeSize);
    this.levels.push(level);
    console.log('   Inizialized level ' + nLevel);
  }
  console.log('Initialized game levels');
}
Game.prototype.getMaxPoints = function () {
var maxPoints = 40;
switch (this.mode) {
  case 'easy':
  break;
  case 'normal':
    maxPoints = 2 * maxPoints;
  break;
  case 'hard':
    maxPoints = 3 * maxPoints;
  break;
  case 'expert':
    maxPoints = 4 * maxPoints;
  break;
  default:
  return;
}
return maxPoints;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function Level (nLevel, mazeMapNumFiles, mazeMapViewRadius,
                maxPoints, timeLimit,
                ceilingImgTextSource, exitCubeImgTextSource,
                groundImgTextSource, genericCubeImgTextSource,
                canvas3d, gl, cubeSize) {
  this.nLevel     = nLevel;
  this.maxPoints  = maxPoints;
  this.timeLimit  = timeLimit;
  this.timeStart;
  this.exitMaze   = false;

  this.debug(mazeMapNumFiles, mazeMapViewRadius,
             ceilingImgTextSource, exitCubeImgTextSource,
             groundImgTextSource, genericCubeImgTextSource);

  this.initMazeMap (mazeMapNumFiles, mazeMapViewRadius);

  this.initMazeModels(canvas3d, gl, cubeSize,
                      groundImgTextSource, ceilingImgTextSource,
                      genericCubeImgTextSource, exitCubeImgTextSource);
}
Level.prototype.debug = function (mazeMapNumFiles, mazeMapViewRadius,
                                  ceilingImgTextSource, exitCubeImgTextSource,
                                  groundImgTextSource, genericCubeImgTextSource) {
  console.log(
    '      Parameters:\n' +
    '         Maze map size (squares):              ' + mazeMapNumFiles + ' x ' + mazeMapNumFiles + '\n' +
    '         Maze map view radius (squares):       ' + mazeMapViewRadius + '\n' +
    '         Time limit (s):                       ' + this.timeLimit + '\n' +
    '         Max points:                           ' + this.maxPoints + '\n' +
    '         Texture image source for the ceiling: ' + ceilingImgTextSource + '\n' +
    '         Texture image source for the exit:    ' + exitCubeImgTextSource + '\n' +
    '         Texture image source for the ground:  ' + groundImgTextSource + '\n' +
    '         Texture image source for the wall:    ' + genericCubeImgTextSource + '\n'
  );
}
Level.prototype.initMazeMap = function (mazeMapNumFiles, mazeMapViewRadius) {
  console.log('      Inizializing maze map...');
  var mazeMapOutPos = this.getRandMazeOutPos(mazeMapNumFiles);
  var outPosI = mazeMapOutPos[0];
  var outPosJ = mazeMapOutPos[1];

  var mazeMapStartPos = this.getRandMazeStartPos(mazeMapNumFiles, mazeMapOutPos);
  var startPosI = mazeMapStartPos[0];
  var startPosJ = mazeMapStartPos[1];

  mazeMapOutPos = new Pos (outPosI, outPosJ);
  mazeMapStartPos = new Pos (startPosI, startPosJ);
  this.mazeMap = new Maze(mazeMapNumFiles, mazeMapOutPos, mazeMapStartPos, mazeMapViewRadius);
  this.mazeMap.randPrim();
  console.log('      Inizialized maze map');
}
Level.prototype.getRandMazeOutPos = function (mazeMapNumFiles) {
  var outPosI, outPosJ;
  var minOutPosI = 0;
  var maxOutPosI = Math.round(mazeMapNumFiles/2); // Para evitar que la salida esté en la zona superior izquierda
                                                  // (si no, a veces se queda encerrada)
  var minOutPosJ = 0;
  var maxOutPosJ = mazeMapNumFiles-2;

  var randNumber = Math.round(Math.random() * 1); // Numero aleatorio: 0 ó 1
  if (randNumber === 0) {
    outPosI = 0; // Salida en parte lateral derecha del mapa
    outPosJ = Math.trunc( (Math.random() * (maxOutPosJ - minOutPosJ)) + minOutPosJ);
  } else {
    outPosI = Math.trunc( (Math.random() * (maxOutPosI - minOutPosI)) + minOutPosI);
    outPosJ = 0; // Salida en parte superior del mapa
  }

  var mazeMapOutPos = [outPosI, outPosJ];
  console.log('         Random exit created');
  return mazeMapOutPos;
}
Level.prototype.getRandMazeStartPos = function (mazeMapNumFiles, mazeMapOutPos) {
  var outPosI = mazeMapOutPos[0];
  var outPosJ = mazeMapOutPos[1];
  var startPosI, startPosJ;
  var minStartPosI = 1;
  var maxStartPosI = mazeMapNumFiles-2;
  var minStartPosJ = 1;
  var maxStartPosJ = mazeMapNumFiles-2;

  if (outPosI === 0) { // Salida en parte lateral derecha del mapa
    startPosI = mazeMapNumFiles-2; // Inicio de juego en parte lateral izquierda del mapa
    if (outPosJ < maxStartPosJ/2) {
      minStartPosJ = Math.round(maxStartPosJ/2 + 1);
    } else {
      maxStartPosJ = Math.round(maxStartPosJ/2 - 1);
    }
    startPosJ = Math.trunc( (Math.random() * (maxStartPosJ - minStartPosJ)) + minStartPosJ);
  } else { // Salida en parte superior del mapa
    if (outPosI < maxStartPosI/2) {
      minStartPosI = Math.round(maxStartPosI/2 + 1);
    } else {
      maxStartPosI = Math.round(maxStartPosI/2 - 1);
    }
    startPosI = Math.trunc( (Math.random() * (maxStartPosI - minStartPosI)) + minStartPosI);
    startPosJ = mazeMapNumFiles-2; // Inicio de juego en parte inferior del mapa
  }
  var mazeMapStartPos = [startPosI, startPosJ];
  console.log('         Random start created');
  return mazeMapStartPos;
}
Level.prototype.initMazeModels = function (canvas3d, gl, cubeSize,
                                           groundImgTextSource, ceilingImgTextSource,
                                           genericCubeImgTextSource, exitCubeImgTextSource) {
  console.log('      Initializing 3D models and cameras...')
  this.models = [];
  this.initPlayerCam    (canvas3d, gl, cubeSize);  // Inicializar primero las cámaras para no tener que
  this.initTopPlayerCam (canvas3d, gl, cubeSize);  // recorrer array entero al seleccionar una cámara
  this.initExitCam      (canvas3d, gl, cubeSize);
  this.initGround       (gl, cubeSize, groundImgTextSource);
  this.initCeiling      (gl, cubeSize, ceilingImgTextSource);
  this.initGenericCubes (gl, cubeSize, genericCubeImgTextSource);
  this.initExitCube     (gl, cubeSize, exitCubeImgTextSource);
  console.log('      Initialized 3D models and cameras')
}
Level.prototype.initPlayerCam = function (canvas3d, gl, cubeSize) {
  var camPosX = (this.mazeMap.pos.x + 0.5 ) * cubeSize; // (m)
  var camPosY = (this.mazeMap.pos.y + 0.5 ) * cubeSize; // (m)
  var camPosZ = 1.60; // (m)
  var camSize = 0.30; // (m)

  var camPanAngle  = - Math.PI/2; // (rad)
  var camTiltAngle = 0.0; // (rad)
  var camViewAngle = 50; // (º)

  var maxPanAngle = 2*Math.PI; // (rad);
  var minPanAngle = -2*Math.PI; // (rad);
  var maxTiltAngle = Math.PI/2 - 0.1; // (rad);
  var minTiltAngle = 0.1 - Math.PI/2; // (rad);

  var moveStep = 0.15; // (m)
  var panTiltAngleStep = 0.03; // (rad)
  var viewAngleStep = 0; // (º)

  var imgTextSource = "resources/cube_map-rubik.png";
  var textScaleFactor = 0; // Textura envolvente

  var farDistance = Math.ceil(this.mazeMap.sz * Math.sqrt(2) * cubeSize); // (m)

  var walkEffectOn = true;

  var playerCam = new Camera ('playerCam',
                          camPosX, camPosY, camPosZ, camSize, camSize, camSize,
                          camPanAngle, camTiltAngle, camViewAngle,
                          maxPanAngle, minPanAngle, maxTiltAngle, minTiltAngle,
                          moveStep, panTiltAngleStep, viewAngleStep,
                          imgTextSource, textScaleFactor,
                          farDistance, walkEffectOn,
                          canvas3d, gl);

  playerCam.walkHeightIncrement = 0.03; // (m)
  playerCam.walkAngleStep = Math.PI/6; // (rad)

  this.models.push(playerCam);
  console.log('         Inizialized player camera');
}
Level.prototype.initTopPlayerCam = function (canvas3d, gl, cubeSize) {

  var playerCam = this.getCamera('playerCam');

  var camPosX = playerCam.posX; // (m)
  var camPosY = playerCam.posY; // (m)
  var camPosZ = playerCam.posZ + playerCam.scalZ + 1.00; // (m)
  var camSize = 0.0; // (m)

  var camPanAngle  = playerCam.panAngle; // (rad)
  var camTiltAngle = -Math.PI/2 + 0.01; // (rad)
  var camViewAngle = 45; // (º)

  var maxPanAngle = playerCam.maxPanAngle; // (rad);
  var minPanAngle = playerCam.minPanAngle; // (rad);
  var maxTiltAngle = playerCam.maxTiltAngle; // (rad);
  var minTiltAngle = playerCam.minTiltAngle; // (rad);

  var moveStep = playerCam.moveStep; // (m)
  var panTiltAngleStep = playerCam.panTiltAngleStep; // (rad)
  var viewAngleStep = 0; // (º)

  var imgTextSource = "";
  var textScaleFactor = 1;

  var farDistance = playerCam.farDistance; // (m)

  var walkEffectOn = playerCam.walkEffectOn;

  var topPlayerCam = new Camera ('topPlayerCam',
                          camPosX, camPosY, camPosZ, camSize, camSize, camSize,
                          camPanAngle, camTiltAngle, camViewAngle,
                          maxPanAngle, minPanAngle, maxTiltAngle, minTiltAngle,
                          moveStep, panTiltAngleStep, viewAngleStep,
                          imgTextSource, textScaleFactor,
                          farDistance, walkEffectOn,
                          canvas3d, gl);

  topPlayerCam.walkHeightIncrement = playerCam.walkHeightIncrement; // (m)
  topPlayerCam.walkAngleStep = playerCam.walkAngleStep; // (rad)

  this.models.push(topPlayerCam);
  console.log('         Inizialized top player camera');
}
Level.prototype.initExitCam = function (canvas3d, gl, cubeSize) {
  var camPosX;
  var camPosY;
  var camPosZ = 2.50; // (m)
  var camSizeX = 0.35; // (m)
  var camSizeY = 0.15; // (m)
  var camSizeZ = (2/3)*camSizeY; // (m)

  var camPanAngle;
  if (this.mazeMap.out.x === 0) { // Casilla de salida en parte lateral derecha del mapa
    camPosX = (this.mazeMap.out.x * cubeSize) + camSizeX/2 + 0.01; // (m)
    camPosY = (this.mazeMap.out.y + 0.5 ) * cubeSize; // (m)
    camPanAngle = 0.0; // (rad)

  } else { // Casilla de salida en parte superior del mapa
    camPosX = (this.mazeMap.out.x + 0.5) * cubeSize; // (m)
    camPosY = (this.mazeMap.out.y * cubeSize) + camSizeX/2 + 0.01; // (m)
    camPanAngle = Math.PI/2; // (rad)
    minPanAngle = -Math.PI; // (rad)
  }

  var camTiltAngle = -Math.PI/12; // (rad);
  var camViewAngle = 45; // (º)

  var maxPanAngle = camPanAngle + Math.PI/2; // (rad);
  var minPanAngle = camPanAngle - Math.PI/2; // (rad);
  var maxTiltAngle = 0.0; // (rad);
  var minTiltAngle = - Math.PI/2 + 0.05; // (rad);

  var moveStep = 0.0; // (m)
  var panTiltAngleStep = 0.04; // (rad)
  var viewAngleStep = 1; // (º)

  var imgTextSource = "resources/cube_map-camera.jpg";
  var textScaleFactor = 0; // Textura envolvente

  var farDistance = Math.ceil(this.mazeMap.sz * Math.sqrt(2) * cubeSize); // (m)

  var walkEffectOn = false;

  var exitCam = new Camera ('exitCam',
                        camPosX, camPosY, camPosZ, camSizeX, camSizeY, camSizeZ,
                        camPanAngle, camTiltAngle, camViewAngle,
                        maxPanAngle, minPanAngle, maxTiltAngle, minTiltAngle,
                        moveStep, panTiltAngleStep, viewAngleStep,
                        imgTextSource, textScaleFactor,
                        farDistance, walkEffectOn,
                        canvas3d, gl);
  this.models.push(exitCam);
  console.log('         Inizialized exit camera');
}
Level.prototype.initGround = function (gl, cubeSize, groundImgTextSource) {
  var maze3dSize = cubeSize * this.mazeMap.sz; // (m)
  var groundSizeX = maze3dSize;
  var groundSizeY = maze3dSize;
  var groundSizeZ = 0;
  var groundPosX = groundSizeX / 2;
  var groundPosY = groundSizeY / 2;
  var groundPosZ = 0;
  var textScaleFactor = maze3dSize; // (textScaleFactor x textScaleFactor) imágenes
  var ground = new Square('ground', groundPosX, groundPosY, groundPosZ, groundSizeX,
                           groundSizeY, groundSizeZ, groundImgTextSource, textScaleFactor, gl);
  this.models.push(ground);
  console.log('         Inizialized ground');
}
Level.prototype.initCeiling = function (gl, cubeSize, ceilingImgTextSource) {
  var maze3dSize = cubeSize * this.mazeMap.sz; // (m)
  var ceilingSizeX = maze3dSize;
  var ceilingSizeY = maze3dSize;
  var ceilingSizeZ = 0;
  var ceilingPosX = ceilingSizeX / 2;
  var ceilingPosY = ceilingSizeY / 2;
  var ceilingPosZ = cubeSize;
  var textScaleFactor = maze3dSize; // (textScaleFactor x textScaleFactor) imágenes
  var ceiling = new Square('ceiling', ceilingPosX, ceilingPosY, ceilingPosZ, ceilingSizeX,
                           ceilingSizeY, ceilingSizeZ, ceilingImgTextSource, textScaleFactor, gl);
  this.models.push(ceiling);
  console.log('         Inizialized ceiling');
}
Level.prototype.initGenericCubes = function (gl, cubeSize, genericCubeImgTextSource) {
  var cubePosX, cubePosY;
  var cubePosZ = cubeSize / 2; // Posición del cubo a ras de suelo
  var textScaleFactor = cubeSize; // (textScaleFactor x textScaleFactor) imágenes por cara

  var i, j;
  for(i = 0; i < this.mazeMap.rooms.length; i++){
    for(j = 0; j < this.mazeMap.rooms.length; j++){
      // ++++++++++++++ Cubos en casillas negras del laberinto +++++++++++++++++
      if (!this.mazeMap.rooms[i][j]) { // Si la casilla no está libre...
        cubePosX = (i + 0.5 ) * cubeSize;
        cubePosY = (j + 0.5 ) * cubeSize;
        var genericCube = new Cube('genericCube', cubePosX, cubePosY, cubePosZ, cubeSize,
                                   cubeSize, cubeSize, genericCubeImgTextSource, textScaleFactor, gl)
        this.models.push(genericCube);
      }
      // ++++++++ Añadir 1 fila de cubos en pared superior del laberinto +++++++
      if (j === 0) { // Primera fila
        cubePosX = (i + 0.5 ) * cubeSize;
        cubePosY = - 0.5 * cubeSize;
        var genericCube = new Cube('genericCube', cubePosX, cubePosY, cubePosZ, cubeSize,
                                   cubeSize, cubeSize, genericCubeImgTextSource, textScaleFactor, gl)
        this.models.push(genericCube);
      }
    }
  }
  console.log('         Inizialized generic cubes');
}
Level.prototype.initExitCube = function (gl, cubeSize, exitCubeImgTextSource) {
  var cubePosX, cubePosY;
  if (this.mazeMap.out.x === 0) {
    cubePosX = - 0.5 * cubeSize;
    cubePosY = (this.mazeMap.out.y + 0.5) * cubeSize;
  } else {
    cubePosX = (this.mazeMap.out.x + 0.5) * cubeSize;
    cubePosY = - 0.5 * cubeSize;
  }
  var cubePosZ = cubeSize / 2; // Posición del cubo a ras de suelo
  var textScaleFactor = cubeSize / 3; // La textura ocupa toda la cara en un cubo de 3m
  var exitCube = new Cube('exitCube', cubePosX, cubePosY, cubePosZ, cubeSize, cubeSize,
                          cubeSize, exitCubeImgTextSource, textScaleFactor, gl)
  this.models.push(exitCube);
  console.log('         Inizialized exit cube');
}
Level.prototype.initTime = function () {
  var dateStart = new Date();
  this.timeStart = dateStart.getTime();
}
Level.prototype.getCamera = function (cameraId) {
  var camera;
  var i;
  for (i in this.models) {
    if (this.models[i].id === cameraId) {
      camera = this.models[i];
      break;
    }
  }
  return camera;
}
Level.prototype.operateCamera = function (cameraId, action, cubeSize, canvas3d) {
  var operatePlayerCam = false;
  if (cameraId === 'playerCam') {
    operatePlayerCam = true;
  }
  var i;
  for (i in this.models) {
    if (this.models[i].id === cameraId) {
      if (action.match('move')) {
        if (this.nextPosAllowed(this.models[i], action, cubeSize)) {
          this.models[i].operate(action);
          this.mazeMapPlayerPosUpdate(cubeSize);
          this.exitMaze = this.foundExitMaze(canvas3d, cubeSize);
          if (operatePlayerCam) {
            this.operateTopPlayerCam(action);
          }
        }
      } else {
        this.models[i].operate(action);
        if (operatePlayerCam) {
          if (action === 'panLeft' || action === 'panRight') {
            this.operateTopPlayerCam(action);
          }
        }
      }
      if (game.camDebugOn) {
        cameraMovementDebug(this.models[i], cubeSize);
      }
      break;
    }
  }
}
Level.prototype.operateTopPlayerCam = function (action) {
  var i;
  for (i in this.models) {
    if (this.models[i].id === 'topPlayerCam'){
        this.models[i].operate(action);
      break;
    }
  }
}
Level.prototype.nextPosAllowed = function (object, action, cubeSize) {
  var nextPosAllowed = false;
  var maxDistToWall = 0.30; // (m)

  nextObjectCoord = object.getNextPosCoordinate(action, maxDistToWall); // (x, y)
  nextPosI = Math.trunc(nextObjectCoord[0] / cubeSize);
  nextPosJ = Math.trunc(nextObjectCoord[1] / cubeSize);

  if (nextObjectCoord[1] > 0)  { // Para evitar atravesar fila de cubos añadida
                                 // en la parte superior del mapa
    nextPosAllowed = this.mazeMap.rooms[nextPosI][nextPosJ];
  }
  return nextPosAllowed;
}
Level.prototype.mazeMapPlayerPosUpdate = function (cubeSize) {
  var playerCam = this.getCamera('playerCam');
  this.mazeMap.pos.x = Math.trunc(playerCam.posX / cubeSize);
  this.mazeMap.pos.y = Math.trunc(playerCam.posY / cubeSize);
}
Level.prototype.foundExitMaze = function (canvas3d, cubeSize) {
  var foundExitMaze = false;
  var distToOpenDoor = 0.50 // (m)
  var playerCam = this.getCamera('playerCam');

  if (this.mazeMap.out.x === 0) { // Casilla de salida en parte lateral derecha del mapa
    if (playerCam.posX < distToOpenDoor && this.mazeMap.pos.y === this.mazeMap.out.y) { // Posición frente a puerta de salida
      foundExitMaze = true;
    }
  } else { // Casilla de salida en parte superior del mapa
    if (this.mazeMap.pos.x === this.mazeMap.out.x && playerCam.posY < distToOpenDoor) { // Posición frente a puerta de salida
      foundExitMaze = true;
    }
  }
  return foundExitMaze;
}
Level.prototype.getPoints = function () {
  var date = new Date();
  var timeNow = date.getTime();
  var timeElapsed = (Math.trunc((timeNow - this.timeStart) / 1000.0));

  var percentTimeElapsed = Math.round( 100 * (timeElapsed / this.timeLimit) ); // (%)
  var points;

  if (percentTimeElapsed < 25) { // (%)
    points = this.maxPoints;
  } else if (percentTimeElapsed < 50) { // (%)
    points = this.maxPoints / 2;
  } else if (percentTimeElapsed < 75) { // (%)
    points = this.maxPoints / 4;
  } else {
    points = this.maxPoints / 8;
  }
  return points;
}
