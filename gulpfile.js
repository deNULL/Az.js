var gulp = require('gulp'),
    gutil = require('gulp-util'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    filesize = require('gulp-filesize'),
    sourcemaps = require('gulp-sourcemaps'),
    jsdoc2md = require('gulp-jsdoc-to-markdown'),
    merge = require('merge-stream'),
    fs = require('fs');

gulp.task('docs', function () {
  return merge(
    gulp.src(['src/az.tokens.js', 'src/az.morph.js'])
      .pipe(jsdoc2md({ template: fs.readFileSync('./api.hbs', 'utf8') }))
      .on('error', function (err) {
        gutil.log(gutil.colors.red('jsdoc2md failed'), err.message)
      })
      .pipe(rename(function (path) {
        path.basename = path.basename.split('.').map(function(part) {
          return part[0].toLocaleUpperCase() + part.substr(1);
        }).join('.');
        path.extname = '.md'
      }))
      .pipe(gulp.dest('wiki')),
    gulp.src('README.md')
      .pipe(rename(function (path) {
        path.basename = 'Home';
      }))
      .pipe(gulp.dest('wiki'))
  );
});

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
