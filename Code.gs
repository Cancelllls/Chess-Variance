function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  template.urlParams = e ? e.parameter : {};
  template.scriptUrl = ScriptApp.getService().getUrl();
  return template.evaluate()
    .setTitle('Chess Pro - GAS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function saveGame(data) {
  try {
    var props = PropertiesService.getUserProperties();
    props.setProperty('savedGame', data);
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

function loadGame() {
  try {
    var props = PropertiesService.getUserProperties();
    return { success: true, data: props.getProperty('savedGame') };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

// ---- Online Multiplayer Backend Functions ----

// PERF: Cache key helper — shorter keys = faster cache ops
function _ck(id) { return 'cs_' + id; }

// PERF: Lock-free internal state reader — used by functions that already hold a lock
function _readState(gameId) {
  var raw = CacheService.getScriptCache().get(_ck(gameId));
  if (!raw) return null;
  return JSON.parse(raw);
}

// PERF: Internal state writer — increments version on every mutation
function _writeState(gameId, state) {
  state.version = (state.version || 0) + 1;
  CacheService.getScriptCache().put(_ck(gameId), JSON.stringify(state), 21600);
}

function createRoom(playerName, timeControl) {
  var roomId = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (var i = 0; i < 4; i++) {
    roomId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  var tc = (timeControl === "null" || timeControl === null) ? null : parseInt(timeControl, 10);
  var now = Date.now();

  var state = {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    pgn: '',
    takebackRequest: null,
    drawOffer: null,
    gameOver: null,
    whitePlayer: playerName || "White",
    blackPlayer: null,
    whiteTime: tc,
    blackTime: tc,
    lastMoveTimestamp: now,
    timeControl: tc,
    lastHeartbeatWhite: now,
    lastHeartbeatBlack: now,
    isPaused: false,
    version: 1
  };
  CacheService.getScriptCache().put(_ck(roomId), JSON.stringify(state), 21600);
  return roomId;
}

// PERF: Optimized getGameState with version-based fast path and conditional locking
function getGameState(gameId, playerName, lastVersion) {
  var cache = CacheService.getScriptCache();
  var cachedData = cache.get(_ck(gameId));
  
  if (cachedData == null) {
    return { success: false, error: "ROOM_NOT_FOUND" };
  }
  
  var state = JSON.parse(cachedData);
  var now = Date.now();
  var role = "spectator";

  if (state.whitePlayer === playerName) role = "w";
  else if (state.blackPlayer === playerName) role = "b";
  
  // PERF: Determine if we actually need a write (lock) — player join or stale heartbeat
  var needsJoin = (!state.blackPlayer && playerName && role === "spectator");
  var heartbeatStale = false;
  if (role === 'w') heartbeatStale = (now - state.lastHeartbeatWhite > 5000);
  else if (role === 'b') heartbeatStale = (now - state.lastHeartbeatBlack > 5000);
  
  var needsWrite = needsJoin || heartbeatStale;
  
  // PERF: Version-based fast path — if nothing changed AND no write needed, skip entirely
  if (!needsWrite && lastVersion && state.version === lastVersion) {
    // Compute pause status without writing — read-only check
    var wOffline = (now - state.lastHeartbeatWhite > 30000);
    var bOffline = (now - state.lastHeartbeatBlack > 30000);
    var currentlyPaused = (wOffline || bOffline) && !state.gameOver;
    return { success: true, noChange: true, isPaused: currentlyPaused, role: role };
  }
  
  // PERF: Lock-free read path — if no writes needed, serve without lock
  if (!needsWrite) {
    // Compute pause status (read-only, no lock needed)
    var wOffline = (now - state.lastHeartbeatWhite > 30000);
    var bOffline = (now - state.lastHeartbeatBlack > 30000);
    state.isPaused = (wOffline || bOffline) && !state.gameOver;
    return { success: true, data: state, role: role, version: state.version };
  }
  
  // Needs write — acquire lock
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    
    // Re-read under lock to avoid race conditions
    cachedData = cache.get(_ck(gameId));
    if (!cachedData) return { success: false, error: "ROOM_NOT_FOUND" };
    state = JSON.parse(cachedData);
    
    // Re-determine role under lock
    role = "spectator";
    if (state.whitePlayer === playerName) role = "w";
    else if (state.blackPlayer === playerName) role = "b";
    else if (!state.blackPlayer && playerName) {
      state.blackPlayer = playerName;
      role = "b";
      state.lastHeartbeatBlack = now;
    }

    // PERF: Update heartbeat only if stale (>5s)
    if (role === 'w' && (now - state.lastHeartbeatWhite > 5000)) state.lastHeartbeatWhite = now;
    if (role === 'b' && (now - state.lastHeartbeatBlack > 5000)) state.lastHeartbeatBlack = now;

    var wOffline = (now - state.lastHeartbeatWhite > 30000);
    var bOffline = (now - state.lastHeartbeatBlack > 30000);
    
    var shouldBePaused = (wOffline || bOffline) && !state.gameOver;
    
    if (state.isPaused && !shouldBePaused) {
      state.lastMoveTimestamp = now;
    }
    state.isPaused = shouldBePaused;

    _writeState(gameId, state);
    return { success: true, data: state, role: role, version: state.version };
  } catch(e) {
    return { success: false, error: "CACHE_ERROR", message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function makeMove(gameId, fenString, pgnString, isGameOver, moveCount, playerColor) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    
    var state = _readState(gameId);
    if (!state) return { success: false, error: "ROOM_EXPIRED" };
    if (state.gameOver) return { success: false, error: "GAME_ALREADY_OVER" };

    // Update Clocks ONLY if not paused
    var now = Date.now();
    if (state.timeControl !== null && !state.isPaused) {
      var elapsed = Math.max(0, (now - state.lastMoveTimestamp) - 100);
      if (playerColor === 'w') {
        state.whiteTime -= elapsed;
        if (state.whiteTime <= 0) {
          state.whiteTime = 0;
          state.gameOver = { result: "0-1", reason: "White flagged (Timeout)" };
        }
      } else {
        state.blackTime -= elapsed;
        if (state.blackTime <= 0) {
          state.blackTime = 0;
          state.gameOver = { result: "1-0", reason: "Black flagged (Timeout)" };
        }
      }
    }
    
    if (playerColor === 'w') state.lastHeartbeatWhite = now;
    if (playerColor === 'b') state.lastHeartbeatBlack = now;
    
    state.lastMoveTimestamp = now;
    state.fen = fenString;
    state.pgn = pgnString;
    state.takebackRequest = null;
    state.drawOffer = null;
    
    if (isGameOver && !state.gameOver) {
       var turn = fenString.split(' ')[1];
       var result = (turn === 'b') ? "1-0" : "0-1";
       var reason = (turn === 'b') ? "White won by Checkmate" : "Black won by Checkmate";
       state.gameOver = { result: result, reason: reason };
    }

    _writeState(gameId, state);
    
    // PERF: Only write to sheet on game over — removed periodic writes from hot path
    if (state.gameOver) {
      try { writeToSheet(gameId, fenString, state.gameOver.result + ": " + state.gameOver.reason); } catch(se) {}
    }
    
    return { success: true };
  } catch(e) {
    return { success: false, error: "LOCK_TIMEOUT", message: "Server busy." };
  } finally {
    lock.releaseLock();
  }
}

// PERF: Eliminated double-locking — uses _readState instead of getGameState
function offerDraw(gameId, playerColor) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    var state = _readState(gameId);
    if (!state) return { success: false, error: "ROOM_EXPIRED" };
    state.drawOffer = playerColor;
    _writeState(gameId, state);
    return { success: true };
  } catch(e) {
    return { success: false, error: "DRAW_ERROR", message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// PERF: Eliminated double-locking
function resolveDraw(gameId, isAccepted) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var state = _readState(gameId);
    if (!state) return { success: false, error: "ROOM_EXPIRED" };
    
    state.drawOffer = null;
    if (isAccepted) {
      state.gameOver = { result: "1/2-1/2", reason: "Mutual Agreement" };
    }
    _writeState(gameId, state);
    
    if (isAccepted) {
      try { writeToSheet(gameId, state.fen, "1/2-1/2: Mutual Agreement"); } catch(se) {}
    }
    return { success: true };
  } catch(e) {
    return { success: false, error: "RESOLVE_DRAW_ERROR", message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// PERF: Eliminated double-locking
function resignGame(gameId, resigningColor) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var state = _readState(gameId);
    if (!state) return { success: false, error: "ROOM_EXPIRED" };
    
    var winner = resigningColor === 'w' ? 'Black' : 'White';
    var result = resigningColor === 'w' ? '0-1' : '1-0';
    state.gameOver = { result: result, reason: winner + " won by Resignation" };
    
    _writeState(gameId, state);
    try { writeToSheet(gameId, state.fen, result + ": " + state.gameOver.reason); } catch(se) {}
    return { success: true };
  } catch(e) {
    return { success: false, error: "RESIGN_ERROR", message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// PERF: Eliminated double-locking
function requestTakeback(gameId, playerColor) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    var state = _readState(gameId);
    if (!state) return { success: false, error: "ROOM_EXPIRED" };
    state.takebackRequest = playerColor;
    _writeState(gameId, state);
    return { success: true };
  } catch(e) {
    return { success: false, error: "TAKEBACK_ERROR", message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// PERF: Uses _readState, shorter cache keys
function resolveTakeback(gameId, isAccepted, fallbackFen, fallbackPgn) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var state = _readState(gameId);
    if (!state) return { success: false, error: "ROOM_EXPIRED" };
    if (!state.takebackRequest) return { success: false, error: "STALE_REQUEST" }; 
    
    state.takebackRequest = null;
    if (isAccepted && fallbackFen) {
      state.fen = fallbackFen;
      state.pgn = fallbackPgn;
      state.lastMoveTimestamp = Date.now();
    }
    _writeState(gameId, state);
    return { success: true };
  } catch(e) {
    return { success: false, error: "RESOLVE_ERROR", message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function writeToSheet(gameId, fen, note) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      var sheet = ss.getSheetByName("ChessGames");
      if (!sheet) {
        sheet = ss.insertSheet("ChessGames");
        sheet.appendRow(["GameID", "FEN", "LastUpdated", "Notes"]);
      }
      var data = sheet.getDataRange().getValues();
      var found = false;
      var updateRow = [fen, new Date(), note || ""];
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] == gameId) {
          sheet.getRange(i + 1, 2, 1, 3).setValues([updateRow]);
          found = true;
          break;
        }
      }
      if (!found) {
        sheet.appendRow([gameId, fen, new Date(), note || ""]);
      }
    }
  } catch(e) {
    console.warn("Sheet write failed: " + e);
  }
}