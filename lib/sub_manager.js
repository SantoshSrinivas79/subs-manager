import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson'
import { Tracker } from 'meteor/tracker';
import { _helpers } from './_helpers.js';

const FastRender = Package['staringatlights:fast-render'] ?  Package['staringatlights:fast-render'].FastRender : null;

class SubsManager {
    constructor(options = {}) {
        //
        this.options = options;
        // maxiumum number of subscriptions are cached
        this.options.cacheLimit = this.options.cacheLimit || 10;
        // maximum time, subscription stay in the cache
        this.options.expireIn = this.options.expireIn || 5;

        this._cacheMap = {};
        this._cacheList = [];
        this._ready = false;
        this.tracker = new Tracker.Dependency();

        this.computation = this._registerComputation();
    }

    subscribe () {
        if (Meteor.isClient) {
            const args = [...arguments];
            // const args = _.toArray(arguments);
            this._addSub(args);

            return {
                ready: () => {
                    this.tracker.depend();
                    return this._ready;
                }
            };
        } else {
            // to support fast-render
            if (Meteor.subscribe) {
                return Meteor.subscribe.apply(Meteor, this.options);
            }
        }
    }

    _addSub  (args)  {

        const hash = EJSON.stringify(args);
        const subName = args[0];
        const paramsKey = EJSON.stringify(args.slice(1));
        let sub;
        if (!this._cacheMap[hash]) {
            sub = {
                args,
                hash
            };

            this._handleError(sub);

            this._cacheMap[hash] = sub;
            this._cacheList.push(sub);

            // if fast-render comes with this subscription
            // we need to fake the ready message at first
            // This is because we are delaying the actual subscription evaluation
            // May be FastRender needs to send full list of subscription args to the client
            // But, for now this is something working
            if (FastRender && FastRender._subscriptions && FastRender._subscriptions[subName]) {
                this._ready = this._ready && FastRender._subscriptions[subName][paramsKey];
            } else {
                this._ready = false;
            }

            // to notify the global ready()
            this._notifyChanged();

            // no need to interfere with the current computation
            this._reRunSubs();
        }

        // add the current sub to the top of the list
        sub = this._cacheMap[hash];
        sub.updated = (new Date).getTime();
        const index = this._cacheList.indexOf(sub);
        this._cacheList.splice(index, 1);
        this._cacheList.push(sub);
    }

    _reRunSubs () {

        if (Tracker.currentComputation) {
            Tracker.afterFlush(() => {
                this.computation.invalidate();
            });
        } else {
            this.computation.invalidate();
        }
    }

    _notifyChanged () {

        if (Tracker.currentComputation) {
            setTimeout(() => {
                this.tracker.changed();
            }, 0);
        } else {
            this.tracker.changed();
        }
    }

    _applyCacheLimit () {
        const overflow = this._cacheList.length - this.options.cacheLimit;
        if (overflow > 0) {
            const removedSubs = this._cacheList.splice(0, overflow);
            removedSubs.forEach((sub) => {
                delete this._cacheMap[sub.hash];
            });
        }
    }

    _applyExpirations () {
        const newCacheList = [];
        const expirationTime = (new Date).getTime() - this.options.expireIn * 60 * 1000;
        this._cacheList.forEach((sub) => {
            if (sub.updated >= expirationTime) {
                newCacheList.push(sub);
            } else {
                delete this._cacheMap[sub.hash];
            }
        });

        this._cacheList = newCacheList;
    }

    _registerComputation () {

        return Tracker.autorun(() => {
            this._applyExpirations();
            this._applyCacheLimit();
            let ready = true;
            this._cacheList.forEach(function (sub) {
                sub.ready = Meteor.subscribe.apply(Meteor, sub.args).ready();
                ready = ready && sub.ready;
            });

            if (ready) {
                this._ready = true;
                this._notifyChanged();
            }
        });
    }

    static _createIdentifier  (args)  {
        const tmpArgs = args.map(function (value) {
            if (typeof value === "string") {
                return '"' + value + '"';
            } else {
                return value;
            }
        });
        return tmpArgs.join(', ');
    }

    _handleError  (sub) {
        const args = sub.args;
        let lastElement = _helpers.last(args);
        sub.identifier = SubsManager._createIdentifier(args);

        if (!lastElement) {
            args.push({onError: errorHandlingLogic});
        } else if (typeof lastElement === "function") {
            args.pop();
            args.push({onReady: lastElement, onError: errorHandlingLogic});
        } else if (typeof lastElement.onError === "function") {
            const originalOnError = lastElement.onError;
            lastElement.onError = function (err) {
                errorHandlingLogic(err);
                originalOnError(err);
            };
        } else if (typeof lastElement.onReady === "function") {
            lastElement.onError = errorHandlingLogic;
        } else {
            args.push({onError: errorHandlingLogic});
        }

        function errorHandlingLogic(err) {
            Meteor._debug("Error invoking SubsManager.subscribe(%s): ", sub.identifier, err.reason);
            // expire this sub right away.
            // Then expiration machanism will take care of the sub removal
            sub.updated = new Date(1);
        }
    }

    reset () {

        const oldComputation = this.computation;
        this.computation = this._registerComputation();

        // invalidate the new compuation and it will fire new subscriptions
        this.computation.invalidate();

        // after above invalidation completed, fire stop the old computation
        // which then send unsub messages
        // mergeBox will correct send changed data and there'll be no flicker
        Tracker.afterFlush(() => {
            oldComputation.stop();
        });
    }

    clear () {
        this._cacheList = [];
        this._cacheMap = {};
        this._reRunSubs();
    }

    ready () {
        this.tracker.depend();

        // if there are no items in the cacheList we are not ready yet.
        if (this._cacheList.length === 0) {
            return false;
        }
        return this._ready;
    }

}

export default SubsManager;