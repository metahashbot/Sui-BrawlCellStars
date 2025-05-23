import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const network = 'testnet'; //'devnet', 'mainnet'

export const SUI_CLIENT = new SuiClient({ url: getFullnodeUrl(network) });