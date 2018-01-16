import Ember from 'ember';
import canUseDOM from '../utils/can-use-dom';
import objectTransforms from '../utils/object-transforms';
import BaseAdapter from './base';

const {
  $,
  assert,
  get,
} = Ember;
const {
  compact,
  without,
} = objectTransforms;
const assign = Ember.assign || Ember.merge;

function detectIE() {
  if (!window || !window.navigator) {
    return false;
  }
  let ua = window.navigator.userAgent;

  let trident = ua.indexOf('Trident/');
  if (trident > 0) {
    // ie11
    return true;
  }

  // other browser
  return false;
}

export default BaseAdapter.extend({
  booted: false,

  toStringExtension() {
    return 'Intercom';
  },

  init() {
    const { appId } = get(this, 'config');

    assert(`[ember-metrics] You must pass a valid \`appId\` to the ${this.toString()} adapter`, appId);

    if (canUseDOM) {
      /* eslint-disable */
      (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',{});}else{var d=document;var i=function(){i.c(arguments)};i.q=[];i.c=function(args){i.q.push(args)};w.Intercom=i;function l(){var s=d.createElement('script');s.type='text/javascript';s.async=true;
      s.src=`https://widget.intercom.io/widget/${appId}`;
      var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);} l(); }})()
      /* eslint-enable */
    }
  },

  identify(options = {}) {
    const { appId } = get(this, 'config');
    const compactedOptions = compact(options);
    const { distinctId } = compactedOptions;
    const props = without(compactedOptions, 'distinctId');
    props.app_id = appId;
    if (distinctId) {
      props.user_id = distinctId;
    }


    assert(`[ember-metrics] You must pass \`distinctId\` or \`email\` to \`identify()\` when using the ${this.toString()} adapter`, props.email || props.user_id);

    const method = this.booted ? 'update' : 'boot';
    if (canUseDOM && !detectIE()) {
      window.Intercom(method, props);
      this.booted = true;
    }
  },

  trackEvent(options = {}) {
    const compactedOptions = compact(options);
    const { event } = compactedOptions;
    const props = without(compactedOptions, 'event');

    if (canUseDOM && !detectIE()) {
      window.Intercom('trackEvent', event, props);
    }
  },

  trackPage(options = {}) {
    const event = { event: 'page viewed' };
    const mergedOptions = assign(event, options);

    this.trackEvent(mergedOptions);
  },

  boot(options = {}) {
    if (this.booted) { return; }

    const { appId } = get(this, 'config');
    const props = compact(options);

    props.app_id = appId;

    if (canUseDOM && !detectIE()) {
      window.Intercom('boot', props);
      this.booted = true;
    }
  },

  willDestroy() {
    if (canUseDOM) {
      $('script[src*="intercom"]').remove();
      delete window.Intercom;
    }
  }
});
