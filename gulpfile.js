var gulp = require('gulp'),
    gutil = require('gulp-util'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    filesize = require('gulp-filesize');

gulp.task('default', function() {
  return gulp.src(['src/az.js', 'src/az.*.js'])
    .pipe(concat('az.js'))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(rename('az.min.js'))
    .pipe(gulp.dest('dist'))
    .pipe(filesize())
    .on('error', gutil.log);
});