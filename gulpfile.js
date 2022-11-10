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
    ts = require("gulp-typescript");
    tsProject = ts.createProject("./tsconfig.json");
    terser = require('gulp-terser');

gulp.task('docs', function () {
  return merge(
    tsProject.src(['src/az.tokens.ts', 'src/az.morph.ts'])
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
  return tsProject.src(['src/az.ts', 'src/az.*.ts'])
    .pipe(tsProject())
    .pipe(terser())
    .pipe(gulp.dest('dist'))
    .on('error', gutil.log);
});
