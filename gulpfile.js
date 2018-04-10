var gulp = require('gulp');
var babel = require('gulp-babel');
var less = require('gulp-less');
var path = require('path');
var concat = require('gulp-concat');
var minify = require('gulp-minify');
var cleanCSS = require('gulp-clean-css');
var gulpSequence = require('gulp-sequence')
var rename = require('gulp-rename');

gulp.task('scripts', function() {
	return gulp.src(
		[
		'js/*.js'
		]
	)
	.pipe(babel({presets: ['env']}))
	.pipe(concat('index.js'))
	.pipe(gulp.dest('compiled/js'))
	.pipe(minify({
		noSource: true,
		ext:{
			src:'compiled/index.js',
			min:'.min.js'
		}
	}))
	.pipe(gulp.dest('compiled/js'))
});
 
gulp.task('less', function (callback) {
	return gulp.src('less/*.less')
	.pipe(less({
		paths: [ path.join(__dirname, 'less', 'includes') ]
	}))
	.pipe(concat('index.css'))
	.pipe(gulp.dest('compiled/css'))
});
gulp.task('minify-css', function (callback) {
	return gulp.src('compiled/css/index.css')
	.pipe(cleanCSS({
		compatibility: 'ie8'
	}))
	.pipe(rename({
		suffix: '.min'
	}))
	.pipe(gulp.dest('compiled/css'))
});
gulp.task('sequence-1', gulpSequence('less', 'minify-css'))

gulp.task('default', () =>{
	gulp.watch('js/*.js', ['scripts'])
	gulp.watch('less/*.less', function (event) {
		gulpSequence('less', 'minify-css')(function (err) {
		  if (err) console.log(err)
		})
	  })
});