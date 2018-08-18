import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Tinytest } from 'meteor/tinytest';
import { ReactiveDict } from 'meteor/reactive-dict';

import SubsManager from '../lib/sub_manager';
import {Posts, Comments, Points, PostsOnlyAllowed} from "./init";

export const session = new ReactiveDict();

Tinytest.addAsync('core - init', function(test, done) {
  Meteor.call('init', done);
});

Tinytest.addAsync('core - single subscribe', function(test, done) {
    const sm = new SubsManager();
    Tracker.autorun(function(c) {
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
    session.set('sub', 'posts');

  Tracker.autorun(function(c) {
      const sub = session.get('sub');
      subs[sub] = true;
      const handler = sm.subscribe(sub);
      if(Object.keys(subs).length === 2) {
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
    session.set('sub', 'comments');
  });
});

Tinytest.addAsync('core - global ready method - basic usage', function(test, done) {
    const sm = new SubsManager();
    Tracker.autorun(function(c) {
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
    Tracker.autorun(function(c) {
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
    session.set('id', 'one');

  Tracker.autorun(function(c) {
      const id = session.get('id');
      ids[id] = true;
      const handler = sm.subscribe('singlePoint', id);
      if(Object.keys(ids).length === 2) {
      if(handler.ready()) {
        test.equal(Points.find().count(), 2);
        c.stop();
        Meteor.defer(done);
      }
    }
  });

  Meteor.call('wait', 200, function() {
    session.set('id', 'two');
  });
});

Tinytest.addAsync('core - resetting', function(test, done) {
    const sm = new SubsManager();
    let allowed = false;
    Meteor.call('postsOnlyAllowed.allow', false, function() {
    Tracker.autorun(function(c) {
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
    Tracker.autorun(function(c) {
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
