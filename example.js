let inactives_container = document.getElementById('hide_inactive');
let content_container = document.getElementById('Drift_contents');

Drift.activate_anchor = function(id, event){
  //add associated anchor content to the drift_elem
  let associated_id = Drift.anchor_elems[id].id+"_hover";
  let associated = document.getElementById(associated_id);
  if (associated !== null){
      content_container.prepend(associated);
  }
  if (Drift.active_anchors.length !== 1){
    //position only if not first, first will be positioned by activate_drift_element
    position_drift_element(event);
  }
}
Drift.deactivate_anchor = function(id, event, out_of_anchor){
  //remove associated anchor content from the drift_elem
  let associated_id = Drift.anchor_elems[id].id+"_hover";
  let associated = document.getElementById(associated_id);
  if (associated !== null){
    inactives_container.appendChild(associated);
  }
  if (Drift.active_anchors.length !== 0){
    //still have active anchors, position wherever this event was
    position_drift_element(event);
  }
}
Drift.activate_drift_element = function(id, event){
  //activate and position drift_elem
  Drift.drift_elem.classList.add("Drift_active");
  position_drift_element(event);
}
Drift.deactivate_drift_element = function(id, event, out_of_anchor){
  //deactivate
  Drift.drift_elem.classList.remove("Drift_active");
}
Drift.leave_drift_element = function(event, left_to_active_id, left_to_inactive_id){
  if (left_to_active_id !== null && (left_to_active_id !== Drift.active_anchors[Drift.active_anchors.length-1]) && left_to_inactive_id === null){
    //left drift to an active element that was not the latest, reposition
    position_drift_element(event);
  }
}

function position_drift_element(evt, horizontal_overlap = 20, vertical_overlap = 5, margin = 5){
  /*
    this is set up to position near cursor event,
    with a certain amount of overlap of the anchor that triggered the event
    and corrections for the drift_elem being offscreen

    arguments:
      horizontal_overlap (number of pixels) - minimum amount of overlap in x direction between anchor and drift_elem (prior to offscreen adjustment)
      vertical_overlap (number of pixels) - minimum amount of overlap in y direction between anchor and drift_elem (prior to offscreen adjustment)
      margin (number of pixels) - buffer space around edges of screen when making sure the drift_elem is not offscreen

    this is a lot of variables, but i prefer the explicitness since I don't have a great memory for all the different width, height, position attributes
  
    note: overlap code expects drift element to have width >= overlap size, otherwise calculations aren't quite right
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
  // start at position of event (for top left corner of drift_elem)
  let initial_top = evt.clientY;
  let initial_left = evt.clientX;
  // Perimeter Adjustment: 
  // use midpoints to determine which corner of the drift_elem to position near the event
  // this keeps the drift element around the perimeter of the anchor so that it isn't blocking a big chunk of it
  let horizontal_mid = (trueRight+trueLeft) / 2;
  let vertical_mid = (trueBottom+trueTop) / 2;
  if (initial_left < horizontal_mid){
    initial_left = initial_left - elem_width;
  }
  if (initial_top < vertical_mid){
    initial_top = initial_top - elem_height;
  }
  // coordinates of drift_elem
  let elem_left = initial_left;
  let elem_right = initial_left + elem_width;
  let elem_top = initial_top;
  let elem_bottom = initial_top + elem_height;
  //Overlap: adjust position so that there's at least the specified amount of overlap in the horizontal / vertical direction
  function is_overlapping(int1, int2){
    return Math.max(int1[0],int2[0]) <= Math.min(int1[1],int2[1])
  }
  function get_overlap_length(int1, int2){
    return Math.min(int1[1],int2[1]) - Math.max(int1[0],int2[0]);
  }
  //horizontal:
  if (!is_overlapping([elem_left, elem_right],[trueLeft, trueRight])){
    if (elem_left > trueRight){
      //move it left
      let diff = elem_left - trueRight;
      initial_left = initial_left - (diff + horizontal_overlap); 
    } else {
      //move it right
      let diff = trueLeft - elem_right;
      initial_left = initial_left + (diff + horizontal_overlap); 
    }
  } else {
    let overlap_length = get_overlap_length([elem_left, elem_right],[trueLeft, trueRight]);
    if (overlap_length < horizontal_overlap){
      //do some adjustment
      if (elem_right > trueRight){
        initial_left = initial_left - (horizontal_overlap - overlap_length);
      } else {
        initial_left = initial_left + (horizontal_overlap - overlap_length);
      }
    }
  }
  //vertical:
  if (!is_overlapping([elem_top, elem_bottom],[trueTop, trueBottom])){
    if (elem_top > trueBottom){
      //move it up
      let diff = elem_top - trueBottom;
      initial_top = initial_top - (diff + vertical_overlap); 
    } else {
      //move it down
      let diff = trueTop - elem_bottom;
      initial_top = initial_top + (diff + vertical_overlap); 
    }
  } else {
    let overlap_length = get_overlap_length([elem_top, elem_bottom],[trueTop, trueBottom]);
    if (overlap_length < vertical_overlap){
      //do some adjustment
      if (elem_bottom > trueBottom){
        initial_top = initial_top - (vertical_overlap - overlap_length);
      } else {
        initial_top = initial_top + (vertical_overlap - overlap_length);
      }
    }
  }
  // update rectangle bounds:
  elem_left = initial_left;
  elem_right = elem_left + elem_width;
  elem_top = initial_top;
  elem_bottom = elem_top + elem_height; 
  // Now check if drift_elem is entirely within the window (with specified margin)
  if (elem_right > (window.innerWidth - margin)){
    let diff = elem_right - window.innerWidth;
    initial_left = initial_left - (diff + margin);
  }
  if (elem_bottom > (window.innerHeight - margin)){
    let diff = elem_bottom - window.innerHeight;
    initial_top = initial_top - (diff + margin);
  }
  // update elem bounds;
  elem_left = initial_left;
  elem_right = elem_left + elem_width;
  elem_top = initial_top;
  elem_bottom = elem_top + elem_height; 
  //and check top and bottom:
  if (elem_left < margin){
    let diff = 0 - elem_left;
    initial_left = initial_left + (diff + margin);
  }
  if (elem_top < margin){
    let diff = 0 - elem_top;
    initial_top = initial_top + (diff + margin);
  }
  //set position, adjust for scroll
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