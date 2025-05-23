module agar_betting::betting {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::event;
    use sui::transfer;
    use std::vector;
    use std::string;
    use sui::sui::SUI;

    const HOUSE_EDGE: u64 = 6050;  // 6.05% = 6050/1e5

    // 玩家信息
    public struct Player has store, drop {
        id: u8,
        name: string::String,
        raw_win_rate: u64,      // 真实胜率（百万分比，1e6=100%）
        adjusted_odds: u64,     // 调整后赔率（百万分比，1e6=1.0）
    }

    // 比赛状态
    public struct Game has key, store {
        id: UID,
        players: vector<Player>,
        is_active: bool,
        bets: Table<address, vector<u64>>, // 用户地址 → [玩家1下注金额, ..., 玩家8下注金额]
        bettors: vector<address>,          // 所有投注者的地址
        house_edge: u64,        // 主办方抽成（百万分比，6050=6.05%）
        pool: Balance<SUI>,     // 资金池
    }

    // 事件定义
    public struct BetPlaced has copy, drop {
        player_id: u8,
        amount: u64,
        bettor: address,
    }

    public struct GameEnded has copy, drop {
        winner_id: u8,
        total_payout: u64,
    }

    // 创建玩家
    fun create_player(id: u8, name: vector<u8>, raw_win_rate: u64): Player {
        Player {
            id,
            name: string::utf8(name),
            raw_win_rate,
            adjusted_odds: 0,
        }
    }

    // 计算总胜率
    fun calculate_total_win_rate(players: &vector<Player>): u64 {
        let mut total = 0u64;
        let len = vector::length(players);
        let mut i = 0;
        while (i < len) {
            let player = vector::borrow(players, i);
            total = total + player.raw_win_rate;
            i = i + 1;
        };
        total
    }

    // 调整玩家赔率
    fun adjust_player_odds(player: &mut Player, total_win_rate: u64) {
        let norm_rate = if (total_win_rate > 0) {
            (player.raw_win_rate * 1_000_000) / total_win_rate
        } else { 0 };
        let adjusted_rate = (norm_rate * 10_605) / 10_000;
        player.adjusted_odds = (1_000_000 * 1_000_000) / adjusted_rate;
    }

    // 初始化玩家列表
    fun init_players(): vector<Player> {
        let mut players = vector::empty<Player>();
        vector::push_back(&mut players, create_player(1, b"Alice", 200_000));    // 20%
        vector::push_back(&mut players, create_player(2, b"Bob", 150_000));      // 15%
        vector::push_back(&mut players, create_player(3, b"Charlie", 130_000));  // 13%
        vector::push_back(&mut players, create_player(4, b"David", 120_000));    // 12%
        vector::push_back(&mut players, create_player(5, b"Eve", 100_000));      // 10%
        vector::push_back(&mut players, create_player(6, b"Frank", 90_000));     // 9%
        vector::push_back(&mut players, create_player(7, b"Grace", 70_000));     // 7%
        vector::push_back(&mut players, create_player(8, b"Helen", 140_000));    // 14%
        players
    }

    // 初始化比赛
    #[allow(unused_type_parameter)]
    public fun init_game(
        coin: Coin<SUI>,
        ctx: &mut TxContext
    ): Game {
        let mut players = init_players();
        let total_win_rate = calculate_total_win_rate(&players);
        
        let len = vector::length(&players);
        let mut i = 0;
        while (i < len) {
            let player = vector::borrow_mut(&mut players, i);
            adjust_player_odds(player, total_win_rate);
            i = i + 1;
        };

        let pool = coin::into_balance(coin);

        Game {
            id: object::new(ctx),
            players,
            is_active: true,
            bets: table::new(ctx),
            bettors: vector::empty(),
            house_edge: HOUSE_EDGE,
            pool,
        }
    }

    // 初始化下注向量
    fun init_bet_vector(): vector<u64> {
        let mut bets = vector::empty<u64>();
        let mut i = 0;
        while (i < 8) {
            vector::push_back(&mut bets, 0);
            i = i + 1;
        };
        bets
    }

    // 下注功能
    public entry fun place_bet(
        game: &mut Game,
        player_id: u8,
        amount: u64,
        coin: &mut Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(game.is_active, 0x1);
        assert!(player_id >= 1 && player_id <= 8, 0x2);

        let bet_coin = coin::split(coin, amount, ctx);
        let sender = tx_context::sender(ctx);

        if (!table::contains(&game.bets, sender)) {
            let bets = init_bet_vector();
            table::add(&mut game.bets, sender, bets);
            vector::push_back(&mut game.bettors, sender);
        };

        let bets_vec = table::borrow_mut(&mut game.bets, sender);
        let old_amount = vector::borrow_mut(bets_vec, (player_id - 1) as u64);
        *old_amount = *old_amount + amount;

        let coin_balance = coin::into_balance(bet_coin);
        balance::join(&mut game.pool, coin_balance);

        event::emit(BetPlaced {
            player_id,
            amount,
            bettor: sender,
        });
    }

    // 结算比赛
    public entry fun end_game(
        game: &mut Game,
        winner_id: u8,
        ctx: &mut TxContext
    ) {
        assert!(game.is_active, 0x1);
        assert!(winner_id >= 1 && winner_id <= 8, 0x2);
        game.is_active = false;

        let pool_size = balance::value(&game.pool);
        let house_cut = (pool_size * game.house_edge) / 1_000_000;
        let payout_pool = pool_size - house_cut;

        let winner_idx = (winner_id - 1) as u64;
        let winner_player = vector::borrow(&game.players, winner_idx);
        let winner_odds = winner_player.adjusted_odds;

        let len = vector::length(&game.bettors);
        let mut i = 0;
        while (i < len) {
            let addr = *vector::borrow(&game.bettors, i);
            let bets_vec = table::borrow(&game.bets, addr);
            let bet_amount = *vector::borrow(bets_vec, winner_idx);
            if (bet_amount > 0) {
                let reward = (bet_amount * winner_odds) / 1_000_000;
                let reward_coin = coin::from_balance(balance::split(&mut game.pool, reward), ctx);
                transfer::public_transfer(reward_coin, addr);
            };
            i = i + 1;
        };

        event::emit(GameEnded {
            winner_id,
            total_payout: payout_pool,
        });
    }

    // 转移游戏对象（仅测试用）
    #[test_only]
    public fun transfer_game(game: Game, recipient: address) {
        transfer::transfer(game, recipient);
    }

    // 转移币（仅测试用）
    #[test_only]
    public fun transfer_coin(coin: Coin<SUI>, recipient: address) {
        transfer::public_transfer(coin, recipient);
    }

    // 获取玩家赔率（测试用）
    public fun get_odds(game: &Game, player_id: u8): u64 {
        let idx = (player_id - 1) as u64;
        let player = vector::borrow(&game.players, idx);
        player.adjusted_odds
    }

    // 获取资金池余额（测试用）
    public fun get_pool_value(game: &Game): u64 {
        balance::value(&game.pool)
    }

    // 添加这个公共入口函数
    public entry fun create_game(
        coin: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let game = init_game(coin, ctx);
        transfer::transfer(game, tx_context::sender(ctx));
    }
}