'use strict';

console.log('\'Allo \'Allo!');


var card = function(header){
	this.header = header;

	this.createObject = function(){
		return $('<div/>',{
			'class': 'card'
		}).append($('<h3/>', { 'text': this.header}));
	};
};

function drawLoop(canvas){
	// var c=$('#'+canvas.attr('id'));
	//document.getElementById(canvas.attr('id'));
	var ctx = canvas[0].getContext('2d');
	ctx.strokeStyle='white';
	ctx.beginPath();
	ctx.arc(150,70,40,0,2*Math.PI);
	// ctx.closePath();
	ctx.stroke();
	
	
	var x = 10;
	var y = 10;
	var incX = 1;
	var incY = -1;
	(function timer(){
		ctx.clearRect(x-5,y-5,10,10);
		
		if(x > 50 || x < 10){
			incX *= -1;
		}
		if(y > 100 || y < 10){
			incY *= -1;
		}

		x += incX;
		y += incY;
		
		ctx.beginPath();
		ctx.arc(x,y,3,0,2*Math.PI);
		ctx.fillStyle = 'red';
		// ctx.closePath();
		ctx.fill();
		ctx.fillStyle = 'white';
		// ctx.clearRect(placement,placement,5,5);
		// ctx.fillRect(placement,placement+10,10,10);
		setTimeout(timer, 16);
	}());
}

function createBarGraphs(){
	var html = '';
	var text = ['Temp', 'BatTemp','RPM', 'Charge'];
	for (var i = 0; i < text.length; i++){
		var container = $('<div/>',{
			'class':'gauge-container'
		});
		container.append($('<div/>', {
			'class':'gauge-text'
		}).html(text[i] + ':'));
		html += container.append($('<div/>',{
			'class':'gauge-line'
		}))[0].outerHTML;
	}
	return html;
}

function createStats(){
	var div = $('<div/>',{
		'id':'gauges'
	});
	div.html(createBarGraphs());
	return div;
}

/**
 * Returns a random integer between min and max
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function animateStats(){
	var gauges = $('.gauge-line');
	(function timer(){
		gauges.each(function(){
			var percentage = getRandomInt(1,70);
			$(this).width(percentage + '%');
		});
		setTimeout(timer, 100);
	}());
}

function createSpeedo(){
	var div = $('<div/>', {
		'class':'speedo'
	});
	div.append($('<img/>', {
		'src':'../images/needle.png',
		'class':'needle'
	}));
	return div;
}

function animateSpeedo(){
	var needle = $('.needle');
	var position = -50;
	var inc = 1;
	(function timer(){
		needle.css('transform', 'rotate(' + position + 'deg)');
		position += inc;
		if(position > 180 || position < -50){
			inc *= -1;
		}
		setTimeout(timer, 10);
	}());
}

$(function(){
	var firstRow = $('.row').each(function(){
		var canvasTest = new card('Canvas test').createObject();
		var canvas = $('<canvas/>', {
			'id':'canvasTest',
			'width' : '100%',
			'height': '100%'
		});
		canvasTest.append(canvas);
		$(this).append(canvasTest);

		var statTest = new card('Stat test').createObject();
		statTest.append(createStats());
		$(this).append(statTest);

		var speedoTest = new card('col3').createObject();
		speedoTest.append(createSpeedo());

		$(this).append(speedoTest);
		drawLoop(canvas);
	});



	animateStats();
	animateSpeedo();
});
