import core.src.card as card

class CardInfo:
    def __init__(self, name, rank, suit):
        self.name = name
        self.rank = rank
        self.suit = suit

def gen_cards(cards_info):
    class IdGen:
        i = 0

        def __init__(self):
            self.i = 0

        def next(self):
            r = self.i
            self.i += 1
            return r
    id_gen = IdGen()
    def card_gen(info):
        return card.Card(id_gen.next(), info.name, info.rank, info.suit)
    return map(card_gen, cards_info)

class CardPool:
    def __init__(self, cards):
        self.discarded = []
        self.cards = cards
        self.id_to_card = { c.card_id: c for c in cards }
        self.player_id_to_owning_cards = {}

    def _recycle(self, card):
        self.player_id_to_owning_cards[card.owner_or_nil.player_id].remove(card)
        card.set_region('cardpool')
        card.set_owner(None)
        card.restore()

    def deal(self, player, cnt):
        self.check_player_recorded(player)
        result = self.cards[:cnt]
        self.cards = self.cards[cnt:]
        [c.set_owner(player) for c in result]
        [c.set_region('cards') for c in result]
        self.player_id_to_owning_cards[player.player_id].extend(result)
        return result

    def discard(self, cards):
        self.discarded.extend(cards)
        for c in cards: self._recycle(c)

    def cards_by_ids(self, cards_ids):
        return map(lambda card_id: self.id_to_card[card_id], cards_ids)

    def player_has_cards(self, player):
        return len(filter(lambda c: c.available(),
                          self.player_id_to_owning_cards[player.player_id])) > 0

    def player_has_cards_at(self, player, region):
        return self.player_cards_count_at(player, region) > 0

    def player_cards_count_at(self, player, region):
        return len(filter(lambda c: c.available() and c.region == region,
                          self.player_id_to_owning_cards[player.player_id]))

    def random_pick_cards(self, player, count):
        cards = filter(lambda c: c.region == 'cards',
                       self.player_id_to_owning_cards[player.player_id])
        return cards[0: count]

    def cards_transfer(self, target, cards):
        for c in cards:
            self.player_id_to_owning_cards[c.owner_or_nil.player_id].remove(c)
            c.set_region('cards')
            c.set_owner(target)
            c.restore()
        self.player_id_to_owning_cards[target.player_id].extend(cards)

    def recycle_cards_of_player(self, player):
        self.discard(self.player_id_to_owning_cards[player.player_id])

    def check_player_recorded(self, player):
        if not player.player_id in self.player_id_to_owning_cards:
            self.player_id_to_owning_cards[player.player_id] = []
