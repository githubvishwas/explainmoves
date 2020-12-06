// --- Begin Example JS --------------------------------------------------------
// NOTE: this example uses the chess.js library:
// https://github.com/jhlywa/chess.js

var START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
var _engine, _curmoves = [];
var _history = [[START]], _history2 = null, _historyindex = 0;
var _flip = false, _edit = false, _info = false, _play = null;
var _arrow = false, _menu = false;
var _dragElement = null, _dragActive = false, _startX, _startY, _dragCtrl, _dragLMB, _clickFrom, _clickFromElem;
var _tooltipState = false, _wantUpdateInfo = true;;
var _wname = "White", _bname = "Black", _color = 0, _bodyScale = 1;
var _nncache = null;
var _staticSortByChange = false;
var evalUnit = 213;
var board1 = null
var game = new Chess()
var curengeval = 0.0
var _staticscore = 0.0
function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for White
  //if (piece.search(/^b/) !== -1) return false
}

function makeRandomMove () {
  var possibleMoves = game.moves()

  // game over
  if (possibleMoves.length === 0) return

  var randomIdx = Math.floor(Math.random() * possibleMoves.length)
  game.move(possibleMoves[randomIdx])
  board1.position(game.fen())
}
function updateStatus() {
	
	var staticEvalList = getStaticEvalList(game.fen()), total = 0, ci = 5;
	//console.log(staticEvalList)
	for (var i = 0; i < staticEvalList.length; i++) {
	  if (i > 0 && staticEvalList[i-1].group != staticEvalList[i].group) ci++;
	  var c1=0, c2=0, c3=0;
	  while (c1 + c2 + c3 == 0) {
		c1 = 22 + (ci % 2) * 216;
		c2 = 22 + (((ci / 2) << 0) % 3) * 108;
		c3 = 22 + ((((ci / 6) << 0)) % 2) * 216;
		if (c1 + c2 + c3 < 100) { c1 = c2 = c3 = 0; ci++; }
	  }
	  staticEvalList[i].bgcol = "rgb("+c1+","+c2+","+c3+")";
	  //staticEvalList[i].rel = staticEvalList[i].item[2] - (staticEvalListLast == null ? 0 : staticEvalListLast[i].item[2]);
	}
	var advcolor = "White"
	if(curengeval < 0) {
		advcolor = "Black"
	} 
	var sortArray = [];
	var for_winning_side = [];
	var for_losing_side = [];
	for (var i = 0; i < staticEvalList.length; i++) sortArray.push({value:_staticSortByChange ? staticEvalList[i].rel : staticEvalList[i].item[2],index:i});
	sortArray.sort(function(a,b) {return (Math.abs(a.value) < Math.abs(b.value)) ? 1 : Math.abs(a.value) > Math.abs(b.value) ? -1 : 0;} );
	for (var j = 0; j < sortArray.length; j++) {
	  var i = sortArray[j].index;
	  n2 = staticEvalList[i].elem.replace(/_/g, " ");
	  key = n2.charAt(0).toUpperCase() + n2.slice(1)
	  //console.log(key)
	  if(advcolor == "Black") {
		  if(staticEvalList[i].item[2] < 0) {
			  for_winning_side.push(datadesc.get(key))
		  } else {
			  for_losing_side.push(datadesc.get(key))
		  }
	  } else {
		  if(staticEvalList[i].item[2] > 0) {
			  for_losing_side.push(datadesc.get(key))
		  } else {
			  for_winning_side.push(datadesc.get(key))
		  }
	  }
	  total += staticEvalList[i].item[2];
	  //console.log("------------------------------------")
	  //console.log(staticEvalList[i].elem)
	  //console.log(staticEvalList[i].item[2])
	  
	  var text = (staticEvalList[i].item[2] / evalUnit).toFixed(2);
	  if (text == "-0.00") text = "0.00";
	  var rel = (staticEvalList[i].rel / evalUnit).toFixed(2);
	  if (rel == "-0.00") rel = "0.00";
	  if (!_staticSortByChange && text == "0.00") continue;
	  if (_staticSortByChange && rel == "0.00") continue;
	}
	var staticscore = (total / evalUnit).toFixed(2)
	var abscore = Math.abs(staticscore)
	var txt = ""
	var advcolor = ""
	var ocolor = ""
	if(staticscore < 0) {
		advcolor = "Black"
		ocolor = "White"
	} else {
		advcolor = "White"
		ocolor = "Black"
	}
	if(abscore < 0.5) {
		txt = "Too early to say anything!"
	} else if (abscore < 1) {
		txt = advcolor + " seems to be doing better here"
	} else if (abscore >= 1 && abscore < 2) {
		txt = "Looks like " + advcolor + " is dominating"
	} else {
		txt = advcolor + " is winning here folks!"
	}

	txt1 = "Things working for " + advcolor + ": " + for_winning_side
	txt2 = "Things working for " + ocolor + ": " + for_losing_side
	//console.log("Static evaluation (" + (total / evalUnit).toFixed(2)+ ")")
	//document.getElementById("staticeval").innerHTML = txt +"\nStatic Eval: " + (total / evalUnit).toFixed(2);
	//console.log(staticEvalList)
	
	//var openinfo = getOpenInfo(game.pgn(),game.fen())
	//document.getElementById("openinfo").innerHTML = " Opening Info: " + openinfo[0].name;
	//document.getElementById("cpscore").innerHTML = " Static score: " + staticscore;
	_staticscore = staticscore
	//document.getElementById("staticevalwin").innerHTML = txt1
	//document.getElementById("staticevallose").innerHTML = txt2
}
function makeEngineMove () {
	_engine.kill = false;
	_engine.waiting = false;
	_engine.send("stop");
	_engine.send("ucinewgame");
	var e = document.getElementById("sel1");
	var level = e.options[e.selectedIndex].value;
	_engine.send("setoption name Skill Level value " + 10); 
	_engine.score = null;
	_engine.eval(game.fen(), function done(str) {
	  _engine.waiting = true;
	  
	  var matches = str.match(/^bestmove\s(\S+)(?:\sponder\s(\S+))?/);
	  if (matches && matches.length > 1) {
		var source  = matches[1][0] + matches[1][1] 
		var target  = matches[1][2] + matches[1][3]  
		//console.log(source)
		//console.log(target)
	
		var move = game.move({
		from: source,
		to: target,
		promotion: 'q' // NOTE: always promote to a queen for example simplicity
	  })

	  // illegal move
	  if (move === null) return 'snapback'
	  board1.position(game.fen())
	  updateStatus()	
	
	 
	  
	  
	  }
	},function info(depth, score, pv, str) {
        if(depth == 10) {
			//console.log(depth)
			//console.log(score)
			//console.log(pv)
			document.getElementById("cpscore").innerHTML = " CP score: " + score/100;
		}
      });
	
	
}
function getEngineEval () {
	_engine.kill = false;
	_engine.waiting = false;
	_engine.send("stop");
	_engine.send("ucinewgame");
	//var e = document.getElementById("sel1");
	//var level = e.options[e.selectedIndex].value;
	_engine.send("setoption name Skill Level value " + 5); 
	_engine.score = null;
	_engine.eval(game.fen(), function done(str) {
	  _engine.waiting = true;
		var matches = str.match(/^bestmove\s(\S+)(?:\sponder\s(\S+))?/);
		if (matches && matches.length > 1) {
			var source  = matches[1][0] + matches[1][1] 
			var target  = matches[1][2] + matches[1][3] 
			//console.log(matches)
						
			//console.log(source)
			//console.log(target)
		}
	 
	},function info(depth, score, pv, str) {
		//console.log(str)
        if(depth == 15) {
			//console.log(depth)
			//console.log(score)
			//console.log(pv)
			if(game.turn() == 'b') {
				score = score * -1
			}
			curengeval = score
			
			var abscore = Math.abs(score)
			var txt = ""
			var advcolor = ""
			
			if(score < 0) {
				advcolor = "Black"
			} else {
				advcolor = "White"
			}
			if(abscore < 0.5) {
				txt = "Too close to say anything!"
			} else if (abscore < 1) {
				txt = advcolor + " seems to be doing better here"
			} else if (abscore >= 1 && abscore < 2) {
				txt = "Looks like " + advcolor + " is dominating"
			} else {
				txt = advcolor + " is winning here folks!"
			}			
			document.getElementById("cpscore").innerHTML = txt + " Static eval: " + _staticscore + " Score: " + score/100;
			document.getElementById("bestmoves").innerHTML = pv;
		}
      });
	
	
}
function onDrop (source, target) {
  // see if the move is legal
  //console.log(game.turn())
  //console.log(source)
  //console.log(target)
  
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })
 //console.log(move)	
  // illegal move
  if (move === null) return 'snapback'
  //window.setTimeout(makeEngineMove(0), 250)	
  // make random legal move for black
  //window.setTimeout(makeRandomMove, 250)
  board1.position(game.fen())	
  e = document.getElementById("fen");
  
  e.value = game.fen()
  SubmitFen()
  //window.setTimeout(makeEngineMove(), 250)
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  //board1.position(game.fen())
}
function parseFEN(fen) {
  var board = new Array(8);
  for (var i = 0; i < 8; i++) board[i] = new Array(8);
  var a = fen.replace(/^\s+/,'').split(' '), s = a[0], x, y;
  for (x = 0; x < 8; x++) for (y = 0; y < 8; y++) {
    board[x][y] = '-';
  }
  x = 0, y = 0;
  for (var i = 0; i < s.length; i++) {
    if (s[i] == ' ') break;
    if (s[i] == '/') {
      x = 0;
      y++;
    } else {
      if (!bounds(x, y)) continue;
      if ('KQRBNP'.indexOf(s[i].toUpperCase()) != -1) {
        board[x][y] = s[i];
        x++;
      } else if ('0123456789'.indexOf(s[i]) != -1) {
        x += parseInt(s[i]);
      } else x++;
    }
  }
  var castling, enpassant, whitemove = !(a.length > 1 && a[1] == 'b');
  if (a.length > 2) {
    castling = [ a[2].indexOf('K') != -1, a[2].indexOf('Q') != -1,
                 a[2].indexOf('k') != -1, a[2].indexOf('q') != -1];
  } else {
    castling = [ true, true, true, true ];
  }
  if (a.length > 3 && a[3].length == 2) {
    var ex = 'abcdefgh'.indexOf(a[3][0]);
    var ey = '87654321'.indexOf(a[3][1]);
    enpassant = (ex >= 0 && ey >= 0) ? [ex, ey] : null;
  } else {
    enpassant = null;
  }
  var movecount = [(a.length > 4 && !isNaN(a[4]) && a[4] != '') ? parseInt(a[4]) : 0,
                   (a.length > 5 && !isNaN(a[5]) && a[5] != '') ? parseInt(a[5]) : 1];
				   //alert('parseFEN')
  //alert({b:board, c:castling, e:enpassant, w:whitemove, m:movecount}) 				   
  return {b:board, c:castling, e:enpassant, w:whitemove, m:movecount};
}
function SubmitFenWrap() {
	var e = document.getElementById("fen");
	var fen = e.value;
	var or = "white"
	
	//console.log(or)
	game.load(fen)
	if (game.turn() == 'b') {
		or = "black"
	}
	board1.position(game.fen())
	//console.log(game.fen())
	board1.orientation(or)
	SubmitFen()
}
function SubmitFen() {
	document.getElementById("cpscore").innerHTML = "Processing ..."
	document.getElementById("bestmoves").innerHTML = ""
	getEngineEval()
	updateStatus()
}
function loadEngine() {
  var engine = {ready: false, kill: false, waiting: true, depth: 15, lastnodes: 0};
  var wasmSupported = typeof WebAssembly === 'object' && WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
  if (typeof(Worker) === "undefined") return engine;
  var workerData = new Blob([atob(wasmSupported ? sfWasm : sf)], { type: "text/javascript" });
  try { var worker = new Worker(window.URL.createObjectURL(workerData )); }
  catch(err) { return engine; }
  worker.onmessage = function (e) { if (engine.messagefunc) engine.messagefunc(e.data); }
  engine.send = function send(cmd, message) {
    cmd = String(cmd).trim();
    engine.messagefunc = message;
    worker.postMessage(cmd);
  };
  engine.eval = function eval(fen, done, info) {
    engine.send("position fen " + fen);
    engine.send("go depth "+ engine.depth, function message(str) {
	//console.log(str)	
      var matches = str.match(/depth (\d+) .*score (cp|mate) ([-\d]+) .*nodes (\d+) .*pv (.+)/);
      if (!matches) matches = str.match(/depth (\d+) .*score (cp|mate) ([-\d]+).*/);
      if (matches) {
        if (engine.lastnodes == 0) engine.fen = fen;
        if (matches.length > 4) {
          var nodes = Number(matches[4]);
          if (nodes < engine.lastnodes) engine.fen = fen;
          engine.lastnodes = nodes;
        }
        var depth = Number(matches[1]);
        var type = matches[2];
        var score = Number(matches[3]);
        if (type == "mate") score = (1000000 - Math.abs(score)) * (score <= 0 ? -1 : 1);
        engine.score = score;
        if (matches.length > 5) {
          var pv = matches[5].split(" ");
          if (info != null && engine.fen == fen) info(depth, score, pv,str);
        }
      }
      if (str.indexOf("bestmove") >= 0 || str.indexOf("mate 0") >= 0 || str == "info depth 0 score cp 0") {
        if (engine.fen == fen) done(str);
        engine.lastnodes = 0;
      }
    });
  };
  engine.send("uci", function onuci(str) {
    if (str === "uciok") {
      engine.send("isready", function onready(str) {
        if (str === "readyok") engine.ready = true;
      });
    }
  });
  return engine;
}

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
  overlay: true
}
_engine = loadEngine();
board1 = Chessboard('myBoard', config)
// --- End Example JS ----------------------------------------------------------