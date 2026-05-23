function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Offline Chess')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function saveGame(data) {
  var props = PropertiesService.getUserProperties();
  props.setProperty('savedGame', data);
  return true;
}

function loadGame() {
  var props = PropertiesService.getUserProperties();
  return props.getProperty('savedGame');
}

// ---- Online Multiplayer Backend Functions ----

function createRoom() {
  var roomId = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (var i = 0; i < 4; i++) {
    roomId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  var state = {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    takebackRequest: null
  };
  CacheService.getScriptCache().put('chess_state_' + roomId, JSON.stringify(state), 21600);
  return roomId;
}

function getGameState(gameId) {
  try {
    var cache = CacheService.getScriptCache();
    var cachedData = cache.get('chess_state_' + gameId);
    var state = null;
    
    if (cachedData == null) {
      try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        if (ss) {
          var sheet = ss.getSheetByName("ChessGames");
          if (sheet) {
            var data = sheet.getDataRange().getValues();
            for (var i = 1; i < data.length; i++) {
              if (data[i][0] == gameId) {
                state = { fen: data[i][1], takebackRequest: null };
                cache.put('chess_state_' + gameId, JSON.stringify(state), 21600);
                return { success: true, data: state };
              }
            }
          }
        }
      } catch(e) {}
      return { success: false, error: "ROOM_NOT_FOUND" };
    }
    
    try {
      state = JSON.parse(cachedData);
    } catch(e) {
      state = { fen: cachedData, takebackRequest: null }; // Migration fallback
    }
    return { success: true, data: state };
  } catch(e) {
    return { success: false, error: "CACHE_ERROR", message: e.toString() };
  }
}

function makeMove(gameId, fenString, isGameOver, moveCount) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    
    var state = { fen: fenString, takebackRequest: null }; // Making a move cancels any takeback
    CacheService.getScriptCache().put('chess_state_' + gameId, JSON.stringify(state), 21600);
    
    isGameOver = isGameOver || false;
    moveCount = moveCount || 0;
    
    if (isGameOver || (moveCount > 0 && moveCount % 10 === 0)) {
      try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        if (ss) {
          var sheet = ss.getSheetByName("ChessGames");
          if (!sheet) {
            sheet = ss.insertSheet("ChessGames");
            sheet.appendRow(["GameID", "FEN", "LastUpdated"]);
          }
          var data = sheet.getDataRange().getValues();
          var found = false;
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] == gameId) {
              sheet.getRange(i + 1, 2, 1, 2).setValues([[fenString, new Date()]]);
              found = true;
              break;
            }
          }
          if (!found) {
            sheet.appendRow([gameId, fenString, new Date()]);
          }
        }
      } catch(e) {
        console.warn("Sheet backup failed: " + e);
      }
    }
    return { success: true };
  } catch(e) {
    return { success: false, error: "LOCK_TIMEOUT", message: "Server busy." };
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

function resolveTakeback(gameId, isAccepted, fallbackFen) {
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
    }
    CacheService.getScriptCache().put('chess_state_' + gameId, JSON.stringify(state), 21600);
    return { success: true };
  } catch(e) {
    return { success: false, error: "RESOLVE_ERROR", message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}