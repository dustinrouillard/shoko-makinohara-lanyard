export function msToMinSeconds(millis: number) {
  var minutes = Math.floor(millis / 60000);
  var seconds = Number(((millis % 60000) / 1000).toFixed(0));
  return seconds == 60 ? minutes + 1 + ':00' : minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}
