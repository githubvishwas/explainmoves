// --- Begin Example JS --------------------------------------------------------
// NOTE: this example uses the chess.js library:
// https://github.com/jhlywa/chess.js

var START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
var _engine, _evalengine, _curmoves = [];
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
var prevScore = 0.0
var currScore = 0.0
var evalLevel = 10
var evalDepth = 10
const proceedBtn = document.getElementById("proceed");
const undoBtn = document.getElementById("undo");
const hintBtn = document.getElementById("hint");
proceedBtn.setAttribute("disabled", "disabled");
undoBtn.setAttribute("disabled", "disabled");
hintBtn.setAttribute("disabled", "disabled");
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

function updateStatus_bak() {
	
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
function makeEngineMove () {
	//console.log("start move")
	_engine.kill = false;
	_engine.waiting = false;
	_engine.send("stop");
	_engine.send("ucinewgame");
	var e = document.getElementById("sel1");
	var level = e.options[e.selectedIndex].value;
	_engine.send("setoption name Skill Level value " + level); 
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
	});
	
	
}

function getEngineEval () {
	_evalengine.kill = false;
	_evalengine.waiting = false;
	_evalengine.send("stop");
	_evalengine.send("ucinewgame");
	//var e = document.getElementById("sel1");
	//var level = e.options[e.selectedIndex].value;
	_evalengine.send("setoption name Skill Level value " + evalLevel); 
	_evalengine.score = null;
	_evalengine.eval(game.fen(),function done(str) {}, function info(depth, score, pv, str) {
		//console.log(depth)
        if(depth == evalDepth) {
			//console.log(score)
			//document.getElementById("cpscore").innerHTML = " CP score: " + score/100;
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
			prevScore = currScore
			currScore = score/100
				
			var absdiff = Math.abs(prevScore - currScore)
			
			var e = document.getElementById("sel1");
			var wlevel = e.options[e.selectedIndex].value;
			if(wlevel != 4) {
				if(absdiff > 0.5 && absdiff < 1 && game.history().length > 8 && wlevel == 1) {
					document.getElementById("coachspeak").innerHTML = "<span style='color: blue;'>Small mistake?</span>";
				} else if(absdiff > 1 && absdiff < 2 && wlevel >=2) {
					document.getElementById("coachspeak").innerHTML = "<span style='color: purple;'>Mistake?</span>";
				} else if(absdiff > 2 ){
					document.getElementById("coachspeak").innerHTML = "<span style='color: red;'>Big mistake?</span>";
				} else if(game.history().length < 9){
					document.getElementById("coachspeak").innerHTML = "<span style='color: green;'>Too early to say anything!</span>";;
				} else if(wlevel == 1){
					document.getElementById("coachspeak").innerHTML = "<span style='color: green;'>Good move</span>";;
				}
				//document.getElementById("coachspeak").innerHTML += " " + prevScore + " " + currScore + " " + absdiff 
				//document.getElementById("cpscore").innerHTML = " Score: " + currScore;
			}
			
			//document.getElementById("staticscore").innerHTML = " Static eval: " + _staticscore 
			//document.getElementById("bestmoves").innerHTML = pv;
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

	makeEngineMove()
	getEngineEval()
    myboard.position(game.fen());
	updateStatus();
   
    if (game.game_over()) {
        alert('Game over');
    }
};
function Proceed() {
  makeBestMove();
  updateStatus();
  myboard.position(game.fen())	
  ret = getOpeningInfo(game.pgn())
	if(ret.length == 3) {
		document.getElementById("openinfo").innerHTML = " Opening Info: " + "ECO: " + ret[0] + " White: " + ret[1];
		if(ret[2] != "") {
			document.getElementById("openinfo").innerHTML += " Black: " + ret[2];
		}
		document.getElementById("openinfo").innerHTML += " moves: " + ret[3];
	} 
	
	proceedBtn.setAttribute("disabled", "disabled");
	proceedBtn.style.background = ''
	undoBtn.setAttribute("disabled", "disabled");
	undoBtn.style.background = ''
	hintBtn.setAttribute("disabled", "disabled");
	hintBtn.style.background = ''
}
function onDrop (source, target) {
  
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })
 
  // illegal move
  if (move === null) return 'snapback'
  updateStatus();
  
  ret = getOpeningInfo(game.pgn())
	if(ret.length == 4) {
		document.getElementById("openinfo").innerHTML = " Opening Info: " + "ECO: " + ret[0] + " White: " + ret[1];
		if(ret[2] != "") {
			document.getElementById("openinfo").innerHTML += " Black: " + ret[2];
		}
		
	} 
	
  getEngineEval()
  proceedBtn.removeAttribute("disabled");
  proceedBtn.style.background = 'lightgreen'
  undoBtn.removeAttribute("disabled");
  undoBtn.style.background = 'lightgreen'
  hintBtn.style.background = 'lightgreen'
  hintBtn.removeAttribute("disabled");
  //postUserMoveFunc()
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

function getOpeningInfo(curpgn) {
	var ngame = new Chess()
	ngame.load_pgn(curpgn)
	var nmoves = ngame.history().join().replace(/,/g, " ");
	//console.log(nmoves)  
	var retArr = []
	  for (var i = 0; i < eco_openings.length; i++) {
		//console.log(eco_openings[i].moves)
		if (nmoves ==  eco_openings[i].moves)
		{
			retArr.push(eco_openings[i].eco)
			retArr.push(eco_openings[i].white)
			retArr.push(eco_openings[i].black)
			retArr.push(eco_openings[i].moves)
			return retArr
		}
	  }
	  return retArr
	//var positionInfoText = "Position: "+(_historyindex+1)+" of "+_history.length+" - Last move: ";
}
var newGame = function() {
	prevScore = 0.0
	currScore = 0.0
	document.getElementById("coachspeak").innerHTML = ""
	document.getElementById("cpscore").innerHTML = ""
	document.getElementById("openinfo").innerHTML = ""
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
	//game.undo();
	myboard.position(game.fen())
	getEngineEval()
	prevScore = currScore
	
	document.getElementById("coachspeak").innerHTML = ""
	document.getElementById("cpscore").innerHTML = ""
	document.getElementById("openinfo").innerHTML = ""
	//updateStatus()
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
function loadEvalEngine() {
  var engine = {ready: false, kill: false, waiting: true, depth: evalDepth, lastnodes: 0};
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
_evalengine = loadEvalEngine();
newGame()
// --- End Example JS ----------------------------------------------------------