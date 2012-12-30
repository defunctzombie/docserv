// vendor
var dom = require('dom');
var request = require('superagent');

// container for sidebar items
var sidenav = dom('#modules-list');

// readme area
var readme = dom('#readme');

// template for sidebar items
var sidenav_template = document.querySelector('script[name="sidenav-module"]');

function cssbind(elem, map) {

    var binding = {};

    Object.keys(map).forEach(function(prop) {
        var selector = map[prop];

        var subelem = elem.querySelector(selector);
        Object.defineProperty(binding, prop, {
            get: function() {
                return subelem.innerText;
            },
            set: function(val) {
                subelem.innerText = val;
            }
        });
    });

    return binding;
}

sidenav.on('click', 'li', function(ev) {
    sidenav.find('li.active').removeClass('active');
    dom(ev.currentTarget).addClass('active');

    request
        .get('/modules/' + dom(ev.currentTarget).data('module-name'))
        .end(function(res) {
            readme.html(res.body.readme);
        });
});

function get_modules(cb) {
    request
        .get('/modules')
        .set('Accept', 'application/json')
        .end(function(res) {
            cb(null, res.body);
        });
};

get_modules(function(err, modules) {
    modules.forEach(function(module, idx) {

        var elem = dom(sidenav_template.text)[0];
        dom(elem).data('module-name', module.name);

        var bound = cssbind(elem, {
            name: '.name',
            version: '.version'
        });

        bound.name = module.name;
        bound.version = module.version;

        // finally add to document
        sidenav.append(elem);

        if (idx === 0) {
            dom(elem).emit('click', { bubbles: true });
        }
    });
});

