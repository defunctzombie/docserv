# docserv

Simple documentation browser for your node project.

![docserv](http://shtylman.github.com/docserv/docserv_window.png)

## use

Docserv will serve the readme files for your project as well as the immediate module dependencies.

```
$ docserv [--port 3000] [path to project root]
```

This will start a server on localhost to the project you specify (cwd if none specified). Use the module list on the left to browse through your dependencies.

## api

You can create a docserv instance by specifying a path to the project. `docserv` will return an express app.

```
var docserv = require('docserv');

var app = docserv('/path/to/project/root');
var server = app.listen(3000);
```

## install

Docserv is best installed globally to be used on any project.

```
$ npm install docserv -g
```
