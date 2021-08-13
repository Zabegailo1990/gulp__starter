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
const svgmin = require('gulp-svgmin');
const svgSprite = require('gulp-svg-sprites');
const pngSprite = require('gulp.spritesmith');
const del = require('del');
const { render } = require('sass');

// BrowserSync***
gulp.task('browserSync', function(){
    browserSync.init({
        server: {
            baseDir: "./app/"
        },
        notify: false,
    });
});

//BrowserSync для HTML***
gulp.task('html', function(){
    return gulp.src('app/**/*.html')
        .pipe(browserSync.reload({ stream: true }));
})

// CSS компилятор***
gulp.task('scss', function(){
    return gulp.src('src/scss/main.scss')
        .pipe(scss({outputStyle: 'compressed'}).on('error', scss.logError))
        .pipe(autoprefix(['last 15 versions']))
        .pipe(rename({suffix: '.min', prefix : ''}))
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({stream: true}));
})

// Минификация JS***
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

//Минификация jpeg, png***
gulp.task('img', function(){
    return gulp.src('src/img/images/*.{jpg,png}')
        .pipe(imagemin([
            imagemin.mozjpeg({quality: 75, progressive: true}),
            imagemin.optipng({optimizationLevel: 5})
        ]))
        .pipe(gulp.dest('app/img/images/'));
})

//Минификация svg***
gulp.task('svg', function(){
    return gulp.src('src/img/images/*.svg')
        .pipe(svgmin({
            multipass: true,
            js2svg: {
                pretty: true,
                indent: 4,
            },
            plugins:[
                {
                    name: 'mergePaths',
                    active: false
                },
                {
                    name: 'collapseGroups',
                    active: true
                },
            ]
        }))
        .pipe(gulp.dest('app/img/images/'));
})

// Создание SVG sprite***
gulp.task('svgSprite', function(){
    return gulp.src('src/img/icons/svg/*.svg')
        .pipe(cheerio({
            run: function($){
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: {xmlMode: true}
        }))
        // После исполнения cheerio иногда, сивол '>' заменяется на '&gt', исправляем это с помощью gulp-replace
        .pipe(replace('&gt;', '>'))
        // Создание спрайта SYMBOL
        .pipe(svgSprite({
                mode: "symbols",
                svgId: "icon-%f",
                preview: false,
                svg: {
                    symbols: "icons-sprite.svg"
                }
            }
        ))
        .pipe(gulp.dest('app/img/icons/'));
})

// Создание PNG спрайта***
gulp.task('pngSprite', function(){
    var spriteData = gulp.src('src/img/icons/png/*.png')
        .pipe(pngSprite({
            imgName: 'icons-sprite.png',
            imgPath: '../img/icons/icons-sprite.png',
            cssName: '_sprite-img.scss',
            cssFormat: 'scss',
            algorithm: 'binary-tree',
            padding: 20
        }));
    return spriteData.img.pipe(gulp.dest('app/img/icons/')), spriteData.css.pipe(gulp.dest('src/scss/'));
});

//Watch***
gulp.task('watch', function(){
	gulp.watch('src/scss/**/*.scss', gulp.parallel('scss'));
	gulp.watch('src/js/common.js', gulp.parallel('js'));
	gulp.watch('app/*.html', gulp.parallel('html'));
});

// Удаление файлов/папок***
gulp.task('del', function(){
    return del.sync(['app/**', '!app/index.html']); 
})

// Команда для разработки***
gulp.task('dev', gulp.parallel('watch', 'browserSync'));

// Команда сборки***
gulp.task('prod', gulp.parallel('del', 'scss', 'js', 'img', 'svg', 'svgSprite', 'pngSprite'));