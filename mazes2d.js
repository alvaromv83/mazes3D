// Contiene un generador de laberintos aleatorio
// El laberinto está compuesto de un array de dos dimensiones con "true" (casilla libre) o "false" (casilla ocupada)

var Pos = function(x, y) { // Posición del cuadrado rojo (jugador)
	this.x = x
	this.y = y
}

Pos.prototype.sum = function(p) {
	return new Pos(p.x + this.x, p.y + this.y);
}

var DirEnum = {
	UP: 0,
	DOWN: 1,
	LEFT: 2,
	RIGHT: 3,
	NSIDES: 4,
};

var to = [new Pos(0, -1), new Pos (0, 1), new Pos(-1, 0), new Pos(1, 0),];

var Maze = function(size, out, start, viewRadius) {
	var i, j;
	this.sz = size;
	this.out = out;
	this.start = start;
	this.viewRadius = viewRadius;
	this.pos = new Pos(this.start.x, this.start.y);
	this.rooms = new Array(size);            // Rooms es un array de "size" elementos (primera fila del laberinto).
	for(i = 0; i < size; i++){               // Cada elemento es otro array de "size" elementos (una columna por
		this.rooms[i] = new Array(size)        // cada elemento de la primera fila).
		for(j = 0; j < size; j++){
			this.rooms[i][j] = false
		}
	}
}

Maze.prototype.isborder = function(p) {
	return p.x == 0 || p.x == this.sz-1 || p.y == 0 ||  p.y == this.sz-1;
}

Maze.prototype.isinside = function(p) {
	return p.x >= 0 && p.x <= this.sz-1 && p.y >= 0 &&  p.y <= this.sz-1;
}

Maze.prototype.iscross = function(from, dest) {
	var wr;
	for(wr =  0; wr < DirEnum.NSIDES; wr++) {
		var w = dest.sum(to[wr])
		if(w.x == from.x && w.y == from.y){
			continue
		}
		if(this.rooms[w.x][w.y]){
			return true;
		}
	}
	return false;
}


var PROBCUT = 80;	//	1/PROBCUT of cutting itself

//Randomized Prim algorithm
Maze.prototype.randPrim = function() {
	var wpend = [];
	wpend.push(this.start);
	this.rooms[this.start.x][this.start.y] = true;
	while(wpend.length != 0) {
		var rn = Math.floor(Math.random()*wpend.length);
		var wpos = wpend.splice(rn, 1)[0];
		var wr;
		for(wr = 0; wr < DirEnum.NSIDES; wr++){
			var w = wpos.sum(to[wr]);
			if(!this.isinside(w) || this.isborder(w) || this.rooms[w.x][w.y]){
				continue
			}
			if (this.iscross(wpos, w)) {
				rn = Math.floor(Math.random()*PROBCUT);
				if(rn != 1){
					continue;
				}
			}
			this.rooms[w.x][w.y] = true; // Me dice si la casilla está libre
			wpend.unshift(w);
		}
	}
	var i;
	for(i = this.out.x; i<this.sz; i++){
		this.rooms[i][this.out.y] = true;
		var con = this.out.sum(to[DirEnum.DOWN]);
		con.x = i;
		if (this.rooms[con.x][con.y])  {
			break
		}
	}
}

Maze.prototype.string = function() {
	var i, j;
	var s = "";
	for(i = 0; i<this.sz; i++){
		for(j = 0; j<this.sz; j++){
			if(i == this.pos.x && j == this.pos.y){
				s = s + "S";
			}else if(this.rooms[i][j]){
				s = s + " ";
			}else{
				s = s + "X"
			}
		}
		s = s + "\n"
	}
	return s
}

var WHITE = 'rgba(255, 255, 255, 1)';
var RED = 'rgba(255, 0, 0, 1)';
var BLUE = 'rgba(0, 0, 255, 1)';
var FONTSZ=18;

//if viewRadius is zero it draws all, else only around pos
Maze.prototype.draw = function(canvas, x, y, sz) {
	var i, j;
	var fontsz = FONTSZ;
	var r;
	var xp = x - (this.sz - this.pos.x - 1 - this.viewRadius)*sz;
	var yp = y - (this.pos.y - this.viewRadius)*sz;
	r = this.viewRadius;
	if(this.viewRadius == 0){
		r = Math.round(this.sz/2);
		xp = x;
		yp = y;
        }
	canvas.fillText("N", x+r*sz, y);
	canvas.save();
	canvas.translate(xp, yp);
	canvas.font = fontsz+'px "Times New Roman"';
	canvas.fillStyle = WHITE;
	canvas.translate(0, fontsz/2);

	for(i = 0; i<this.sz; i++){
		var ii = this.sz - i - 1;
		for(j = 0; j<this.sz; j++){
			var dsq = Math.abs(this.pos.x - ii)*Math.abs(this.pos.x - ii);
			dsq = dsq + Math.abs(this.pos.y - j)*Math.abs(this.pos.y - j);
			if(this.viewRadius != 0 && dsq > r*r) {
				continue
			}
			var xoff = i*sz;
			var yoff = j*sz;
			if(this.sz - i - 1 == this.pos.x && j == this.pos.y){
				canvas.fillStyle = WHITE;
				canvas.fillRect(xoff, yoff, sz, sz);
				canvas.fillStyle = RED;
				canvas.fillRect(xoff+sz/4,  yoff+sz/4, sz/2, sz/2);
				canvas.fillStyle = WHITE;
			} else if(this.rooms[this.sz- i -1][j]){
				canvas.fillRect(xoff, yoff, sz, sz);
			}
			if(i ===  this.sz-1 - this.out.x && j === this.out.y	){ // Colocar cuadrado azul en salida
				canvas.fillStyle = WHITE;
				canvas.fillRect(xoff, yoff, sz, sz);
				canvas.fillStyle = BLUE;
				canvas.fillRect(xoff+sz/4,  yoff+sz/4, sz/2, sz/2);
				canvas.fillStyle = WHITE;
			}
		}
	}
	canvas.restore();
}

//for debugging
Maze.prototype.determ = function(out) {
	var i, j;
	if(this.sz < 13){
		console.log("The maze is not big enough for determinism");
		return;
	}
	this.rooms[this.start.x][this.start.y] = true;
	for(i = 0; i<this.sz; i++){
		for(j = 0; j<this.sz; j++){
			this.rooms[i][j] = true;
		}
	}
	//recoginzable L shape for debugging
	for(i = 0; i < 5; i++){
		this.rooms[10][8+i] = false;
	}
	this.rooms[9][12] = false;
	this.out = out;
}


//var TheMaze = new Maze(mazeNumFiles);
//TheMaze.randPrim(new Pos(0, 0));
//TheMaze.determ(new Pos(0, 0));
