/**
 * (C) Copyright 2008 Nicholas Zigarovich
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_variable("clicks_in_new_buffer_button", 1,
                "Which mouse button should open links in a new buffer. " +
                "0 = left, 1 = middle, 2 = right. Default is 1.");

define_variable("clicks_in_new_buffer_target", OPEN_NEW_BUFFER,
                "How to open links in a new buffer, in the foreground or " +
                "the background. Set to one the constants OPEN_NEW_BUFFER " +
                "or OPEN_NEW_BUFFER_BACKGROUND. Default is OPEN_NEW_BUFFER.");

// Should mouse click event propagation be stopped?
var clicks_in_new_buffer_ev_stop_prop = true;

function find_tag_in_parents (tag, element) {
    // FIXME If tag names will always be upper-case, toLowerCase() can
    //       be eliminated. Also not sure that p will ever be null.
    tag = tag.toLowerCase();
    for (let p = element.parentNode;
         p != null && p.tagName.toLowerCase() != "html";
         p = p.parentNode)
    {
        if (p.tagName.toLowerCase() == tag)
            return p;
    }
    return null;
}

define_variable("ctrl_new_buffer",
    false,
    "Does holding control key along with mouse click open up new buffer.");

define_variable("alt_new_buffer",
    false,
    "Does holding alt key along with mouse click open up new buffer.");

define_variable("shift_new_buffer",
    false,
    "Does holding shift key along with mouse click open up new buffer.");

define_variable("ctrl_new_profile",
    false,
    "Does holding control key along with mouse click open up new profile.");

define_variable("alt_new_profile",
    false,
    "Does holding alt key along with mouse click open up new profile.");

define_variable("shift_new_profile",
    false,
    "Does holding shift key along with mouse click open up new profile.");

define_variable("new_profile_name",
    "default2",
    "The new profile to open the clicked link into.");

define_variable("new_profile_command",
    "conkeror -P default2",
    "The new profile to open the clicked link into.");

define_variable("ctrl_new_app",
    false,
    "Does holding control key along with mouse click open up new app.");

define_variable("alt_new_app",
    false,
    "Does holding alt key along with mouse click open up new app.");

define_variable("shift_new_app",
    false,
    "Does holding shift key along with mouse click open up new app.");

define_variable("new_app_command",
    "chromium",
    "The new app to open the clicked link into.");

function open_link_in_new_buffer (event) {
    // reset handler for each new command
    g_open_document_for_current_command = false;
    var new_buffer=false;
    var new_profile=false;
    var new_app=false;
    if (event.button == clicks_in_new_buffer_button || (event.ctrlKey && ctrl_new_buffer) || (event.altKey && alt_new_buffer) || (event.shiftKey && shift_new_buffer)) {
        new_buffer = true;
    } else if (event.button == clicks_in_new_buffer_button || (event.ctrlKey && ctrl_new_profile) || (event.altKey && alt_new_profile) || (event.shiftKey && shift_new_profile)) {
        new_profile=true;
    } else if (event.button == clicks_in_new_buffer_button || (event.ctrlKey && ctrl_new_app) || (event.altKey && alt_new_app) || (event.shiftKey && shift_new_app)) {
        new_app=true;
    } else {
        return;
    }

    let element = event.target;
    let anchor = null;
    if (element instanceof Ci.nsIDOMHTMLAnchorElement ||
        element instanceof Ci.nsIDOMHTMLAreaElement) {
        anchor = element;
    } else
        anchor = find_tag_in_parents("a", element);
    if (anchor == null)
        return;
    event.preventDefault();
    if (clicks_in_new_buffer_ev_stop_prop) {
        event.stopPropagation();
    }
    let spec = load_spec(anchor);
    let window = this.ownerDocument.defaultView;
    let buffer = window.buffers.current;
    let mime_type=mime_type_from_uri(load_spec_uri(spec));
    // TODO: use new profile for this?
    if (mime_type == "application/djvu" || mime_type == "application/epub+zip" || mime_type == "application/pdf") {
        g_open_document_for_current_command = true;
        buffer.load(spec);
        return;
    } else {
        if (new_profile == true) {
            var url=spec.uri;
            var cmd_str=new_profile_command + " " + url;
            dumpln("i: " + cmd_str);
            shell_command_blind(cmd_str);
        } else if (new_app == true) {
            var url=spec.uri;
            var cmd_str=new_app_command + " " + url;
            dumpln("i: " + cmd_str);
            shell_command_blind(cmd_str);
        } else {
            create_buffer(window,
                          buffer_creator(content_buffer,
                                         $opener = buffer,
                                         $load = spec),
                          clicks_in_new_buffer_target);
        }
    }
}

function clicks_in_new_buffer_add_listener (buffer) {
    buffer.browser.addEventListener("click",
                                    open_link_in_new_buffer,
                                    true);
}

function clicks_in_new_buffer_remove_listener (buffer) {
    buffer.browser.removeEventListener("click",
                                       open_link_in_new_buffer,
                                       true);
}

function clicks_in_new_buffer_mode_enable () {
    add_hook("create_buffer_hook",
             clicks_in_new_buffer_add_listener);
    for_each_buffer(clicks_in_new_buffer_add_listener);
}

function clicks_in_new_buffer_mode_disable () {
    remove_hook("create_buffer_hook",
                clicks_in_new_buffer_add_listener);
    for_each_buffer(clicks_in_new_buffer_remove_listener);
}

define_global_mode("clicks_in_new_buffer_mode",
                   clicks_in_new_buffer_mode_enable,
                   clicks_in_new_buffer_mode_disable);

clicks_in_new_buffer_mode(true);

provide("clicks-in-new-buffer");
