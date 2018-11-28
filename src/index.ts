import fetch from 'node-fetch';
import parser from 'peercast-yp-channels-parser';

const YP_LIST = [
  'http://temp.orz.hm/yp/index.txt',
  'http://bayonet.ddo.jp/sp/index.txt',
  'http://peercast.takami98.net/turf-page/index.txt',
  'http://games.himitsukichi.com/hktv/index.txt',
];

async function main() {
  const channelName = process.argv[2];
  const now = new Date();
  const nullableChannelList = await Promise.all(YP_LIST.map(async (x) => {
    const ypTxt = await (await fetch(x)).text();
    return (
      parser.parse(ypTxt, now)
        .filter(y => y.name === channelName)[0]
    );
  }));
  const channel = nullableChannelList.filter(x => x != null)[0];
  if (channel == null) {
    return -1;
  }
  process.stdout.write(`http://localhost:7144/stream/${channel.id}?tip=${channel.ip}`);
  return 0;
}

main()
  .then((x) => { process.exit(x); })
  .catch((x) => { process.stderr.write(`${x}\n`); });
