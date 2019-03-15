/**
 * (C) Copyright 2018 Andrew Kroshko
 * (C) Copyright 2013 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("http-request-hook");
require("debug");

var buffer_policies = {};

function user_agent_buffer_policy (name, user_agent, patterns) {
    this.name = name;
    this.user_agent = user_agent;
    this.byhost = {};
    this.byregexp = [];
    for (var i = 0, n = patterns.length; i < n; ++i) {
        var p = patterns[i];
        if (p instanceof RegExp)
            this.byregexp.push(p);
        else
            this.byhost[p] = true;
    }
}
user_agent_buffer_policy.prototype = {
    constructor: user_agent_buffer_policy,
    name: null,
    user_agent: null,
    byhost: null,
    byregexp: null
};

function define_buffer_policy (name, user_agent) {
    var patterns = Array.prototype.slice.call(arguments, 2);
    var o = new user_agent_buffer_policy(name, user_agent, patterns);
    buffer_policies[o.name] = o;
    return o;
}

function http_request_hook_buffer_function (channel) {
    var uri = channel.URI;
    var spec = uri.spec;
    var location = null;
    try {
        // https://developer.mozilla.org/en-US/docs/Archive/Add-ons/Tabbed_browser#Getting_the_tab_that_fires_the_http-on-modify-request_notification
        var notificationCallbacks = channel.notificationCallbacks ? channel.notificationCallbacks : channel.loadGroup.notificationCallbacks;
        location = notificationCallbacks.getInterface(Ci.nsIDOMWindow).location;
    } catch (e) {
        return null;
    }
    try {
        var host = uri.host;
    } catch (e) {}
    outer: for each (let p in buffer_policies) {
        if (host && p.byhost[host]) {
            var user_agent = p.user_agent;
            break;
        }
        for (var i = 0, r; r = p.byregexp[i]; ++i) {
            if (r.test(spec)) {
                user_agent = p.user_agent;
                break outer;
            } else if (location && (r.test(location))) {
                user_agent = p.user_agent;
                break outer;
            }
        }
    }
    if (user_agent != null) { // allow empty-string ua
        channel.setRequestHeader("User-Agent", user_agent, false);
    }
}
add_hook("http_request_hook", http_request_hook_buffer_function);

provide("user-agent-buffer-policy");
