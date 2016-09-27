const gulp = require('gulp');
const ghPages = require('gulp-gh-pages');

gulp.task('deploy', () =>
    gulp.src([
        './dist/**/*',
    ], { base: '.' })
    .pipe(ghPages())
);
