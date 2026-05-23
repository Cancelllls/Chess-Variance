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
              return state;
            }
          }
        }
      }
    } catch(e) {}
    return null;
  }
  
  try {
    return JSON.parse(cachedData);
  } catch(e) {
    return { fen: cachedData, takebackRequest: null }; // Migration fallback
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
    
    if (moveCount === 0 && fenString) {
      var parts = fenString.split(' ');
      if (parts.length >= 6) {
        moveCount = parseInt(parts[5], 10) || 0;
      }
    }

    if (isGameOver || (moveCount > 0 && moveCount % 10 === 0)) {
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
    }
    return true;
  } catch(e) {
    console.error("Lock error: " + e);
    return false;
  } finally {
    lock.releaseLock();
  }
}

function requestTakeback(gameId, playerColor) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    var state = getGameState(gameId);
    if (!state) return false;
    state.takebackRequest = playerColor;
    CacheService.getScriptCache().put('chess_state_' + gameId, JSON.stringify(state), 21600);
    return true;
  } catch(e) {
    return false;
  } finally {
    lock.releaseLock();
  }
}

function resolveTakeback(gameId, isAccepted, fallbackFen) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var cachedData = CacheService.getScriptCache().get('chess_state_' + gameId);
    if (!cachedData) return false;
    
    var state = JSON.parse(cachedData);
    if (!state.takebackRequest) return false; // Already resolved or overridden by a move
    
    state.takebackRequest = null;
    if (isAccepted && fallbackFen) {
      state.fen = fallbackFen;
    }
    CacheService.getScriptCache().put('chess_state_' + gameId, JSON.stringify(state), 21600);
    return true;
  } catch(e) {
    return false;
  } finally {
    lock.releaseLock();
  }
}