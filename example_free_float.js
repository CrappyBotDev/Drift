/*
  setup that makes drift_elem usable without requiring drift_elem overlapping anchor elements
  this example will position drift_elem off to the side of anchors, resulting in it not having overlap with the most recently activated anchor
  also delays modifying drift_elem so that it can be interacted with without having it disappear / its contents change due to Drift anchor deactivation when navigating out of the anchor on the way to the drift_elem

  some things to note about events and ordering
  "leave/enter" events are mouse events - these are fired by browser when entering / exiting elements
  "activate/deactive" are Drift events - these are determined by Drift logic, essentially:
    anchors activate when moused over and deactivate when the mouse leaves them to an element that isn't the drift_elem, or leaves the drift_elem to an element outside of the anchor
      check whether an anchor is activated with 
        Drift.active_check[anchor_id] !== undefined
    drift_elem activates when there are no active anchors and an anchor is activated, drift_elem deactivates when there is one active anchor and that last active anchor is deactivated
      check whether its currently activated with 
        Drift.drift_elem_active === true

  enter/leave anchor are done first on entering / leaving an anchor
  enter/leave drift are done first on entering / leaving drift
  activate/deactivate anchor is done prior to activating/deactivating drift elem
    
  ordering examples:
    enter anchor, exit without entering drift elem:
      anchor enter
      anchor activated
      drift_elem_activated      
      anchor leave
      anchor deactivated
      drift_elem deactivated

    enter anchor 1, enter anchor 2 (within anchor 1), enter drift and exit to a anchor 3 (new anchor outside anchor 2 but still within anchor 1):
      [mouse into anchor 1]
        anchor 1 enter
        anchor 1 activated
        drift_elem activated
      [mouse from anchor 1 into anchor 2]
        anchor 2 enter
        anchor 2 activated
      [mouse into drift elem from anchor 2]
        anchor 2 leave
        anchor 1 leave
        drift_elem enter
      [mouse into anchor 3 from drift elem]
        drift_elem leave
        anchor 2 deactivate
        anchor 1 enter
        anchor 3 enter
        anchor 3 activated

  for event functions and arguments, see bottom of "Drift" class in "Drift.js" file
*/

let shown_anchors = {};
let timeouts = {};
let delay = 3000;
let inactives_container = document.getElementById('hide_inactive');
let content_container = document.getElementById('Drift_contents');

function timeout_fn(id){
  return function(){
    //remove the shown anchor from the drift_elem, hide the drift_elem if there are no more shown_anchors
    inactives_container.appendChild(shown_anchors[id].content_elem);
    delete shown_anchors[id];
    delete timeouts[id];
    if (Object.keys(shown_anchors).length === 0){
      Drift.drift_elem.classList.remove("Drift_active"); //remove "Drift_active" to make menu disappear once all shown_anchors are removed from drift_elem
    }
  }
}

Drift.activate_anchor = function(id, event){
  //make it a shown anchor, if this anchor was recently deactivated, clear the timeout that would've removed it from shown_anchors
  let associated_id = Drift.anchor_elems[id].id+"_hover";
  let associated = document.getElementById(associated_id);
  if (associated !== null){
    shown_anchors[id] = {
      content_elem: associated
    }
    if (timeouts[id] !== undefined){
      clearTimeout(timeouts[id]);
      delete timeouts[id];
    }
    content_container.prepend(associated);
    if (Drift.active_anchors.length !== 1){
      position_right_or_left(event);
    }
  }
}
Drift.deactivate_anchor = function(id, event, out_of_anchor){
  //set timeout to remove from shown_anchors
  timeouts[id] = setTimeout(timeout_fn(id), delay);
  //make sure the most recent active anchor is shown at top
  if (Drift.active_anchors.length !== 0){
    content_container.prepend(shown_anchors[Drift.active_anchors[Drift.active_anchors.length-1]].content_elem);
    position_right_or_left(event);
  }
}
Drift.enter_drift_element = function(event){
  //suspend timeouts that would remove shown_anchors while interacting with drift_elem
  for (let deactivated_id in timeouts){
    clearTimeout(timeouts[deactivated_id]);
    timeouts[deactivated_id] = "suspended";
  }
}
Drift.leave_drift_element = function(event, left_to_active_id, left_to_inactive_id){
  //reset the suspended timeouts
  for (let deactivated_id in timeouts){
    timeouts[deactivated_id] = setTimeout(timeout_fn(deactivated_id), delay);
  }
  if (left_to_active_id !== null && (left_to_active_id !== Drift.active_anchors[Drift.active_anchors.length-1]) && left_to_inactive_id === null){
    position_right_or_left(event);
  }
}
Drift.activate_drift_element = function(id, event){
  Drift.drift_elem.classList.add("Drift_active");
  position_right_or_left(event);
}

function position_right_or_left(evt, distance = 20){
  /*
    position aligned with top of anchor, and 20 px off to the right of it (or left if right would cause offscreen)
  */
  // bounding rectangle for anchor element:
  let bounding_rect = evt.currentTarget.getBoundingClientRect();
  let targetClientLeft = bounding_rect.left;
  let targetClientTop = bounding_rect.top;
  let targetClientBottom = targetClientTop + evt.currentTarget.clientHeight;
  let targetClientRight = targetClientLeft + evt.currentTarget.clientWidth;
  // and add borders to it
  let computedStyle = window.getComputedStyle(evt.currentTarget);
  let borderLeftWidth = parseFloat(computedStyle.borderLeftWidth);
  let borderRightWidth = parseFloat(computedStyle.borderRightWidth);
  let borderTopWidth = parseFloat(computedStyle.borderTopWidth);
  let borderBottomWidth = parseFloat(computedStyle.borderBottomWidth);
  let trueLeft = targetClientLeft - borderLeftWidth;
  let trueRight = targetClientRight + borderRightWidth;
  let trueTop = targetClientTop - borderTopWidth;
  let trueBottom = targetClientBottom + borderBottomWidth;
  // now get the drift_elem width, height
  let elem_width = Drift.drift_elem.offsetWidth;
  let elem_height = Drift.drift_elem.offsetHeight;

  // start at top right corner of anchor, <distance> px right
  let initial_top = trueTop;
  let initial_left = trueRight + distance;

  //if right side of drift element is offscreen, swap it to the left side
  if (initial_left + elem_width > window.innerWidth){
    initial_left = trueLeft - distance - elem_width;
  }
  Drift.drift_elem.style.top = initial_top + window.scrollY + "px";
  Drift.drift_elem.style.left = initial_left + window.scrollX + "px";
}

//set up shortcuts for hide / permahide
let Drift_shortcuts = {
  //dict, keys: function to do when shortcut pressed
  "x": function(){
    Drift.toggle_temp_hide();
  },
  "x+z": function(){
    Drift.toggle_perma_hide();
  }
}
PageShortcuts.add_shortcuts(Drift_shortcuts);
PageShortcuts.listen();

Drift.ready();