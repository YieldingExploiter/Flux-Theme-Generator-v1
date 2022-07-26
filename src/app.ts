import {
  Client, GatewayIntentBits
} from 'discord.js';
import axios from 'axios';
import {
  readFileSync, createWriteStream, writeFileSync, rmSync, statSync
} from 'fs';
import * as path from 'path';
import * as lib from './lib';
import * as _gm from 'gm';
const gm = _gm.subClass({ 'imageMagick': true });
const client = new Client({
  'intents': [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ]
});

client.once('ready', () => {
  console.log('Ready!');
  client.user?.setPresence({
    'activities': [{ 'name': 'Making Fluxus Themes | 0.1.0' }], 'status': 'idle'
  });
});
const GetFileSize = (path:string) =>{
  const stat = statSync(path);
  const bytes = stat['size'];
  const mb = bytes / 1000000.0;
  return mb;
};
const DownloadsDir = path.resolve(process.cwd(), 'downloads');
const OutDir = path.resolve(process.cwd(), 'out');
const TopbarsDir = path.join(OutDir, 'topbars');
const WindowsDir = path.join(OutDir, 'windows');
const ThemesDir = path.join(OutDir, 'themes');
client.on('messageCreate', async (msg)=>{
  if (msg.content.toLowerCase().startsWith('!dmme'))
    msg.author.send('hi!');
  if (!msg.content.toLowerCase().startsWith('!maketheme'))
    return;
  // const args = msg.content.split(' ');
  // args.shift();
  // const settings = { 'rounded': 0, };
  // for (const arg of args) {
  //   args.shift();
  //   if (arg.toLowerCase() === `round`){
  //     const val = args.shift();
  //     if (!val){
  //       await msg.reply(`Cannot parse argument \`${arg}\`!`);
  //       return;
  //     }
  //     settings.rounded = Number(val);
  //   }
  // }
  const attachList = msg.attachments.toJSON();
  if (attachList.length === 0 || attachList.length > 1){
    await msg.reply(`<:question:1001454656054120519> **Invalid Input** Please upload exactly *one* image.
> **Example Usage** https://cdn.discordapp.com/attachments/959617195682443376/1001455222557773844/unknown.png
> **Recommended Image Size** 1854x1090`);
    return;
  }
  const a = attachList[0];
  let aData = `> **Content Type** \`${a.contentType}\`
> **Size** \`${a.width}x${a.height}\` (Will be cropped to \`1854x1090\`)
> **Proxy URL** \`${a.proxyURL}\`
> **Description** \`${a.description}\`
> **ID** \`${a.id}\``;
  const ourMsg = await msg.reply(`**Status** Downloading...
${aData}`);
  const Status = async (status: string, statusType = '<a:loading:1001452471710912563> Generating Theme...') => {
    if (statusType === 'Error')
      await ourMsg.edit(`**<:error:1001454654418333776> Error** ${status}`);
    else
      await ourMsg.edit(`**${statusType}** ${status}
${aData}`);
  };
  const FileName = `${a.id}.${a.contentType?.replace(/\\/gi, '/').split('/')
    .pop()}`;
  const DlPath = path.join(DownloadsDir, FileName);
  const writer = createWriteStream(DlPath);

  const response = await axios({
    'url': a.proxyURL,
    'method': 'GET',
    'responseType': 'stream'
  });
  response.data.pipe(writer);
  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
  await Status(`Creating Main Window Image...`);
  const Window = await lib.ImageToWindow(DlPath);
  const WindowPath = path.join(WindowsDir, FileName);
  await new Promise(resolve => Window.write(WindowPath, resolve));
  await Status(`Creating Topbar Image...`);
  const Topbar = lib.WindowToTopbar(gm(WindowPath));
  const TopbarPath = path.join(TopbarsDir, FileName);
  await new Promise(resolve => Topbar.write(TopbarPath, resolve));
  await Status(`Ensuring files aren't too big...`);
  const EnsureIsSmallEnough = async (FilePath:string)=>{
    let mb = GetFileSize(FilePath);
    if (mb > 4){
      await Status(`Window Output File is too big! Resizing...`);
      const task = await new Promise((resolve, reject) => {
        const Image = gm(FilePath);
        Image.size((err, size)=>{
          if (err)
            reject(err);
          else
            Image.resize(size.width / 2, size.height / 2).write(FilePath, async (err)=>{
              if (err)
                reject(err);
              else {
                mb = GetFileSize(FilePath);
                if (mb > 4){
                  // const FNSplit = FileName.split('.');
                  // if (FNSplit.pop()?.toLowerCase() !== 'png'){
                  //   await Status(`Window Output File is *still* too big! Converting to PNG...`);
                  //   rmSync(FilePath);
                  //   FileName = `${FNSplit.join('.')}.png`;
                  // } else {
                  await Status(`Exited; Window Output File is *still* too big post-resize! Already a png - giving up.`);
                  resolve('exit');
                  // }
                }
                else
                  resolve('continue');
              }
            });
        });
      });
      if (task === 'exit')
        return false;
    }
    return true;
  };
  if (!await EnsureIsSmallEnough(WindowPath) || !await EnsureIsSmallEnough(TopbarPath))
    return;
  await Status(`Uploading Assets...`);
  const AssetsMsg = await ourMsg.reply({
    'content': '**Assets**',
    'files': [
      {
        'attachment': TopbarPath,
        'name': `Topbar-${FileName}`
      },
      {
        'attachment': WindowPath,
        'name': `Window-${FileName}`
      }
    ]
  });
  const Assets = AssetsMsg.attachments;
  const TopbarAsset = Assets.find(v=>(v.name ?? '').startsWith('Topbar'));
  const WindowAsset = Assets.find(v=>(v.name ?? '').startsWith('Window'));
  if (!TopbarAsset) {
    await Status(`Cannot find Topbar Asset URL!`, 'Error');
    return;
  }
  if (!WindowAsset) {
    await Status(`Cannot find Window Asset URL!`, 'Error');
    return;
  }
  aData += `
> **Topbar URL** <${TopbarAsset.url}>
> **Window URL** <${WindowAsset.url}>`;
  await Status(`Cleaning Up Disk...`);
  rmSync(TopbarPath);
  rmSync(WindowPath);
  await Status(`Converting to theme file...`);
  const Theme = {
    '': 'Made Using Fluxus Theme Maker by Yielding#3961',
    'main_grid': WindowAsset.url,
    'top_bar': TopbarAsset.url,
    'tab_background': `#00000000`, // `${await lib.TopbarToAccentColour(Topbar)}77`,
    '​': 'https://cord.breadhub.cc/'
  };
  const ThemeFile = path.join(ThemesDir, `${FileName}.flux`);
  writeFileSync(ThemeFile, JSON.stringify(Theme));
  await Status(`Uploading theme file...`);
  const ThemeFileMsg = await ourMsg.reply({
    'content': '**Theme File**',
    'files': [{
      'name': 'theme.flux',
      'attachment': ThemeFile
    }]
  });
  const ThemeAtt = ThemeFileMsg.attachments.find(()=>true);
  if (!ThemeAtt) {
    await Status(`Cannot find theme file!
> **Notice** If a message was sent with a theme file, you can directly use it.`, 'Error');
    return;
  }
  await Status(`Done!
> **Theme File** ${ThemeAtt.url}`, '<:success:1001452381722124288> Success');
});

client.login(readFileSync('token.txt', 'utf-8'));
