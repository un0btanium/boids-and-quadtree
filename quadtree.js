
let totalQuadtrees = 0;

class Point2D {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	draw() {
		stroke(0, 255, 0);
		strokeWeight(3);
		point(this.x, this.y);
	}
}

class Circle {
	constructor(x, y, radius) {
		this.x = x;
		this.y = y;
		this.radius = radius;
	}

	draw() {
		noFill();
		stroke(0, 0, 255);
		strokeWeight(1);
		ellipse(this.x, this.y, this.radius);
	}

	contains(point) {
		let square_dist = (this.x - point.x) * (this.x - point.x) + (this.y - point.y) * (this.y - point.y)
		return square_dist <= this.radius * 32

		// if (   point.x < this.x-this.radius
		// 	&& point.x < this.x+this.w
		// 	&& point.y >= this.y
		// 	&& point.y < this.y+this.h)
		// {
		// 	return false;
		// }
		// return point.x >= this.x
		// 	&& point.x < this.x+this.w
		// 	&& point.y >= this.y
		// 	&& point.y < this.y+this.h
		// ;
	}
}

class Rectangle {
	constructor(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}
	
	contains(point) {
		return point.x >= this.x
			&& point.x < this.x+this.w
			&& point.y >= this.y
			&& point.y < this.y+this.h
		;
	}

	draw() {
		noFill();
		strokeWeight(1);
		stroke(255);
		rect(this.x, this.y, this.w, this.h);
	}
}

//center or top-left? topleft
class QuadTree {
	constructor(bounds, capacity, isFirstQuadtree=false) {
		this.bounds = bounds;
		this.capacity = capacity;
		this.entities = [];
		this.isSubdivided = false;
		this.tl = undefined;
		this.tr = undefined;
		this.bl = undefined;
		this.br = undefined;
		if (isFirstQuadtree) {
			totalQuadtrees = 0;
		}
		totalQuadtrees += 1;
	}

	addEntity(entity) {
		if (!this.bounds.contains(entity)) {
			return false;
		}

		if (this.entities.length < this.capacity || this.bounds.w < MIN_QUADTREE_SIZE) { // limit size
			this.addEntityToThisTree(entity);
		} else {
			this.addEntityToSubTree(entity);
		}
		return true;
	}

	addEntityToThisTree(entity) {
		this.entities.push(entity);
	}

	addEntityToSubTree(entity) {
		if (!this.isSubdivided) {
			this.subdivide();
		}

		this.tl.addEntity(entity) ||
		this.tr.addEntity(entity) ||
		this.bl.addEntity(entity) || 
		this.br.addEntity(entity); 
	}

	subdivide() {
		let halfWidth = this.bounds.w/2;
		let halfHeight = this.bounds.h/2;
		let boundsTL = new Rectangle(this.bounds.x, this.bounds.y, halfWidth, halfHeight);
		let boundsTR = new Rectangle(this.bounds.x+halfWidth, this.bounds.y, halfWidth, halfHeight);
		let boundsBL = new Rectangle(this.bounds.x, this.bounds.y+halfHeight, halfWidth, halfHeight);
		let boundsBR = new Rectangle(this.bounds.x+halfWidth, this.bounds.y+halfHeight, halfWidth, halfHeight);
		this.tl = new QuadTree(boundsTL, this.capacity);
		this.tr = new QuadTree(boundsTR, this.capacity);
		this.bl = new QuadTree(boundsBL, this.capacity);
		this.br = new QuadTree(boundsBR, this.capacity);
		this.isSubdivided = true;
		for (let entity of this.entities) { // migrate entities of this node to the new sub nodes
			this.addEntityToSubTree(entity);
		}
	}

	queryByRectangle(range, found={entities:[], quadtrees:[], entitiesChecked: 0, quadtreesChecked: 0, quadtreesTraversed: 0}) {
		if (   range.x < this.bounds.x+this.bounds.w
			&& range.x+range.w > this.bounds.x
			&& range.y < this.bounds.y+this.bounds.h
			&& range.y+range.h > this.bounds.y)
		{
			found.quadtreesTraversed += 1;
			if (!this.isSubdivided) {
				found.quadtrees.push(this);
				found.quadtreesChecked += 1;
			}
		} else {
			return found;
		}
		
		if (this.isSubdivided) {
			this.tl.queryByRectangle(range, found);
			this.tr.queryByRectangle(range, found);
			this.bl.queryByRectangle(range, found);
			this.br.queryByRectangle(range, found);
		} else {
			found.entitiesChecked += this.entities.length;
			for (let entity of this.entities) {
				if (range.contains(entity)) {
					found.entities.push(entity);
				}
			}
		}
		return found;
	}

	draw() {
		if (this.isSubdivided) {
			this.drawSubTrees();
		} else {
			this.drawThisTree();
		}
	}

	drawSubTrees() {
		this.tl.draw();
		this.tr.draw();
		this.bl.draw();
		this.br.draw();
	}

	drawThisTree() {
		noFill();
		strokeWeight(1);
		stroke(255);
		rect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h);
	}
}


class NoQuadTree {
	constructor(allBoidEntities) {
		this.allBoidEntities = allBoidEntities;
	}

	queryByRectangle(range, found={entities:[], quadtrees:[], entitiesChecked: 0, quadtreesChecked: 0, quadtreesTraversed: 0}) {
		found.entitiesChecked = this.allBoidEntities.length;
		for (let boidEntity of this.allBoidEntities) {
			if (range.contains(boidEntity)) {
				found.entities.push(boidEntity);
			}
		}
		return found;
	}

	draw() {}
}