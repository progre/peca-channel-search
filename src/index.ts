import fetch from 'node-fetch';
import parser, { Channel } from 'peercast-yp-channels-parser';

const YP_LIST = [
  'http://temp.orz.hm/yp/index.txt',
  'http://bayonet.ddo.jp/sp/index.txt',
  'http://peercast.takami98.net/turf-page/index.txt',
  'http://games.himitsukichi.com/hktv/index.txt',
];

async function main() {
  const port = process.argv[2];
  const keyword = process.argv[3];
  const now = new Date();
  const channelListList = await Promise.all<Channel[]>(YP_LIST.map(async (x) => {
    const ypTxt = await (await fetch(x)).text();
    return parser.parse(ypTxt, now);
  }));
  const channelList = channelListList.reduce((p, c) => p.concat(c), []);
  const channels = channelList.filter(x => (
    [x.name, x.genre, x.desc, x.comment].some(y => y.includes(keyword))
  ));
  if (channels.length <= 0) {
    return -1;
  }
  process.stdout.write(
    channels
      .map(x => `http://localhost:${port}/stream/${x.id}?tip=${x.ip}`)
      .join('\n'),
  );
  return 0;
}

main()
  .then((x) => { process.exit(x); })
  .catch((x) => { process.stderr.write(`${x}\n`); });
