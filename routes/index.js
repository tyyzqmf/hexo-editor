'use strict';
const express = require('express');
const router = express.Router();
const multiparty = require("multiparty");
const yaml = require('js-yaml');
const fs = require('fs');
const config = yaml.safeLoad(fs.readFileSync('./_config.yml', 'utf8'));
const auth = require('../models/auth');
const Manager = require('../models/manager');
const Editor = require('../models/editor');
const Article = require('../models/article');
const util = require('../models/util');
const cache = require('../models/cache');
const emoji = require('../models/emoji');
const busboy = require('connect-busboy');

auth.init(config.username, config.password);
const manager = new Manager(config.base_dir);
const editor = new Editor(config.base_dir);

router.get('/', (req, res, next) => {
  if (req.session.username || config.local == true) {
    const itemsPromise = manager.getItems();
    itemsPromise.then((files) => {
      let items = new Array();
      for (let i = 0; i < files.length; i++) {
        const article = new Article(manager.post_dir + files[i]);
        items.push(article.getPreview());
        cache.put(article.hashCode(), article.toJson());
      }
      util.sortPosts(items);
      res.render('index', {'items': items});
    }, (err) => {
        console.error(err)
    });
  } else {
    res.render('login', {'emoji': emoji.random()});
  }
});

router.post('/login', (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  if (auth.check(username, password)) {
    req.session.username = username;
  }
  console.log('ddd' + req.session.username);
  res.redirect('/');
});

router.get('/logout', (req, res, next) => {
  const username = req.session.username;
  console.log(username + ' logout');
  req.session.username = null;
  res.redirect('/');
});

router.get('/editor', (req, res, next) => {
  const articleId = req.query.id;
  cache.get(articleId, (article) => {
    if (!article) {
      article = {'title': 'Untitled', 'date': '', 'tags': '',
                 'categories': '', 'content': ''};
    }
    res.render('editor', {'article': article});
  });
});

router.post('/editor/image', (req, res, next) => {
  let fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', (fieldname, file, filename) => {
    fstream = fs.createWriteStream(config.base_dir + '/source/' + filename);
    file.pipe(fstream);
    fstream.on('close', () => {
        res.send(filename);
    });
  });
});

router.delete('/post', (req, res, next) => {

});

router.put('/post', (req, res, next) => {

});

router.get('/post', (req, res, next) => {
  const articleId = req.query.id;
  cache.get(articleId, (article) => {
    res.send(article.content);
  });
});

router.put('/draft', (req, res, next) => {

});

router.get('/generate', (req, res, next) => {

});

router.get('/deploy', (req, res, next) => {

});

module.exports = router;
