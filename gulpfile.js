const {src, dest, watch, series, task} = require('gulp');
const sass = require('gulp-sass');
const ts = require('gulp-typescript');
const del = require('delete');
const cleanCss = require('gulp-clean-css');
const renderer = require('./dist/Renderer');
const fsx = require("fs-extra");
const path = require("path");

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

async function renderMarkdown() {
    let filename = 'test.md';
    let rend = new renderer.Renderer();
    let html = await rend.render(filename);
    await fsx.writeFile(filename.replace(path.extname(filename), '') + '.html', html);
}

task('cleanBuild', series(clearDist, compileTypescript, compileSass));
task('default', series(compileTypescript, compileSass));
task('watch', () => {
    series(compileSass, compileTypescript, renderMarkdown);
    watch('src/**/*.sass', series(compileSass, renderMarkdown));
    watch('**/*.ts', compileTypescript);
    watch('**/*.md', renderMarkdown);
});
