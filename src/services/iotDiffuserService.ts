export const iotDiffuserService = {
  async triggerAroma(aromaName: string, reason: string = 'Automated wellness sync') {
    console.log(`[IoT Service] Triggering aroma: ${aromaName}`);
    
    try {
      // Call the simulated backend endpoint
      const response = await fetch('/api/iot/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'diffuser_trigger',
          value: aromaName,
          reason: reason
        }),
      });

      if (!response.ok) throw new Error('Failed to sync with IoT device');

      const data = await response.json();
      console.log('[IoT Service] Sync success:', data);
      
      // Visual feedback via toast
      // Note: In a real app, this would also update global IoT state
      return true;
    } catch (error) {
      console.error('[IoT Service] Sync error:', error);
      return false;
    }
  }
};
