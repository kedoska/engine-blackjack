declare module 'engine-blackjack' {
    interface ActionPayload {
        bet?: number;
        position?: 'right' | 'left';
        sideBets?: SideBetsInfo;
        dealerHoleCardOnly?: boolean;
        type?: Action['type'];
        payload: ActionPayload;
    }

    interface Action {
        type:
            | 'RESTORE'
            | 'DEAL'
            | 'INSURANCE'
            | 'SPLIT'
            | 'HIT'
            | 'DOUBLE'
            | 'STAND'
            | 'SURRENDER'
            | 'SHOWDOWN'
            | 'DEALER-HIT'
            | 'INVALID';
        payload?: ActionPayload;
    }

    interface AvailableActions {
        double: boolean;
        split: boolean;
        insurance: boolean;
        hit: boolean;
        stand: boolean;
        surrender: boolean;
    }

    interface Card {
        text:
            | 'A'
            | '2'
            | '3'
            | '4'
            | '5'
            | '6'
            | '7'
            | '8'
            | '9'
            | '10'
            | 'J'
            | 'Q'
            | 'K';
        suite: 'hearts' | 'diamonds' | 'clubs' | 'spades';
        value: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10;
        color: 'R' | 'B';
    }

    interface HandValue {
        hi: number;
        lo: number;
    }

    interface Hand {
        bet: number;
        cards: Card[];
        playerValue: HandValue;
        playerHasBlackjack: boolean;
        playerHasBusted: boolean;
        playerHasSurrendered: boolean;
        close: boolean;
        availableActions: AvailableActions;
    }

    interface HandInfo {
        left: Hand;
        right: Hand;
    }

    interface SideBets {
        luckyLucky: boolean;
        perfectPairs: boolean;
        royalMatch: boolean;
        luckyLadies: boolean;
        inBet: boolean;
        MatchTheDealer: boolean;
    }

    interface Rule {
        decks: number;
        standOnSoft17: boolean;
        double: 'any' | '9or10' | '9or10or11' | '9thru15' | 'none';
        doubleAfterSplit: boolean;
        split: boolean;
        surrender: boolean;
        insurance: boolean;
        evenMoneyInsurance: boolean;
        showdownAfterAceSplit: boolean;
    }

    interface HistoryItem {
        type: Action['type'];
        payload?: ActionPayload;
        left?: Hand;
        right?: Hand;
        dealerCards?: Card[];
        value: number;
        ts: number
    }

    interface State {
        hits: number;
        initialBet: number;
        finalBet: number;
        finalWin: number;
        wonOnRight: number;
        wonOnLeft: number;
        stage:
            | 'STAGE_READY'
            | 'STAGE_PLAYER_TURN_RIGHT'
            | 'STAGE_PLAYER_TURN_LEFT'
            | 'STAGE_SHOWDOWN'
            | 'STAGE_DEALER_TURN'
            | 'STAGE_DONE';
        deck: Card[];
        handInfo: HandInfo;
        history: HistoryItem[];
        availableBets: SideBets;
        sideBetsInfo: SideBetsInfo;
        rules: Rule;
        dealerCards: Card[];
        dealerHoleCard: Card | null;
        dealerHasBlackjack: boolean;
        dealerHasBusted: boolean;
        cardCount: number;
    }

    interface SideBetsInfo {
        insurance?: { risk: number, win: number }
        luckyLucky: number;
        perfectPairs: number;
    }

    export class Game {
        public static canDouble(
            double: Rule['double'],
            playerValue: HandValue
        ): boolean;
        constructor(initialState?: State, rules?: Rule);
        public dispatch(action: Action): State;
        public enforceRules(handInfo: Hand): Hand;
        public getState(): State;
        public setState(state: Partial<State>): void;
    }

    export namespace actions {
        function deal(options?: { bet: number; sideBets: SideBetsInfo }): Action;
        // function dealerHit(options?: { dealerHoleCard: Card }): Action;
        function hit(options?: { position: 'right' | 'left' }): Action;
        function insurance(options?: { bet: number }): Action;
        // function invalid(action: Action, info: string): Action;
        function restore(): Action;
        // function showdown(options?: { dealerHoleCardOnly: boolean }): Action;
        function split(): Action;
        function stand(options?: { position: 'right' | 'left' }): Action;
        function surrender(): Action;
        function double(options?: { position: 'right' | 'left' }): Action;
    }

    export namespace engine {
        function calculate(cards: Card[]): HandValue;
        function checkForBusted(handValue: HandValue): boolean;
        function countCards(cards: Card[]): number;
        function getHandInfo(
            playerCards: Card[],
            dealerCards: Card[],
            hasSplit?: boolean
        ): Hand;
        function getHandInfoAfterDeal(
            playerCards: Card[],
            dealerCards: Card[],
            initialBet: number
        ): Hand;
        function getHandInfoAfterDouble(
            playerCards: Card[],
            dealerCards: Card[],
            initialBet: number,
            hasSplit: boolean
        ): Hand;
        function getHandInfoAfterHit(
            playerCards: Card[],
            dealerCards: Card[],
            initialBet: number,
            hasSplit: boolean
        ): Hand;
        function getHandInfoAfterInsurance(
            playerCards: Card[],
            dealerCards: Card[]
        ): Hand;
        function getHandInfoAfterSplit(
            playerCards: Card[],
            dealerCards: Card[],
            initialBet: number
        ): Hand;
        function getHandInfoAfterStand(handInfo: Hand): Hand;
        function getHandInfoAfterSurrender(handInfo: Hand): Hand;
        function getHigherValidValue(handValue: HandValue): number;
        function getLuckyLuckyMultiplier(
            playerCards: Card[],
            dealerCards: Card[]
        ): number;
        function getPrize(playerHand: Hand, dealerCards: Card[]): number;
        function getPrizes(gameInfo: {
            history: HistoryItem[];
            handInfo: HandInfo;
            dealerCards: Card[];
        }): { finalBet: number; wonOnRight: number; wonOnLeft: number };
        function getSideBetsInfo(
            availableBets: SideBets,
            sideBets: SideBets,
            playerCards: Card[],
            dealerCards: Card[]
        ): SideBetsInfo;
        function isActionAllowed(actionName: string, stage: string): boolean;
        function isBlackjack(cards: Card[]): boolean;
        function isLuckyLucky(
            playerCards: Card[],
            dealerCards: Card[]
        ): boolean;
        function isNull(obj: any): boolean;
        function isNullOrUndef(obj: any): boolean;
        function isPerfectPairs(playerCards: Card[]): boolean;
        function isSoftHand(cards: Card[]): boolean;
        function isSuited(cards: Card[]): boolean;
        function isUndefined(obj: any): boolean;
    }

    export namespace presets {
        function defaultState(rules: Rule): State;
        function getDefaultSideBets(active?: boolean): SideBets;
        function getRules(): Rule;
    }
}
