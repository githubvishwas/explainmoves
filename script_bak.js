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
var myboard = null
var game = new Chess()
var curengeval = 0.0
var _staticscore = 0.0
var elem = document.getElementById('col1');
var squareClass = 'square-55d63';
var $myboard = null;
var pgnEl = $('#pgn');
var sdepth = 10
function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false
	if (game.game_over() === true ||
      (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
  // only pick up pieces for White
  //if (piece.search(/^b/) !== -1) return false
}
var getMove = function () {
	makeBestMove()
};
function makeRandomMove () {
  var possibleMoves = game.moves()

  // game over
  if (possibleMoves.length === 0) return

  var randomIdx = Math.floor(Math.random() * possibleMoves.length)
  game.move(possibleMoves[randomIdx])
  myboard.position(game.fen())
}
function updateStatus1() {
	
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
	document.getElementById("cpscore").innerHTML = " Static score: " + staticscore;
	_staticscore = staticscore
	//document.getElementById("staticevalwin").innerHTML = txt1
	//document.getElementById("staticevallose").innerHTML = txt2
}
function makeEngineMove (makeMove) {
	//console.log("start move")
	_engine.kill = false;
	_engine.waiting = false;
	_engine.send("stop");
	_engine.send("ucinewgame");
	var e = document.getElementById("sel1");
	var level = e.options[e.selectedIndex].value;
	_engine.send("setoption name Skill Level value " + 1); 
	_engine.score = null;
	//console.log("eval move")
	_engine.eval(game.fen(), function done(str) {
	  _engine.waiting = true;
	  //console.log(str)
	  var matches = str.match(/^bestmove\s(\S+)(?:\sponder\s(\S+))?/);
	  if (matches && matches.length > 1) {
		var source  = matches[1][0] + matches[1][1] 
		var target  = matches[1][2] + matches[1][3]  
		//console.log(source)
		//console.log(target)
		if(makeMove == 1) {
			var move = game.move({
			from: source,
			to: target,
			promotion: 'q' // NOTE: always promote to a queen for example simplicity
		  })

		  // illegal move
		  if (move === null) return 'snapback'
		  myboard.position(game.fen())
		  updateStatus()
		  //console.log(getStaticEvalList(game.fen()))
		}
		
	  }
	},function info(depth, score, pv,str) {
		console.log("=========")
		console.log(str)
        if(depth == sdepth) {
			console.log(score)
			//document.getElementById("cpscore").innerHTML = " CP score: " + score/100;
		}
      });
	
	
}
function makeEngineMove1 () {
	_engine.kill = false;
	_engine.waiting = false;
	_engine.send("stop");
	_engine.send("ucinewgame");
	var e = document.getElementById("sel1");
	var level = e.options[e.selectedIndex].value;
	//console.log(level)
	_engine.send("setoption name Skill Level value " + level); 
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
	  myboard.position(game.fen())
	  updateStatus()	
	
	 
	  
	  
	  }
	},function info(depth, score, pv, str) {
		//console.log(str)
        
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
	_engine.eval(game.fen(), function info(depth, score, pv, str) {
		//console.log(depth)
        if(depth == sdepth) {
			
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
var updateStatus = function() {
  var status = '';

  var moveColor = 'White';
  if (game.turn() === 'b') {
    moveColor = 'Black';
  }

  // checkmate?
  if (game.in_checkmate() === true) {
    alert('Game over, ' + moveColor + ' is in checkmate.')
  }

  // draw?
  else if (game.in_draw() === true) {
    alert('Game over, drawn position')
  }

  // game still on
  else {
    status = moveColor + ' to move';

    // check?
    if (game.in_check() === true) {
      status += ', ' + moveColor + ' is in check';
    }
  }

  pgnEl.html(game.pgn());
  myboard.position(game.fen());
};
var makeBestMove = function () {
    if (game.game_over()) {
        alert('Game over');
    }

	makeEngineMove(1)
    myboard.position(game.fen());
	updateStatus();
   
    if (game.game_over()) {
        alert('Game over');
    }
};
function onDrop (source, target) {
  
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })
 
  // illegal move
  if (move === null) return 'snapback'
  updateStatus();
  makeBestMove();
  
  myboard.position(game.fen())	
  ret = getOpeningInfo(game.pgn())
	if(ret.length == 3) {
		//console.log("ECO: " + ret[0])
		//console.log("White: " + ret[1])
		//console.log("Black: " + ret[2])
		document.getElementById("openinfo").innerHTML = " Opening Info: " + "ECO: " + ret[0] + " White: " + ret[1];
		if(ret[2] != "") {
			document.getElementById("openinfo").innerHTML += " Black: " + ret[2];
		}
		
	} else {
		console.log("not found anything")
	}
	getEngineEval()
  //window.setTimeout(makeEngineMove(), 250)
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  //myboard.position(game.fen())
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
	myboard.position(game.fen())
	//console.log(game.fen())
	myboard.orientation(or)
	SubmitFen()
}
function SubmitFen() {
	document.getElementById("cpscore").innerHTML = "Processing ..."
	document.getElementById("bestmoves").innerHTML = ""
	console.log(game.history())
	ret = getOpeningInfo(game.pgn())
	if(ret.length == 3) {
		console.log("ECO: " + ret[0])
		console.log("White: " + ret[1])
		console.log("Black: " + ret[2])
	} else {
		console.log("not ound anything")
	}
	
	//getEngineEval()
	//updateStatus()
}
function getOpeningInfo(curpgn) {
	var ngame = new Chess()
	ngame.load_pgn(curpgn)
	var nmoves = ngame.history().join().replace(/,/g, " ");
	console.log(nmoves)  
	var retArr = []
	  for (var i = 0; i < eco_openings.length; i++) {
		//console.log(eco_openings[i].moves)
		if (nmoves ==  eco_openings[i].moves)
		{
			retArr.push(eco_openings[i].eco)
			retArr.push(eco_openings[i].white)
			retArr.push(eco_openings[i].black)
			return retArr
		}
	  }
	  return retArr
	//var positionInfoText = "Position: "+(_historyindex+1)+" of "+_history.length+" - Last move: ";
}
var newGame = function() {
    game.reset();
    var cfg = {
      draggable: true,
      position: 'start',
      onDragStart: onDragStart,
      onDrop: onDrop,
      onSnapEnd: onSnapEnd,
      orientation: elem.options[elem.selectedIndex].value
    };
    myboard = ChessBoard('myBoard', cfg);
    updateStatus();

}
function changeLevel() {
		
	if (this.options[this.selectedIndex].value > 4) {
		alert("Above level 4, things will get real slow on phones or low powered devices!")
	}
}

function Undo() {
	game.undo();
	game.undo();
	myboard.position(game.fen())
	
	updateStatus()
}
function changeBoard() {
		newGame()
		if (this.options[this.selectedIndex].value == 'black') {
			getMove()
		}
	}
function loadEngine() {
  var engine = {ready: false, kill: false, waiting: true, depth: sdepth, lastnodes: 0};
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

newGame()
// --- End Example JS ----------------------------------------------------------