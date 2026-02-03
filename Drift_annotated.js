class Drift extends Object{
  //the "anchor" elements that trigger the drift element:
  static count = 0; //functionally an id for each anchor, simple integer count is a bit easier to read log messages and remember anchors than crypto.randomUUID()
  static anchor_elems = {}; //elements that trigger the drift_elem, by id
  static active_anchors = []; //ids in orderthey were entered
  static active_check = {}; //maps id to index in active_anchors
  static delayed_leaves = []; //{id, event, event.currenTarget} mouseleave events that delayed deactivation due to entering the drift elem
  static anchor_class = 'Drift_anchor'; //used to mark anchors and identify anchors in html code, will use class since it searches and styles better than dataset attribute
  static check_anchors(){
    let existing_anchors = document.getElementsByClassName(Drift.anchor_class);
    for (let i=0; i<existing_anchors.length; i++){
      Drift.add_anchor(existing_anchors[i]);
    }
  }
  static add_anchor(anchor_elem){
    if (anchor_elem.dataset.fhaid === undefined){
      while (Drift.anchor_elems[Drift.count] !== undefined){
        Drift.count++;
      }
      Drift.anchor_elems[Drift.count] = anchor_elem;
      anchor_elem.dataset.fhaid = Drift.count;
      anchor_elem.classList.add(Drift.anchor_class);
      anchor_elem.addEventListener('mouseenter', Drift.anchor_mouseenter);
      anchor_elem.addEventListener('mouseleave', Drift.anchor_mouseleave);
    }
  }
  static remove_anchor(fhaid_or_elem){
    let anchor_elem = (typeof fhaid_or_elem === "number" ? Drift.anchor_elems[fhaid_or_elem] : fhaid_or_elem);
    anchor_elem.removeEventListener('mouseenter', Drift.anchor_mouseenter);
    anchor_elem.removeEventListener('mouseleave', Drift.anchor_mouseleave);
    delete Drift.anchor_elems[anchor_elem.dataset.fhaid];
  }
  static anchor_mouseenter(evt){
    let id = evt.currentTarget.dataset.fhaid;
    Drift.enter_anchor(id, evt);
    if (Drift.temp_hid){
      if (Drift.temp_hid_cooldown !== null){
        Drift.temp_hid_freeze[id] = true;
      } else if (Drift.temp_hid_freeze[id] === undefined){
        Drift.untemp_hide();
      }
    }
    if (Drift.active_check[id] === undefined){
      /* 
        the active check above is here due to unreliable browser events in addition to ignoring some of the events when leaving drift_elemm into an active anchor, 
        every once in a while mouseenter will get triggered twice without the expected mouseleave event in between
        this helps prevent that from causing issues
      */
      Drift.active_anchors.push(id);
      Drift.active_check[id] = Drift.active_anchors.length-1;
      Drift.activate_anchor(id, evt);
      if (Drift.active_anchors.length === 1){
        Drift.activate_drift_element(id, evt)
      }
    }
  }
  static anchor_mouseleave(evt){
    let id = evt.currentTarget.dataset.fhaid;
    Drift.leave_anchor(id, evt);
    if (evt.relatedTarget === undefined || Drift.drift_elem.contains(evt.relatedTarget) === false){
      //didn't leave into the drift_elem, process mouseleave and do deactivation immediately
      Drift.mouseleave_process(id, evt)
    } else {
      Drift.delayed_leaves.push({
        id: id,
        evt: evt,
        currentTarget: evt.currentTarget
      });
    }
  }
  static mouseleave_process(currentTargetId, anchor_leave_evt, optional_currentTarget, drift_leave_evt){
    //extra args leftover from when both the drift leave and the anchor leave were passed to deactivate_anchor()
    let last_elem = Drift.active_anchors[Drift.active_anchors.length-1];
    if (currentTargetId === last_elem){
      Drift.active_anchors.pop();
      delete Drift.active_check[currentTargetId];
      if (drift_leave_evt !== undefined){
        //note: if you want to use anchor_leave_evt here, need to set anchor_leave_evt.currentTarget = optional_currentTarget since it will have already finished bubbling
        Drift.deactivate_anchor(currentTargetId, drift_leave_evt, false);
        if (Drift.active_anchors.length === 0){
          Drift.deactivate_drift_element(currentTargetId, drift_leave_evt, false);
        }
      } else {
        Drift.deactivate_anchor(currentTargetId, anchor_leave_evt, true);
        if (Drift.active_anchors.length === 0){
          Drift.deactivate_drift_element(currentTargetId, anchor_leave_evt, true);
        }
      }
    }
  }
  static process_delayed_leaves(drift_leave_evt){
    for (let i=0; i<Drift.delayed_leaves.length; i++){
      Drift.mouseleave_process(Drift.delayed_leaves[i].id, Drift.delayed_leaves[i].evt, Drift.delayed_leaves[i].currentTarget, drift_leave_evt);
    }
    Drift.delayed_leaves = [];
  }
  //the drift element:
  static drift_elem = null; //Drift.ready() seems to be too early here, even when script is at bottom of example.html with defer... hmmm
  static drift_elem_innerHTML = '<div id="Drift_contents"></div>';
  static drift_elem_id = "Drift";
  static drift_elem_active = false;
  static ready(){
    //function to call when ready to listen to anchor events
    //checks / creates drift_elem and existing anchors on page
    let drift_elem = document.getElementById(Drift.drift_elem_id);
    if (drift_elem === null){
      drift_elem = Drift.make_div_helper(Drift.drift_elem_innerHTML, [], {
        onmouseenter: Drift.drift_mouseenter,
        onmouseleave: Drift.drift_mouseleave
      });
    } else {
      drift_elem.onmouseenter = Drift.drift_mouseenter;
      drift_elem.onmouseleave = Drift.drift_mouseleave;
    }
    Drift.check_anchors();
    Drift.drift_elem = drift_elem;
    return drift_elem;
  }
  static drift_mouseenter(evt){
    Drift.drift_elem_active = true;
    Drift.enter_drift_element(evt);
  }
  static drift_mouseleave(evt){
    Drift.drift_elem_active = false;
    let exited_to = Drift.bubble_check(evt);
    Drift.leave_drift_element(evt, exited_to.deepest_anchor, exited_to.deepest_new_anchor);
    Drift.process_delayed_leaves(evt);
  }
  static bubble_check(evt){
    //bubbles up from element until it hits an active anchor
    //returns first new anchor it hits and first active anchor it hits
    let deepest_new_anchor = null;
    let deepest_anchor = null;
    if (evt.relatedTarget){
      let start = evt.relatedTarget;
      while(start){
        if (start.dataset.fhaid !== undefined){
          if (Drift.active_check[start.dataset.fhaid] !== undefined){
            let ind_in_delayed = Drift.delayed_leaves.length - 1 - Drift.active_check[start.dataset.fhaid];
            for (let i=Drift.delayed_leaves.length-1; i>ind_in_delayed-1; i--){
              Drift.delayed_leaves.pop();
            }
            deepest_anchor = start.dataset.fhaid;
            break;
          } else {
            deepest_new_anchor = start.dataset.fhaid
          }
        }
        start = start.parentElement;
      }
    }
    return {
      deepest_new_anchor: deepest_new_anchor,
      deepest_anchor: deepest_anchor
    };
  }
  /* hide states
    temp_hid: hidden temporarily until a new anchor is entered after a brief cooldown period - any anchors entered during cooldown will not trigger unhiding until temp_hid is disabled
    perma_hid: permanently hidden
  */
  static perma_hid = false;
  static temp_hid = false;
  static temp_hid_freeze = {}; //list of anchors that entering will not trigger unhide
  static temp_hid_cooldown = null; //setTimeout for cooldown
  static temp_hid_cooldown_length_ms = 1500; //length of cooldown in ms
  static on_perma_hide_change(perma_hidden){
    if (perma_hidden === true){
      Drift.drift_elem.classList.add('perma_hide');
    } else {
      Drift.drift_elem.classList.remove('perma_hide');
    }
  }
  static on_temp_hide_change(temp_hidden){
    if (temp_hidden === true){
      Drift.drift_elem.classList.add('temp_hide');
    } else {
      Drift.drift_elem.classList.remove('temp_hide');
    }
  }
  static toggle_perma_hide(){
    Drift.perma_hid === true ? Drift.unperma_hide() : Drift.perma_hide();
  }
  static perma_hide(){
    Drift.perma_hid = true;
    Drift.on_perma_hide_change(Drift.perma_hid);
  }
  static unperma_hide(){
    Drift.untemp_hide();
    Drift.perma_hid = false;
    Drift.on_perma_hide_change(Drift.perma_hid);
  }
  static toggle_temp_hide(){
    //only do anything if there are active anchors
    if (this.active_anchors.length !== 0){
      Drift.temp_hid === true ? Drift.untemp_hide() : Drift.temp_hide();
    }
  }
  static temp_hide(){
    Drift.temp_hid_freeze = {};
    for (let i=0; i<this.active_anchors.length; i++){
      Drift.temp_hid_freeze[Drift.active_anchors[i]] = true;
    }
    Drift.temp_hid_cooldown = setTimeout(()=>{
      Drift.temp_hid_cooldown = null;
    }, Drift.temp_hid_cooldown_length_ms); 
    Drift.temp_hid = true;
    Drift.on_temp_hide_change(Drift.temp_hid);
  }
  static untemp_hide(){
    Drift.temp_hid = false;
    Drift.on_temp_hide_change(Drift.temp_hid);
  }
  /* helper function */
  static make_div_helper(innerHTML = undefined, classes_arr = [], attr_strs_dict = {}, add_fn = function(a){document.body.appendChild(a)}){
    /* 
      just a helper to make div element 
      "attr_strs_dict_dict" is dict of attributes to set, such as
      {
        "id": "new_div_id",
        "dataset.data_attribute": "dataset_attribute_value",
        "onclick": function(){...}
      }
      "add_fn" is the function that adds new_div to DOM
    */
    let new_div = document.createElement('div');
    innerHTML !== undefined && (new_div.innerHTML = innerHTML);
    for (let i=0; i<classes_arr.length; i++){
      new_div.classList.add(classes_arr[i]);
    }
    function loop_down_set(thing, split, set, current_place){
      if (current_place === split.length-1){
        thing[split[current_place]] = set;
      } else {
        loop_down_set(thing[split[current_place]], split, current_place+1);
      }
    }
    for (let attr in attr_strs_dict){
      loop_down_set(new_div, attr.split("."), attr_strs_dict[attr], 0);
    }
    add_fn(new_div);
    return new_div;
  }
  //events:
  static enter_anchor(id, event){
    //function called when mouse enters anchor
    //id is the id of the anchor that was entered
    //event is the mouseenter event
    //console.log("enter: "+id);
  }
  static leave_anchor(id, event){
    //function called when mouse leaves anchor
    //id is the id of the anchor that was left
    //event is the mouseleave event
    //console.log("leave: "+id);
  }
  static activate_anchor(id, event){
    //function called when anchor is activated (mouse into inactive anchor)
    //id is the id of the anchor that was activated
    //event is the mouseenter event that activated the anchor
    //console.log("activate: "+id);
  }
  static deactivate_anchor(id, event, out_of_anchor){
    //function called when anchor is deactivated (mouse out of anchor into an element that is not the drift element, or out of the drift element and into an element that is not within this anchor)
    //id is the id of the anchor that was deactivated
    //event is the mouseleave event from leaving the anchor, or the mouseleave event from leaving the drift elem
    //out_of_anchor is whether this was from leaving an anchor (true) or the drift element (false)
    //console.log("deactivate: "+id);
  }
  static enter_drift_element(event){
    //function called when mouse enters drift element
    //console.log("enter: drift")
  }
  static leave_drift_element(event, left_to_active_id, left_to_inactive_id){
    //function called when mouse leaves drift element
    //event is the mouseleave event
    //the mouse may have left the drift element into an anchor, in that case:
      //left_to_active_id is the id of the deepest active anchor that the mouse entered when leaving the drift element, or null if the element the mouse entered is not within any active anchors
      //left_to_inactive_id is the id of the deepest inactive anchor that the mouse entered when leaving the drift element, or null if the element the mouse entered is not within any inactive anchors
    //console.log("leave: drift")
  }
  static activate_drift_element(id, event){
    //function called when first active anchor is put in active_anchors
    //id is the id of the anchor that was activated that caused the drift element to be activated
    //event is mouseenter event that activated the anchor
    //console.log("activate: drift")
  }
  static deactivate_drift_element(id, event, out_of_anchor){
    //function called when there are no more active_anchors
    //id is the id of the anchor that was deactivated that caused the drift element to be deactivated
    //event is the mouseleave event from leaving the anchor, or the mouseleave event from leaving the drift elem that deactivated that anchor
    //out_of_anchor is whether that anchor deactivation was from leaving an anchor (true) or the drift element (false)
    //console.log("deactivate: drift")
  }
}