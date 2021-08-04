const gulp = require('gulp');
const scss = require('gulp-sass')(require ('sass'));
const autoprefix = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const replace = require('gulp-replace');
const rename = require('gulp-rename');
const cheerio = require ('gulp-cheerio');
const imagemin = require ('gulp-imagemin');
const svgSprite = require('gulp-svg-sprites');
const svgmin = require('gulp-svgmin');
const del = require('del');

// BrowserSync
gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: "./app/"
        },
        notify: false,
    });
});

//BrowserSync для HTML
gulp.task('html', function(){
    return gulp.src('app/**/*.html')
        .pipe(browserSync.reload({ stream: true }));
})

// CSS компилятор
gulp.task('scss', function(){
    return gulp.src('src/scss/main.scss')
        .pipe(scss({outputStyle: 'compressed'}).on('error', scss.logError))
        .pipe(autoprefix(['last 15 versions']))
        .pipe(rename({suffix: '.min', prefix : ''}))
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({stream: true}));
})

// Минификация JS
gulp.task('js', function(){
    return gulp.src([
        'src/vendors/jquery/jquery.min.js',
        'src/vendors/**/*.js',
        'src/js/common.js',
    ])
        .pipe(concat('script.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('app/js'))
        .pipe(browserSync.reload({stream: true}));
})

//Минификация jpeg, png, svg
gulp.task('img', function(){
    return gulp.src('src/img/images/*')
        .pipe(imagemin([
            imagemin.mozjpeg({quality: 75, progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: true}
                ]
            })
        ]))
        .pipe(gulp.dest('app/img/images/'));
})

// Создание SVG sprite
gulp.task('svgSprite', function(){
    return gulp.src('src/img/icons/svg/*.svg')
        .pipe(svgmin({
            js2svg: {
                pretty: true,
            },
            // Иногда svgmin удаляет ViewBox, плагин который это устраняет
            plugins: [{
                name: 'removeViewBox',
                active: false,
            }],
        }))
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: {xmlMode: true}
        }))
        // После исполнения cheerio иногда, сивол '>' заменяется на '&gt', исправляем это с помощью gulp-replace
        .pipe(replace('&gt;', '>'))
        // Создание спрайта
        .pipe(svgSprite({
                mode: "symbols",
                preview: true,
                selector: "icon-%f",
                svg: {
                    symbols: 'icons-sprite.svg',
                }
            }
        ))
        .pipe(gulp.dest('app/img/icons/'));
})

//Watch
gulp.task('watch', function() {
	gulp.watch('src/scss/**/*.scss', gulp.parallel('scss'));
	gulp.watch('src/js/common.js', gulp.parallel('js'));
	gulp.watch('app/*.html', gulp.parallel('html'));
});

// Команда для разработки
gulp.task('dev', gulp.parallel('watch', 'browserSync'));

// Команда сборки
gulp.task('prod', gulp.parallel('scss', 'js', 'svgSprite', 'img'));

// Удаление файлов/папок
gulp.task('del', function(){
    return del.sync('app'); 
})