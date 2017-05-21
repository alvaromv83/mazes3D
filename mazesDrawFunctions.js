function drawCanvas2dMessage(message) {

  game.ctx_2d.save();
  // Dibujar rectángulo del tamaño del canvas
  game.ctx_2d.fillStyle = 'rgba(255, 255, 255, 1.0)';
  game.ctx_2d.beginPath();
  game.ctx_2d.fillRect(0, 0, game.canvas2d.width, game.canvas2d.height);
  game.ctx_2d.fill();
  // Mostrar mensaje
  game.ctx_2d.font = '14pt Arial';
  game.ctx_2d.fillStyle = 'black';
  game.ctx_2d.fillText(message, 0, game.canvas2d.height / 2, game.canvas2d.width);
  game.ctx_2d.restore();
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function drawScene() {
  var currentLevel = game.levels[game.nLevel-1];

  // Evaluar tiempo
  var date = new Date();
  var timeNow = date.getTime();
  var timeElapsed = (Math.trunc((timeNow - currentLevel.timeStart) / 1000.0));
  if (currentLevel.timeLimit - timeElapsed === 0) {
    game.timeOut = true;
  }

  game.ctx_2d.clearRect(0, 0, game.canvas2d.width, game.canvas2d.height); // Limpiar canvas 2D
  game.gl.clear(game.gl.COLOR_BUFFER_BIT | game.gl.DEPTH_BUFFER_BIT); // Establecer color del canvas 3D

  if (game.mode != 'expert') {
    drawMazeMap();
  }
  drawScore(currentLevel, timeElapsed);
  drawModels(currentLevel); // Los modelos 3D se pintan en función de la matriz vista de la cámara

  if (game.win) {
    message = "                              " +
              "Congratulations, you win!  Total Points: " + game.points;
    drawCanvas2dMessage(message);
    console.log('End of drawing the scene');

  } else if (game.timeOut) {
    message = '                              ' +
              'Time Out.  Please refresh the page if you want to try again';
    drawCanvas2dMessage(message);
    console.log('End of drawing the scene');

  } else if (game.exit) {
    message = '                              ' +
              'Exit game.  Please refresh the page if you want to try again';
    drawCanvas2dMessage(message);
    console.log('End of drawing the scene');

  } else {
    requestAnimationFrame(drawScene);
  }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function drawMazeMap() {
  var mazeMapCanvas2dPosX = 0;
  var mazeMapCanvas2dPosY = 0;
  var mazeMapSize = game.canvas2d.width / 100;
  game.levels[game.nLevel-1].mazeMap.draw(game.ctx_2d, mazeMapCanvas2dPosX, mazeMapCanvas2dPosY, mazeMapSize);
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function drawScore(currentLevel, timeElapsed) {
  var scoreLength = 300;
  var levelTimeLeft = currentLevel.timeLimit - timeElapsed;

	game.ctx_2d.save();
  game.ctx_2d.font = '14pt Arial';
  game.ctx_2d.fillStyle = 'white';
  game.ctx_2d.fillText('level: ' + game.nLevel, game.canvas2d.width - scoreLength - 15, 30);
  game.ctx_2d.fillText('points: ' + game.points, game.canvas2d.width - (2/3)*scoreLength - 15, 30);
  switch(game.cameraOn.id ) {
    case 'playerCam':
      game.ctx_2d.fillText('player', game.canvas2d.width - 65, game.canvas2d.height - 20);
    break;
    case 'topPlayerCam':
      game.ctx_2d.fillText('player (3rd person)', game.canvas2d.width - 170, game.canvas2d.height - 20);
    break;
    case 'exitCam':
      game.ctx_2d.fillText('video camera', game.canvas2d.width - 128, game.canvas2d.height - 20);
      game.ctx_2d.fillText('zoom: ' + ((45 - game.cameraOn.viewAngle)/3).toFixed(1), 20, game.canvas2d.height - 20);
    break;
    default:
    return;
  }
  if (levelTimeLeft <= 15) { // (seg)
    game.ctx_2d.fillStyle = 'red';
  }
  game.ctx_2d.fillText('time: ' + (levelTimeLeft), game.canvas2d.width - (1/3)*scoreLength - 15, 30);
  game.ctx_2d.restore();
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function drawModels(currentLevel) {

  // Get the storage location of u_MvpMatrix
  var u_MvpMatrix = game.gl.getUniformLocation(game.gl.program, 'u_MvpMatrix');
  if (!u_MvpMatrix) {
    console.log('Failed to get the storage location of u_MvpMatrix');
    return;
  }
  // Get the storage location of u_ModelMatrix
  var u_ModelMatrix = game.gl.getUniformLocation(game.gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  var mvpMatrix = new Matrix4();
  var normalMatrix = new Matrix4();

  var i;
  for (i in currentLevel.models) {

    if (currentLevel.models[i].id === 'ground' || currentLevel.models[i].id === 'ceiling') {
        setModel(u_MvpMatrix, u_ModelMatrix, mvpMatrix, normalMatrix, currentLevel, i);
        // Dibujar cuadrado (2 triángulos)
        game.gl.drawElements(game.gl.TRIANGLES, 6, game.gl.UNSIGNED_SHORT, 0);

    } else if (currentLevel.models[i].id === 'genericCube' ||
               currentLevel.models[i].id === 'exitCube' ||
               (game.cameraOn.id != 'playerCam' && currentLevel.models[i].id === 'playerCam') ||
               (game.cameraOn.id != 'exitCam' && currentLevel.models[i].id === 'exitCam')) {
      setModel(u_MvpMatrix, u_ModelMatrix, mvpMatrix, normalMatrix, currentLevel, i);
      // Dibujar cubo (2 triángulos por cara)
      game.gl.drawElements(game.gl.TRIANGLES, 36, game.gl.UNSIGNED_SHORT, 0);
    }
  }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function setModel(u_MvpMatrix, u_ModelMatrix, mvpMatrix, normalMatrix, currentLevel, i) {

  var modelMatrix              = currentLevel.models[i].modelMatrix;
  var vertexBuffer             = currentLevel.models[i].vertexBuffer;
  var vertexNormalBuffer       = currentLevel.models[i].vertexNormalBuffer;
  var vertexTextureCoordBuffer = currentLevel.models[i].vertexTextureCoordBuffer;
  var vertexIndexBuffer        = currentLevel.models[i].vertexIndexBuffer;
  var texture                  = currentLevel.models[i].texture;

  // Calcular matriz Modelo-Vista-Perspectiva (MVP)
  mvpMatrix.set(game.cameraOn.projMatrix).multiply(game.cameraOn.viewMatrix).multiply(modelMatrix);

  game.gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  game.gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

  var vertexPositionAttribute = game.gl.getAttribLocation(game.gl.program, "a_VertexPosition");
  game.gl.enableVertexAttribArray(vertexPositionAttribute);

  var textureCoordAttribute = game.gl.getAttribLocation(game.gl.program, "a_TextureCoord");
  game.gl.enableVertexAttribArray(textureCoordAttribute);

  var vertexNormalAttribute = game.gl.getAttribLocation(game.gl.program, "a_VertexNormal");
  game.gl.enableVertexAttribArray(vertexNormalAttribute);

  game.gl.bindBuffer(game.gl.ARRAY_BUFFER, vertexBuffer);
  game.gl.vertexAttribPointer(vertexPositionAttribute, 3, game.gl.FLOAT, false, 0, 0);

  game.gl.bindBuffer(game.gl.ARRAY_BUFFER, vertexTextureCoordBuffer);
  game.gl.vertexAttribPointer(textureCoordAttribute, 2, game.gl.FLOAT, false, 0, 0);

  game.gl.bindBuffer(game.gl.ARRAY_BUFFER, vertexNormalBuffer);
  game.gl.vertexAttribPointer(vertexNormalAttribute, 3, game.gl.FLOAT, false, 0, 0);

  game.gl.activeTexture(game.gl.TEXTURE0);
  game.gl.bindTexture(game.gl.TEXTURE_2D, texture);
  game.gl.uniform1i(game.gl.getUniformLocation(game.gl.program, "u_Sampler"), 0);

  game.gl.bindBuffer(game.gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);

  normalMatrix.set(modelMatrix);
  normalMatrix.invert();
  normalMatrix.transpose();
  var nUniform = game.gl.getUniformLocation(game.gl.program, "u_NormalMatrix");
  game.gl.uniformMatrix4fv(nUniform, false, normalMatrix.elements);
}
