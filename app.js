// Indicamos los modulos que necesitaremos
// Falta indicar el motor de render de las plantillas
var express = require('express'),
    favicon = require('serve-favicon'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    cookieParser = require('cookie-parser'),
    cookieSession = require('cookie-session'),
    jade = require('jade'),
    app = express()
    ;

// Definimos Parametros de forma global dentro de la Aplicación
app.set('public', __dirname + '/public');
app.set('views', __dirname + '/views');
app.set('secret cookies', 'texto opcional para el secret de las cookies');
app.set('secret session', "asdf");

// Configuramos el motor de las plantillas
app.engine('jade', jade.__express);
app.set('view engine', 'jade');

// Configuramos los elementos que utilizará Express.
// Recuerda que es importante el orden!
app.use( favicon(app.get('public') + '/favicon.ico') );
app.use( bodyParser() );
app.use( methodOverride() );
app.use( cookieParser(app.get('secret cookies')) );
app.use( cookieSession({secret: app.get('secret session')}) );

//--------------------------------------------
// Función que nos permite extender un objeto
// Utilizaremos para simular los modelos
function extend() {
    var args = [].slice.call(arguments);
    return args.reduce(function(acc, el) {
        for (var k in el) { acc[k] = el[k]; }
        return acc;
    });
}

//################################################################################################
// ############################# MODELOS #########################################################
// ###############################################################################################

var BaseModels = function(data) {
    extend(this, data);
};
extend(BaseModels, {
    initialize: function(klass) {
        extend(klass, {
            _models: [],
            _id: 0,
            find: function(id) {
                return this._models.filter(function(p) { return p.id == id; })[0];
            },
            getAll: function() {
                return this._models;
            }
        });
    }
});
extend(BaseModels.prototype, {
    save: function() {
        this.id = this.constructor._id++;
        this.constructor._models.push(this);
    },
    update: function() {
        var models = this.constructor._models;
        for (var i=0,_len=models.length; i<_len; i++) if (models[i].id === this.id) {
            models.splice(i, 1, this);
            break;
        }
    },
    delete: function() {
        var models = this.constructor._models;
        for (var i=0,_len=models.length; i<_len; i++) if (models[i].id === this.id) {
            models.splice(i, 1);
            break;
        }
    }
});


var Post = function(data) {
    data = extend({}, {title: "", content: "", date: Date.now(), views: 0}, data);
    BaseModels.call(this, data);
};
BaseModels.initialize(Post);
extend(Post.prototype, BaseModels.prototype);

var User = function(data) {
    data = extend({email: "", date: Date.now(), password: ""}, data);
    BaseModels.call(this, data);
};
BaseModels.initialize(User);
extend(User, {
    findByEmail: function(email) {
        return this._models.filter(function(u) {
            return u.email === email;
        })[0];
    }
});
extend(User.prototype, BaseModels.prototype);

//-------------- RADAR --------------------------------------------------------------------------

var Radar = function(data) {
    data = extend({}, {velMax: "", descripcio: "", longitud: "", latitud:"", date: Date.now() }, data);
    BaseModels.call(this, data);
};
BaseModels.initialize(Radar);
extend(Radar.prototype, BaseModels.prototype);
//-----------------------------------------------------------------------------------------------

//################################################################################################
// ############################# CONTROLADORES ###################################################
// ###############################################################################################

var postsController = {

    index: function(req, res) {
        if(req.session.user != undefined)
            res.render("post-list", {posts: Post.getAll(), user: req.session.user });
        else
            res.render("post-list", {posts: Post.getAll()});
    },
    view: function(req, res) {
        //if (!req.postPlantilla) throw Error("Not found!");
        res.render("post-detail", {post: req.postPlantilla});
    },
    new: function(req, res) {
        res.render("new-post", { post:{ }, user: req.session.user });
    },
    create: function(req, res) {
        var post = new Post( {title: req.body.title, content: req.body.content } );
        post.save();
        res.render("post-detail", {post: post});

    },
    edit: function(req, res) {
        // if (!req.postPlantilla) throw Error("Not found!");
        res.render("new-post", {post: req.postPlantilla});
    },
    update: function(req, res) {
        req.postPlantilla.title = req.body.title;
        req.postPlantilla.content = req.body.content;
        req.postPlantilla.update();
        res.redirect("/posts");
    },
    remove: function(req, res) {
        if(!req.postPlantilla) throw Error("Not Found");
        var post = req.postPlantilla;
        post.delete();
        res.render("post-list", {post: Post.getAll()});
    },

    param: function(req, res, next, id) {
        req.postPlantilla = Post.find(id);
        next();
    }

};

var userController = {

    create: function(req, res){
        var email = req.body.email;
        var pass = req.body.password;

        if( (email != "") && (pass != "") ){

            if( User.findByEmail(email) != undefined ){
                res.render("register-user", { message: "El usuari '"+email+"' ja existeix!" });
            }else{
                var user = new User( {email: email, password: pass } );
                user.save();
                req.session.user = user;
                res.redirect("/posts");
            }
        }else{
            res.render("register-user", { message: "Tots els camps son obligatoris!" });
        }
    },
    authenticate: function(req, res) {
        var user = new User( {email: req.body.email, password: req.body.password } );

        if( userController.isValidUser(user) ){
            req.session.user = user;
            res.redirect("/posts");
        }else{
            res.redirect("/login");
        }
    },
    isValidUser: function( user ){
        var auxUser = User.findByEmail( user.email );

        if( auxUser ){
            if( auxUser.password === user.password )
                return true;
            else
                return false;
        }else{
            return false;
        }
    },
    requireSession: function(req, res, next){
        if(req.session.user != undefined){
            next();
        }else{
            res.redirect("/login");
        }
    },
    destroySession: function(req, res){
        req.session = null;
        //req.session.destroy;
        res.redirect("/login");
    },
    showForm: function(req, res) {
        if( req.originalUrl == "/login" )
            res.render("login-user");
        else if ( req.originalUrl == "/register")
            res.render("register-user");
        //res.render('some-view', { messages: allMessages });
    },
    param: function(req, res, next, email) {
        req.userPlantilla = User.findByEmail(email);
        next();
    }
}




//################################################################################################
// ############################# RUTAS ###########################################################
// ###############################################################################################

// Procesamos el parametro :postid, utilizandon el metodo creado en
// el controlador. Siempre se realizan antes de las procesar las rutas
// Ejemplo: https://github.com/visionmedia/express/blob/master/examples/params/app.js
app.param("postid", postsController.param);

app.get('/', function(req, res){
    //res.send('hello world');
    res.render('index');
});


app.get('/posts', postsController.index);
app.get('/posts/news', userController.requireSession, postsController.new);
app.post('/posts', userController.requireSession, postsController.create);
app.get('/posts/:postid', postsController.view);
app.get('/posts/:postid/edit', userController.requireSession, postsController.edit);
app.put('/posts/:postid', userController.requireSession, postsController.update);
app.delete('/posts/:postid', userController.requireSession, postsController.remove);
app.get('/login', userController.showForm);
app.post('/login', userController.authenticate);
app.get('/register', userController.showForm);
app.post('/register', userController.create);
app.get('/logout', userController.destroySession);
/*
 Parte donde escribiremos nuestro código:
 * los controladores
 * middleware
 * rutas
 * errores
 */

app.use( express.static(app.get('public')) );
// Indicamos el puerto
app.listen(3000);
console.log('Application Started on http://localhost:3000/');


/* Datos: los Posts */
var post = new Post({title: "Prueba", content: "Esto es una prueba"});
post.save();

var admin = new User({email: "admin@localhost.com", password: "1234"});
admin.save();

var radar = new Radar({velMax: 50, latitud:10.34234, longitud: 1.34234, descripcio: 'fixe'});
radar.save();



