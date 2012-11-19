var catApp = require('./cat_app');
var AngryCats = require('./models/angrycats');
var AngryCat = require('./models/angrycat');

$(function() {
  var cats = new AngryCats(
    [
      new AngryCat({ name: 'Wet Cat', image_path : 'images/cat2.jpg' }) ,
      new AngryCat({ name : 'Bitey Cat', image_path : 'images/cat1.jpg' }),
      new AngryCat({ name : 'Surprised Cat', image_path : 'images/cat3.jpg' })
    ]);
  console.log('before app start');
  catApp.start({cats : cats});

  cats.add(new AngryCat({ name: 'Cranky Cat', image_path: 'images/cat4.jpg',
                        rank: cats.size() + 1 }));
});

