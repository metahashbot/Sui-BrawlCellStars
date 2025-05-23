// 从 @mysten/sui.js/transactions 导入 TransactionBlock 类
import { TransactionBlock } from '@mysten/sui.js/transactions';
// 假设 ../config/sui 存在并导出了 SUI_CLIENT
import { SUI_CLIENT } from '../config/sui';

const PACKAGE_ID = '0x6994f20653f263d5bc01180e460e0e18ae2b6ecd7777dd86c205c62abea71b09';

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
 * 创建游戏
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
    const result = await signAndExecuteTransactionBlock(txb);
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
    // 注意：devInspectTransactionBlock 的参数结构可能因 SDK 版本而异
    // 请参考您使用的 @mysten/sui.js 版本的文档
    // 以下是一个示例结构，可能需要调整
    const result = await SUI_CLIENT.devInspectTransactionBlock({
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000', // 任意发送者地址，因为是只读
      transactionBlock: {
        // @ts-ignore // devInspectTransactionBlock 的类型可能不完全匹配 TransactionBlock
        kind: 'MoveCall', // 这部分可能需要根据SDK版本调整为 TransactionBlock 格式
        data: {
            packageObjectId: PACKAGE_ID,
            module: 'betting',
            function: 'get_odds',
            typeArguments: [],
            arguments: [gameId, playerId.toString()], // 确保参数类型匹配合约
        }
      }
    });
    // @ts-ignore
    if (result.effects && result.effects.status.status === 'success' && result.results && result.results[0]?.returnValues?.[0]?.[0]) {
       // @ts-ignore
      const returnValue = result.results[0].returnValues[0][0];
      return Number(returnValue) / 1_000_000; // 转换为小数形式
    }
    console.error('查询赔率失败:', result);
    return null;
  } catch (error) {
    console.error('查询赔率异常:', error);
    return null;
  }
}