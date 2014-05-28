var express = require('express');
var router = express.Router();

/* GET users listing. */
/*
router.get('/', function(req, res) {
  res.send('respond with a resource');
});
*/

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

/*
router.get('/radars', function (request, response) {
    response.json( {radar: Radar.findAll()} );
});
*/
/**
 * HTTP POST /radars/
 * Body Param: the JSON task you want to create
 * Returns: 200 HTTP code
 */
//router.post('/radars', radarController.create);


app.get('/posts', postsController.index);
router.get('/posts/news',  postsController.new);
router.post('/posts',  postsController.create);
router.get('/posts/:postid', postsController.view);
router.get('/posts/:postid/edit',  postsController.edit);
router.put('/posts/:postid',  postsController.update);
router.delete('/posts/:postid', postsController.remove);

//var post = new Post({title: "Prueba", content: "Esto es una prueba"});
//post.save();

module.exports = router;
