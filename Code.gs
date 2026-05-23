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
  // Generate a random 4-letter room code
  var roomId = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (var i = 0; i < 4; i++) {
    roomId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  var startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  CacheService.getScriptCache().put('chess_state_' + roomId, startFen, 21600);
  return roomId;
}

function getGameState(gameId) {
  var cache = CacheService.getScriptCache();
  var state = cache.get('chess_state_' + gameId);
  
  if (state == null) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss) {
        var sheet = ss.getSheetByName("ChessGames");
        if (sheet) {
          var data = sheet.getDataRange().getValues();
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] == gameId) {
              state = data[i][1];
              cache.put('chess_state_' + gameId, state, 21600);
              return state;
            }
          }
        }
      }
    } catch(e) {}
    return '';
  }
  
  return state;
}

function makeMove(gameId, fenString, isGameOver, moveCount) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Wait up to 10s for lock
    
    var cache = CacheService.getScriptCache();
    cache.put('chess_state_' + gameId, fenString, 21600);
    
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
    console.error("Lock error in makeMove: " + e);
    return false;
  } finally {
    lock.releaseLock();
  }
}