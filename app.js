
//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

mongoose.set("useCreateIndex", true);
const itemSchema=new mongoose.Schema({
  name: String,
  image: String,
  cost: Number,
  add: String
},
{
  versionKey: false
});

const cartSchema=new mongoose.Schema({
  number:Number,
  name:String,
  image:String,
  cost:Number,
  count: Number,
  value: Number
},
  {
    versionKey: false
});

const boxSchema=new mongoose.Schema({
  name:String,
  items:[itemSchema],
  carts:[cartSchema]
},
{
  versionKey: false
});

const userSchema=new mongoose.Schema({
  email:String,
  password:String,
  secret:String,
  googleId: String
},
  {
    versionKey: false
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const Item=mongoose.model("Item",itemSchema);
const Cart=mongoose.model("Cart",cartSchema);
const User=mongoose.model("User",userSchema);
const Box=mongoose.model("Box",boxSchema);
var nameplate="";


// const userSchema = new mongoose.Schema ({
//   email: String,
//   password: String,
//   // googleId: String,
//   secret: String
// });


passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/secrets",
//     userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     console.log(profile);
//
//     User.findOrCreate({ googleId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));





const item1=new Item({
  name: "How to Stop Worrying and Start Living: Time-Tested Methods for Conquering Worry",
  image: "https://m.media-amazon.com/images/I/61O9uqUfQDL._AC_UY218_ML3_.jpg",
  cost: 100,
  add: "Add to cart"
});

const item2=new Item({
  name:"How to Win Friends and Influence People",
  image:"https://m.media-amazon.com/images/I/81rsnHmlrbL._AC_UY218_ML3_.jpg",
  cost: 150,
  add: "Add to cart"
});

const item3=new Item({
  name:"Attitude Is Everything: Change Your Attitude ... Change Your Life!",
  image:"https://m.media-amazon.com/images/I/710jnzKlDTL._AC_UY218_ML3_.jpg",
  cost: 200,
  add: "Add to cart"
});

const data=[item1,item2,item3];
var cont="Add to cart";
var counting=0;

var x=0;
app.get("/",function(req,res){
  if(req.isAuthenticated()){
    Box.findOne({name:req.user.username},function(err,box){
      if(!err){
        if(box.carts.length===null)
        x=0;
        else
        x=box.carts.length;
        res.render("list",{count:x,bookItems:box.items,nameplan:"logout",abcd:"Hi!" + req.user.username});
      }
    });
}
else{
  Item.find({},function (err,founditems){
    if(founditems.length ===0){
      Item.insertMany(data,function(err){
        if(err)
        console.log(err);
        else
        console.log("sucess");
      });
      res.redirect("/");
    }
    else{
      Cart.find({},function (err,cartitems){
        if(err)
        console.log(err);
        else{
          const counting=cartitems.length;
          res.render("list",{count: counting,bookItems: founditems,nameplan:"Sign-in",abcd:""});
        }
      });
    }
});
var num=0;
var f=0;
}
});
app.get("/cart",function(req,res){
var amount=0;

if(req.isAuthenticated()){
      Box.findOne({name:req.user.username},function(err,boxitems){
        if(!err){
          if(boxitems.carts.length!==0){
          for(var i=0;i<boxitems.carts.length;i++)
          amount+=boxitems.carts[i].value;
          console.log(amount);
        }
      }
      });

      Box.find({},function(err,boxitems){
        if(!err){
          res.render("list3",{newItems:boxitems.carts,totalAmount:amount});
        }
      });
    }
else{
      Cart.find({},function(err,cartitems){
        if(!err){
          for(var i=0;i<cartitems.length;i++)
          amount+=cartitems[i].value;
        }
      });

      Cart.find({},function(err,cartitems){
        if(!err){
          res.render("list3",{newItems:cartitems,totalAmount:amount});
        }
      });
  }
});
app.post("/",function(req,res){
  res.redirect("/");
});
app.post("/cart",function(req,res){
  res.redirect("/cart");
});

app.get("/delete",function(req,res){
  res.redirect("/cart");
});
app.post("/delete",function(req,res){
  if(req.isAuthenticated()){
    var fuf=req.body.changed;
    var named=req.body.itemname;
    if(fuf!=0){

Box.findOne({name:req.user.username,"carts.name":named},function(err,cart){
  if(!err){
    var cost=cart.cost;
    var b=cost*fuf;
    Box.update({name:req.user.username,"carts.name":named},{"carts.cost":fuf},function(err){
      if(!err){
      console.log("sucess");

      Box.update({name:req.user.username,"items.add":fuf + " added to cart"},function(err){
        if(!err)
        console.log("done");
      });

      res.redirect("/cart");
    }
    });
  }
});
}
  else{
    Box.deleteOne({name:req.user.username,"carts.name":named},function(err){
      if(!err){
      console.log("deleted");

      Box.update({name:req.user.username,"items.add":"Add to cart"},function(err){
        if(!err)
        console.log("done");
      });


      res.redirect("/cart");
    }
    });
  }
  }
  else{
  var fuf=req.body.changed;
  console.log(fuf);
  var named=req.body.itemname;
  console.log(named);
  if(fuf!=0){
  Cart.findOne({name:named},function(err,item){
    var cost=item.cost;
    var b=cost*fuf;
  Cart.findOneAndUpdate({name:named},{$set: {count:fuf,value:b}},function(err,items){
    if(!err){
    console.log("sucess");

  Item.update({name:named},{add:fuf + " added to cart"},function(err){
    if(!err)
    res.redirect("/cart");
});
}
});
});
}
else{
  Cart.deleteOne({name:named},function(err){
    if(!err){
    console.log("deleted");

    Item.update({name:named},{add:"Add to cart"},function(err){
      if(!err)
      console.log("done");
    });
    res.redirect("/cart");
  }
  });
}
}
});

app.post("/deletebut",function(req,res){
  var named=req.body.itemname2;
  if(req.isAuthenticated()){
    Box.deleteOne({name:req.user.username,"carts.name":named},function(err){
      if(!err){
      console.log("deleted");

      Box.update({name:req.user.username,"items.add":"Add to cart"},function(err){
        if(!err)
        console.log("done");
      });


      res.redirect("/cart");
    }
    });
  }
  else{
  Cart.deleteOne({name:named},function(err){
    if(!err){
      console.log("deleted");
      Item.update({name:named},{add:"Add to cart"},function(err){
        if(!err)
        console.log("done");
      });

      res.redirect("/cart");
    }
  });
}
});
var nums=0;
var v=1;
var w=1;
app.post("/add",function(req,res){
  if(req.isAuthenticated()){
    const elem=req.body.listitem;
    const elemid=req.body.element;
    const val=req.body.button;

    Item.findOne({name: elem},function(err,newitem){
      if(!err){
        Box.find({name:req.user.username,"carts.name":newitem.name},function(err,item){
          if(item.length===0){
            const obj=new Cart({
              number:w,
              name: newitem.name,
              image: newitem.image,
              cost: newitem.cost,
              count:1,
              value:newitem.cost
            });
            Box.update({name:req.user.username},{$push: {carts:obj}},function(err){
              if(!err)
              console.log("saved item");
            });
            w++;

            Cart.deleteOne({name:newitem.name},function(err){
              if(!err)
              console.log("good");
            });

            Box.update({name:req.user.username,"items.name":newitem.name},{$set:{add:"Added to Cart"}});
            res.redirect("/");
          }

          else{
            Box.findOne({name:req.user.username,"carts.name":newitem.name},function(err,carteditem){
              if(!err){
                var b=carteditem.count+1;
                var c=b*newitem.cost;
                Box.update({name:req.user.username,"carts.name":newitem.name},{$set: {count: b,value: c}},function(err,foundcarts){
                  if(!err)
                  console.log("sucess");
                });

                Box.update({name:req.user.username,"items.name":newitem.name},{$set:{add:b+ " added to cart"}},function(err,founditem){
                  if(!err)
                  res.redirect("/");
              });
            }
          });
        }
      });
    }
  });
}
else{
   const elem=req.body.listitem;
   const elemid=req.body.element;
   const val=req.body.button;
   console.log(val);
   var b=0;
   Item.findOne({name: elem},function(err,newitem){
     if(err)
     console.log(err);
     else{
       Cart.find({name:newitem.name},function(err,item){
           if(item.length===0){
             const obj=new Cart({
               number:v,
               name: newitem.name,
               image: newitem.image,
               cost: newitem.cost,
               count:1,
               value:newitem.cost
             });
             obj.save();
             v++;
             Item.findOneAndUpdate({name:elem},{$set:{add: "1 added to cart"}},function(err,founditem){
               if(!err)
               res.redirect("/");
           });
                }

           else{
            Cart.findOne({name:newitem.name},function(err,item){
              b=item.count+1;
              var c=b*newitem.cost;
               Cart.findOneAndUpdate({name:newitem.name},{$set: {count: b,value: c}},function(err,foundcarts){
                 if(!err)
                 console.log("sucess");
               });

               Item.findOneAndUpdate({name:elem},{$set:{add:b+ " added to cart"}},function(err,founditem){
                 if(!err)
                 res.redirect("/");
             });
           });

           }

     });
   }
   });
}
 });
app.post("/homepage",function(req,res){
  res.redirect("/");
});
 app.get("/sign-in",function(req,res){
   res.render("list4");
 });


app.get("/signup",function(req,res){
  res.render("list5");
});

app.get("/signin2",function(req,res){
  res.render("list6");
});

app.post("/sign-in",function(req,res){

  const user=new User({
    username:req.body.username,
    password:req.body.password
  });


  req.login(user, function(err){
    if (err) {
      console.log(err);
      res.flash("sorry,try again");
      res.redirect("/sign-in");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/");
      });
    }
  });


});
app.post("/signup",function(req,res){

  if(req.isAuthenticated()){
    req.logout();
    res.redirect("/");
  }
  else{
  var named=req.body.username;
  var email=req.body.email;
  var pswd=req.body.password;


    User.register({username:named},pswd,function(err,user){
      if(err){
      console.log(err);
      res.redirect("/signup");
    }
      else{
        passport.authenticate("local")(req,res,function (){
          var box=new Box({
            name:req.user.username,
            items:data,
          });
          box.save();
          res.redirect("/");
        });
      }
    });
  }
  });

 function calc()
{
  var price = document.getElementById("ticket_price").innerHTML;
  var noTickets = document.getElementById("num").value;
  var total = parseFloat(price) * noTickets
  if (!isNaN(total))
    document.getElementById("total").innerHTML = total
}

app.listen(3000,function (){
  console.log("server started at 3000");
});
