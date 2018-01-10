const fs = require('fs');
let handlePageRequests = require('./server').handlePageRequests;

const toKeyValue = kv=>{
  let parts = kv.split('=');
  return {key:parts[0],value:parts[1]};
};


const accumulate = (o,kv)=> {
  o[kv.key] = kv.value;
  return o;
};


const parseBody = text=> text.split('&').map(toKeyValue).reduce(accumulate,{});


let redirect = function(path){
  this.statusCode = 302;
  this.setHeader('location',path);
  this.end();
};


const parseCookies = text=> text.split(';').map(toKeyValue).reduce(accumulate,{});


let invoke = function(req,res){
  let handler = this._handlers[req.method][req.url];
  if(!handler){
    res.statusCode = 404;
    res.write('File not found!');
    res.end();
    return;
  }
  handler(req,res);
}


const WebApp = function(){
  this._handlers = {GET:{},POST:{}};
  this._preprocess = [];
};

WebApp.prototype = {

  get:function(url,handler){
    this._handlers.GET[url] = handler;
  },

  post:function(url,handler){
    this._handlers.POST[url] = handler;
  },

  use:function(handler){
    this._preprocess.push(handler);
  },

  main:function(req,res){
    res.redirect = redirect.bind(res);
    req.Cookies = parseCookies(req.headers.cookie||'');
    // console.log(`${req.method} ${req.url}`);
    let content="";
    req.on('data',data=>content+=data.toString())
    req.on('end',()=>{
      req.body = parseBody(content);
      // console.log(`data: ${JSON.stringify(req.body,null,2)}`);
      content="";
      this._preprocess.forEach(p=>p(req,res));
      invoke.call(this,req,res);
    });
  }

};

module.exports = WebApp;
