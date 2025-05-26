import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SUI_CLIENT } from '../config/sui';

const PACKAGE_ID = import.meta.env.VITE_Betting_CONTRACT_PACKAGE_ID;

/**
 * 玩家下注
 * @param gameId 游戏对象ID
 * @param playerId 玩家ID (1-8)
 * @param amount 下注金额 (MIST单位)
 * @param coinObjectId 用于下注的SUI代币对象ID
 * @param signAndExecuteTransactionBlock 来自钱包的签名函数
 */
export async function placeBetOnContract(
  gameId: string,
  playerId: number,
  amount: number, // 注意：合约期望的是MIST单位，如果前端是SUI，需要转换
  coinObjectId: string,
  signAndExecuteTransactionBlock: (txb: TransactionBlock) => Promise<any> // 根据您的钱包适配器调整类型
) {
  // 使用 TransactionBlock 类创建实例
  const txb = new TransactionBlock();
  txb.moveCall({
    target: `${PACKAGE_ID}::betting::place_bet`,
    arguments: [
      txb.object(gameId),
      txb.pure(playerId, 'u64'), 
      txb.pure(amount, 'u64'),    
      txb.object(coinObjectId),
    ],
  });

  try {
    const result = await signAndExecuteTransactionBlock(txb);
    console.log('下注交易已提交:', result.digest);
    // 可以在这里进一步处理交易结果，例如等待交易确认
    await SUI_CLIENT.waitForTransaction({ digest: result.digest });
    console.log('下注交易成功确认:', result.digest);
    return { success: true, digest: result.digest };
  } catch (error) {
    console.error('下注失败:', error);
    return { success: false, error };
  }
}

/**
 * 创建游戏e
 * @param coinObjectId SUI 代币对象ID，用于初始化资金池
 * @param signAndExecuteTransactionBlock 来自钱包的签名函数
 */
export async function createGameOnContract(
  coinObjectId: string,
  // 将类型更改为 TransactionBlock
  signAndExecuteTransactionBlock: (txb: TransactionBlock) => Promise<any>
) {
  // 使用 TransactionBlock 类创建实例
  const txb = new TransactionBlock();
  txb.moveCall({
    target: `${PACKAGE_ID}::betting::create_game`,
    arguments: [txb.object(coinObjectId)],
  });

  try {
    // --- MODIFICATION START ---
    console.log('createGameOnContract: Attempting to sign and execute transaction block.');
    // 可选：如果需要，可以打印 txb 对象，但它可能很大
    // console.log('createGameOnContract: TransactionBlock object:', txb);
    console.log('createGameOnContract: Using coinObjectId:', coinObjectId);
    console.log('createGameOnContract: Using packageId:', PACKAGE_ID);
    // --- MODIFICATION END ---

    const result = await signAndExecuteTransactionBlock(txb);

    // --- MODIFICATION START ---
    console.log('createGameOnContract: signAndExecuteTransactionBlock returned:', result);
    // --- MODIFICATION END ---

    console.log('创建游戏交易已提交:', result.digest);

    // 等待交易确认并获取游戏ID
    const txDetails = await SUI_CLIENT.waitForTransaction({
      digest: result.digest,
      options: {
        showEffects: true,
      },
    });

    if (txDetails.effects?.created?.length && txDetails.effects.created[0].reference.objectId) {
      const gameId = txDetails.effects.created[0].reference.objectId;
      console.log('新游戏ID:', gameId);
      return { success: true, digest: result.digest, gameId };
    } else {
      console.error('创建游戏成功，但无法获取游戏ID:', txDetails);
      return { success: false, error: '无法获取游戏ID', digest: result.digest };
    }
  } catch (error) {
    console.error('创建游戏失败:', error);
    // --- MODIFICATION START ---
    // 打印完整的错误对象，以便查看更多细节
    console.error('创建游戏失败详情:', error);
    // --- MODIFICATION END ---
    return { success: false, error };
  }
}

/**
 * 结束游戏
 * @param gameId 游戏对象ID
 * @param winnerId 获胜玩家ID (1-8)
 * @param signAndExecuteTransactionBlock 来自钱包的签名函数
 */
export async function endGameOnContract(
  gameId: string,
  winnerId: number,
  // 将类型更改为 TransactionBlock
  signAndExecuteTransactionBlock: (txb: TransactionBlock) => Promise<any>
) {
  // 使用 TransactionBlock 类创建实例
  const txb = new TransactionBlock();
  txb.moveCall({
    target: `${PACKAGE_ID}::betting::end_game`,
    arguments: [
      txb.object(gameId),
      txb.pure(winnerId, 'u64'), // 合约中 winnerId 可能是 u64
    ],
  });

  try {
    const result = await signAndExecuteTransactionBlock(txb);
    console.log('结束游戏交易已提交:', result.digest);
    await SUI_CLIENT.waitForTransaction({ digest: result.digest });
    console.log('结束游戏交易成功确认:', result.digest);
    return { success: true, digest: result.digest };
  } catch (error) {
    console.error('结束游戏失败:', error);
    return { success: false, error };
  }
}

// 其他合约接口如 getOdds, getPoolValue 可以类似地实现
// 注意：getOdds 和 getPoolValue 是只读调用，可以使用 provider.devInspectTransactionBlock
// 或者如果SUI_CLIENT版本支持, 可以使用 sui_devInspectTransactionBlock

/**
 * 查询赔率
 * @param gameId 游戏对象ID
 * @param playerId 玩家ID (1-8)
 */
export async function getOddsFromContract(gameId: string, playerId: number): Promise<number | null> {
  try {
    const txb = new TransactionBlock();
    txb.moveCall({
      target: `${PACKAGE_ID}::betting::get_odds`,
      arguments: [
        txb.object(gameId), // gameId is an object ID
        txb.pure(playerId, 'u8'), // playerId is u8 in the contract
      ],
    });

    const result = await SUI_CLIENT.devInspectTransactionBlock({
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000', // Dummy sender for read-only calls
      transactionBlock: await txb.build(),
    });

    if (result.effects && result.effects.status.status === 'success' && result.results && result.results[0]?.returnValues?.[0]?.[0]) {
      const returnValueBytes = result.results[0].returnValues[0][0];
      // Assuming the return value is u64, convert bytes to number
      // The actual conversion might depend on how the SDK returns u64 from devInspect
      // For u64, it's often returned as a string or a BigInt, then needs parsing.
      // Let's assume it's a string representing a number for now.
      const oddsValue = BigInt(new Uint8Array(returnValueBytes).reduce((str, byte, i) => str + byte * (256**i), 0)).toString();
      return Number(oddsValue) / 1_000_000; // 转换为小数形式
    }
    console.error('查询赔率失败:', result);
    return null;
  } catch (error) {
    console.error('查询赔率异常:', error);
    return null;
  }
}

/**
 * 查询资金池总额
 * @param gameId 游戏对象ID
 */
export async function getPoolValueFromContract(gameId: string): Promise<number | null> {
  try {
    const txb = new TransactionBlock();
    txb.moveCall({
      target: `${PACKAGE_ID}::betting::get_pool_value`,
      arguments: [
        txb.object(gameId), // gameId is an object ID
      ],
    });

    const result = await SUI_CLIENT.devInspectTransactionBlock({
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000', // Dummy sender
      transactionBlock: await txb.build(),
    });

    if (result.effects && result.effects.status.status === 'success' && result.results && result.results[0]?.returnValues?.[0]?.[0]) {
      const returnValueBytes = result.results[0].returnValues[0][0];
      // Similar to getOdds, parse the u64 return value
      // This is a placeholder, adjust based on actual return format
      const poolValue = BigInt(new Uint8Array(returnValueBytes).reduce((str, byte, i) => str + byte * (256**i), 0)).toString();
      return Number(poolValue); // Pool value is likely in MIST, so no division by 1_000_000 unless it represents SUI with decimals
    }
    console.error('查询资金池失败:', result);
    return null;
  } catch (error) {
    console.error('查询资金池异常:', error);
    return null;
  }
}