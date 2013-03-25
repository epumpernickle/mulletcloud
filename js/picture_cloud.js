function PictureCloud(options) {
	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
	
	this.defaultOptions = {
			imageList: [],
			viewDepth: 2000,
			fogDistance: 1800,
			imageCount: 100,
			backgroundColor: "#1e4877",
			gradientStartColor: "#002365",
			gradientEndColor: "#1e4877",
	};
	this.options = $.extend({}, this.defaultOptions, options);
	
	this.vs, this.fs;
	
	var self = this;
	$.ajax({
		url : "js/vertex_shader",
		async: false,
		dataType: 'html'
	}).done(function(data){
		self.vs = data;
	});
	
	$.ajax({
		url : "js/fragment_shader",
		async: false,
		dataType: 'html'
	}).done(function(data){
		self.fs = data;
	});

	var container;
	var camera, scene, renderer;

	this.mouseX = 0, this.mouseY = 0;
	this.start_time = Date.now();

	this.windowHalfX = window.innerWidth / 2;
	this.windowHalfY = window.innerHeight / 2;
}

PictureCloud.prototype.init = function() {
	this.container = document.createElement( 'div' );
	document.body.appendChild( this.container );

	// Bg gradient

	var canvas = document.createElement( 'canvas' );
	canvas.width = 32;
	canvas.height = window.innerHeight;

	var context = canvas.getContext( '2d' );

	var gradient = context.createLinearGradient( 0, 0, 0, canvas.height );
	gradient.addColorStop(0, this.options.gradientStartColor);
	gradient.addColorStop(0.5, this.options.gradientEndColor);

	context.fillStyle = gradient;
	context.fillRect(0, 0, canvas.width, canvas.height);

	//this.container.style.background = 'url(' + canvas.toDataURL('image/png') + ')';
	this.container.style.background = 'url(' + canvas.toDataURL('image/jpeg') + ')';
	this.container.style.backgroundSize = '32px 100%';

	//

	this.camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, this.options.viewDepth );
	this.camera.position.z = this.options.viewDepth;

	this.scene = new THREE.Scene();
	
	this.materialList = [];
	
	for (textureIndex in this.options.imageList) {
		this.materialList.push(this.generateMaterial(this.options.imageList[textureIndex]));
	}
	
	var scale = this.options.viewDepth;
	var totalObjects = this.options.imageCount;
	for (var i = 0; i < totalObjects; i++) {
		var material = this.materialList[Math.floor(Math.random() * this.materialList.length)];
		this.renderMesh(this.scene, material, scale / totalObjects * i);
	}

	this.renderer = new THREE.WebGLRenderer( { antialias: false } );
	this.renderer.setSize( window.innerWidth, window.innerHeight );
	this.container.appendChild( this.renderer.domElement );

	document.addEventListener( 'mousemove', $.proxy(this.onDocumentMouseMove, this), false );
	window.addEventListener( 'resize', $.proxy(this.onWindowResize, this), false );
};

PictureCloud.prototype.generateMaterial = function(textureName) {
	var texture = THREE.ImageUtils.loadTexture( textureName, null, $.proxy(this.animate, this) );
	texture.magFilter = THREE.LinearMipMapLinearFilter;
	texture.minFilter = THREE.LinearMipMapLinearFilter;

	var fog = new THREE.Fog( 0x1e4877, - 100, this.options.fogDistance );

	var material = new THREE.ShaderMaterial( {

		uniforms: {

			"map": { type: "t", value: texture },
			"fogColor" : { type: "c", value: fog.color },
			"fogNear" : { type: "f", value: fog.near },
			"fogFar" : { type: "f", value: fog.far },

		},
		vertexShader: this.vs, //document.getElementById( 'vs' ).textContent,
		fragmentShader: this.fs, //document.getElementById( 'fs' ).textContent,
		depthWrite: false,
		depthTest: false,
		transparent: true

	} );
	return material;
}

PictureCloud.prototype.renderMesh = function (scene, material, z) {
	//console.log("Rendering mesh at " + z + " with material " + material);
	var plane = new THREE.Mesh( new THREE.PlaneGeometry( 64, 64 ), material );

	plane.position.x = Math.random() * 1000 - 500;
	plane.position.y = - Math.random() * Math.random() * 200 - 15;
	plane.position.z = z;
	plane.rotation.z = 0;//Math.random() * Math.PI;
	//plane.scale.x = plane.scale.y = Math.random() * Math.random() * 1.5 + 0.5;
	plane.scale.x = plane.scale.y = 1;//Math.random() * Math.random() * 0.5 + 0.5;
	scene.add( plane );
}

PictureCloud.prototype.onDocumentMouseMove = function( event ) {

	this.mouseX = ( event.clientX - this.windowHalfX ) * 0.25;
	this.mouseY = ( event.clientY - this.windowHalfY ) * 0.15;

}

PictureCloud.prototype.onWindowResize = function( event ) {

	this.camera.aspect = window.innerWidth / window.innerHeight;
	this.camera.updateProjectionMatrix();

	this.renderer.setSize( window.innerWidth, window.innerHeight );

}

PictureCloud.prototype.animate = function () {

	requestAnimationFrame( $.proxy(this.animate, this) );

	var position = ( ( Date.now() - this.start_time ) * 0.03 ) % this.options.viewDepth;

	this.camera.position.x += ( this.mouseX - this.camera.position.x ) * 0.01;
	this.camera.position.y += ( - this.mouseY - this.camera.position.y ) * 0.01;
	this.camera.position.z = - position + this.options.viewDepth;

	this.renderer.render( this.scene, this.camera );

}