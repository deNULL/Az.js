var gulp = require('gulp'),
    gutil = require('gulp-util'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    filesize = require('gulp-filesize'),
    sourcemaps = require('gulp-sourcemaps');

gulp.task('default', function() {
  return gulp.src(['src/az.js', 'src/az.*.js'])
    .pipe(sourcemaps.init())
    .pipe(concat('az.js'))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(rename('az.min.js'))
    .pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '../src' }))
    .pipe(gulp.dest('dist'))
    .on('error', gutil.log);
});