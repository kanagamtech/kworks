import NetInfo from '@react-native-community/netinfo';

export type NetworkState = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  details: any;
};

export async function checkInternetConnection(): Promise<NetworkState> {
  const state = await NetInfo.fetch();
  return {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable ?? null,
    type: state.type,
    details: state.details,
  };
}

export function subscribeToNetworkChanges(
  callback: (state: NetworkState) => void
): () => void {
  return NetInfo.addEventListener((state) => {
    callback({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? null,
      type: state.type,
      details: state.details,
    });
  });
}

export function isOnline(state: NetworkState): boolean {
  return state.isConnected && state.isInternetReachable !== false;
}