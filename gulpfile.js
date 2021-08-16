const gulp = require('gulp');
const scss = require('gulp-sass')(require ('sass'));
const autoprefix = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const imagemin = require ('gulp-imagemin');
const svgo = require ('gulp-svgo');
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



// CSS компилятор ***
    // Для команды gulp prod
gulp.task('scssProd', function(){
    return gulp.src('src/scss/main.scss')
        .pipe(scss({outputStyle: 'compressed'}).on('error', scss.logError))
        .pipe(autoprefix(['last 5 versions']))
        .pipe(rename({suffix: '.min', prefix : ''}))
        .pipe(gulp.dest('app/css'))
})

    // Для команды gulp dev
gulp.task('scssDev', function(){
    return gulp.src('src/scss/main.scss')
        .pipe(scss({
            outputStyle: 'expanded',
            indentWidth: 4,
        }))
        .pipe(autoprefix(['last 5 versions']))
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



//Шрифты***
gulp.task('fonts', function(){
    return gulp.src('src/fonts/*')
    .pipe(gulp.dest('app/fonts'))
})



//Минификация jpeg, png***
gulp.task('imgMin', function(){
    return gulp.src('src/img/images/*.{jpg,png}')
        .pipe(imagemin([
            imagemin.mozjpeg({quality: 75, progressive: true}),
            imagemin.optipng({optimizationLevel: 5})
        ]))
        .pipe(gulp.dest('app/img/images/'));
})



//Минификация svg***
gulp.task('svgMin', function(){
    return gulp.src('src/img/images/*.svg')
        .pipe(svgo({
            js2svg: {
                pretty: true,
                indent: 4,
            },
            plugins:[
                {mergePaths: false},
                {collapseGroups: true},
            ]
        }))
        .pipe(gulp.dest('app/img/images/'));
})



// Создание SVG sprite***
    // "Команда работает в ручном режиме"
gulp.task('svgSprite', function(){
    return gulp.src('src/img/icons/svg/*.svg')
        // Удаление атрибутов
        .pipe(svgo({
            plugins:[
                {convertPathData: false},
                {removeStyleElement: true},
                {removeAttrs: {attrs: ['fill', 'stroke']}},
            ]
        }))
        // Создание спрайта SYMBOL
        .pipe(svgSprite({
            mode: "symbols",
            svgId: "icon-%f",
            preview: false,
            svg: {
                symbols: "icons-sprite.svg"
            }
        }))
        .pipe(gulp.dest('app/img/icons/'));
})
 


// Создание PNG спрайта***
    // "Команда работает в ручном режиме"
gulp.task('pngSprite', function(){
    var spriteData = gulp.src('src/img/icons/png/*.png')
        .pipe(pngSprite({
            imgName: 'icons-sprite.png',
            imgPath: '../img/icons/icons-sprite.png',
            cssName: '_sprite-img.scss',
            cssFormat: 'scss',
            cssVarMap: function (sprite) {
                sprite.name = 'icon-' + sprite.name;
            },
            algorithm: 'binary-tree',
            padding: 20
        }));
    return spriteData.img.pipe(gulp.dest('app/img/icons/')), spriteData.css.pipe(gulp.dest('src/scss/'));
});



//Watch***
gulp.task('watch', function(){
	gulp.watch('src/scss/**/*.scss', gulp.parallel('scssDev'));
	gulp.watch('src/js/common.js', gulp.parallel('js'));
	gulp.watch('app/*.html', gulp.parallel('html'));
});



// Удаление файлов/папок***
gulp.task('del', function(){
    return del.sync(['app/**', '!app/index.html']); 
})



// Команда для разработки***
gulp.task('dev', gulp.parallel('scssDev', 'watch', 'browserSync'));

// Команда сборки***
    // "Перед исполнением команды, необходимо предварительно отключить команду Dev, иначе css файл не минифицируется "
gulp.task('prod', gulp.parallel('del', 'scssProd', 'js', 'fonts', 'imgMin', 'svgMin'));