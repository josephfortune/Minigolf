// Written by Joseph Fortune and Aerick Stephans 2018

window.onload = function() {
	c = document.getElementById('gc');
	cc = c.getContext('2d');
	setInterval(update, 1000/85);
	
	height = 480;
	width = 640;
	score = newScore = 0;
  
  frameCounter = 0;
  firstClick = false;
  
	resetMap();
	/*map = buildTestMap();
	ball = Ball(10, 50);
	aimMode = true;*/
	
	mousePos = null;
	
	c.addEventListener('mousemove', function(evt) {
		mousePos = getMousePos(c, evt);
		//console.log('Mouse position: ' + mousePos.x + ',' + mousePos.y);
	}, false);
	
	c.addEventListener('mousedown', function(evt) {
		if (ball.moving == false)
		{
			ball.moving = true;
			aimMode = false;
      firstClick = true;
			mouseVector = Vector(mousePos.x, mousePos.y);
			forceVector = mouseVector.sub(ball.pos);
			forceVector = forceVector.mult(1/20);
			ball.velocity = forceVector;
		}
	}, false);
}

function resetMap() {
	map = buildTestMap();
	ball = Ball(10, 50);
	ball.radius = 5;
	aimMode = true;
}

function update() {
	ball.update();
	
	for(k = 0; k < map.actors.length; k++)
		map.actors[k].update();
	
	// Check collisions with the geometry
	for (i = 0; i < map.polygons.length; i++) {
		poly = map.polygons[i];
		if (Collision(poly, ball)) {
		
			/*v = ball.velocity;
			n = closestEdge(poly, ball);
			n = n.perp().normalize();
			nDotv = n.dot(v);
			n = n.mult(2 * nDotv);
			v = n.sub(v);
			v = v.mult(-1);
			
			ball.velocity = v;
			ball.pos = ball.prevPos;
			ball.update();
			
			
			if (Collision(poly, ball)) {
				ball.pos = ball.prevPos;
				ball.velocity = v.mult(-1);
				ball.update();
			}*/
			bounceBallOffPoly(poly, ball);
			break;
		
			
		}
	}	
	
	if(score < newScore)
		score += 15;
	if(score > newScore)
		score = newScore;
	
	drawScene(map, ball);
  
  
  frameCounter++;
  if (frameCounter > 50)
    frameCounter = 0;
  if (!firstClick && frameCounter < 25) {
    cc.font = "30pt Arial";
    cc.fillStyle = "white"; 
    cc.fillText("CLICK TO PLAY",160,200);
    
  }
	
	if (aimMode)
		drawAim(cc, ball, mousePos);
  
}

function bounceBallOffPoly(poly, ball)
{
	v = ball.velocity;
	n = closestEdge(poly, ball);
	n = n.perp().normalize();
	nDotv = n.dot(v);
	n = n.mult(2 * nDotv);
	v = n.sub(v);
	v = v.mult(-1);
			
	ball.velocity = v;
	ball.pos = ball.prevPos;
	ball.update();
			
			
	if (Collision(poly, ball)) {
		ball.pos = ball.prevPos;
		ball.velocity = v.mult(-1);
		ball.update();
	}
}

function Vector(newX, newY) {
	var v = {
		x:newX,
		y:newY,
		length: function() { return Math.sqrt(this.x*this.x + this.y*this.y); },
		dot: function(w) { return this.x * w.x + this.y * w.y; },
		mult: function(s) { return Vector(s * this.x, s * this.y); },
		sub: function(w) { return Vector(this.x - w.x, this.y - w.y); },
		add: function(w) { return Vector(this.x + w.x, this.y + w.y); },
		perp: function() { return Vector(-this.y, this.x); },
		normalize: function() { return Vector(this.x, this.y).mult(1 / Math.sqrt(this.x*this.x + this.y*this.y)); }
	};
	return v;
}

function distToEdge(p, v, w) {
// p is point, v1 an v2 are vertices of edge
	
	var vw = w.sub(v);
	var vp = p.sub(v);
	var wp = p.sub(w);
	var wv = v.sub(w);
	
	if (vp.dot(vw) < 0)
		//return vp.length();
		return 99999;
	else if (wp.dot(wv) < 0)
		//return wp.length();
		return 99999;
		
	else
	{
		var vw_perp = vw.perp().normalize();
		return Math.abs(vw_perp.dot(vp));
	}
}

function Polygon(vertices, color, passable, friction) {
	var p = {
		verts:vertices,
		color:color,
		passable:passable,
		friction:friction
	}
	return p;
}

function Actor(x, y) {
	var a = {
		pos: Vector(0, 0),
		angle: Vector(0, 0),
		radius: 0,
		draw: function() { },
		update: function() { },
	}
	return a;
}

function distBetweenActors(obj1, obj2)
{
	xv = obj1.pos.x - obj2.pos.x;
	yv = obj1.pos.y - obj2.pos.y;
	return Math.sqrt(xv*xv + yv*yv);
}

function checkActorCollision(obj1, obj2)
{
	if(distBetweenActors(obj1, obj2) <= (obj1.radius + obj2.radius))
		return true;
	return false;
}

function Map(polygons, actors, defaultColor) {
	var m = {
		polygons:polygons,
		actors:actors,
		color:defaultColor
	}
	return m;
}

function Coin(x, y) {
	var c = {
		pos: Vector(x, y),
		angle: Vector(0, 0),
		radius: 3,
		draw: function() {
			if(!this.collected)
			{
				cc.fillStyle = 'yellow';
				cc.beginPath();
				cc.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI*2, true);
				cc.closePath();
				cc.fill();
			}
			else
			{
				cc.fillStyle = 'white';
				if(this.frame < 10)
				{
					cc.beginPath();
					cc.arc(this.pos.x - 4, this.pos.y - 4, 2, 0, Math.PI*2, true);
					cc.closePath();
					cc.fill();
					
					cc.beginPath();
					cc.arc(this.pos.x + 4, this.pos.y - 4, 2, 0, Math.PI*2, true);
					cc.closePath();
					cc.fill();
					
					cc.beginPath();
					cc.arc(this.pos.x - 4, this.pos.y + 4, 2, 0, Math.PI*2, true);
					cc.closePath();
					cc.fill();
					
					cc.beginPath();
					cc.arc(this.pos.x + 4, this.pos.y + 4, 2, 0, Math.PI*2, true);
					cc.closePath();
					cc.fill();
					this.frame++;
				}
				else if(this.frame < 15)
				{
					cc.beginPath();
					cc.arc(this.pos.x, this.pos.y + 4, 2, 0, Math.PI*2, true);
					cc.closePath();
					cc.fill();
					
					cc.beginPath();
					cc.arc(this.pos.x + 4, this.pos.y - 4, 2, 0, Math.PI*2, true);
					cc.closePath();
					cc.fill();
					
					cc.beginPath();
					cc.arc(this.pos.x - 4, this.pos.y - 4, 2, 0, Math.PI*2, true);
					cc.closePath();
					cc.fill();

					this.frame++;
				}
				else if(this.frame < 20)
				{
					cc.beginPath();
					cc.arc(this.pos.x + 4, this.pos.y - 4, 2, 0, Math.PI*2, true);
					cc.closePath();
					cc.fill();
					
					cc.beginPath();
					cc.arc(this.pos.x - 4, this.pos.y + 4, 2, 0, Math.PI*2, true);
					cc.closePath();
					cc.fill();

					this.frame++;
				}
				else if(this.frame < 24)
				{
					cc.beginPath();
					cc.arc(this.pos.x - 4, this.pos.y + 4, 2, 0, Math.PI*2, true);
					cc.closePath();
					cc.fill();
					
					cc.beginPath();
					cc.arc(this.pos.x + 4, this.pos.y - 4, 2, 0, Math.PI*2, true);
					cc.closePath();
					cc.fill();

					this.frame++;
				}
			}
		},
		update: function() {
			if(!this.collected)
			{
				if(checkActorCollision(this, ball))
				{
					newScore += 100;
					this.collected = true;
				}
			}
		},
		// internal state
		collected: false,
		frame: 0
	}
	return c;
}

function Goal(x, y) {
	var g = {
		pos: Vector(x, y),
		angle: Vector(0, 0),
		radius: 2,
		draw: function() {
			cc.fillStyle = 'black';
			cc.beginPath();
			cc.arc(this.pos.x, this.pos.y, this.radius+3, 0, Math.PI*2, true);
			cc.closePath();
			cc.fill();
		},
		update: function() {
			if(this.frame == 0)
			{
				if(checkActorCollision(this, ball))
					this.collisions++;
			
				if(this.collisions > 5)
				{
					newScore += 5000;
					ball.velocity = Vector(0, 0);
					ball.moving = false;
					ball.aimMode = false;
					ball.radius = 4;
					this.frame++;
				}
			}
			else if(this.frame < 10)
			{
				ball.pos = this.pos;
				ball.aimMode = false;
				ball.radius = 3;
				this.frame++;
			}
			else if(this.frame < 20)
			{
				ball.aimMode = false;
				ball.radius = 2;
				this.frame++;
			}
			else if(this.frame < 50)
			{
				ball.aimMode = false;
				this.frame++;
			}
			else
			{
				this.collisions = 0;
				this.frame = 0;
				resetMap();
			}
		},
		// internal state
		collisions: 0,
		frame: 0
	}
	return g;
}

function Box(x, y) {
	var b = {
		pos: Vector(x, y),
		angle: 0,
		angvel: 0.05,
		radius: 25,
		draw: function() {
			console.log(this.poly);
			cc.fillStyle = this.poly.color;
			cc.beginPath();
			cc.moveTo(this.poly.verts[0].x, this.poly.verts[0].y);
			cc.lineTo(this.poly.verts[1].x, this.poly.verts[1].y);
			cc.lineTo(this.poly.verts[2].x, this.poly.verts[2].y);
			cc.lineTo(this.poly.verts[3].x, this.poly.verts[3].y);
			cc.closePath();
			cc.fill();
		},
		update: function() {
			this.angle += this.angvel;
			this.angvel *= 0.99;

			xv = this.radius * Math.cos(this.angle);
			yv = this.radius * Math.sin(this.angle);
			this.poly.verts[0] = Vector(this.pos.x - xv, this.pos.y - yv);

			xv = this.radius * Math.sin(this.angle);
			yv = this.radius * Math.cos(this.angle);
			this.poly.verts[1] = Vector(this.pos.x + xv, this.pos.y - yv);
			
			xv = this.radius * Math.cos(this.angle);
			yv = this.radius * Math.sin(this.angle);
			this.poly.verts[2] = Vector(this.pos.x + xv, this.pos.y + yv);
			
			xv = this.radius * Math.sin(this.angle);
			yv = this.radius * Math.cos(this.angle);
			this.poly.verts[3] = Vector(this.pos.x - xv, this.pos.y + yv);
			
			if(Collision(this.poly, ball))
			{
				this.angvel += ball.velocity.length()*0.025;
				bounceBallOffPoly(this.poly, ball);
				ball.velocity = ball.velocity.mult(1.25);
			}
		},
		// internal state
		poly: Polygon([Vector(0, 0), Vector(0, 0), Vector(0, 0), Vector(0, 0)], 'white', false, 1.0)
	}
	return b;
}

function Ball(x, y) {
	var b = {
		pos: Vector(x, y),
		prevPos: Vector(x, y),
		velocity: Vector(0,0),
		radius: 5,
		draw: function() {
				cc.fillStyle = 'white';
				cc.beginPath();
				cc.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI*2, true);
				cc.closePath();
				cc.fill();
		},
		update: function() { 
						
			this.prevPos = this.pos;
			this.pos = this.pos.add(this.velocity);
			
			this.velocity = this.velocity.mult(.99);
			if (this.velocity.length() < 1)
			{
				this.velocity = Vector(0, 0);
				this.moving = false;
				aimMode = true;
			}
			
			if (this.pos.x < 0)
			{
				this.velocity.x = -this.velocity.x;
				this.pos.x = 0;
			}
			
			if (this.pos.x > width)
			{
				this.velocity.x = -this.velocity.x;
				this.pos.x = width;
			}
			
			if (this.pos.y < 0)
			{
				this.velocity.y = -this.velocity.y; 
				this.pos.y = 0;
			}
			
			if (this.pos.y > height)
			{
				this.velocity.y = -this.velocity.y; 
				this.pos.y = height;
			}
		},
		// internal state
		moving: false
	}
	return b;
}

function drawMap(map) {
	cc.fillStyle = map.color;
	cc.fillRect(0, 0, 640, 480);
	for (i = 0; i < map.polygons.length; i++) { // For every polygon
		cc.fillStyle = map.polygons[i].color;
		cc.beginPath();
		cc.moveTo(map.polygons[i].verts[0].x, map.polygons[i].verts[0].y);
		for (j = 1; j < map.polygons[i].verts.length; j++ ) { // For every vertex
			cc.lineTo(map.polygons[i].verts[j].x, map.polygons[i].verts[j].y);
		}
		cc.closePath();
		cc.fill();
	}
}

function drawScene(map, ball) {
	drawMap(map);
	
	// Draw the map objects
	for(k = 0; k < map.actors.length; k++)
		map.actors[k].draw();
		
	// Draw ball
	ball.draw();
	
	cc.fillStyle = 'white';
	cc.fillRect(0, 480, 640, 500);
	cc.fillStyle = 'black';
	cc.font = "14px Courier New";
	cc.fillText("SCORE: " + score, 10, 500);

	/*cc.fillStyle = 'white';
	cc.beginPath();
	cc.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI*2, true); 
	cc.closePath();
	cc.fill();*/
}

function buildTestMap() {
	var verts0 = [Vector(10, 10), Vector(90, 10), Vector(50, 50)];
	var verts1 = [Vector(240, 260), Vector(320, 240), Vector(280, 300)];
	var verts2 = [Vector(120, 10), Vector(190, 10), Vector(190,50), Vector(120,50)];
	var verts3 = [Vector(300, 300), Vector(400, 300), Vector(400,400), Vector(300,400)];
	var verts4 = [Vector(330, 20), Vector(370, 20), Vector(400, 50), Vector(400, 90), Vector(370, 120), Vector(330, 120), Vector(300, 90), Vector(300, 50)];
	var verts5 = [Vector(550, 20), Vector(554, 420), Vector(546, 425)];
	var verts6 = [Vector(110, 110), Vector(120, 100), Vector(140, 120), Vector(150, 110), Vector(160, 120), Vector(150, 130), Vector(170, 150), Vector(160, 160), Vector(140, 140), Vector(120, 160), Vector(110, 150), Vector(130, 130)]
	var verts7 = [Vector(40, 350), Vector(70, 375), Vector(100, 350), Vector(120, 370),
				  Vector(95, 400), Vector(120, 430), Vector(100, 450), Vector(70, 425),
				  Vector(40, 450), Vector(20, 430), Vector(45, 400), Vector(20, 370)];
	var poly0 = Polygon(verts0, "orange", false, 0.4);
	var poly1 = Polygon(verts1, "blue", false, 0.5);
	var poly2 = Polygon(verts2, "red", false, 0.6);
	var poly3 = Polygon(verts3, "pink", false, 0.7);
	var poly4 = Polygon(verts4, "grey", false, 0.8);
	var poly5 = Polygon(verts5, "yellow", false, 0.1);
	var poly6 = Polygon(verts6, "black", false, 0.1);
	var poly7 = Polygon(verts7, "teal", true, 0.1);
	var actor0 = Coin(200, 250);
	var actor1 = Coin(210, 250);
	var actor2 = Coin(220, 250);
	var actor3 = Coin(200, 260);
	var actor4 = Coin(210, 260);
	var actor5 = Coin(220, 260);
	var actor6 = Goal(600, 450);
	var actor7 = Box(500, 100);
	
	var polyList = [poly0, poly1, poly2, poly3, poly4, poly5, poly6, poly7];
	var actorList = [actor0, actor1, actor2, actor3, actor4, actor5, actor6, actor7];
	var map = Map(polyList, actorList, 'green');
	
	return map;
}

function inside(x, y, polygon) {
	var vs = polygon.verts;
    var inside = false;

    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i].x, yi = vs[i].y;
        var xj = vs[j].x, yj = vs[j].y;

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}

function Collision(polygon, ball) {
	
	// Check edge between last and first vert that loop wont touch
	if (distToEdge(ball.pos, polygon.verts[polygon.verts.length-1], polygon.verts[0]) <= ball.radius) {
		return true;
	}
	// Check remaining edges
	
	for (j = 0; j < polygon.verts.length-1; j++) {
		if (distToEdge(ball.pos, polygon.verts[j], polygon.verts[j+1]) <= ball.radius) {
			return true;
		}
	}
	
	if (inside(ball.pos.x, ball.pos.y, polygon)) {
		return true;
	}
	
	return false;
}

function closestEdge(polygon, ball) {
	var minDistance = distToEdge(ball.pos, polygon.verts[polygon.verts.length-1], polygon.verts[0]);
	var edge = polygon.verts[0].sub(polygon.verts[polygon.verts.length-1]);
	
	for (j = 0; j < polygon.verts.length-1; j++) {
		var distance = distToEdge(ball.pos, polygon.verts[j], polygon.verts[j+1]);
		if (distance < minDistance) {
			edge = polygon.verts[j+1].sub(polygon.verts[j]);
			minDistance = distance;
		}
	}
	
	return edge;
}

function drawAim(cc, ball, mousePos) {
	cc.beginPath();
	cc.moveTo(ball.pos.x, ball.pos.y);
	cc.lineTo(mousePos.x, mousePos.y);
	cc.strokeStyle = 'white';
	cc.stroke();
	console.log("drawing line from", ball.x, ball.y, mousePos.x, mousePos.y);
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}


