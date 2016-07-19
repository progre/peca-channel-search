import fs from "fs";
import path from "path";
import typescript from "typescript";
import promisify from "native-promisify";
const access = promisify(fs.access);
import gulp from "gulp";
import gulpIf from "gulp-if";
import uglify from "gulp-uglify";
import browserify from "browserify";
import tsify from "tsify";
import babelify from "babelify";
import licensify from "licensify";
import source from "vinyl-source-stream";
import buffer from "vinyl-buffer";
import { parallel } from "./util";

export async function buildBrowser(config, release) {
    let availableFiles = await getAvailableFiles(config.files);
    let project = createBrowserProject();
    return parallel(
        availableFiles.map(x => buildBrowserOne(x.src, x.dest, project, release))
    );
}

async function getAvailableFiles(files) {
    let accessResults = await Promise.all(
        files.map(x => access(x.src, fs.R_OK).catch(e => e)));
    return files.filter((_, i) => accessResults[i] == null);
}

function buildBrowserOne(src, dest, project, release) {
    let basename = path.basename(src);
    let outputName = basename.replace(
        new RegExp(path.extname(basename) + "$"), ".js");
    let browserifyOpts = {
        entries: src,
        removeComments: release,
        debug: !release
    };
    let babelOpts = {
        extensions: [".ts", ".tsx"],
        presets: ["es2015"],
        sourceMaps: true
    };
    return new Promise((resolve, reject) => {
        let stream = browserify(browserifyOpts)
            .plugin(tsify, project)
            .plugin(licensify)
            .transform(babelify, babelOpts)
            .bundle()
            .on("error", onError)
            .on("end", onEnd)
            .pipe(source(outputName))
            .pipe(gulpIf(release, buffer()))
            .pipe(gulpIf(release, uglify({ preserveComments })))
            .pipe(gulp.dest(dest));

        function onError(e) {
            stream.removeListener("error", onError);
            stream.removeListener("end", onEnd);
            reject(e);
        }

        function onEnd() {
            stream.removeListener("error", onError);
            stream.removeListener("end", onEnd);
            resolve();
        }
    });
}

function preserveComments(node, comment) {
    return comment.value.indexOf("generated by licensify") >= 0;
}

function createBrowserProject() {
    return Object.assign({},
        require("../tsconfig.json").compilerOptions,
        { typescript });
}
