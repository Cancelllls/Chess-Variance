
class EnginePool {
  constructor() {
    this.poolSize = Math.min(2, navigator.hardwareConcurrency || 2);
    this.workers = [];
    this.taskQueue = [];
    this.onPuzzleFound = null;
    this.onEvalResult = null;
    this.isGenerating = false;
    this.isInitialized = false;
  }

  initPool() {
    if (this.isInitialized) return;
    const chessCode = document.getElementById('chess-engine').innerText;
    const stockfishCode = document.getElementById('stockfish-engine').innerText;

    const workerScript = `
      ${chessCode}
      ${stockfishCode}

      // WASM Memory Optimization & Performance Tuning
      let stockfish = typeof STOCKFISH !== "undefined" ? STOCKFISH() : Stockfish();
      
      let game = new Chess();
      let state = 'IDLE'; 
      let solutionMoves = [];
      let initialFen = '';
      let extractionDepth = 0;
      let lastEval = 0;
      let mateEval = null;
      let currentTaskId = null;

      // Hardware Acceleration: Hash Memory Allocation
      stockfish.postMessage('uci');
      stockfish.postMessage('setoption name Hash value 32');
      stockfish.postMessage('isready');

      function randomMove() {
        const moves = game.moves();
        if(moves.length === 0) return false;
        const move = moves[Math.floor(Math.random() * moves.length)];
        game.move(move);
        return true;
      }

      function generateRandomGame() {
        game.reset();
        const numMoves = 20 + Math.floor(Math.random() * 20);
        for(let i=0; i<numMoves; i++) {
          if(game.game_over()) break;
          randomMove();
        }
        return game.fen();
      }

      stockfish.onmessage = function(event) {
        const line = event.data || event;
        
        if (state === 'LIVE_EVAL' || state === 'BATCH_EVAL') {
          if (line.startsWith('info depth')) {
            const cpMatch = line.match(/score cp (-?\\d+)/);
            if (cpMatch) { lastEval = parseInt(cpMatch[1]); mateEval = null; }
            const mateMatch = line.match(/score mate (-?\\d+)/);
            if (mateMatch) { mateEval = parseInt(mateMatch[1]); lastEval = mateEval > 0 ? 10000 : -10000; }
          }
          if (line.startsWith('bestmove')) {
             postMessage({ type: 'EVAL_RESULT', cp: lastEval, mate: mateEval, taskId: currentTaskId });
             state = 'IDLE';
          }
        } else if (state === 'EVAL_INITIAL') {
          if (line.startsWith('info depth')) {
            const match = line.match(/score cp (-?\\d+)/);
            if (match) lastEval = parseInt(match[1]);
            const mateMatch = line.match(/score mate (-?\\d+)/);
            if (mateMatch) lastEval = parseInt(mateMatch[1]) > 0 ? 10000 : -10000;
          }
          if (line.startsWith('bestmove')) {
            if (Math.abs(lastEval) > 400 || Math.abs(lastEval) === 10000) {
               const parts = line.split(' ');
               if(parts.length > 1 && parts[1] !== '(none)') {
                 solutionMoves.push(parts[1]);
                 game.move(parts[1], {sloppy: true});
                 extractionDepth = 1;
                 state = 'EXTRACT_RESPONSE';
                 stockfish.postMessage('position fen ' + game.fen());
                 stockfish.postMessage('go depth 12');
                 return;
               }
            }
            startGeneration();
          }
        } else if (state === 'EXTRACT_RESPONSE' || state === 'EXTRACT_MOVE') {
            if (line.startsWith('bestmove')) {
               const parts = line.split(' ');
               if(parts.length > 1 && parts[1] !== '(none)') {
                 solutionMoves.push(parts[1]);
                 game.move(parts[1], {sloppy: true});
                 if (extractionDepth < 3 && !game.game_over()) {
                    extractionDepth++;
                    state = state === 'EXTRACT_RESPONSE' ? 'EXTRACT_MOVE' : 'EXTRACT_RESPONSE';
                    stockfish.postMessage('position fen ' + game.fen());
                    stockfish.postMessage('go depth 12');
                    return;
                 }
               }
               postMessage({ type: 'PUZZLE_FOUND', fen: initialFen, solution: solutionMoves });
               state = 'IDLE';
            }
        }
      };

      function startGeneration() {
        state = 'SEED';
        solutionMoves = [];
        initialFen = generateRandomGame();
        state = 'EVAL_INITIAL';
        stockfish.postMessage('position fen ' + initialFen);
        stockfish.postMessage('go depth 12');
      }

      onmessage = function(e) {
        if (e.data && e.data.type === 'GENERATE_PUZZLE') {
          startGeneration();
        } else if (e.data && (e.data.type === 'EVALUATE' || e.data.type === 'BATCH_TASK')) {
          state = e.data.type === 'EVALUATE' ? 'LIVE_EVAL' : 'BATCH_EVAL';
          currentTaskId = e.data.taskId || null;
          lastEval = 0;
          mateEval = null;
          stockfish.postMessage('stop');
          stockfish.postMessage('position fen ' + e.data.fen);
          stockfish.postMessage('go depth ' + (e.data.depth || 14));
        }
      };
    `;

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);

    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(blobUrl);
      worker.isBusy = false;
      worker.onmessage = (e) => this.handleWorkerMessage(worker, e);
      this.workers.push(worker);
    }
    this.isInitialized = true;
  }

  handleWorkerMessage(worker, e) {
    if (e.data && e.data.type === 'PUZZLE_FOUND') {
      if (this.onPuzzleFound) this.onPuzzleFound(e.data.fen, e.data.solution);
      worker.isBusy = false;
      this.isGenerating = false;
      this.processQueue();
    } else if (e.data && e.data.type === 'EVAL_RESULT') {
      if (this.onEvalResult) this.onEvalResult(e.data.cp, e.data.mate, e.data.taskId);
      worker.isBusy = false;
      this.processQueue();
    }
  }

  processQueue() {
    if (this.taskQueue.length === 0) return;
    const idleWorker = this.workers.find(w => !w.isBusy);
    if (idleWorker) {
      const task = this.taskQueue.shift();
      idleWorker.isBusy = true;
      idleWorker.postMessage(task);
    }
  }

  generate() {
    this.isGenerating = true;
    this.initPool();
    this.taskQueue.push({ type: 'GENERATE_PUZZLE' });
    this.processQueue();
  }

  evaluate(fen, depth = 14, taskId = null) {
    this.initPool();
    // Live eval bar takes priority - clear queue if it's a live eval
    if (taskId === 'live') {
      this.taskQueue = this.taskQueue.filter(t => t.type !== 'EVALUATE');
      this.taskQueue.unshift({ type: 'EVALUATE', fen, depth, taskId });
    } else {
      this.taskQueue.push({ type: 'BATCH_TASK', fen, depth, taskId });
    }
    this.processQueue();
  }
}

// UI Integration
const enginePool = new EnginePool();
let puzzleSolution = [];
let currentPuzzleStep = 0;
let puzzleBuffer = [];

// Pre-warm the buffer
setTimeout(() => {
  enginePool.onPuzzleFound = (fen, solution) => {
    puzzleBuffer.push({ fen, solution });
    if (puzzleBuffer.length < 3) enginePool.generate();
  };
  enginePool.generate();
}, 1000);

function startOfflinePuzzle() {
  if (puzzleBuffer.length > 0) {
    const p = puzzleBuffer.shift();
    loadPuzzleData(p.fen, p.solution);
    // Continue filling buffer
    enginePool.onPuzzleFound = (f, s) => { 
      puzzleBuffer.push({ fen: f, solution: s }); 
      if (puzzleBuffer.length < 3) enginePool.generate();
    };
    if (!enginePool.isGenerating) enginePool.generate();
  } else {
    document.getElementById('btn-generate-puzzle').innerText = "⏳ Generating... (Parallel Optimized)";
    enginePool.onPuzzleFound = (fen, solution) => {
      document.getElementById('btn-generate-puzzle').innerText = "🧩 Puzzles";
      loadPuzzleData(fen, solution);
      // Now start buffering the next ones
      enginePool.onPuzzleFound = (f, s) => { 
        puzzleBuffer.push({ fen: f, solution: s }); 
        if (puzzleBuffer.length < 3) enginePool.generate();
      };
      if (!enginePool.isGenerating) enginePool.generate();
    };
    if (!enginePool.isGenerating) enginePool.generate();
  }
}

function loadPuzzleData(fen, solution) {
  gameMode = 'puzzle';
  puzzleSolution = solution; 
  currentPuzzleStep = 0;
  game.load(fen);
  playerColor = game.turn();
  boardFlipped = (playerColor === 'b');
  updateBoard();
  triggerEvaluation();
  document.getElementById('game-info-panel').innerText = "Puzzle: Find the best move!";
  closeWelcomeScreen();
}

function handlePuzzleMove(move) {
  const expectedMove = puzzleSolution[currentPuzzleStep];
  const userMoveStr = move.from + move.to + (move.promotion || '');
  
  if (userMoveStr === expectedMove || expectedMove === (move.from + move.to)) {
    currentPuzzleStep++;
    if (currentPuzzleStep >= puzzleSolution.length) {
      document.getElementById('game-info-panel').innerText = "Solved! Next puzzle...";
      setTimeout(() => startOfflinePuzzle(), 1000);
    } else {
      // Computer replies
      setTimeout(() => {
        const replyMove = puzzleSolution[currentPuzzleStep];
        game.move(replyMove, { sloppy: true });
        updateBoard();
        AudioController.play('move');
        currentPuzzleStep++;
        if (currentPuzzleStep >= puzzleSolution.length) {
          document.getElementById('game-info-panel').innerText = "Solved! Next puzzle...";
          setTimeout(() => startOfflinePuzzle(), 1000);
        }
      }, 500);
    }
  } else {
    // Wrong move
    game.undo();
    updateBoard();
    const fromEl = document.querySelector(`[data-square="${move.from}"] .piece`);
    if (fromEl) { fromEl.classList.add('shake'); setTimeout(() => fromEl.classList.remove('shake'), 400); }
    document.getElementById('game-info-panel').innerText = "Incorrect move, try again.";
  }
}
