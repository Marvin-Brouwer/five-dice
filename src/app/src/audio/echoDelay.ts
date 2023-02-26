// https://github.com/mdn/webaudio-examples/blob/main/voice-change-o-matic/scripts/app.js#L272
export function createEchoDelayEffect(audioContext: AudioContext, delayTime: number, frequency = 1100) {
    const delay = audioContext.createDelay(1);
    const dryNode = audioContext.createGain();
    const wetNode = audioContext.createGain();
    const mixer = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    delay.delayTime.value = delayTime;
    dryNode.gain.value = 1;
    wetNode.gain.value = 0;
    filter.frequency.value = frequency;
    filter.type = "highpass";

    return {
      apply: function () {
        wetNode.gain.setValueAtTime(0.75, audioContext.currentTime);
      },
      discard: function () {
        wetNode.gain.setValueAtTime(0, audioContext.currentTime);
      },
      isApplied: function () {
        return wetNode.gain.value > 0;
      },
      placeBetween: function (inputNode: AudioNode, outputNode: AudioNode) {
        inputNode.connect(delay);
        delay.connect(wetNode);
        wetNode.connect(filter);
        filter.connect(delay);

        inputNode.connect(dryNode);
        dryNode.connect(mixer);
        wetNode.connect(mixer);
        outputNode.connect(mixer);
      },
      build: function (inputNode: AudioNode, outputNode: AudioNode) {
        inputNode.connect(delay);
        delay.connect(wetNode);
        wetNode.connect(filter);
        filter.connect(delay);

        inputNode.connect(dryNode);
        dryNode.connect(mixer);
        wetNode.connect(mixer);
        mixer.connect(outputNode);
      },
    };
  }