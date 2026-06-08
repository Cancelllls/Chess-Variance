function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
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
    isPaused: false
  };
  CacheService.getScriptCache().put('chess_state_' + roomId, JSON.stringify(state), 21600);
  return roomId;
}

function getGameState(gameId, playerName) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var cache = CacheService.getScriptCache();
    var cachedData = cache.get('chess_state_' + gameId);
    
    if (cachedData == null) {
      // (Simplified fallback for brevity, assuming room existence)
      return { success: false, error: "ROOM_NOT_FOUND" };
    }
    
    var state = JSON.parse(cachedData);
    var now = Date.now();
    var role = "spectator";

    if (state.whitePlayer === playerName) role = "w";
    else if (state.blackPlayer === playerName) role = "b";
    else if (!state.blackPlayer && playerName) {
      state.blackPlayer = playerName;
      role = "b";
      state.lastHeartbeatBlack = now;
    }

    // --- HEARTBEAT & PAUSE LOGIC ---
    if (role === 'w') state.lastHeartbeatWhite = now;
    if (role === 'b') state.lastHeartbeatBlack = now;

    var wOffline = (now - state.lastHeartbeatWhite > 30000);
    var bOffline = (now - state.lastHeartbeatBlack > 30000);
    
    var shouldBePaused = (wOffline || bOffline) && !state.gameOver;
    
    if (state.isPaused && !shouldBePaused) {
      // Game resuming: reset move timestamp so no time was lost during disconnection
      state.lastMoveTimestamp = now;
    }
    state.isPaused = shouldBePaused;

    cache.put('chess_state_' + gameId, JSON.stringify(state), 21600);
    return { success: true, data: state, role: role };
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
    
    var cache = CacheService.getScriptCache();
    var cachedData = cache.get('chess_state_' + gameId);
    if (!cachedData) return { success: false, error: "ROOM_EXPIRED" };
    
    var state = JSON.parse(cachedData);
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

    cache.put('chess_state_' + gameId, JSON.stringify(state), 21600);
    
    if (state.gameOver) {
      writeToSheet(gameId, fenString, state.gameOver.result + ": " + state.gameOver.reason);
    } else if (moveCount > 0 && moveCount % 10 === 0) {
      writeToSheet(gameId, fenString);
    }
    
    return { success: true };
  } catch(e) {
    return { success: false, error: "LOCK_TIMEOUT", message: "Server busy." };
  } finally {
    lock.releaseLock();
  }
}

function offerDraw(gameId, playerColor) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    var res = getGameState(gameId);
    if (!res.success) return res;
    var state = res.data;
    state.drawOffer = playerColor;
    CacheService.getScriptCache().put('chess_state_' + gameId, JSON.stringify(state), 21600);
    return { success: true };
  } catch(e) {
    return { success: false, error: "DRAW_ERROR", message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function resolveDraw(gameId, isAccepted) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var res = getGameState(gameId);
    if (!res.success) return res;
    var state = res.data;
    
    state.drawOffer = null;
    if (isAccepted) {
      state.gameOver = { result: "1/2-1/2", reason: "Mutual Agreement" };
      writeToSheet(gameId, state.fen, "1/2-1/2: Mutual Agreement");
    }
    CacheService.getScriptCache().put('chess_state_' + gameId, JSON.stringify(state), 21600);
    return { success: true };
  } catch(e) {
    return { success: false, error: "RESOLVE_DRAW_ERROR", message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function resignGame(gameId, resigningColor) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var res = getGameState(gameId);
    if (!res.success) return res;
    var state = res.data;
    
    var winner = resigningColor === 'w' ? 'Black' : 'White';
    var result = resigningColor === 'w' ? '0-1' : '1-0';
    state.gameOver = { result: result, reason: winner + " won by Resignation" };
    
    writeToSheet(gameId, state.fen, result + ": " + state.gameOver.reason);
    CacheService.getScriptCache().put('chess_state_' + gameId, JSON.stringify(state), 21600);
    return { success: true };
  } catch(e) {
    return { success: false, error: "RESIGN_ERROR", message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function requestTakeback(gameId, playerColor) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    var res = getGameState(gameId);
    if (!res.success) return res;
    var state = res.data;
    state.takebackRequest = playerColor;
    CacheService.getScriptCache().put('chess_state_' + gameId, JSON.stringify(state), 21600);
    return { success: true };
  } catch(e) {
    return { success: false, error: "TAKEBACK_ERROR", message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function resolveTakeback(gameId, isAccepted, fallbackFen, fallbackPgn) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var cachedData = CacheService.getScriptCache().get('chess_state_' + gameId);
    if (!cachedData) return { success: false, error: "ROOM_EXPIRED" };
    
    var state = JSON.parse(cachedData);
    if (!state.takebackRequest) return { success: false, error: "STALE_REQUEST" }; 
    
    state.takebackRequest = null;
    if (isAccepted && fallbackFen) {
      state.fen = fallbackFen;
      state.pgn = fallbackPgn;
      state.lastMoveTimestamp = Date.now();
    }
    CacheService.getScriptCache().put('chess_state_' + gameId, JSON.stringify(state), 21600);
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