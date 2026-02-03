# Drift
javascript code for designating "anchor" elements (not to be confused with anchor tags / links) that trigger events on mouseenter / mouseleave (emulating hover) and a floating element to go with them

# How it Works:
there are anchor elements (`Drift.anchor_elems` - which trigger events on mouseenter / mouseleave), and the drift element (`Drift.drift_elem` - which also triggers events on mouseenter / mouseleave)
Events:
- `enter_anchor` / `leave_anchor` - when mouse goes in or out of an anchor element
- `activate_anchor` / `deactivate_anchor` - when an anchor is activated / deactivated (activation happens when mouse enters an inactive anchor, deactivation happens when the mouse exits that anchor into an element that is not the drift element, or when the mouse exits the drift element into an element that is not that anchor)
- `enter_drift_element` / `leave_drift_element` - when mouse goes in or out of the drift element
- `activate_drift_element` / `deactivate_drift_element` - the drift element is activated when there are no active anchors and an ancor is activated and is deactivated when the last active anchor is deactivated

Set up your anchors / drift element either in html (add whatever class you set in `Drift.anchor_class`, id in `Drift.drift_elem_id` to relevant elements) or js (drift_elem will be created automatically based on `Drift.drift_elem_innerHTML`, add anchors with `Drift.add_anchor(anchor_elem)`), then write some `Drift.<event_name>()` functions for logic, and call `Drift.ready()`.  See "Drift_annotated.js" and the examples "example.js" / "example_free_float.js"


# Examples
Examples are provided in the form of a Chrome extensions. To load it:

    open the Chrome browser
    go to the extensions page
    enable "Developer Mode" (top right corner)
    click "Load Unpacked"
    and select the "Drift" folder.

Once loaded, click the extension icon to open the example page.  The "example.html" page is set up with a drift element that is positioned over the latest active anchor and displays information about what anchors are active.  There's a link to a second example, "example_free_float.html", on the page, that example is set up in a way that doesn't require the drift element to be over an anchor to be usable (which it does by decoupling changes to the drift_element from anchor deactivation by simply setting some delays).

# What is this good for?
Could be useful for more stylish or complicated explainer text than html's alternative text attribute.  Or building an interface to add additional interaction to a webpage.

# To Do
- rename "anchor" elements to something less likely to be confused with \<a> tag?
- Test / look more into hardcoding html stuff, attaching anchor-specific event functions
- Or maybe look into removing reliance on dataset.fhaid, Drift.drift_elem_id, Drift.anchor_class for identifying anchors and the drift element - would require passing relevant elements to Drift, so that's kind of at odds with hardcoding stuff in html