// test
console.log('running');
/*
var sprinklet = require('./sprinklet.js');

sprinklet.init();
//*/

var GPIO = require('./gpio').GPIO;
var g1 = new GPIO(1);

function async() {
	console.log('async ==========');
	g1.export(function() {
		g1.direction('out', function() {
			g1.value(function(val) {
				console.log('value: ' + val);
				g1.value(0, function(val) {
					g1.value(function(val) {
						console.log('value: ' + val);
						g1.unexport();
					});
				});
			});
		});
	});
}

function sync() {
	console.log('sync ==========');
	g1.exportSync();
	g1.directionSync('out');
	console.log('value: ' + g1.valueSync());
	g1.valueSync('0');
	console.log('value: ' + g1.valueSync());
	g1.unexportSync();
}

function time(fn) {
	if (fn) {
		var startTime = new Date().getTime();
		fn();
		var endTime = new Date().getTime();

		console.log('elapsed time: ' + (endTime - startTime));
	} else {
		console.log('no function specified for time()');
	}
}

time(async);

setTimeout(function() {
	time(sync);
}, 2000);
