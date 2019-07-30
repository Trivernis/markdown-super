const {src, dest, watch, series, task} = require('gulp');
const sass = require('gulp-sass');
const ts = require('gulp-typescript');
const del = require('delete');
const cleanCss = require('gulp-clean-css');

function clearDist(cb) {
    del('dist/*', cb);
}

function compileTypescript() {
    let tsProject = ts.createProject('tsconfig.json');
    let tsResult = tsProject.src().pipe(tsProject());
    return tsResult
        .pipe(dest('dist'));
}

function compileSass() {
    return src('src/styles/*.sass')
        .pipe(sass())
        .pipe(cleanCss())
        .pipe(dest('dist/styles'));
}

function moveOther() {
    return src(['src/**/*', '!src/**/*.ts', '!src/**/*.sass'])
        .pipe(dest('dist'));
}


task('cleanBuild', series(clearDist, compileTypescript, compileSass, moveOther));
task('default', series(compileTypescript, compileSass, moveOther));
task('watch', () => {
    series(compileSass, compileTypescript, moveOther);
    watch('src/**/*.sass', series(compileSass));
    watch('**/*.ts', compileTypescript);
    watch(['src/**/*', '!src/**/*.ts', '!src/**/*.sass'], moveOther);
});
