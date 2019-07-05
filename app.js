var express=require("express"),
    app=express(),
    bodyparser=require("body-parser"),
    mongoose=require("mongoose"),
    methodOverride=require("method-override"),
    Sanitizer=require("express-sanitizer");

var url=process.env.DBURL || "mongodb://localhost/blog_app";    
mongoose.connect(url,{ useNewUrlParser: true });

//APP CONFIG
app.use(express.static("public")); //  TO USE PUBLIC DIRECTORY WHERE SCRIPTS AND STYLESHEETS ARE PRESENT
app.use(bodyparser.urlencoded({extended:true}));
app.use(Sanitizer()); //MUST COME AFTER BODYPARSER AS REQ.BODY IS SANITIZED

app.use(methodOverride("_method"));    //TELLS WHAT QUERY VARIABLE SERVER SHOULD LOOK FOR IN URL(SINCE WE USED _method IN EDIT.EJS,it is passed)

// MONGOOSE CONFIG
var blogSchema=new mongoose.Schema({
   title:String,
   image:String,
   body:String,
   created:{type:Date, default:Date.now}  //sets date to current date of blog creation
});
var Blog=mongoose.model("Blog",blogSchema);


//RESTful ROUTES
app.get("/",function(req, res) {  //HOME ROUTE REDIRECTS TO INDEX ROUTE
    res.redirect("/blogs");
});
//INDEX ROUTE
app.get("/blogs",async function(req,res){
    try
    {
        let blogs=await Blog.find({});
        res.render("index.ejs",{blogs:blogs});
    }
    catch(err)
    {
        console.log(err);
    }
});
//NEW ROUTE
app.get("/blogs/new",function(req,res){
    res.render("new.ejs");
});
//CREATE ROUTE
app.post("/blogs",async function(req,res){
    req.body.body=req.sanitize(req.body.body);//IF USER ENTERS HTML AS BODY , SANITIZER MAKES SURE THAT HTML STRUCTURE IS EXECUTED BUT REJECTS SCRIPTS
                                            //  WHICH OTHERWISE CAN HAVE UNWANTED EFFECTS
    var newBlog=req.body;
    //CREATE BLOG
    try{
        let createdblog=await Blog.create(newBlog);
               res.redirect(`/blogs/${createdblog._id}`);
    }
    catch(err)
    {
            res.render("new.ejs");
    }  
});
//SHOW ROUTE
app.get("/blogs/:id",async function(req,res){
     try
     {
        let blog=await Blog.findById(req.params.id);
        res.render("show.ejs",{blog:blog});
     }
     catch(err)
     {
         res.redirect("back");
     }
});

//EDIT ROUTE(CONVENTION OF PATH AS GIVEN)
app.get("/blogs/:id/edit",async function(req, res) {
    //FIRST FIND THE ID OF SELECTED BLOG
    
    try{
        let foundBlog=await Blog.findById(req.params.id);
        res.render("edit.ejs",{blog:foundBlog});
    }
    catch(err){
        res.redirect("/blogs");
    }
});

//UPDATE ROUTE
app.put("/blogs/:id",async function(req,res){
    
    req.body.body=req.sanitize(req.body.body);
    var newBlog=req.body;
    try{
        let updatedBlog=await Blog.findByIdAndUpdate(req.params.id,newBlog);
        res.redirect("/blogs/"+updatedBlog._id);
    }
    catch(err)
    {
        res.redirect("/blogs");
    }
    
});

//DESTROY(DELETE) ROUTE(THE SHOW PAGE HAS DELETE OPTION AS FORM)
app.delete("/blogs/:id",async function(req,res){
    try{
        await Blog.remove({_id:req.params.id});   
        res.redirect("/blogs");    
    }
    catch(err)
    {
        res.redirect("/blogs");    
    }
    
});

app.listen(process.env.PORT,process.env.IP,function(req,res){
   console.log("Server Started!"); 
});