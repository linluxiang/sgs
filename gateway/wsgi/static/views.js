function Coord(x, y) {
    this.x = x;
    this.y = y;

    this.isIn = function(x, y, w, h) {
        return x <= this.x && this.x < x + w && y <= this.y && this.y < y + h;
    };

    this.offset = function(dx, dy) {
        return new Coord(this.x + dx, this.y + dy);
    };

    this.translate = function(dx, dy) {
        return this.offset(-dx, -dy);
    };
}

var HORI_PADDING = 10;
var VERT_PADDING = 16;
var CHILD_HORI_INTERVAL = 16;
var CHILD_VERT_INTERVAL = 12;
var CANVAS_W = 720;
var CANVAS_H = 540;
var CHILD_W = 108;
var CHILD_H = 144;
var CENTER_W = CHILD_W * 3 + CHILD_HORI_INTERVAL * 2;
var CENTER_H = CANVAS_H - (VERT_PADDING + CHILD_H + CHILD_VERT_INTERVAL) * 2
var ME_W = CHILD_W * 5 + CHILD_HORI_INTERVAL * 4;
var ME_H = CHILD_H;

function Game(pane) {
    /*
     *   5 4 3
     * 6       2
     * 7       1
     *  My Pos-
     */
    var FIRST_X = HORI_PADDING + CHILD_W + CHILD_HORI_INTERVAL;
    var FIRST_Y = VERT_PADDING;
    var SECOND_X = HORI_PADDING;
    var SECOND_Y = CANVAS_H - VERT_PADDING - CHILD_H * 3 -
                        CHILD_VERT_INTERVAL * 2 - 1;
    var THIRD_X = HORI_PADDING;
    var THIRD_Y = SECOND_Y + CHILD_H + CHILD_VERT_INTERVAL;
    var ME_X = HORI_PADDING;
    var ME_Y = THIRD_Y + CHILD_H + CHILD_VERT_INTERVAL;
    var childAreas = [
        new Coord(ME_X, ME_Y),
        new Coord(THIRD_X + (CHILD_W + CHILD_HORI_INTERVAL) * 4, THIRD_Y),
        new Coord(SECOND_X + (CHILD_W + CHILD_HORI_INTERVAL) * 4, SECOND_Y),
        new Coord(FIRST_X + (CHILD_W + CHILD_HORI_INTERVAL) * 2, FIRST_Y),
        new Coord(FIRST_X + CHILD_W + CHILD_HORI_INTERVAL, FIRST_Y),
        new Coord(FIRST_X, FIRST_Y),
        new Coord(SECOND_X, SECOND_Y),
        new Coord(THIRD_X, THIRD_Y),
    ];

    var canvas = document.createElement('canvas');
    var ctxt = canvas.getContext('2d');
    canvas.height = CANVAS_H;
    canvas.width = CANVAS_W;
    pane.appendChild(canvas);

    var me = new Me(ctxt, childAreas[0]);
    var players = [];
    this.initPosition = function(playersCount, pos) {
        players.length = 0;
        for (i = 0; i < 8; ++i) {
            if (i != pos) {
                players[i] = new Player(ctxt, childAreas[(8 + i - pos) % 8]);
            } else {
                players[i] = me;
            }
        }
    };

    this.player = function(id) {
        return players[id];
    };

    var CENTER_X = SECOND_X + CHILD_W + CHILD_HORI_INTERVAL;
    var CENTER_Y = FIRST_Y + CHILD_H + CHILD_VERT_INTERVAL;
    var center = new Center(ctxt, new Coord(CENTER_X, CENTER_Y));
    var hintparser = new SGS_HintParser(this, players, center);
    this.hint = function(result) {
        hintparser.hint(result);
    };

    canvas.onclick = function(event) {
        var coord = new Coord(event.offsetX, event.offsetY);
        if (coord.isIn(CENTER_X, CENTER_Y, CENTER_W, CENTER_H)) {
            center.click(coord.translate(CENTER_X, CENTER_Y));
        }
        if (coord.isIn(ME_X, ME_Y, ME_W, ME_H)) {
            me.click(coord.translate(ME_X, ME_Y));
        }
    }
}

var TEXT_H = 16;
var BORDER = 4;
var NUM_W = 16;

function drawBorder(ctxt, coord, width, height, borderSize, color) {
    ctxt.save();
    ctxt.translate(coord.x - borderSize, coord.y - borderSize);
    ctxt.fillStyle = color;
    ctxt.fillRect(0, 0, width + borderSize * 2, borderSize);
    ctxt.fillRect(0, 0, borderSize, height + borderSize * 2);
    ctxt.fillRect(0, height + borderSize, width + borderSize * 2, borderSize);
    ctxt.fillRect(width + borderSize, 0, borderSize, height + borderSize * 2);
    ctxt.restore();
}

function Player(ctxt, coord) {
    this.cards_count = 0;
    this.drawCount = function(count) {
        ctxt.save();
        ctxt.translate(coord.x, coord.y);
        this.cards_count += count;
        ctxt.save();
        ctxt.fillStyle = '#fff';
        ctxt.fillRect(0, TEXT_H, NUM_W, TEXT_H);
        ctxt.restore();

        ctxt.textBaseline = 'top';
        ctxt.fillText(this.cards_count, 0, NUM_W, TEXT_H);
        ctxt.restore();
    };
    this.activate = function() {
        drawBorder(ctxt, coord, CHILD_W, CHILD_H, BORDER, '#f33');
    };
    this.deactivate = function() {
        drawBorder(ctxt, coord, CHILD_W, CHILD_H, BORDER, '#aaa');
    };
    this.selectCharacter = function(name, max_vigor) {
        ctxt.save();
        ctxt.translate(coord.x, coord.y);
        ctxt.textBaseline = 'top';
        ctxt.fillText(name, 0, 0, CHILD_W - BORDER * 2);
        ctxt.fillText(Array(max_vigor + 1).join('[]'), TEXT_H, NUM_W,
                      CHILD_W - NUM_W - BORDER * 2);
        ctxt.restore();
    };
}

function Me(ctxt, coord) {
    var LEFT_AREA = 80;
    var CARD_W = 48;
    function paintCard(card, position) {
        ctxt.save();
        ctxt.translate(coord.x, coord.y);

        var x = position * CARD_W + LEFT_AREA;
        ctxt.save();
        ctxt.fillStyle = card.selected ? '#fff' : '#ddd';
        ctxt.fillRect(x, 0, CARD_W, ME_H);
        ctxt.restore();

        ctxt.save();
        ctxt.textBaseline = 'top';
        ctxt.save();
        ctxt.fillStyle = SGS_STR_CARD_SUITS_COLOR[card.suit];
        ctxt.fillText(SGS_STR_CARD_RANKS[card.rank], x, 0, NUM_W);
        ctxt.fillText(SGS_STR_CARD_SUITS[card.suit], x + NUM_W, 0, NUM_W);
        ctxt.restore();
        ctxt.fillText(card.name, x, TEXT_H, CARD_W);
        ctxt.restore();

        ctxt.restore();
    }

    this.click = function(c) {
        if (LEFT_AREA <= c.x && c.x < LEFT_AREA + cards.length * CARD_W) {
            var index = Math.floor((c.x - LEFT_AREA) / CARD_W);
            card = cards[index];
            card.selected = !card.selected;
            paintCard(card, index);
        }
    };

    var cards = new Array();

    this.drawCards = function(new_cards) {
        for (c in new_cards) {
            new_cards[c].selected = false;
        }
        cards = cards.concat(new_cards);
        for (i = 0; i < cards.length; ++i) {
            paintCard(cards[i], i);
        }
    };
    this.activate = function() {
        drawBorder(ctxt, coord, ME_W, ME_H, BORDER, '#bb1');
    };
    this.deactivate = function() {
        drawBorder(ctxt, coord, ME_W, ME_H, BORDER, '#aaa');
    };
    this.selectCharacter = function(name, max_vigor) {
        ctxt.save();
        ctxt.translate(coord.x, coord.y);
        ctxt.textBaseline = 'top';
        ctxt.fillText(name, 0, 0, 80);
        ctxt.fillText(Array(max_vigor + 1).join('[]'), 0, TEXT_H, LEFT_AREA);
        ctxt.restore();
    };
}

function Center(ctxt, coord) {
    drawBorder(ctxt, coord, CENTER_W, CENTER_H, BORDER, '#798');
    this.click = function(c) {}
    this.selectCharacters = function(candidates) {
        ctxt.save();
        ctxt.translate(coord.x, coord.y);
        var width = (CENTER_W - (CHILD_HORI_INTERVAL * (candidates.length - 1)))
                        / candidates.length;
        ctxt.textBaseline = 'top';
        for (i = 0; i < candidates.length; ++i) {
            ctxt.fillStyle = '#ddd';
            var x = (width + CHILD_HORI_INTERVAL) * i;
            ctxt.fillRect(x, 0, width, CENTER_H);
            ctxt.fillStyle = '#000';
            ctxt.fillText(candidates[i], x, 0, width);
        }
        ctxt.restore();
        this.click = function(c) {
            if (c.x % Math.floor(width + CHILD_HORI_INTERVAL) <= width) {
                var index = Math.floor(c.x / (width + CHILD_HORI_INTERVAL));
                post_act({ 'select': candidates[index] });
                ctxt.save();
                ctxt.translate(coord.x, coord.y);
                ctxt.fillStyle = '#fff';
                ctxt.fillRect(0, 0, CENTER_W, CENTER_H);
                ctxt.restore();
                this.click = function(c) {}
            }
        }
    };
}
