var gulp = require('gulp');
var fs = require('fs');
var pkg = require('./package.json');
var header = require('gulp-header');
var nunjucksApi = require('gulp-nunjucks-api');
var nunjucks = require('nunjucks');
var data = require('gulp-data');
var helpers=require('./helpers');
var tasks = require('gulp-task-listing');
var currentDate = new Date();
var scriptVer = "?v" + pkg.version + "." + Math.floor(Date.now() / 1000);
var banner = ['/**',
	' * <%= pkg.name %> - <%= pkg.description %>',
	' * @version ' + scriptVer,
	currentDate,
	' */',
	''
].join('\n');

gulp.task('man', tasks);

var getremote=require("./nunjucks_components/getremote.js").getremote
console.log(getremote);
gulp.task('build', () =>
	gulp.src('app/index.html')
	.pipe(data(() => ({
		name: 'Sindre'
	})))
	.pipe(nunjucksApi({
		extensions: {
			getremote: new getremote()
		}
	}))
	.pipe(gulp.dest('dist'))
);
gulp.task('validate_deployment', ['build'], function () {
	/*
	handlevalidateResult(function () {
       return false;
	});
	*/
});
gulp.task('default', ['validate_deployment'], function () {
	helpers.logsuccess('yay');
});