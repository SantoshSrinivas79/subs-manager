Package.describe({
  summary: 'Subscriptions Manager for Meteor',
  version: '1.7.0',
  git: 'https://github.com/THETCR/subs-manager.git',
  name: 'thetcr:subs-manager',
});

Package.on_use(function (api) {
    api.versionsFrom('1.4');
    api.use(['tracker', 'ejson', 'ecmascript'], ['client', 'server']);
    api.use('staringatlights:fast-render@3.0.4', 'client', { weak: true });
    api.mainModule('lib/sub_manager.js', ['client', 'server']);
});

Package.on_test(function (api) {
  api.use(['ecmascript', 'tinytest', 'mongo-livedata', 'reactive-dict', 'thetcr:subs-manager'], ['client', 'server']);
  api.add_files([
    'tests/init.js',
  ], ['server', 'client']);

  api.add_files([
    'tests/options.js',
    'tests/core.js',
    'tests/error.js',
  ], ['client']);
});
