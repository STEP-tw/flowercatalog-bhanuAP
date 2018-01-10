const http = require('http');
const fs = require('fs');
const PORT = 8000;

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
  if (req.url == '/') {
    req.url = '/index.html';
  }
  if (req.method == 'POST' || req.url == '/guestBook.html') {
    respondToData(req,res);
    return;
  } else if (fs.existsSync('.' + req.url)) {
    respondToFileFound(req, res, getContentType(req.url));
    return;
  }
  respondFileNotFound(req, res);
}


let requestHandler = function(req, res) {
  respond(req, res);
}

const server = http.createServer(requestHandler);
server.listen(PORT);
console.log(`listening at ${PORT}`);
