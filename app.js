// builtin
var fs = require('fs');
var path = require('path');

// vendor
var express = require('express');
var marked = require('marked');
var hbs = require('hbs');
var enchilada = require('enchilada');
var log = require('book');
var semver = require('semver');
var hljs = require('highlight.js');
var optimist = require('optimist');

var wheresreadme = require('./lib/wheresreadme');

var argv = optimist
    .describe('port', 'port to start docserv server on')
    .default('port', 3000)
    .argv;

var port = argv.port;

var base = argv._.shift() || process.cwd();
var module_dir = path.join(base, 'node_modules');
var our_info = require(base + '/package.json');

// array of module information
var modules = [];

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.engine('html', hbs.__express);

app.use(app.router);
app.use(enchilada(__dirname + '/static'));
app.use(express.static(__dirname + '/static'));

app.get('/', function(req, res, next) {
    res.locals.project = our_info;
    return res.render('index');
});

app.get('/modules', function(req, res, next) {
    // read package.json for current project dir
    // also read module_dir for list of actually installed modules
    //
    var pkg = JSON.parse(fs.readFileSync(path.join(base, 'package.json'), 'utf8'));

    var modules = {};
    modules[pkg.name] = {
        name: pkg.name,
        version: pkg.version,
        installed: true
    };

    Object.keys(pkg.dependencies || {}).forEach(function(name) {
        modules[name] = {
            name: name,
            // will be set to true if found in node_modules
            installed: false,
            version: pkg.dependencies[name]
        }
    });

    if (!fs.existsSync(module_dir)) {
        return res.json(Object.keys(modules).map(function(name) {
            return modules[name];
        }));
    }

    fs.readdir(module_dir, function(err, paths) {
        if (err) {
            return next(err);
        }

        // no hidden dirs
        paths = paths.filter(function(p) {
            return p[0] !== '.';
        });

        paths.forEach(function(module) {
            var pkgfile = path.join(module_dir, module, 'package.json');

            // TODO(shtylman) maybe smarter? if no package.json skip
            if (!fs.existsSync(pkgfile)) {
                return;
            }

            var pkg = JSON.parse(fs.readFileSync(pkgfile, 'utf8'));

            var name = pkg.name;
            var version = pkg.version;

            var mod = modules[name];
            if (!mod) {
                mod = modules[name] = {
                    name: name,
                    version: version,
                    extraneous: true
                }
            }

            mod.installed = true;

            // check if installed module has valid version
            if (!semver.satisfies(mod.version, mod.version)) {
                mod.invalid = true;
            }

            // git versions are ignored
            if (/^[a-z]/.test(mod.version[0])) {
                mod.invalid = false;
            }

            // set module version to installed version
            mod.version = version;
        });

        res.json(Object.keys(modules).map(function(name) {
            return modules[name];
        }));
    });
});

// get details for a given module
// includes the readme
app.get('/modules/:module', function(req, res, next) {
    var module_name = req.param('module');
    var mod_path = path.join(module_dir, module_name);

    // our own module
    if (module_name === our_info.name) {
        mod_path = base;
    }

    if (!fs.existsSync(mod_path)) {
        return res.send(404);
    }

    var readme = wheresreadme(mod_path);
    if (!readme) {
        return res.json({});
    }


    fs.readFile(readme, 'utf8', function(err, src) {
        if (err) {
            return next(err);
        }

        res.json({
            readme: marked(src, {
                gfm: true,
                highlight: function(code, lang) {
                    if (lang && hljs.LANGUAGES[lang]) {
                        return hljs.highlight(lang, code).value;
                    }
                    return hljs.highlightAuto(code).value;
                }
            })
        });
    });
});

var server = app.listen(port);
log.info('serving docs on localhost:%d', server.address().port);

