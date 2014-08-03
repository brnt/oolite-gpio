/*
 * This is configured for GS-Oolite v1.0. The valid GPIO numbers will vary with
 * other hardware.
 *
 *
 * TODO:
 * 	- can we use ReadableStream and WritableStream to speed this up?
 * 	- can we hold open the value pseudo-file for faster writes?
 * 	- see if we can get an event when a gpio changes (like a button) without having to poll; there are some C libraries that do this
 * 	- perhaps use the same low-level stuff for more than gpio events
 *
 */

if (!exports) exports = {};
var fs = require('fs');

var gpio_path = '/sys/class/gpio';
var valid_gpios = [ 0,1,8,13,14,15,16,17,19,20,21,22,23,24,26 ];

function buildPath(num, type) {
	type = type || null;
	if (type == 'export') {
		return gpio_path + '/export';
	} else if (type == 'unexport') {
		return gpio_path + '/unexport';
	} else if (type == 'direction') {
		return gpio_path + '/gpio' + num + '/direction';
	} else if (type == 'value') {
		return gpio_path + '/gpio' + num + '/value';
	}
	return gpio_path + '/gpio' + num;
}

function g(num) {
	if (!(num in valid_gpios)) {
		throw new Error("invalid GPIO: " + num);
	}
	this.num = num;
	var that = this;

	// This needs to be synchronous so that we get the correct state (since we
	// often change the direction and/or value immediately after creating the
	// GPIO instance).
	this.initially_exported = this.exported = fs.existsSync(gpio_path + '/gpio' + num);

};

g.prototype.export = function(callback) {
	fs.writeFile(buildPath(this.num, 'export'), this.num, null, function(err) {
		if (callback) {
			callback();
		}
	});
}

g.prototype.exportSync = function() {
	fs.writeFileSync(buildPath(this.num, 'export'), this.num);
}

g.prototype.unexport = function(callback) {
	fs.writeFile(buildPath(this.num, 'unexport'), this.num, null, function(err) {
		if (callback) {
			callback();
		}
	});
}

g.prototype.unexportSync = function() {
	fs.writeFileSync(buildPath(this.num, 'unexport'), this.num);
}

g.prototype.direction = function(dir, callback) {
	var num = this.num;
	if (dir == 'out') {
		// This is done synchronously so that we can avoid flip-flopping in
		// scenarios where what would be very bad (like controlling sprinkler
		// solenoids).
		fs.writeFileSync(buildPath(num, 'direction'), dir);
		fs.writeFile(buildPath(num, 'value'), '1', null, function(err) {
			if (err) {
				console.log(err);
			}
			if (callback) {
				callback();
			}
		});
	} else if (dir == 'in') {
		fs.writeFile(buildPath(num, 'direction'), dir, null, function(err) {
			if (err) {
				console.log(err);
			}
			if (callback) {
				callback();
			}
		});
	} else {
		// return current direction
		fs.readFile(buildPath(num, 'direction'), function(err, data) {
			if (err) {
				console.log(err);
			}
			if (callback) {
				callback(data);
			}
		});
	}
}

g.prototype.directionSync = function(dir) {
	var num = this.num;
	if (dir == 'out') {
		fs.writeFileSync(buildPath(num, 'direction'), dir);
		fs.writeFileSync(buildPath(num, 'value'), '1');
	} else if (dir == 'in') {
		fs.writeFileSync(buildPath(num, 'direction'), dir);
	} else {
		// return current direction
		return fs.readFileSync(buildPath(num, 'direction'), {'encoding': 'utf-8'});
	}
}

g.prototype.value = function(arg1, callback) {
	if (callback) {
		// set
		var val = String.valueOf(arg1) == '1' ? 1 : 0;
		fs.writeFile(buildPath(this.num, 'value'), val, function(err) {
			if (err) {
				console.log(err);
			}
			if (callback) {
				callback();
			}
		});
	} else {
		// get
		var callback = arg1;
		fs.readFile(buildPath(this.num, 'value'), function(err, data) {
			if (callback) {
				callback(data);
			}
		});
	}
}

g.prototype.valueSync = function(arg1) {
	if (arg1 !== undefined) {
		// set
		var val = String.valueOf(arg1) == '1' ? 1 : 0;
		fs.writeFileSync(buildPath(this.num, 'value'), val);
	} else {
		// get
		var callback = arg1;
		return fs.readFileSync(buildPath(this.num, 'value'), {'encoding': 'utf-8'});
	}
}

exports.GPIO = g;
