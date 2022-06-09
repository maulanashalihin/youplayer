function noop() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return /* @__PURE__ */ Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function append(target, node) {
  target.appendChild(node);
}
function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}
function detach(node) {
  node.parentNode.removeChild(node);
}
function element(name) {
  return document.createElement(name);
}
function text(data) {
  return document.createTextNode(data);
}
function space() {
  return text(" ");
}
function listen(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
  if (value == null)
    node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value)
    node.setAttribute(attribute, value);
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function set_style(node, key, value, important) {
  if (value === null) {
    node.style.removeProperty(key);
  } else {
    node.style.setProperty(key, value, important ? "important" : "");
  }
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
const seen_callbacks = /* @__PURE__ */ new Set();
let flushidx = 0;
function flush() {
  const saved_component = current_component;
  do {
    while (flushidx < dirty_components.length) {
      const component = dirty_components[flushidx];
      flushidx++;
      set_current_component(component);
      update(component.$$);
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
const outroing = /* @__PURE__ */ new Set();
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
function mount_component(component, target, anchor, customElement) {
  const { fragment, on_mount, on_destroy, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  if (!customElement) {
    add_render_callback(() => {
      const new_on_destroy = on_mount.map(run).filter(is_function);
      if (on_destroy) {
        on_destroy.push(...new_on_destroy);
      } else {
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
  }
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function init(component, options, instance2, create_fragment2, not_equal, props, append_styles, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: null,
    props,
    update: noop,
    not_equal,
    bound: blank_object(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles && append_styles($$.root);
  let ready = false;
  $$.ctx = instance2 ? instance2(component, options.props || {}, (i, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
      if (!$$.skip_bound && $$.bound[i])
        $$.bound[i](value);
      if (ready)
        make_dirty(component, i);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment2 ? create_fragment2($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro)
      transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor, options.customElement);
    flush();
  }
  set_current_component(parent_component);
}
class SvelteComponent {
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop;
  }
  $on(type, callback) {
    const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks.push(callback);
    return () => {
      const index2 = callbacks.indexOf(callback);
      if (index2 !== -1)
        callbacks.splice(index2, 1);
    };
  }
  $set($$props) {
    if (this.$$set && !is_empty($$props)) {
      this.$$.skip_bound = true;
      this.$$set($$props);
      this.$$.skip_bound = false;
    }
  }
}
function isMobileOrTable() {
  let check = false;
  (function(a) {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
      check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}
function create_if_block_2(ctx) {
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
      attr(button, "class", "text-white");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(button, "click", ctx[0]);
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching)
        detach(button);
      mounted = false;
      dispose();
    }
  };
}
function create_if_block(ctx) {
  let div6;
  let div5;
  let t0;
  let div3;
  let div0;
  let t1;
  let div1;
  let t2;
  let div2;
  let t3;
  let div4;
  let button;
  let mounted;
  let dispose;
  function select_block_type(ctx2, dirty) {
    if (ctx2[2])
      return create_if_block_1;
    return create_else_block;
  }
  let current_block_type = select_block_type(ctx);
  let if_block = current_block_type(ctx);
  return {
    c() {
      div6 = element("div");
      div5 = element("div");
      if_block.c();
      t0 = space();
      div3 = element("div");
      div0 = element("div");
      t1 = space();
      div1 = element("div");
      t2 = space();
      div2 = element("div");
      t3 = space();
      div4 = element("div");
      button = element("button");
      button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>`;
      attr(div0, "class", "bg-gray-200 absolute h-2 rounded-full opacity-25 w-full");
      attr(div1, "class", "bg-blue-600 absolute h-2 rounded-full ");
      set_style(div1, "width", ctx[6] + "%");
      attr(div2, "class", "w-full absolute h-2");
      attr(div3, "class", "w-full cursor-pointer rounded-full h-2 mt-2 relative");
      attr(button, "class", "text-white");
      attr(div5, "class", "flex p-3 gap-2");
      attr(div6, "class", "absolute w-full bottom-0 left-0 z-20");
    },
    m(target, anchor) {
      insert(target, div6, anchor);
      append(div6, div5);
      if_block.m(div5, null);
      append(div5, t0);
      append(div5, div3);
      append(div3, div0);
      append(div3, t1);
      append(div3, div1);
      append(div3, t2);
      append(div3, div2);
      append(div5, t3);
      append(div5, div4);
      append(div4, button);
      if (!mounted) {
        dispose = [
          listen(div2, "click", ctx[10]),
          listen(button, "click", ctx[11])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type(ctx2)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(div5, t0);
        }
      }
      if (dirty & 64) {
        set_style(div1, "width", ctx2[6] + "%");
      }
    },
    d(detaching) {
      if (detaching)
        detach(div6);
      if_block.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_else_block(ctx) {
  let div;
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      button = element("button");
      button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
      attr(button, "class", "text-white");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, button);
      if (!mounted) {
        dispose = listen(button, "click", ctx[9]);
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching)
        detach(div);
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_1(ctx) {
  let div;
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      button = element("button");
      button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
      attr(button, "class", "text-white");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, button);
      if (!mounted) {
        dispose = listen(button, "click", ctx[0]);
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching)
        detach(div);
      mounted = false;
      dispose();
    }
  };
}
function create_fragment(ctx) {
  let div4;
  let div3;
  let div0;
  let t0;
  let div2;
  let div1;
  let div1_style_value;
  let t1;
  let div2_style_value;
  let div3_style_value;
  let mounted;
  let dispose;
  let if_block0 = ctx[2] && create_if_block_2(ctx);
  let if_block1 = ctx[4] && create_if_block(ctx);
  return {
    c() {
      div4 = element("div");
      div3 = element("div");
      div0 = element("div");
      t0 = space();
      div2 = element("div");
      div1 = element("div");
      if (if_block0)
        if_block0.c();
      t1 = space();
      if (if_block1)
        if_block1.c();
      attr(div0, "class", "absolute ");
      attr(div0, "id", ctx[8]);
      attr(div1, "class", "flex justify-center ");
      attr(div1, "style", div1_style_value = "height: " + Math.floor(ctx[1]) + "px;" + (ctx[2] && ctx[3] ? "background: linear-gradient(black, rgba(0,0,0,0),rgba(0,0,0,0),rgba(0,0,0,0),rgba(0,0,0,0), black, black)" : "") + ";");
      attr(div2, "class", "absolute z-10 ");
      attr(div2, "style", div2_style_value = "width : " + ctx[5] + "px; height : " + ctx[1] + "px");
      attr(div3, "id", "check-width");
      attr(div3, "class", "relative bg-black ");
      attr(div3, "style", div3_style_value = "height : " + ctx[1] + "px");
      attr(div4, "class", "bg-black");
    },
    m(target, anchor) {
      insert(target, div4, anchor);
      append(div4, div3);
      append(div3, div0);
      append(div3, t0);
      append(div3, div2);
      append(div2, div1);
      if (if_block0)
        if_block0.m(div1, null);
      append(div2, t1);
      if (if_block1)
        if_block1.m(div2, null);
      if (!mounted) {
        dispose = [
          listen(div1, "click", ctx[9]),
          listen(div2, "mousemove", ctx[16]),
          listen(div2, "mouseleave", ctx[17])
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (ctx2[2]) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_2(ctx2);
          if_block0.c();
          if_block0.m(div1, null);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (dirty & 14 && div1_style_value !== (div1_style_value = "height: " + Math.floor(ctx2[1]) + "px;" + (ctx2[2] && ctx2[3] ? "background: linear-gradient(black, rgba(0,0,0,0),rgba(0,0,0,0),rgba(0,0,0,0),rgba(0,0,0,0), black, black)" : "") + ";")) {
        attr(div1, "style", div1_style_value);
      }
      if (ctx2[4]) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block(ctx2);
          if_block1.c();
          if_block1.m(div2, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (dirty & 34 && div2_style_value !== (div2_style_value = "width : " + ctx2[5] + "px; height : " + ctx2[1] + "px")) {
        attr(div2, "style", div2_style_value);
      }
      if (dirty & 2 && div3_style_value !== (div3_style_value = "height : " + ctx2[1] + "px")) {
        attr(div3, "style", div3_style_value);
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(div4);
      if (if_block0)
        if_block0.d();
      if (if_block1)
        if_block1.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance($$self, $$props, $$invalidate) {
  let config = {
    height: 390,
    width: 640,
    playerVars: { "controls": 0 }
  };
  let PlayerHeight = config.height;
  let isFullscreen = false;
  let { videoId = "qBeAUyuctHM" } = $$props;
  let { el } = $$props;
  let player = {};
  config.videoId = videoId;
  config.events = {
    "onStateChange": onPlayerStateChange,
    "onReady": onPlayerReady
  };
  let playButton = true;
  let ready = false;
  let toolbar = false;
  let PlayerWidth = config.width;
  onMount(() => {
    const offsetWidth = document.querySelector(el).offsetWidth;
    config.width = offsetWidth;
    config.height = Math.floor(offsetWidth / 16 * 9);
    $$invalidate(5, PlayerWidth = config.width);
    $$invalidate(1, PlayerHeight = config.height);
    window.addEventListener("orientationchange", function() {
      if (isFullscreen) {
        isFullscreen = true;
        $$invalidate(5, PlayerWidth = window.screen.width);
        $$invalidate(1, PlayerHeight = window.screen.height);
        player.setSize(PlayerWidth, PlayerHeight);
      } else {
        const iframe = document.querySelector("iframe");
        iframe.style.width = "100%";
        setTimeout(() => {
          const offsetWidth2 = document.querySelector("iframe").offsetWidth;
          config.width = offsetWidth2;
          config.height = Math.floor(offsetWidth2 / 16 * 9);
          $$invalidate(5, PlayerWidth = config.width);
          $$invalidate(1, PlayerHeight = config.height);
          player.setSize(PlayerWidth, PlayerHeight);
        }, 200);
      }
    }, false);
  });
  function onPlayerReady() {
    $$invalidate(3, ready = true);
  }
  function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING || event.data == YT.PlayerState.BUFFERING) {
      $$invalidate(2, playButton = false);
    } else {
      $$invalidate(2, playButton = true);
      $$invalidate(4, toolbar = true);
    }
  }
  let randomId = (Math.random() + 1).toString(36).substring(7);
  const checker = setInterval(() => {
    if (typeof YT == "object") {
      player = new YT.Player(randomId, config);
      clearInterval(checker);
    }
  }, 100);
  let persentageVideo = 0;
  setInterval(() => {
    if (!playButton) {
      $$invalidate(6, persentageVideo = Math.floor(player.getCurrentTime() / player.getDuration() * 100));
    }
  }, 1e3);
  document.addEventListener("fullscreenchange", (event) => {
    if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
      isFullscreen = false;
      $$invalidate(5, PlayerWidth = config.width);
      $$invalidate(1, PlayerHeight = config.height);
      document.exitFullscreen();
      player.setSize(PlayerWidth, PlayerHeight);
    }
  });
  function playOrPause() {
    if (playButton == false) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }
  function seekProgress(e) {
    const Duration = player.getDuration();
    const result = e.layerX / e.target.offsetWidth * Duration;
    player.seekTo(result, true);
    $$invalidate(6, persentageVideo = Math.floor(result / Duration * 100));
  }
  function makeFullScreen() {
    if (isFullscreen) {
      isFullscreen = false;
      $$invalidate(5, PlayerWidth = config.width);
      $$invalidate(1, PlayerHeight = config.height);
      document.exitFullscreen();
    } else {
      document.body.requestFullscreen();
      isFullscreen = true;
      $$invalidate(5, PlayerWidth = window.screen.width);
      $$invalidate(1, PlayerHeight = window.screen.height);
      if (isMobileOrTable() && PlayerHeight > PlayerWidth) {
        $$invalidate(1, PlayerHeight = window.screen.height - 20);
      }
    }
    player.setSize(PlayerWidth, PlayerHeight);
  }
  let triggerTime = 0;
  setInterval(() => {
    if (!playButton) {
      if (triggerTime <= 0) {
        $$invalidate(4, toolbar = false);
      }
      $$invalidate(7, triggerTime -= 100);
    }
  }, 100);
  function loadVideo(video_id) {
    player.loadVideoById(video_id);
  }
  function pauseVideo() {
    player.pauseVideo();
  }
  function playVideo() {
    player.playVideo();
  }
  const mousemove_handler = () => {
    $$invalidate(4, toolbar = true);
    $$invalidate(7, triggerTime = 3e3);
  };
  const mouseleave_handler = () => {
    $$invalidate(4, toolbar = false);
  };
  $$self.$$set = ($$props2) => {
    if ("videoId" in $$props2)
      $$invalidate(12, videoId = $$props2.videoId);
    if ("el" in $$props2)
      $$invalidate(13, el = $$props2.el);
  };
  return [
    playVideo,
    PlayerHeight,
    playButton,
    ready,
    toolbar,
    PlayerWidth,
    persentageVideo,
    triggerTime,
    randomId,
    playOrPause,
    seekProgress,
    makeFullScreen,
    videoId,
    el,
    loadVideo,
    pauseVideo,
    mousemove_handler,
    mouseleave_handler
  ];
}
class YouPlayer extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, {
      videoId: 12,
      el: 13,
      loadVideo: 14,
      pauseVideo: 15,
      playVideo: 0
    });
  }
  get loadVideo() {
    return this.$$.ctx[14];
  }
  get pauseVideo() {
    return this.$$.ctx[15];
  }
  get playVideo() {
    return this.$$.ctx[0];
  }
}
var index = /* @__PURE__ */ (() => '*,:before,:after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}:before,:after{--tw-content: ""}html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji"}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,[type=button],[type=reset],[type=submit]{-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}ol,ul,menu{list-style:none;margin:0;padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input:-ms-input-placeholder,textarea:-ms-input-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}button,[role=button]{cursor:pointer}:disabled{cursor:default}img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]{display:none}*,:before,:after{--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: }.absolute{position:absolute}.relative{position:relative}.bottom-0{bottom:0px}.left-0{left:0px}.z-10{z-index:10}.z-20{z-index:20}.mt-2{margin-top:.5rem}.flex{display:flex}.h-20{height:5rem}.h-6{height:1.5rem}.h-2{height:.5rem}.w-96{width:24rem}.w-20{width:5rem}.w-full{width:100%}.w-6{width:1.5rem}.cursor-pointer{cursor:pointer}.justify-center{justify-content:center}.gap-2{gap:.5rem}.rounded-full{border-radius:9999px}.bg-black{--tw-bg-opacity: 1;background-color:rgb(0 0 0 / var(--tw-bg-opacity))}.bg-gray-200{--tw-bg-opacity: 1;background-color:rgb(229 231 235 / var(--tw-bg-opacity))}.bg-blue-600{--tw-bg-opacity: 1;background-color:rgb(37 99 235 / var(--tw-bg-opacity))}.p-3{padding:.75rem}.text-white{--tw-text-opacity: 1;color:rgb(255 255 255 / var(--tw-text-opacity))}.opacity-25{opacity:.25}\n')();
var tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
function Player(config) {
  if (!config.el) {
    return alert("No dom selector");
  }
  if (!config.videoId) {
    return alert("No Youtube Video ID");
  }
  if (!document.querySelector(config.el)) {
    return alert("No Element with selector " + config.el);
  }
  const app = new YouPlayer({
    target: document.querySelector(config.el),
    props: {
      el: config.el,
      videoId: config.videoId
    }
  });
  return app;
}
window.YouPlayer = Player;
export { Player as default };
