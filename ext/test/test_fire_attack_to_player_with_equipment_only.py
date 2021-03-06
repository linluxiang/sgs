from core.src.game_control import GameControl
from core.src.event import EventList
from core.src.action_stack import ActionStack
import core.src.card as card
import core.src.ret_code as ret_code
from ext.src.players_control import PlayersControl
from ext.src.player import Player

from test_common import *
import test_data

pc = PlayersControl()
gc = GameControl(EventList(), test_data.CardPool(test_data.gen_cards([
            test_data.CardInfo('zhangba serpent spear', 1, card.SPADE),
            test_data.CardInfo('slash', 2, card.HEART),
            test_data.CardInfo('slash', 3, card.DIAMOND),
            test_data.CardInfo('slash', 4, card.HEART),

            test_data.CardInfo('fire attack', 5, card.CLUB),
            test_data.CardInfo('sabotage', 6, card.HEART),
            test_data.CardInfo('sabotage', 7, card.DIAMOND),
            test_data.CardInfo('sabotage', 8, card.DIAMOND),

            test_data.CardInfo('slash', 9, card.SPADE),
            test_data.CardInfo('slash', 10, card.SPADE),

            test_data.CardInfo('fire attack', 11, card.HEART),
            test_data.CardInfo('sabotage', 12, card.DIAMOND),
     ])), pc, ActionStack())
players = [Player(91, 3), Player(1729, 4)]
map(lambda p: pc.add_player(p), players)
gc.start()

result = gc.player_act({
                           'token': players[0].token,
                           'action': 'equip',
                           'use': [0],
                       })
assert_eq(ret_code.OK, result['code'])
result = gc.player_act({
                           'token': players[0].token,
                           'action': 'give up',
                       })
assert_eq(ret_code.OK, result['code'])
result = gc.player_act({
                           'token': players[0].token,
                           'discard': [2, 3],
                       })
assert_eq(ret_code.OK, result['code'])

# player 0 show the weapon
result = gc.player_act({
                           'token': players[1].token,
                           'action': 'fire attack',
                           'targets': [players[0].player_id],
                           'use': [10],
                       })
assert_eq(ret_code.OK, result['code'])

result = gc.player_act({
                           'token': players[0].token,
                           'show': [0],
                       })
assert_eq({
              'code': ret_code.BAD_REQUEST,
              'reason': ret_code.BR_WRONG_ARG % 'bad region',
          }, result)

result = gc.player_act({
                           'token': players[0].token,
                           'show': [1],
                       })
assert_eq(ret_code.OK, result['code'])

result = gc.player_act({
                           'token': players[1].token,
                           'discard': [],
                       })
assert_eq(ret_code.OK, result['code'])

# sabotage all in-hand cards of player 0
for i in range(0, 3):
    result = gc.player_act({
                               'token': players[1].token,
                               'action': 'sabotage',
                               'targets': [players[0].player_id],
                               'use': [5 + i],
                           })
    assert_eq(ret_code.OK, result['code'])
    result = gc.player_act({
                               'token': players[1].token,
                               'sabotage': 'cards',
                           })
    assert_eq(ret_code.OK, result['code'])

result = gc.player_act({
                           'token': players[1].token,
                           'action': 'fire attack',
                           'targets': [players[0].player_id],
                           'use': [4],
                       })
assert_eq({
              'code': ret_code.BAD_REQUEST,
              'reason': ret_code.BR_WRONG_ARG % 'forbid target no card',
          }, result)

last_event_id = len(gc.get_events(players[0].token, 0)) # until getting cards
