/**
 * There has got to be a better way... what am I missing?
 */
const fs = require('fs');
module.exports = function(mock) {
  return function(mocks) {
    mock({ 
      ...mocks, 
      'views/index.ejs': fs.readFileSync('views/index.ejs'),
      'views/album/index.ejs': fs.readFileSync('views/album/index.ejs'),
      'views/album/list.ejs': fs.readFileSync('views/album/list.ejs'),
      'views/album/list_item.ejs': fs.readFileSync('views/album/list_item.ejs'),
      'views/image/image.ejs': fs.readFileSync('views/image/image.ejs'),
      'views/_partials/head.ejs': fs.readFileSync('views/_partials/head.ejs'),
      'views/_partials/matomo.ejs': fs.readFileSync('views/_partials/matomo.ejs'),
      'views/_partials/navbar.ejs': fs.readFileSync('views/_partials/navbar.ejs'),
      'views/_partials/messages.ejs': fs.readFileSync('views/_partials/messages.ejs'),
      'views/_partials/login.ejs': fs.readFileSync('views/_partials/login.ejs'),
      'views/_partials/footer.ejs': fs.readFileSync('views/_partials/footer.ejs'),
      'views/error.ejs': fs.readFileSync('views/error.ejs')
    });
  };
};
