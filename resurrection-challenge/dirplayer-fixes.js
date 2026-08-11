// Runtime fixes for dirplayer-rs rendering bugs
(function () {

  // =========================================================================
  // Fix 1: foreColor white text bug
  // Bug: fore_color=0 → PaletteIndex(0)=white in SystemWin palette.
  // Fix: After each frame change, force foreColor=255 on all editable fields.
  // =========================================================================
  let lastFrame = null;

  function checkFrame() {
    try {
      const raw = window.__vm.mcp_get_execution_state(1);
      if (!raw) return;
      const state = JSON.parse(raw);
      const frame = state.current_frame;
      if (frame !== lastFrame) {
        lastFrame = frame;
        setTimeout(fixFieldColors, 150);
        updateNavOverlay(frame);
        if (frame === 14 && !quizActive) {
          quizActive = true;
          startIdleCheck();
          setTimeout(fadeMusicOnce, 300);
          console.log('[fixes] entered quiz frame 14: idle timer started + music fade');
        }
        if (frame !== 14) {
          quizActive = false;
        }
      }
    } catch (_) {}
  }

  function updateNavOverlay(frame) {
    var btnHtp = document.getElementById('btn-howtoplay');
    if (btnHtp) btnHtp.style.display = (frame === 90) ? 'block' : 'none';
    var btnMenu = document.getElementById('btn-menu');
    if (btnMenu) btnMenu.style.display = (frame === 83) ? 'block' : 'none';
  }

  function attachNavOverlayListeners() {
    var btnHtp = document.getElementById('btn-howtoplay');
    if (btnHtp) {
      btnHtp.addEventListener('click', function () {
        try {
          window.__vm.eval_command('go to frame 75');
          console.log('[fixes] HOW TO PLAY overlay button clicked → frame 75');
        } catch (e) {}
      });
    }
    var btnMenu = document.getElementById('btn-menu');
    if (btnMenu) {
      btnMenu.addEventListener('click', function () {
        try {
          window.__vm.eval_command('go to frame 90');
          console.log('[fixes] MENU overlay button clicked → frame 90');
        } catch (e) {}
      });
    }
  }

  function fixFieldColors() {
    try {
      let changed = false;
      for (let i = 1; i <= 80; i++) {
        if (window.__vm.is_sprite_editable_field(i)) {
          window.__vm.eval_command('sprite(' + i + ').foreColor = 255');
          changed = true;
        }
      }
      if (changed) {
        window.__vm.eval_command('updateStage');
      }
    } catch (_) {}
  }


  // =========================================================================
  // Fix 2: Initialize game globals (soundOn, ShowHost, musicon)
  // Bug: Registry APIs not implemented → optionList defaults to [0,0,0]
  //   → Member 14 (optionPrepare) sets musicon=0, soundOn=0.
  //   Member 32 (playPrep) sets soundOn=1 and ShowHost=1 but not musicon.
  // Fix: After startMovie runs, force all three to 1.
  // =========================================================================
  function initGlobals() {
    try {
      window.__vm.eval_command('soundOn = 1');
      window.__vm.eval_command('ShowHost = 1');
      window.__vm.eval_command('musicon = 1');
      window.__vm.eval_command('lowEnd = 0');
      console.log('[fixes] globals set: soundOn=1 ShowHost=1 musicon=1 lowEnd=0');
    } catch (e) {
      console.log('[fixes] initGlobals error:', e.message);
    }
  }

  // Re-apply globals at multiple points to handle the options prepareFrame
  // potentially clobbering them as the intro sequence passes through.
  function scheduleGlobalReinforcement() {
    const delays = [1500, 3000, 5000, 8000, 12000, 20000];
    for (const d of delays) {
      setTimeout(initGlobals, d);
    }
  }

  // =========================================================================
  // Fix 3: Music fadeOut on quiz start
  // Bug: Quiz is entirely on frame 14 (never navigates away), so Member 21's
  //   exitFrame (which calls sound(5).fadeOut(2000)) never runs.
  // Fix: Detect entry to frame 14 in checkFrame() and fade sound channel 5.
  //
  // Fix 4: 30-second idle timer → TL (Too Long) host animation
  // Bug: Director's "the timer" is not implemented in dirplayer-rs, so the
  //   Lingo idle handler never increments IdleTime or sets tlGo.
  // Fix: Canvas mousedown listener resets an idle countdown. After 30s of
  //   inactivity while in the quiz, call playTooLong() via eval_command.
  //
  // Fix 5: OPTIONS button on title screen (frame 11) does nothing
  // Bug: The mouseUp behavior for sprite 5 (OPTIONS) at frame 11 does not
  //   execute navigation in dirplayer-rs. The button click is a no-op.
  // Fix: Intercept the click in the OPTIONS button area and navigate via JS.
  //
  // Note: We use a DOM canvas event listener rather than wrapping
  //   window.__vm.mouse_down because WASM-exported method bindings are not
  //   directly assignable on wasm_bindgen objects.
  // =========================================================================
  let musicFaded = false;
  let quizActive = false;
  let lastClickTime = 0;
  let idleCheckInterval = null;
  const IDLE_TIMEOUT_MS = 30000;

  function onCanvasMousedown(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const vmX = e.clientX - rect.left;
    const vmY = e.clientY - rect.top;

    lastClickTime = Date.now();

    // Fix 5: OPTIONS button on title screen (frame 11): sprite 5 center≈(480,285)
    if (lastFrame === 11 && vmX >= 415 && vmX <= 550 && vmY >= 258 && vmY <= 315) {
      setTimeout(function () {
        try {
          window.__vm.eval_command('go to frame 90');
          console.log('[fixes] OPTIONS button: navigating to Options screen');
        } catch (e) {}
      }, 80);
      return;
    }

    // Fix 6: Exit button (sprite 11) at bottom-right of quiz board (frame 14)
    // Sprite 11 rect: (721,561,800,600) — navigate to frame 11 (main menu)
    if (lastFrame === 14 && vmX >= 721 && vmX <= 800 && vmY >= 561 && vmY <= 600) {
      setTimeout(function () {
        try {
          window.__vm.eval_command('go to frame 11');
          console.log('[fixes] Exit button: navigating to frame 11 (main menu)');
        } catch (e) {}
      }, 80);
      return;
    }
  }

  function fadeMusicOnce() {
    if (musicFaded) return;
    musicFaded = true;
    setTimeout(function () {
      try {
        window.__vm.eval_command('sound(5).fadeOut(2000)');
        console.log('[fixes] music fadeout triggered (sound 5)');
      } catch (e) {}
    }, 100);
  }

  function startIdleCheck() {
    if (idleCheckInterval) return;
    lastClickTime = Date.now();
    idleCheckInterval = setInterval(function () {
      if (!quizActive) return;
      if (Date.now() - lastClickTime >= IDLE_TIMEOUT_MS) {
        lastClickTime = Date.now(); // reset so we don't spam
        triggerTLAnimation();
      }
    }, 2000);
  }

  function triggerTLAnimation() {
    try {
      console.log('[fixes] 30s idle: triggering TL animation');
      window.__vm.eval_command('playTooLong()');
    } catch (e) {
      // Fallback: directly invoke a TL animation
      try {
        const anims = ['TL1', 'TL2', 'TL4', 'TL7'];
        const anim = anims[Math.floor(Math.random() * anims.length)];
        window.__vm.eval_command('tooLongWaiter = 1');
        window.__vm.eval_command('InitPngLoad("' + anim + '")');
      } catch (_) {}
    }
  }

  function attachCanvasListener() {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      setTimeout(attachCanvasListener, 300);
      return;
    }
    canvas.addEventListener('mousedown', onCanvasMousedown);
    console.log('[fixes] canvas mousedown listener attached');
  }

  // =========================================================================
  // Startup
  // =========================================================================
  function waitForVM() {
    if (!window.__vm) {
      setTimeout(waitForVM, 300);
      return;
    }
    scheduleGlobalReinforcement();
    attachCanvasListener();
    attachNavOverlayListeners();
    setInterval(checkFrame, 400);
  }

  waitForVM();
})();
