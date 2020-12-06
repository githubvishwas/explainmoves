//Main evaluation. An evaluation function is used to heuristically determine the relative value of a positions used in general case when 
//no specialized evaluation or tablebase evaluation is available. In Stockfish it is never applied for positions where king of either side 
//is in check. Resulting value is computed by combining Middle game evaluation and End game evaluation. 
//We use Tapered Eval, a technique used in evaluation to make a smooth transition between the phases of the game. 
//Phase is a coeficient of simple linear combination. Before using End game evaluation in this formula we also scale it down using Scale factor.

function main_evaluation(pos) {
  var mg = middle_game_evaluation(pos);
  var eg = end_game_evaluation(pos);
  var p = phase(pos), rule50 = rule50(pos);
  eg = eg * scale_factor(pos, eg) / 64;
  var v = (((mg * p + ((eg * (128 - p)) << 0)) / 128) << 0);
  if (arguments.length == 1) v = ((v / 16) << 0) * 16;
  v += tempo(pos);
  v = (v * (100 - rule50) / 100) << 0;
  return v;
}
//Middle game evaluation. Evaluates position for the middlegame and the opening phases.
function middle_game_evaluation(pos, nowinnable) {
  var v = 0;
  v += piece_value_mg(pos) - piece_value_mg(colorflip(pos));
  v += psqt_mg(pos) - psqt_mg(colorflip(pos));
  v += imbalance_total(pos);
  v += pawns_mg(pos) - pawns_mg(colorflip(pos));
  v += pieces_mg(pos) - pieces_mg(colorflip(pos));
  v += mobility_mg(pos) - mobility_mg(colorflip(pos));
  v += threats_mg(pos) - threats_mg(colorflip(pos));
  v += passed_mg(pos) - passed_mg(colorflip(pos));
  v += space(pos) - space(colorflip(pos));
  v += king_mg(pos) - king_mg(colorflip(pos));
  if (!nowinnable) v += winnable_total_mg(pos, v);
  return v;
}
//End game evaluation. Evaluates position for the endgame phase.
function end_game_evaluation(pos, nowinnable) {
  var v = 0;
  v += piece_value_eg(pos) - piece_value_eg(colorflip(pos));
  v += psqt_eg(pos) - psqt_eg(colorflip(pos));
  v += imbalance_total(pos);
  v += pawns_eg(pos) - pawns_eg(colorflip(pos));
  v += pieces_eg(pos) - pieces_eg(colorflip(pos));
  v += mobility_eg(pos) - mobility_eg(colorflip(pos));
  v += threats_eg(pos) - threats_eg(colorflip(pos));
  v += passed_eg(pos) - passed_eg(colorflip(pos));
  v += king_eg(pos) - king_eg(colorflip(pos));
  if (!nowinnable) v += winnable_total_eg(pos, v);
  return v;
}
//Scale factor. The scale factors are used to scale the endgame evaluation score down.
function scale_factor(pos, eg) {
  if (eg == null) eg = end_game_evaluation(pos);
  var pos2 = colorflip(pos);
  var pos_w = eg > 0 ? pos : pos2;
  var pos_b = eg > 0 ? pos2 : pos;
  var sf = 64;
  var pc_w = pawn_count(pos_w), pc_b = pawn_count(pos_b);
  var qc_w = queen_count(pos_w), qc_b = queen_count(pos_b);
  var bc_w = bishop_count(pos_w), bc_b = bishop_count(pos_b);
  var nc_w = knight_count(pos_w), nc_b = knight_count(pos_b);
  var npm_w = non_pawn_material(pos_w), npm_b = non_pawn_material(pos_b);
  var bishopValueMg = 825, bishopValueEg = 915, rookValueMg = 1276;
  if (pc_w == 0 && npm_w - npm_b <= bishopValueMg) sf = npm_w < rookValueMg ? 0 : npm_b <= bishopValueMg ? 4 : 14;
  if (sf == 64) {
    var ob = opposite_bishops(pos);
    if (ob && npm_w == bishopValueMg && npm_b == bishopValueMg) {
      sf = 22 + 4 * candidate_passed(pos_w);
    } else if (ob) {
      sf = 22 + 3 * piece_count(pos_w);
    } else {
      if (npm_w == rookValueMg && npm_b == rookValueMg && pc_w - pc_b <= 1) {
        var pawnking_b = 0, pcw_flank = [0, 0];
        for (var x = 0; x < 8; x++) {
          for (var y = 0; y < 8; y++) {
            if (board(pos_w, x, y) == "P") pcw_flank[(x < 4)?1:0] = 1;
            if (board(pos_b, x, y) == "K") {
              for (var ix = -1; ix <= 1; ix++) {
                for (var iy = -1; iy <= 1; iy++) {
                  if (board(pos_b, x + ix, y + iy) == "P") pawnking_b = 1;
                }
              }
            }
          }
        }
        if (pcw_flank[0] != pcw_flank[1] && pawnking_b) return 36;
      }
      if (qc_w + qc_b == 1) {
        sf = 37 + 3 * (qc_w == 1 ? bc_b + nc_b : bc_w + nc_w);
      } else {
        sf = Math.min(sf, 36 + 7 * pc_w);
      }
    }
  }
  return sf;
}
//Phase. We define phase value for tapered eval based on the amount of non-pawn material on the board
function phase(pos) {
  var midgameLimit = 15258, endgameLimit  = 3915;
  var npm = non_pawn_material(pos) + non_pawn_material(colorflip(pos));
  npm = Math.max(endgameLimit, Math.min(npm, midgameLimit));
  return (((npm - endgameLimit) * 128) / (midgameLimit - endgameLimit)) << 0;
}
//Tempo. In chess, tempo refers to a "turn" or single move. When a player achieves a desired result in one fewer move, 
//the player "gains a tempo"; and conversely when a player takes one more move than necessary, the player "loses a tempo". 
//We add small bonus for having the right to move.
function tempo(pos, square) {
  if (square != null) return 0;
  return 28 * (pos.w ? 1 : -1);
}
//Rule50
function rule50(pos, square) {
  if (square != null) return 0;
  return pos.m[0];
}
//Pinned direction. Helper function for detecting blockers for king. 
//For our pinned pieces result is positive for enemy blockers negative and value encodes direction of pin. 
//1 - horizontal, 2 - topleft to bottomright, 3 - vertical, 4 - topright to bottomleft
//This shows a javascript implementation of this evaluation term "Pinned direction" from the point of view of white player.
function pinned_direction(pos, square) {
  if (square == null) return sum(pos, pinned_direction);
  if ("PNBRQK".indexOf(board(pos, square.x, square.y).toUpperCase()) < 0) return 0;
  var color = 1;
  if ("PNBRQK".indexOf(board(pos, square.x, square.y)) < 0) color = -1;
  for (var i = 0; i < 8; i++) {
    var ix = (i + (i > 3)) % 3 - 1;
    var iy = (((i + (i > 3)) / 3) << 0) - 1;
    var king = false;
    for (var d = 1; d < 8; d++) {
      var b = board(pos, square.x + d * ix, square.y + d * iy);
      if (b == "K") king = true;
      if (b != "-") break;
    }
    if (king) {
      for (var d = 1; d < 8; d++) {
        var b = board(pos, square.x - d * ix, square.y - d * iy);
        if (b == "q"
         || b == "b" && ix * iy != 0
         || b == "r" && ix * iy == 0) return Math.abs(ix + iy * 3) * color;
        if (b != "-") break;
      }
    }
  }
  return 0;
}
//Knight attack counts number of attacks on square by knight.
//This shows a javascript implementation of this evaluation term "Knight attack" from the point of view of white player.
function knight_attack(pos, square, s2) {
  if (square == null) return sum(pos, knight_attack);
  var v = 0;
  for (var i = 0; i < 8; i++) {
    var ix = ((i > 3) + 1) * (((i % 4) > 1) * 2 - 1);
    var iy = (2 - (i > 3)) * ((i % 2 == 0) * 2 - 1);
    var b = board(pos, square.x + ix, square.y + iy);
    if (b == "N"
    && (s2 == null || s2.x == square.x + ix && s2.y == square.y + iy)
    && !pinned(pos, {x:square.x + ix, y:square.y + iy})) v++;
  }
  return v;
}
//Bishop xray attack counts number of attacks on square by bishop. Includes x-ray attack through queens.
//This shows a javascript implementation of this evaluation term "Bishop xray attack" from the point of view of white player.
function bishop_xray_attack(pos, square, s2) {
  if (square == null) return sum(pos, bishop_xray_attack);
  var v = 0;
  for (var i = 0; i < 4; i++) {
    var ix = ((i > 1) * 2 - 1);
    var iy = ((i % 2 == 0) * 2 - 1);
    for (var d = 1; d < 8; d++) {
      var b = board(pos, square.x + d * ix, square.y + d * iy);
      if (b == "B"
      && (s2 == null || s2.x == square.x + d * ix && s2.y == square.y + d * iy)) {
        var dir = pinned_direction(pos, {x:square.x+d*ix, y:square.y+d*iy});
        if (dir == 0 || Math.abs(ix+iy*3) == dir) v++;
      }
      if (b != "-" && b != "Q" && b != "q") break;
    }
  }
  return v;
}
//Rook xray attack counts number of attacks on square by rook. Includes x-ray attack through queens and our rook.
//This shows a javascript implementation of this evaluation term "Rook xray attack" from the point of view of white player.
