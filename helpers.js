var figlet = require('figlet');
var gulp = require('gulp');
var tasks = require('gulp-task-listing');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var insert = require('gulp-insert');
var ignore = require('gulp-ignore');
var rimraf = require('gulp-rimraf');
var file = require('gulp-file');
var expect = require('gulp-expect-file');
var connect = require('gulp-connect');
var inject = require('gulp-inject');
var htmlreplace = require('gulp-html-replace');
var include = require('gulp-html-tag-include');
var processhtml = require('gulp-processhtml');
var replace = require('gulp-replace-task');
var glob = require("glob");
var debug = require("gulp-debug");
var modRewrite = require('connect-modrewrite');
var reg_replace = require('gulp-regex-replace');
var fs = require('fs');
var pkg = require('./package.json');
var header = require('gulp-header');
var chalk = require('chalk');
var spawn = require('spawn-cmd').spawn;
var es = require('event-stream');
var Proxy = require('gulp-connect-proxy');
var _ = require('underscore');
var path = require('path');
var mocha = require('gulp-mocha');

var gulpif = require('gulp-if');
var beautify = require('gulp-beautify');
var copyDir = require('copy-dir');

var helpers = {
	log: function (msg) {
		gutil.log('App : ', gutil.colors.magenta(msg));
	},
	logerror: function (msg) {
		gutil.log('App : ', gutil.colors.red(msg));
	},
	logsuccess: function (msg) {
		gutil.log('App : ', gutil.colors.green(msg));
	},
	readFromFile: function (fileName) {
		try {
			var content = fs.readFileSync(fileName, "utf8"); //.replace(unprintables, "");
			return content;
		} catch (e) {
			console.error("FILE READ ERROR: from : " + fileName);
			return "";
		}
	},

	fileContainsOnce: function (fileName, substring) {
		try {
			var content = fs.readFileSync(fileName, "utf8");
			return occurrences(content, substring) === 1;
		} catch (e) {
			//console.error(e);
			return false;
		}
	},
	fileContains: function (fileName, substring) {
		try {
			var content = fs.readFileSync(fileName, "utf8");
			return content.indexOf(substring) > -1;
		} catch (e) {
			//console.error(e);
			return false;
		}
	},
	exists: function (fileName) {
		try {
			stats = fs.statSync(fileName);
			// console.log("File exists.");
			return true;
		} catch (e) {
			//console.error(e);
			return false;
		}
	},
	serve: function (root, port, livereload, middleware) {
		var p = port || 8001;
		log('spinning up server at  http://localhost:' + p + '/');

		if (middleware) {
			connect.server({
				root: root,
				livereload: livereload || false,
				port: p,
				middleware: middleware
			});
		} else {
			connect.server({
				root: root,
				livereload: livereload || false,
				port: p
			});
		}
		log(JSON.stringify(connect));
	},	
	hasInstalledModule: function (name) {
		console.log('checking for ' + name + ' installation....');
		try {
			console.log(require.resolve(name));
			return true;
		} catch (e) {
			console.error(name + " is not found");
			process.exit(e.code);
		}
	},

	validateFileExist: function (file) {

		if (this.exists(file)) {
			// logsuccess(file + " looks good!");
			return '';
		} else {
			console.info('Looking for "' + file + '"  ...');
			logerror("oh oh! : I did not find '" + file + "'");
			return "Did not find '" + file + "'\n\r";
		}
	},

	validateFileExistEach: function (files) {
		var errorFeedBacks = '';

		for (var index = 0; index < files.length; index++) {
			var file = files[index];

			errorFeedBacks = validateFileExist(file) + errorFeedBacks;
		}
		return errorFeedBacks;
	},

	validateFileContainsOnce: function (file, contents) {

		if (this.fileContainsOnce(file, contents)) {
			//  logsuccess(file + " contains " + contents + ". Awesome!");
			return '';
		} else {
			console.info('Checking  if "' + file + '" has "' + contents + '" ...');
			var message = " Either  '" + contents + "' occur multiple times or doesnt occure at all in the file '" + file + "' ";
			logerror("oh oh! :" + message);
			return message + "'\n\r";
		}
	},

	validateFileContains:	function (file, contents) {

		if (this.fileContains(file, contents)) {
			logsuccess(file + " contains " + contents + ". Awesome!");
			return '';
		} else {
			console.info('Checking  if "' + file + '" has "' + contents + '" ...');
			var message = " '" + contents + "'  in the file '" + file + "' cannot be found";
			logerror("oh oh! :" + message);
			return message + "'\n\r";
		}
	},


	validateFileDoesNotContains: function (file, contents) {

		if (this.fileContains(file, contents)) {
			console.info('Checking  if "' + file + '" has "' + contents + '" ...');
			var message = " I was NOT expecting '" + file + "'  to contain  '" + contents + "' ";
			logerror("oh oh! :" + message);
			return message + "'\n\r";

		} else {
			logsuccess(file + " contains " + contents + ". Awesome!");
			return '';
		}
	},

	validateFileDoesNotContainEach: function (file, contentsList) {
		var errorFeedBacks = '';

		for (var index = 0; index < contentsList.length; index++) {
			contents = contentsList[index];

			errorFeedBacks = validateFileDoesNotContains(file, contents) + errorFeedBacks;
		}
		return errorFeedBacks;
	},

	validateFileContainsEach: function (file, contentsList) {
		var errorFeedBacks = '';

		for (var index = 0; index < contentsList.length; index++) {
			contents = contentsList[index];

			errorFeedBacks = validateFileContains(file, contents) + errorFeedBacks;
		}
		return errorFeedBacks;
	},

	handlevalidateResult: function (errorFeedBacks) {
		if (errorFeedBacks) {
			logerror("ALL IS NOT WELL!!!");
			throw errorFeedBacks;
		} else {
			logsuccess("Yay! EVERYTHING LOOKS GOOD");
			figlet('A W E S O M E !', function (err, data) {
				if (err) {
					return;
				}
				logsuccess(data);
			});
		}
	},
	getFilesFromDir: function (dir, fileTypes) {
		var filesToReturn = [];

		function walkDir(currentPath) {
			var files = fs.readdirSync(currentPath);
			for (var i in files) {
				var curFile = path.join(currentPath, files[i]);
				if (fs.statSync(curFile).isFile() && fileTypes.indexOf(path.extname(curFile)) != -1) {
					filesToReturn.push(curFile.replace(dir, ''));
				} else if (fs.statSync(curFile).isDirectory()) {
					walkDir(curFile);
				}
			}
		};
		walkDir(dir);
		return filesToReturn;
	}
,
occurrences:function(string, subString, allowOverlapping) {
	string += "";
	subString += "";
	if (subString.length <= 0)
		return (string.length + 1);

	var n = 0,
		pos = 0,
		step = allowOverlapping ? 1 : subString.length;
	while (true) {
		pos = string.indexOf(subString, pos);
		if (pos >= 0) {
			++n;
			pos += step;
		} else
			break;
	}
	return n;
}
	/*
	this.serve("./index.html", 8808, false, mergeJsonServerMiddleware([{
		from: "/call/to/this",
		to: "/this"
	}]));
	*/
	/*
var mergeJsonServerMiddleware = function (maps) {
	var jsonServer = require('gulp-json-srv');
	var jsonPort = 8808;
	jsonServer.start({
		port: jsonPort,
		data: require('./db.json'),
		customRoutes: {
			'/dosomething': {
				method: 'post',
				handler: function (req, res) {
					console.log(req.body);
					return res.json(req.body);
				}
			},
			'/getsomething': {
				method: 'get',
				handler: function (req, res) {
					var db = require('./db.json');
					return res.jsonp(db);
				}
			}
		}
	});
	var allMaps = [];
	for (var m = 0; m < maps.length; m++) {
		allMaps.push((function () {
			var url = require('url');
			var proxy = require('proxy-middleware');
			var options = url.parse('http://127.0.0.1:' + jsonPort + maps[m].to);
			options.route = maps[m].from;
			return proxy(options);
		})());
	}
	return function (connect, o) {
		return allMaps;
	};
};
*/
};

module.exports = helpers;