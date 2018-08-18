Package.describe({
  summary: 'Subscriptions Manager for Meteor',
  version: '1.7.0',
  git: 'https://github.com/THETCR/subs-manager.git',
  name: 'thetcr:subs-manager',
});

Package.on_use(function (api) {
  configurePackage(api);

  api.export(['SubsManager']);
});

Package.on_test(function (api) {
  configurePackage(api);

  api.use(['tinytest', 'mongo-livedata', 'reactive-dict', 'ecmascript', 'subs-manager'], ['client', 'server']);
  api.add_files([
    'tests/init.js',
  ], ['server', 'client']);

  api.add_files([
    'tests/options.js',
    'tests/core.js',
    'tests/error.js',
  ], ['client']);
});

function configurePackage(api) {
  if (api.versionsFrom) {
    api.versionsFrom('METEOR@0.9.0');
  }

  api.use(['tracker', 'ejson', 'ecmascript'], ['client', 'server']);
  api.use('staringatlights:fast-render@3.0.4', 'client', { weak: true });

  api.add_files([
    'lib/sub_manager.js',
  ], ['client', 'server']);
}
