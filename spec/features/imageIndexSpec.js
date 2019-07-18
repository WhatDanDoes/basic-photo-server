const Browser = require('zombie');
const PORT = process.env.NODE_ENV === 'production' ? 3000 : 3001; 
Browser.localhost('example.com', PORT);
const fs = require('fs');
const app = require('../../app');
const fixtures = require('pow-mongoose-fixtures');
const models = require('../../models'); 

/**
 * `mock-fs` stubs the entire file system. So if a module hasn't
 * already been `require`d the tests will fail because the 
 * module doesn't exist in the mocked file system. `ejs` and
 * `iconv-lite/encodings` are required here to solve that 
 * problem.
 */
const mock = require('mock-fs');
const mockAndUnmock = require('../support/mockAndUnmock')(mock);

describe('imageIndexSpec', () => {
  let browser, agent, lanny;

  beforeEach(function(done) {
    browser = new Browser({ waitDuration: '30s', loadCss: false });
    //browser.debug();
    fixtures.load(__dirname + '/../fixtures/agents.js', models.mongoose, function(err) {
      models.Agent.findOne({ email: 'daniel@example.com' }).then(function(results) {
        agent = results;
        models.Agent.findOne({ email: 'lanny@example.com' }).then(function(results) {
          lanny = results; 
          browser.visit('/', function(err) {
            if (err) return done.fail(err);
            browser.assert.success();
            done();
          });
        }).catch(function(error) {
          done.fail(error);
        });
      }).catch(function(error) {
        done.fail(error);
      });
    });
  });

  afterEach(function(done) {
    models.mongoose.connection.db.dropDatabase().then(function(err, result) {
      done();
    }).catch(function(err) {
      done.fail(err);
    });
  });

  describe('authenticated', () => {
    beforeEach(done => {
     mockAndUnmock({ 
       [`uploads/${agent.getAgentDirectory()}`]: {
         'image1.jpg': fs.readFileSync('spec/files/troll.jpg'),
         'image2.jpg': fs.readFileSync('spec/files/troll.jpg'),
         'image3.jpg': fs.readFileSync('spec/files/troll.jpg'),
       },
       'public/images/uploads': {}
     });

     browser.fill('email', agent.email);
     browser.fill('password', 'secret');
     browser.pressButton('Login', function(err) {
       if (err) done.fail(err);
       browser.assert.success();
       done();
     });
    });
  
    afterEach(() => {
      mock.restore();
    });

    describe('authorized', () => {
      it('allows an agent to view his own album', () => {
        browser.assert.url({ pathname: `/image/${agent.getAgentDirectory()}`});
        browser.assert.elements('section img', 3);
      });

      it('allows an agent to view an album he can read', done => {
        expect(agent.canRead.length).toEqual(1);
        expect(agent.canRead[0]).toEqual(lanny._id);

        browser.visit(`/image/${lanny.getAgentDirectory()}`, function(err) {
          if (err) return done.fail(err);
          browser.assert.success();
          browser.assert.text('h2', 'No images');
          done();
        });
      });

      it('creates an agent directory if it does not exist already', done => {
        expect(fs.existsSync(`uploads/${lanny.getAgentDirectory()}`)).toBe(false);
        browser.visit(`/image/${lanny.getAgentDirectory()}`, function(err) {
          if (err) return done.fail(err);
          browser.assert.success();
          expect(fs.existsSync(`uploads/${lanny.getAgentDirectory()}`)).toBe(true);
          done();
        });
      });
    });

    describe('unauthorized', () => {
      it('does not allow an agent to view an album for which he has not been granted access', done => {
        models.Agent.findOne({ email: 'troy@example.com' }).then(function(troy) {
          expect(agent.canRead.length).toEqual(1);
          expect(agent.canRead[0]).not.toEqual(troy._id);

          browser.visit(`/image/${troy.getAgentDirectory()}`, function(err) {
            if (err) return done.fail(err);
            browser.assert.redirected();
            browser.assert.url({ pathname: '/'});
            browser.assert.text('.alert.alert-danger', 'You are not authorized to access that resource');
            done();
          });
        }).catch(function(error) {
          done.fail(error);
        });
      });
    });
  });

  describe('unauthenticated', () => {
    it('redirects home (which is where the login form is located)', done => {
      browser.visit(`/image/${agent.getAgentDirectory()}`, function(err) {
        if (err) return done.fail(err);
        browser.assert.redirected();
        browser.assert.url({ pathname: '/'});
        browser.assert.text('.alert.alert-danger', 'You need to login first');
        done();
      });
    });
  });
});