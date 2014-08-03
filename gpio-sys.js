/*
 * This is configured for GS-Oolite v1.0. The valid GPIO numbers will vary with
 * other hardware.
 *
 *
 * TODO:
 * 	- see if it's faster to execute shell commands or write files through fs module
 * 	- can we hold open the value pseudo-file for faster writes?
 * 	- see if we can get an event when a gpio changes (like a button) without having to poll; there are some C libraries that do this
 * 	- perhaps use the same low-level stuff for more than gpio events
 *
 */

if (!exports) exports = {};
var exec = require('child_process').exec;
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
	this.initially_exported = this.exported = fs.existsSync(gpio_path + '/gpio' + num);

};

g.prototype.export = function(callback) {
	exec('echo ' + this.num + ' > ' + buildPath(this.num, 'export'), function(err, stdout, stderr) {
		if (callback) {
			callback();
		}
	});
}

g.prototype.unexport = function(callback) {
	exec('echo ' + this.num + ' > ' + buildPath(this.num, 'unexport'), function(err, stdout, stderr) {
		if (callback) {
			callback();
		}
	});
}

g.prototype.direction = function(dir, callback) {
	if (dir == 'out') {
		exec('echo ' + dir + ' > ' + buildPath(this.num, 'direction') + ' && echo 1 > ' + buildPath(this.num, 'value'), function(err, stdout, stderr) {
			if (callback) {
				callback();
			}
		});
	} else if (dir == 'in') {
		exec('echo ' + dir + ' > ' + buildPath(this.num, 'direction'), function(err, stdout, stderr) {
			if (callback) {
				callback();
			}
		});
	} else {
		// return current direction
		fs.readFile(buildPath(this.num, 'direction'), 'utf8', function(err, data) {
			if (callback) {
				callback(data);
			}
		});
	}
}

g.prototype.value = function(arg1, arg2) {
	if (arg2) {
		// set
		var val = arg1 ? 1 : 0;
		var callback = arg2;
		exec('echo ' + val + ' > ' + buildPath(this.num, 'value'), function(err, stdout, stderr) {
			if (callback) {
				callback();
			}
		});
	} else {
		// get
		var callback = arg1;
		fs.readFile(buildPath(this.num, 'value'), 'utf8', function(err, data) {
			if (callback) {
				callback(data);
			}
		});
	}
}

exports.GPIO = g;
