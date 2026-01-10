
// notificationSound.ts
export const createNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playSound = () => {
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator1.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator1.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
        oscillator1.type = "sine";

        oscillator2.frequency.setValueAtTime(660, audioContext.currentTime);
        oscillator2.frequency.setValueAtTime(880, audioContext.currentTime + 0.1);
        oscillator2.type = "sine";

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.12);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);

        oscillator1.start(audioContext.currentTime);
        oscillator2.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.4);
        oscillator2.stop(audioContext.currentTime + 0.4);
    };

    return playSound;
};
