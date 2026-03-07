type TabMessage = { type: 'tab-open' | 'tab-ack' | 'tab-close' };

export class TabTracker {
  private channel: BroadcastChannel | null = null;
  private peerCount = 0;

  constructor(channelName: string) {
    if (typeof BroadcastChannel === 'undefined') return;

    this.channel = new BroadcastChannel(channelName);
    this.channel.onmessage = (event: MessageEvent<TabMessage>) => {
      const { type } = event.data;
      if (type === 'tab-open') {
        this.peerCount++;
        this.channel?.postMessage({ type: 'tab-ack' } satisfies TabMessage);
      }
      if (type === 'tab-ack') this.peerCount++;
      if (type === 'tab-close') this.peerCount = Math.max(0, this.peerCount - 1);
    };
    this.channel.postMessage({ type: 'tab-open' } satisfies TabMessage);
  }

  isLastTab(): boolean {
    return this.peerCount === 0;
  }

  destroy(): void {
    this.channel?.postMessage({ type: 'tab-close' } satisfies TabMessage);
    this.channel?.close();
    this.channel = null;
  }
}
