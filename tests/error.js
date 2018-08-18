import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Tinytest } from 'meteor/tinytest';
import {_helpers} from '../lib/_helpers';
import SubsManager from '../lib/sub_manager';

Tinytest.addAsync('subs with error - mix of error and non error', function(test, done) {
    const sm = new SubsManager();
    const subscribeToErrorOne = _helpers.runOnce(function() {
        return sm.subscribe('error-one');
    });
    Tracker.autorun(function(c) {
      subscribeToErrorOne();
      const status = sm.subscribe('posts');
    if(status.ready()) {
      sm.clear();
      c.stop();
      Meteor.defer(done);
    }
  });
});

Tinytest.addAsync('subs with error - with existing ready callback', function(test, done) {
    const sm = new SubsManager();
    const subscribeToErrorOne = _helpers.runOnce(function() {
        return sm.subscribe('error-one', function() {
        });
    });
    Tracker.autorun(function(c) {
      subscribeToErrorOne();
      const status = sm.subscribe('posts');
    if(status.ready()) {
      sm.clear();
      c.stop();
      Meteor.defer(done);
    }
  });
});

Tinytest.addAsync('subs with error - with existing onReady', function(test, done) {
    const sm = new SubsManager();
    const subscribeToErrorOne = _helpers.runOnce(function() {
        return sm.subscribe('error-one', {
            onReady() {
            }
        });
    });
    Tracker.autorun(function(c) {
      subscribeToErrorOne();
      const status = sm.subscribe('posts');
    if(status.ready()) {
      sm.clear();
      c.stop();
      Meteor.defer(done);
    }
  });
});

Tinytest.addAsync('subs with error - with existing onError', function(test, done) {
    const sm = new SubsManager();
    let called = false;
    const subscribeToErrorOne = _helpers.runOnce(function() {
        return sm.subscribe('error-one', {
            onError() {
                called = true;
            }
        });
    });
    Tracker.autorun(function(c) {
      subscribeToErrorOne();
      const status = sm.subscribe('posts');
    if(status.ready()) {
      test.isTrue(called);

      sm.clear();
      c.stop();
      Meteor.defer(done);
    }
  });
});

Tinytest.addAsync('subs with error - with some args', function(test, done) {
    const sm = new SubsManager();
    const subscribeToErrorOne = _helpers.runOnce(function() {
        return sm.subscribe('error-one', "args");
    });
    Tracker.autorun(function(c) {
      subscribeToErrorOne();
      const status = sm.subscribe('posts');
    if(status.ready()) {
      sm.clear();
      c.stop();
      Meteor.defer(done);
    }
  });
});

Tinytest.addAsync('subs with error - just the error sub', function(test, done) {
    const sm = new SubsManager();
    _helpers.runOnce(function() {
        return sm.subscribe('error-one');
    });
    const c = Tracker.autorun(function() {
        const status = sm.subscribe('error-one');
        if (status.ready()) {
            test.fail("This should not pass!");
        }
    });
    Meteor.setTimeout(function() {
    sm.clear();
    c.stop();
    Meteor.defer(done);
  }, 100);
});
