// Notification sound URLs - you can replace these with your own audio files
// For now, using data URIs for simple beep sounds or you can host actual audio files

export const NOTIFICATION_SOUNDS: Record<string, string> = {
  'Ta-da-dum': '/sounds/ta-da-dum.mp3',
  'Ta-ding': '/sounds/ta-ding.mp3',
  'Whoo': '/sounds/whoo.mp3',
  'Chime': '/sounds/chime.mp3',
  'Boop': '/sounds/boop.mp3',
  'Hey there': '/sounds/hey-there.mp3',
};

export class NotificationSoundManager {
  private static instance: NotificationSoundManager;
  private audioContext: AudioContext | null = null;
//   private audioBuffers: Map<string, AudioBuffer> = new Map();

  private constructor() {
    // Initialize Web Audio API
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public static getInstance(): NotificationSoundManager {
    if (!NotificationSoundManager.instance) {
      NotificationSoundManager.instance = new NotificationSoundManager();
    }
    return NotificationSoundManager.instance;
  }

  public async playSound(soundName: string): Promise<void> {
    try {
      const soundUrl = NOTIFICATION_SOUNDS[soundName];
      
      if (!soundUrl) {
        console.warn(`Sound "${soundName}" not found, playing default beep`);
        this.playDefaultBeep();
        return;
      }

      // Use HTML5 Audio for simplicity
      const audio = new Audio(soundUrl);
      audio.volume = 0.5; // 50% volume
      
      try {
        await audio.play();
      } catch (error) {
        console.error('Error playing notification sound:', error);
        // Fallback to default beep
        this.playDefaultBeep();
      }
    } catch (error) {
      console.error('Error in playSound:', error);
    }
  }

  private playDefaultBeep(): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing default beep:', error);
    }
  }
}

export const playNotificationSound = (soundName: string) => {
  const manager = NotificationSoundManager.getInstance();
  manager.playSound(soundName);
};