/*
----
All plugins between sourcemaps.init() and sourcemaps.write() need to support gulp-sourcemaps.
Check compatibility here:
https://github.com/floridoo/gulp-sourcemaps/wiki/Plugins-with-gulp-sourcemaps-support
----
*/

'use strict';

// Node (built-in)
var fs = require('fs');
var path = require('path');
var os = require('os');

// Modules we'll use
var PrettyError = require('pretty-error'); // Shows nice-looking errors in console
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var minimist = require('minimist');
var named = require('vinyl-named');

var prettyError = new PrettyError();
prettyError.start();

var beepError = function (err) {
    $.util.beep();
    console.error(prettyError.render(err));
};

// ----
// Static Variables
// ----

var AUTOPREFIXER_BROWSERS = [
    'ie >= 8',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
];

// ----
// Parse CLI Parameters
// ----

var knownOptions = {
    string: 'env',
    default: { env: 'dev' }
};

// process is a Node global
var options = minimist(process.argv.slice(2), knownOptions);
var IS_PROD = options.env === 'prod';

// ----
// Scripts
// ----

// TODO: add uglification in production
var buildDist = function () {
    var webpackOpts = {
        externals: {
            react: 'React',
            underscore: '_',
            backbone: 'Backbone',
            moment: 'moment',
        },
        module: {
            loaders: [
                {
                    test: /\.jsx?$/,
                    exclude: 'node_modules',
                    loader: 'babel'
                }
            ]
        }
    };
    return $.webpackSourcemaps(webpackOpts, null, function (err, stats) {
        if (err) {
            throw new $.util.PluginError('webpack', err);
        }

        if (stats.compilation.errors.length) {
            $.util.log('webpack', '\n' + stats.toString({ colors: true }));
        }

        $.util.log('[webpack]', stats.toString({
            // output options
        }));
    });
};

gulp.task('scripts', function () {
    return gulp.src('src/scripts/*.{js,jsx}')
        .pipe($.plumber({ errorHandler: beepError }))
        .pipe($.sourcemaps.init()) // Enable sourcemaps
            // .pipe($.jscs())
            .pipe($.babel())
            .pipe(named())
            .pipe(buildDist())
            .pipe($.if(IS_PROD, $.uglify()))
        .pipe($.sourcemaps.write('./', { includeContent: true }))
        .pipe(gulp.dest('dist/scripts'))
        .pipe($.size({title: 'scripts'}));
});

// ----
// Styles
// ----

// Compile and Automatically Prefix Stylesheets
gulp.task('styles', function () {
    // For best performance, don't add Sass partials to `gulp.src`
    return gulp.src('src/styles/*.scss')
        .pipe($.plumber({ errorHandler: beepError }))
        .pipe($.if(IS_PROD, $.sourcemaps.init()))
            .pipe($.sass({
                // Precision required by Bootstrap
                // https://github.com/twbs/bootstrap-sass#sass-number-precision
                precision: 8,
                onError: console.error.bind(console, 'Sass error:'),
                includePaths: ['node_modules/bootstrap-sass/assets/stylesheets']
            }))
            .pipe($.if(IS_PROD, $.autoprefixer({browsers: AUTOPREFIXER_BROWSERS})))

            // Minify and optimize CSS structure. This is excruciatingly slow. Only use in production
            .pipe($.if(IS_PROD, $.minifyCss()))
        .pipe($.if(IS_PROD, $.sourcemaps.write('.')))
        .pipe(gulp.dest('dist/styles'))
        .pipe($.size({title: 'styles'}));
});

// Watch Files For Changes & Reload
gulp.task('watch', ['default'], function () {
    browserSync({
        notify: false,
        logPrefix: 'CoderLife',
        proxy: 'https://' + os.hostname(), // hostname example: sub-domain.coderlife.net
        'ignored': '*systems_safe_save_*.*' // for Transmit: https://panic.com/transmit/
    });

    //gulp.watch(['../../application/smp/views/scripts/*/*.phtml'], reload);
    //gulp.watch(['../../application/smp/layouts/*.phtml'], reload);
    gulp.watch(['src/styles/**/*.{scss,css}'], ['styles', reload]);
    gulp.watch(['src/scripts/**/*.{js,jsx}'], ['scripts', reload]);
});

// ----
// Images
// ----

// Compile and Automatically Prefix Stylesheets
gulp.task('images', function () {
    return gulp.src('src/images/*')
        .pipe(gulp.dest('dist/images'));
});

// ----
// Misc
// ----

// Clean Output Directory
gulp.task('clean', del.bind(null, ['dist/*'], {dot: true}));

// Build Production Files, the Default Task
gulp.task('default', ['scripts', 'styles', 'images']);

