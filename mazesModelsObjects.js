function Square (id, posX, posY, posZ, scalX, scalY, scalZ, imgTextSource, textScaleFactor, gl) {
  this.id = id;
  this.posX = posX;
  this.posY = posY;
  this.posZ = posZ;
  this.scalX = scalX;
  this.scalY = scalY;
  this.scalZ = scalZ;
  this.imgTextSource = imgTextSource;
  this.textScaleFactor = textScaleFactor;

  this.modelMatrix              = this.getModelMatrix();
  this.vertexBuffer             = this.getVertexBuffer(gl);
  this.vertexNormalBuffer       = this.getVertexNormalBuffer(gl);
  this.vertexTextureCoordBuffer = this.getVertexTextureCoordBuffer(gl);
  this.vertexIndexBuffer        = this.getVertexIndexBuffer(gl);
  this.texture                  = this.getTexture(gl);
}
Square.prototype.getModelMatrix = function() {
  // Matriz de modelo (M)
  var modelMatrix = new Matrix4();
  modelMatrix.translate(this.posX, this.posY, this.posZ).
              scale(this.scalX, this.scalY, this.scalZ);
  return modelMatrix;
}
Square.prototype.getVertexBuffer = function(gl) {
  // Coordenadas de los vértices del cuadrado
  var vertex = new Float32Array([
  //  x     y     z       x     y     z       x     y     z       x     y     z                         v0----- v1
     0.5,  0.5,  0.0,    0.5, -0.5,  0.0,   -0.5, -0.5,  0.0,   -0.5,  0.5,  0.0    // v0-v1-v2-v3     /        /
                                                                                    //               v3------v2
  ]);
  // Inicializar buffer de vértices del suelo
  var vertexBuffer = gl.createBuffer(); // Crear e inicializar buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // Enlazar buffer a un array de atributos
  gl.bufferData(gl.ARRAY_BUFFER, vertex, gl.STATIC_DRAW); // Crear e inicializar un almacén de datos
                                                          // para el buffer, de manera estática
  return vertexBuffer;
}
Square.prototype.getVertexNormalBuffer = function(gl) {
  // Coordenadas de los vértices de los vectores normales al cuadrado
  var vertexNormals = new Float32Array([
  //  x     y     z       x     y     z       x     y     z       x     y     z
     0.0,  0.0,  1.0,    0.0,  0.0,  1.0,    0.0,  0.0,  1.0,    0.0,  0.0,  1.0
  ]);
  // Buffer de vértices de los vectores normales al suelo
  var vertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexNormals, gl.STATIC_DRAW);
  return vertexNormalBuffer;
}
Square.prototype.getVertexTextureCoordBuffer = function(gl) {
  var tsf = this.textScaleFactor;
  // Coordenadas de textura del cuadrado
  var textureCoordinates = new Float32Array([
  // s     t        s     t        s     t        s     t
    0.0,  0.0,     tsf,  0.0,     tsf,  tsf,     0.0,  tsf,
  ]);
  // Buffer de vértices de las coordenadas de textura
  var vertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.STATIC_DRAW);
  return vertexTextureCoordBuffer;
}
Square.prototype.getVertexIndexBuffer = function(gl) {
  // Índices de los vértices del cuadrado
  var vertexIndex =  new Uint16Array([
  // Triángulo 1     Triángulo 2
      0,  1,  2,      0,  2,  3
    ]);
  // Buffer de índices de los vértices del suelo
  var vertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexIndex, gl.STATIC_DRAW);
  return vertexIndexBuffer;
}
Square.prototype.getTexture = function(gl) {
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 0, 255]));
  var image = new Image();
  image.onload = function() { handleTextureLoaded(image, texture); }
  image.src = this.imgTextSource;
  return texture;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function Cube (id, posX, posY, posZ, scalX, scalY, scalZ, imgTextSource, textScaleFactor, gl) {
  this.id = id;
  this.posX = posX;
  this.posY = posY;
  this.posZ = posZ;
  this.scalX = scalX;
  this.scalY = scalY;
  this.scalZ = scalZ;
  this.imgTextSource = imgTextSource;
  this.textScaleFactor = textScaleFactor;

  this.modelMatrix              = this.getModelMatrix();
  this.vertexBuffer             = this.getVertexBuffer(gl);
  this.vertexNormalBuffer       = this.getVertexNormalBuffer(gl);
  if (this.textScaleFactor != 0) {
    this.vertexTextureCoordBuffer = this.getVertexTextureCoordBuffer(gl);
  } else {
    this.vertexTextureCoordBuffer = this.getVertexTextureCoordBufferCover(gl);
  }
  this.vertexIndexBuffer        = this.getVertexIndexBuffer(gl);
  this.texture                  = this.getTexture(gl);
}
// -----------------------------------------------------------------------------
//                         (top)
//                           z     (back)
//                           |   /
//                           | /
//            (left) --------/-------- y (right)
//                         / |
//                       /   |
//                     x  (bottom)
//               (front)

//    v3----- v2    v0 =  0.5, -0.5,  0.5,
//   /|      /|     v1 =  0.5,  0.5,  0.5,
//  v0------v1|     v2 = -0.5,  0.5,  0.5,
//  | |     | |     v3 = -0.5, -0.5,  0.5,
//  | |v5---|-|v6   v4 =  0.5, -0.5, -0.5,
//  |/      |/      v5 = -0.5, -0.5, -0.5,
// v4------v7       v6 = -0.5,  0.5, -0.5,
//                  v7 =  0.5,  0.5, -0.5,
// -----------------------------------------------------------------------------
Cube.prototype.getModelMatrix = function() {
  // Matriz de modelo (M)
  var modelMatrix = new Matrix4();
  modelMatrix.translate(this.posX, this.posY, this.posZ).
              scale(this.scalX, this.scalY, this.scalZ);
  return modelMatrix;
}
Cube.prototype.getVertexBuffer = function(gl) {
  // Coordenadas de los vértices del cubo
  var vertex = new Float32Array([
  //  x     y     z       x     y     z       x     y     z       x     y     z
     0.5, -0.5,  0.5,    0.5, -0.5, -0.5,    0.5,  0.5, -0.5,    0.5,  0.5,  0.5,   // v0-v4-v7-v1 Front
    -0.5, -0.5,  0.5,   -0.5, -0.5, -0.5,    0.5, -0.5, -0.5,    0.5, -0.5,  0.5,   // v3-v5-v4-v0 Left
     0.5,  0.5,  0.5,    0.5,  0.5, -0.5,   -0.5,  0.5, -0.5,   -0.5,  0.5,  0.5,   // v1-v7-v6-v2 Right
    -0.5, -0.5,  0.5,    0.5, -0.5,  0.5,    0.5,  0.5,  0.5,   -0.5,  0.5,  0.5,   // v3-v0-v1-v2 Top
     0.5, -0.5, -0.5,   -0.5, -0.5, -0.5,   -0.5,  0.5, -0.5,    0.5,  0.5, -0.5,   // v4-v5-v6-v7 Bottom
    -0.5,  0.5,  0.5,   -0.5,  0.5, -0.5,   -0.5, -0.5, -0.5,   -0.5, -0.5,  0.5,   // v2-v6-v5-v3 Back
  ]);
  // Inicializar buffer de vértices del cubo
  var vertexBuffer = gl.createBuffer(); // Crear e inicializar buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // Enlazar buffer a un array de atributos
  gl.bufferData(gl.ARRAY_BUFFER, vertex, gl.STATIC_DRAW); // Crear e inicializar un almacén de datos
                                                          // para el buffer, de manera estática
  return vertexBuffer;
}
Cube.prototype.getVertexNormalBuffer = function(gl) {
  // Coordenadas de los vértices de los vectores normales al cubo
  var vertexNormals = new Float32Array([
  //  x     y     z       x     y     z       x     y     z       x     y     z
     1.0,  0.0,  0.0,    1.0,  0.0,  0.0,    1.0,  0.0,  0.0,    1.0,  0.0,  0.0,  // Front
     0.0, -1.0,  0.0,    0.0, -1.0,  0.0,    0.0, -1.0,  0.0,    0.0, -1.0,  0.0,  // Left
     0.0,  1.0,  0.0,    0.0,  1.0,  0.0,    0.0,  1.0,  0.0,    0.0,  1.0,  0.0,  // Right
     0.0,  0.0,  1.0,    0.0,  0.0,  1.0,    0.0,  0.0,  1.0,    0.0,  0.0,  1.0,  // Top
     0.0,  0.0, -1.0,    0.0,  0.0, -1.0,    0.0,  0.0, -1.0,    0.0,  0.0, -1.0,  // Bottom
    -1.0,  0.0,  0.0,   -1.0,  0.0,  0.0,   -1.0,  0.0,  0.0,   -1.0,  0.0,  0.0,  // Back
  ]);
  // Buffer de vértices de los vectores normales al cubo
  var vertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexNormals, gl.STATIC_DRAW);
  return vertexNormalBuffer;
}
Cube.prototype.getVertexTextureCoordBuffer = function(gl) {
  var tsf = this.textScaleFactor;         // tsf = 1 --> textura ocupa toda la figura
  // Coordenadas de textura del cubo      // tsf > 1 --> textura se hace más pequeña y se repite
  var textureCoordinates = new Float32Array([
  // s     t        s     t        s     t        s     t
    0.0,  0.0,     0.0,  tsf,     tsf,  tsf,     tsf,  0.0,   // Front
    0.0,  0.0,     0.0,  tsf,     tsf,  tsf,     tsf,  0.0,   // Left
    0.0,  0.0,     0.0,  tsf,     tsf,  tsf,     tsf,  0.0,   // Right
    0.0,  0.0,     0.0,  tsf,     tsf,  tsf,     tsf,  0.0,   // Top
    0.0,  0.0,     0.0,  tsf,     tsf,  tsf,     tsf,  0.0,   // Bottom
    0.0,  0.0,     0.0,  tsf,     tsf,  tsf,     tsf,  0.0,   // Back
  ]);
  // Buffer de vértices de las coordenadas de textura
  var vertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.STATIC_DRAW);
  return vertexTextureCoordBuffer;
}
Cube.prototype.getVertexTextureCoordBufferCover = function(gl) {
  // Coordenadas de textura del cubo
  var textureCoordinates = new Float32Array([
  //  s     t        s     t        s     t        s     t     resources/cube_map-template.png
    0.25,  0.25,   0.25,  0.50,   0.50,  0.50,   0.50,  0.25,  // A-B-C-D Front
    0.00,  0.25,   0.00,  0.50,   0.25,  0.50,   0.25,  0.25,  // E-F-G-H Left
    0.50,  0.25,   0.50,  0.50,   0.75,  0.50,   0.75,  0.25,  // I-J-K-L Right
    0.25,  0.00,   0.25,  0.25,   0.50,  0.25,   0.50,  0.00,  // M-N-O-P Top
    0.25,  0.50,   0.25,  0.75,   0.50,  0.75,   0.50,  0.50,  // Q-R-S-T Bottom
    0.75,  0.25,   0.75,  0.50,   1.00,  0.50,   1.00,  0.25,  // U-V-W-J Back
  ]);
  // Buffer de vértices de las coordenadas de textura
  var vertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.STATIC_DRAW);
  return vertexTextureCoordBuffer;
}
Cube.prototype.getVertexIndexBuffer = function(gl) {
  // Índices de los vértices del cubo
  var vertexIndex =  new Uint16Array([
// Triángulo 1     Triángulo 2
    0,  1,  2,      0,  2,  3,    // Front
    4,  5,  6,      4,  6,  7,    // Left
    8,  9,  10,     8,  10, 11,   // Right
    12, 13, 14,     12, 14, 15,   // Top
    16, 17, 18,     16, 18, 19,   // Bottom
    20, 21, 22,     20, 22, 23    // Back
  ]);
  // Buffer de índices de los vértices del cubo
  var vertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexIndex, gl.STATIC_DRAW);
  return vertexIndexBuffer;
}
Cube.prototype.getTexture = function(gl) {
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 0, 255]));
  var image = new Image();
  image.onload = function() { handleTextureLoaded(image, texture); }
  image.src = this.imgTextSource;
  return texture;
}


//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function Camera (id, posX, posY, posZ, scalX, scalY, scalZ,
                 panAngle, tiltAngle, viewAngle,
                 maxPanAngle, minPanAngle, maxTiltAngle, minTiltAngle,
                 moveStep, panTiltAngleStep, viewAngleStep,
                 imgTextSource, textScaleFactor,
                 farDistance, walkEffectOn,
                 canvas3d, gl) {
  this.id = id;
  this.posX = posX;
  this.posY = posY;
  this.posZ = posZ;
  this.scalX = scalX;
  this.scalY = scalY;
  this.scalZ = scalZ;

  this.panAngle = panAngle;
  this.tiltAngle = tiltAngle;
  this.viewAngle = viewAngle;

  this.maxPanAngle = maxPanAngle;
  this.minPanAngle = minPanAngle;
  this.maxTiltAngle = maxTiltAngle;
  this.minTiltAngle = minTiltAngle;

  this.moveStep = moveStep;
  this.panTiltAngleStep = panTiltAngleStep;
  this.viewAngleStep = viewAngleStep;

  this.axisVector = [0, 0, 1]; // (x, y, z) Vector eje de cámara (orientación vertical)
  this.viewVector = this.getViewVector(); // Vector vista: hacia dónde mira la cámara

  this.imgTextSource = imgTextSource;
  this.textScaleFactor = textScaleFactor;

  this.farDistance = farDistance;
  this.canvas = canvas3d;
  this.walkEffectOn = walkEffectOn;
  if (this.walkEffectOn) {
    this.walkAngle = - Math.PI/2; // (rad)
    this.height = this.posZ;
  }

  this.projMatrix = new Matrix4();
  this.updateProjMatrix();
  this.viewMatrix = new Matrix4();
  this.updateViewMatrix();
  this.updateModelMatrix();

  var cube = new Cube(this.id, this.posX, this.posY, this.posZ,
                      this.scalX, this.scalY, this.scalZ,
                      this.imgTextSource, this.textScaleFactor, gl);
  this.vertexBuffer             = cube.vertexBuffer;
  this.vertexNormalBuffer       = cube.vertexNormalBuffer;
  this.vertexTextureCoordBuffer = cube.vertexTextureCoordBuffer;
  this.vertexIndexBuffer        = cube.vertexIndexBuffer;
  this.texture                  = cube.texture;
}
Camera.prototype.getViewVector = function() {
  var viewVector = []; // (x, y, z)
  viewVector[0] = Math.cos(this.panAngle) * Math.cos(this.tiltAngle);
  viewVector[1] = Math.sin(this.panAngle) * Math.cos(this.tiltAngle);
  viewVector[2] = Math.sin(this.tiltAngle);
  return viewVector;
}
Camera.prototype.updateModelMatrix = function() {
  var panAngle = (this.panAngle * 180) / Math.PI; // (º)
  var tiltAngle = (this.tiltAngle * 180) / Math.PI; // (º)

  // Matriz de modelo (M)
  this.modelMatrix = new Matrix4();
  this.modelMatrix.translate(this.posX, this.posY, this.posZ).
                   rotate(panAngle, 0, 0, 1).rotate(-tiltAngle, 0, 1, 0).
                   scale(this.scalX, this.scalY, this.scalZ);
}
Camera.prototype.updateViewMatrix = function() {
  // Coordenada del punto hacia donde mira la cámara
  var viewX = this.viewVector[0] + this.posX;
  var viewY = this.viewVector[1] + this.posY;
  var viewZ = this.viewVector[2] + this.posZ;
  // Coordenada del eje de la cámara
  var axisX = this.axisVector[0];
  var axisY = this.axisVector[1];
  var axisZ = this.axisVector[2];
  // Matriz de vista (V)
  this.viewMatrix.setLookAt(this.posX, this.posY, this.posZ,
                            viewX, viewY, viewZ,
                            axisX, axisY, axisZ);
}
Camera.prototype.updateProjMatrix = function() {
  var aspectRatio = this.canvas.width/this.canvas.height;
  var nearDistance = 0.01; // (m)
  // Matriz de perspectiva (P)
  this.projMatrix.setPerspective(this.viewAngle, aspectRatio, nearDistance, this.farDistance);
}
Camera.prototype.getNextPosCoordinate = function(action, safetyDistance) {
  var nextPosX = this.posX;
  var nextPosY = this.posY;
  switch(action) {
    case 'moveForward':
      nextPosX += Math.cos(this.panAngle) * (this.moveStep + safetyDistance);
      nextPosY += Math.sin(this.panAngle) * (this.moveStep + safetyDistance);
    break;
    case 'moveBack':
      nextPosX -= Math.cos(this.panAngle) * (this.moveStep + safetyDistance);
      nextPosY -= Math.sin(this.panAngle) * (this.moveStep + safetyDistance);
    break;
    case 'moveLeft':
      nextPosX += Math.cos(this.panAngle + Math.PI/2) * (this.moveStep + safetyDistance);
      nextPosY += Math.sin(this.panAngle + Math.PI/2) * (this.moveStep + safetyDistance);
    break;
    case 'moveRight':
      nextPosX += Math.cos(this.panAngle - Math.PI/2) * (this.moveStep + safetyDistance);
      nextPosY += Math.sin(this.panAngle - Math.PI/2) * (this.moveStep + safetyDistance);
    break;
  }
  var getNextPosCoordinate = [nextPosX, nextPosY];
  return getNextPosCoordinate;
}
Camera.prototype.operate = function(action) {
  switch(action) {
    case 'moveForward':
      this.posX += Math.cos(this.panAngle) * this.moveStep;
      this.posY += Math.sin(this.panAngle) * this.moveStep;
      if (this.walkEffectOn) {
        this.walkAngle += this.walkAngleStep;
        if (this.walkAngle >= 2*Math.PI) {
          this.walkAngle = 0.0;
        }
        this.posZ = this.height + (Math.cos(this.walkAngle) * this.walkHeightIncrement);
      }
      this.updateModelMatrix();
      this.updateViewMatrix();
    break;
    case 'moveBack':
      this.posX -= Math.cos(this.panAngle) * this.moveStep;
      this.posY -= Math.sin(this.panAngle) * this.moveStep;
      if (this.walkEffectOn) {
        this.walkAngle -= this.walkAngleStep;
        if (this.walkAngle <= -2*Math.PI) {
          this.walkAngle = 0.0;
        }
        this.posZ = this.height + (Math.cos(this.walkAngle) * this.walkHeightIncrement);
      }
      this.updateModelMatrix();
      this.updateViewMatrix();
    break;
    case 'moveLeft':
      this.posX += Math.cos(this.panAngle + Math.PI/2) * this.moveStep;
      this.posY += Math.sin(this.panAngle + Math.PI/2) * this.moveStep;
      if (this.walkEffectOn) {
        this.walkAngle += this.walkAngleStep;
        if (this.walkAngle >= 2*Math.PI) {
          this.walkAngle = 0.0;
        }
        this.posZ = this.height + (Math.cos(this.walkAngle) * this.walkHeightIncrement);
      }
      this.updateModelMatrix();
      this.updateViewMatrix();
    break;
    case 'moveRight':
      this.posX += Math.cos(this.panAngle - Math.PI/2) * this.moveStep;
      this.posY += Math.sin(this.panAngle - Math.PI/2) * this.moveStep;
      if (this.walkEffectOn) {
        this.walkAngle -= this.walkAngleStep;
        if (this.walkAngle <= -2*Math.PI) {
          this.walkAngle = 0.0;
        }
        this.posZ = this.height + (Math.cos(this.walkAngle) * this.walkHeightIncrement);
      }
      this.updateModelMatrix();
      this.updateViewMatrix();
    break;
    case 'panLeft':
      if (this.panAngle < this.maxPanAngle) {
        this.panAngle += this.panTiltAngleStep;
        if (this.panAngle >= 2*Math.PI) {
          this.panAngle = 0.0;
        }
        this.viewVector[0] = Math.cos(this.panAngle) * Math.cos(this.tiltAngle);
        this.viewVector[1] = Math.sin(this.panAngle) * Math.cos(this.tiltAngle);
        this.updateModelMatrix();
        this.updateViewMatrix();
      }
    break;
    case 'panRight':
      if (this.panAngle > this.minPanAngle) {
        this.panAngle -= this.panTiltAngleStep;
        if (this.panAngle <= -2*Math.PI) {
          this.panAngle = 0.0;
        }
        this.viewVector[0] = Math.cos(this.panAngle) * Math.cos(this.tiltAngle);
        this.viewVector[1] = Math.sin(this.panAngle) * Math.cos(this.tiltAngle);
        this.updateModelMatrix();
        this.updateViewMatrix();
      }
    break;
    case 'tiltUp':
      if (this.tiltAngle < this.maxTiltAngle) {
        this.tiltAngle += this.panTiltAngleStep;
        this.viewVector[0] = Math.cos(this.panAngle) * Math.cos(this.tiltAngle);
        this.viewVector[1] = Math.sin(this.panAngle) * Math.cos(this.tiltAngle);
        this.viewVector[2] = Math.sin(this.tiltAngle);
        this.updateModelMatrix();
        this.updateViewMatrix();
      }
    break;
    case 'tiltDown':
      if (this.tiltAngle > this.minTiltAngle) {
        this.tiltAngle -= this.panTiltAngleStep;
        this.viewVector[0] = Math.cos(this.panAngle) * Math.cos(this.tiltAngle);
        this.viewVector[1] = Math.sin(this.panAngle) * Math.cos(this.tiltAngle);
        this.viewVector[2] = Math.sin(this.tiltAngle);
        this.updateModelMatrix();
        this.updateViewMatrix();
      }
    break;
    case 'zoomIn':
      if (this.viewAngle > 15) {
        this.viewAngle -= this.viewAngleStep;
        this.updateProjMatrix();
      }
    break;
    case 'zoomOut':
      if (this.viewAngle < 45) {
        this.viewAngle += this.viewAngleStep;
        this.updateProjMatrix();
      }
    break;
  }
}
