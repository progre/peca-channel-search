import childProcess from 'child_process';
import moment from 'moment';
import fetch from 'node-fetch';
import parser, { Channel } from 'peercast-yp-channels-parser';
import uid from 'uid-safe';

const YP_LIST = [
  'http://temp.orz.hm/yp/index.txt',
  'http://bayonet.ddo.jp/sp/index.txt',
  'http://peercast.takami98.net/turf-page/index.txt',
  'http://games.himitsukichi.com/hktv/index.txt',
];

async function main() {
  const port = 7150;
  const keywords = ['壺', '壷'];
  const now = new Date();
  const channelListList = await Promise.all<Channel[]>(YP_LIST.map(async (x) => {
    const ypTxt = await (await fetch(x)).text();
    return parser.parse(ypTxt, now);
  }));
  const channelList = channelListList.reduce((p, c) => p.concat(c), []);
  const channels = channelList
    .filter(x => x.id !== '00000000000000000000000000000000')
    .filter(x => (
      [x.name, x.genre, x.desc, x.comment].some(y => keywords.some(keyword => y.includes(keyword)))
    ));
  if (channels.length <= 0) {
    return -1;
  }
  const urls = [
    ...channels
      .filter(x => x.type === 'FLV')
      .map(x => `http://localhost:${port}/stream/${x.id}?tip=${x.ip}`),
    ...channels
      .filter(x => x.type === 'WMV')
      .map(x => `mmsh://localhost:${port}/stream/${x.id}?tip=${x.ip}`),
  ];
  const workDir = '/Users/progre/Downloads';
  await Promise.all(urls.map(async (url) => {
    if (!await checkProcess(url)) {
      return;
    }
    await new Promise((resolve, reject) => {
      const id = `${moment().format('YYYYMMDDTHHmmSS')}_${uid.sync(2)}`;
      childProcess.exec(
        `ffmpeg -loglevel warning -i ${url} -codec copy ${workDir}/${id}.mkv`
        + ` >& ${workDir}/${id}.log`,
        (err, stdout, stderr) => {
          if (err != null) {
            reject(err);
            return;
          }
          if (stderr.length > 0) {
            reject(new Error(stderr));
            return;
          }
          resolve();
        },
      );
    });
  }));
  return 0;
}

async function checkProcess(url: string) {
  const count = await new Promise<number>((resolve, reject) => {
    childProcess.exec(
      `ps x | grep -v grep | grep -v bash | grep ${url} | wc -l`,
      (err, stdout, stderr) => {
        if (err != null) {
          reject(err);
          return;
        }
        if (stderr.length > 0) {
          reject(new Error(stderr));
          return;
        }
        resolve(Number(stdout));
      },
    );
  });
  return count <= 0;
}

main()
  .then((x) => { process.exit(x); })
  .catch((x) => { process.stderr.write(`${x}\n`); });
