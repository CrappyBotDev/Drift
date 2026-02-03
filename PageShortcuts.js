class PageShortcuts extends Object{
  /*
    why use this rather than chrome.commands in extensions?
    I think  found issues with chrome.commands?  wasn't working properly?
      the documentation and examples look like they might've been updated since I last looked, so I guess maybe they were still working on chrome.commands when I last tried it?
    or maybe I didn't like restrictions on what keys you use or length of shortcuts
    anyway, this works for when you just need shortcuts for a specific page, rather than the full browser
    I'm sure there are other implementations out there that smooth out keyboard differences between mac / windows and such
  */
  static pressed_keys = {}; //a more thorough version would actually check to see what's pressed rather than assume none
  static shortcuts = {};
  static add_shortcuts(shortcuts_dict){
    for (let shortcut_str in shortcuts_dict){
      PageShortcuts.shortcuts[shortcut_str] = new Shortcut(shortcut_str, shortcuts_dict[shortcut_str], PageShortcuts.pressed_keys);
    }
  }
  static remove_shortcuts(shortcuts_dict){
    for (let shortcut_str in shortcuts_dict){
      delete PageShortcuts.shortcuts[shortcut_str];
    }
  }
  static listen(){
    document.addEventListener('keydown', PageShortcuts.on_keydown);
    document.addEventListener('keyup', PageShortcuts.on_keyup);
  }
  static stop_listening(){
    document.removeEventListener('keydown', PageShortcuts.on_keydown);
    document.removeEventListener('keyup', PageShortcuts.on_keyup);
  }
  static on_keydown(event){
    let key = event.key
    if (PageShortcuts.pressed_keys[key] === undefined){
      PageShortcuts.pressed_keys[key] = true;
      for (let shortcut in PageShortcuts.shortcuts){
        PageShortcuts.shortcuts[shortcut].press_key(key);
      }
    }
  }
  static on_keyup(event){
    let key = event.key
    delete PageShortcuts.pressed_keys[key];
    for (let shortcut in PageShortcuts.shortcuts){
      PageShortcuts.shortcuts[shortcut].unpress_key(key);
    }
  }
}

class Shortcut extends Object{
  unpressed_keys = {};
  keys = {};
  fn = null;
  constructor(shortcut_str, shortcut_fn, currently_pressed = {}){
    super();
    let shortcut_arr = shortcut_str.split("+");
    this.fn = shortcut_fn;
    for (let i=0; i<shortcut_arr.length; i++){
      let key = shortcut_arr[i];
      this.keys[key] = true;
      if (currently_pressed[key] === undefined){
        this.unpressed_keys[key] = true;
      }
    }
  }
  press_key(key){
    if (this.keys[key] === true){
      delete this.unpressed_keys[key];
      if (Object.keys(this.unpressed_keys).length === 0){
        this.fn();
      }
    }
  }
  unpress_key(key){
    if (this.keys[key] === true){
      this.unpressed_keys[key] = true;
    }
  }
}
