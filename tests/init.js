import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Posts = new Mongo.Collection('posts');
export const PostsOnlyAllowed = new Mongo.Collection('posts-only-allowed');
export const Comments = new Mongo.Collection('comments');
export const Points = new Mongo.Collection('points');

if(Meteor.isServer) {

  Meteor.publish('posts', function() {
    return Posts.find();
  });

  Meteor.publish('postsOnlyAllowed', function() {
    if(PostsOnlyAllowed.allow) {
      return PostsOnlyAllowed.find();
    } else {
      this.ready();
    }
  });

  Meteor.publish('comments', function() {
    return Comments.find();
  });

  Meteor.publish('singlePoint', function(id) {
      check(id, String);
      return Points.find(id);
  });

  Meteor.publish('error-one', function(id = "") {
      check(id, String);
    throw new Meteor.Error("400", "dddd");
  });

  // using this method since PhantomJS does have support setTimeout
  Meteor.methods({
    "wait"(millis) {
        check(millis, Number);
        Meteor.wrapAsync(function(done) {
        setTimeout(done, millis);
      })();
    },

    "init"() {
      Posts.remove({});
      Comments.remove({});
      Points.remove({});
      PostsOnlyAllowed.remove({});

      Posts.insert({_id: "one"});
      Comments.insert({_id: "one"});
      Points.insert({_id: "one"});
      Points.insert({_id: "two"});

      PostsOnlyAllowed.insert({_id: "one"});
    },

    "postsOnlyAllowed.allow"(allowed) {
        check(allowed, Boolean);
        PostsOnlyAllowed.allow = allowed;
    }
  });
}
