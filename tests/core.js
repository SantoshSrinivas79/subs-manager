Tinytest.addAsync('core - init', function(test, done) {
  Meteor.call('init', done);
});

Tinytest.addAsync('core - single subscribe', function(test, done) {
    const sm = new SubsManager();
    Deps.autorun(function(c) {
      const status = sm.subscribe('posts');
      if(status.ready()) {
        const posts = Posts.find().fetch();
        test.equal(posts, [{_id: 'one'}]);

      sm.clear();
      c.stop();
      Meteor.defer(done);
    }
  });
});

Tinytest.addAsync('core - multi subscribe', function(test, done) {
    const sm = new SubsManager();
    const subs = {};
    Session.set('sub', 'posts');

  Deps.autorun(function(c) {
      const sub = Session.get('sub');
      subs[sub] = true;
      const handler = sm.subscribe(sub);
      if(_.keys(subs).length === 2) {
      if(handler.ready()) {
        test.equal(Posts.find().count(), 1);
        test.equal(Comments.find().count(), 1);

        sm.clear();
        c.stop();
        Meteor.defer(done);
      }
    }
  });

  Meteor.call('wait', 200, function() {
    Session.set('sub', 'comments');
  });
});

Tinytest.addAsync('core - global ready method - basic usage', function(test, done) {
    const sm = new SubsManager();
    Deps.autorun(function(c) {
    sm.subscribe('posts');
    if(sm.ready()) {
        const posts = Posts.find().fetch();
        test.equal(posts, [{_id: 'one'}]);

      sm.clear();
      c.stop();
      Meteor.defer(done);
    }
  });
});

Tinytest.addAsync('core - global ready method - and change it - aa', function(test, done) {
    const sm = new SubsManager();
    let readyCalledOnce = false;
    Deps.autorun(function(c) {
    sm.subscribe('posts');
      const readyState = sm.ready();
      if(readyState) {
        const posts = Posts.find().fetch();
        test.equal(posts, [{_id: 'one'}]);
      readyCalledOnce = true;

      // with this, ready status became false
      sm.subscribe('not-existing-sub');
    } else if(readyCalledOnce) {
      sm.clear();
      c.stop();
      Meteor.defer(done);
    }
  });
});

Tinytest.addAsync('core - global ready method - initial state', function(test, done) {
    const sm = new SubsManager();
    test.equal(sm.ready(), false);
  done();
});

Tinytest.addAsync('core - multi subscribe but single collection', function(test, done) {
    const sm = new SubsManager();
    const ids = {};
    Session.set('id', 'one');

  Deps.autorun(function(c) {
      const id = Session.get('id');
      ids[id] = true;
      const handler = sm.subscribe('singlePoint', id);
      if(_.keys(ids).length == 2) {
      if(handler.ready()) {
        test.equal(Points.find().count(), 2);
        c.stop();
        Meteor.defer(done);
      }
    }
  });

  Meteor.call('wait', 200, function() {
    Session.set('id', 'two');
  });
});

Tinytest.addAsync('core - resetting', function(test, done) {
    const sm = new SubsManager();
    let allowed = false;
    Meteor.call('postsOnlyAllowed.allow', false, function() {
    Deps.autorun(function(c) {
        const status = sm.subscribe('postsOnlyAllowed');
        const readyState = status.ready();
        let posts;
      if(!allowed) {
        if(readyState) {
           posts = PostsOnlyAllowed.find().fetch();
          test.equal(posts, []);
          allowed = true;
          Meteor.call('postsOnlyAllowed.allow', true, function() {
            sm.reset();
          });
        }
      } else {
         posts = PostsOnlyAllowed.find().fetch();
        if(posts.length === 1) {
          test.equal(posts, [{_id: 'one'}]);

          sm.clear();
          c.stop();
          Meteor.defer(done);
        }
      }
    });
  });
});

Tinytest.addAsync('core - clear subscriptions', function(test, done) {
    const sm = new SubsManager();
    Deps.autorun(function(c) {
      const status = sm.subscribe('posts');
      if(status.ready()) {
        const posts = Posts.find().fetch();
        test.equal(posts, [{_id: 'one'}]);

      sm.clear();
      c.stop();
      setTimeout(checkPostsAgain, 200);
    }
  });

  function checkPostsAgain() {
      const postCount = Posts.find({_id: "one"}).count();
      test.equal(postCount, 0);
    done();
  }
});
