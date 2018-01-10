const http = require('http');
const WebApp = require('./webapp');
const fs = require('fs');
const PORT = 8080;

let registered_users = [{userName:'bhanutv',name:'Bhanu Teja Varma'},{userName:'harshab',name:'Harsha Vardhana'}];


let app = new WebApp();

app.use((req,res)=>{
  let sessionid = req.Cookies.sessionid;
  let user = registered_users.find(u=>u.sessionid==sessionid);
  if(sessionid && user){
    req.user = user;
  }
});

app.get('/',(req,res)=>{
  res.redirect('/index.html');
});

app.get('/login',(req,res)=>{
  if(req.user) {
    // console.log('hello');
    res.redirect('/home');
    return;
  }
  res.setHeader('Content-type','text/html');
  res.write('<form method="POST"> <input name="userName"><input name="place"> <input type="submit"></form>');
  res.end();
});

app.post('/login',(req,res)=>{
  let user = registered_users.find(u=>u.userName==req.body.userName);
  if(!user) {
    res.redirect('/login');
    return;
  }
  let sessionid = new Date().getTime();
  res.setHeader('Set-Cookie',`sessionid=${sessionid}`);
  user.sessionid = sessionid;
  // console.log('hii');
  res.redirect('/home');
});

app.get('/home',(req,res)=>{
  if(!req.user) {
    res.redirect('/login');
    return;
  }
  res.setHeader('Content-type','text/html');
  res.redirect('/guestBook.html')
  // res.write(`<p>Hello ${req.user.name}</p>`);
  res.end();
});

app.get('/guestBook.html',(req,res)=>{
  let user = registered_users.find(u=>u.userName==req.body.userName);
  if(!user) {
    res.redirect('/login');
    return;
  }
  let sessionid = new Date().getTime();
  res.setHeader('Set-Cookie',`sessionid=${sessionid}`);
  user.sessionid = sessionid;
  storeCommentAndRedirect(req,res);
});

app.get('/logout',(req,res)=>{
  if(!req.user) {
    res.redirect('/login');
    return;
  }
  res.setHeader('Set-Cookie','');
  delete req.user.sessionid;
  res.redirect('/login');
});

fs.readFile('./guestBook.html', 'utf8', (err, data) => {
  if (err) {
    throw err;
  }
  guestBookContent = data;
});

fs.readFile('./comments.js', 'utf8', (err, data) => {
  if (err) {
    throw err;
  }
  comments = JSON.parse(data);
});


let getContentType = function(fileName) {
  let extension = fileName.substr((fileName.lastIndexOf('.') + 1));
  let contentTypes = {
    'html': 'text/html',
    'txt': 'text/plain',
    'css': 'text/css',
    'gif': 'image/gif',
    'jpg': 'image/jpeg',
    'png': 'image/png',
    'ico': 'image/ico',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'js': 'application/javascript'
  }
  return contentTypes[extension];
}

let respondFileNotFound = function(req, res) {
  res.statusCode = 404;
  res.write(`${req.url} file not found`);
  res.end();
}

let respondToFileFound = function(req, res, header) {
  fs.readFile('.'+req.url, (err, data) => {
    if (err) {
      throw err;
    }
    res.setHeader('content-type', header);
    res.statusCode = 200;
    res.write(data);
    res.end();
  });
}

let getDate = function() {
  let date = new Date().toLocaleDateString();
  return date;
}

let getTime = function() {
  let Time = new Date().toLocaleTimeString();
  return Time;
}

let storeComment = function(data) {
  comments.unshift(`<tr><td>date: ${getDate()}.</td></br><td>time: ${getTime()}.</td></br><td>name: ${getPersonName(data)}.</td></br><td>comment: ${getComment(data)}</td></tr><hr><br>`);
  fs.writeFileSync('./comments.js', JSON.stringify(comments));
  return;
}

let redirect = function(res) {
  res.writeHead(302, {
    Location: './guestBook.html'
  });
  res.end();
  return;
}

let storeCommentAndRedirect = function(req,res) {
  req.on('data',function(data) {
    if(req.user)
    storeComment(data.toString());
  });
  redirect(res);
  return;
}

let printGuestBookWithNewComment = function(res) {
  let guestBookWithNewComment = guestBookContent.replace('No Comments Entered', comments.join(''));
  res.write(guestBookWithNewComment);
  res.end();
  return;
}


let respondToData = function(req,res) {
  if (req.url.startsWith('/server.js')) {
    storeCommentAndRedirect(req,res);
  } else if (req.url == '/guestBook.html' && comments.length != 0) {
    printGuestBookWithNewComment(res);
  } else {
    res.write(guestBookContent);
    res.end();
  }
  return;
}


let getPersonName = function(data) {
  return data.split('&')[0].split('=')[1].split('+').join(' ');
}

let getComment = function(data) {
  return unescape(data.split('=')[2].split('+').join(' '));
}


let respond = function(req, res) {
  if (req.method == 'POST') {
    respondToData(req,res);
    return;
  } else if (fs.existsSync('.' + req.url) && req.url != '/' && req.url != '/guestBook.html') {
    respondToFileFound(req, res, getContentType(req.url));
    return;
  }
  app.main(req,res);
}


let requestHandler = function(req, res) {
  respond(req, res);
  return;
}

let server = http.createServer(requestHandler);
server.listen(PORT);
console.log(`listening at ${PORT}`);
