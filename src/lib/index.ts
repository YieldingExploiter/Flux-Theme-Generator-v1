import * as _gm from 'gm';
import * as fs from 'fs';
import * as path from 'path';
const maskDir = path.resolve(process.cwd(), 'masks');
if (!fs.existsSync(maskDir))
  fs.mkdirSync(maskDir);
const gm = _gm.subClass({ 'imageMagick': true });
export const ImageToWindow = async (ImagePath: string)=>{
  const State = gm(ImagePath);
  const isGif = ImagePath.toLowerCase().endsWith('.gif');
  const TargetX = isGif ? 927 : 1854;
  const TargetY = isGif ? 545 : 1090;
  return State.resize(TargetX, TargetY, '<').resize(TargetX, TargetY, '>')
    .gravity('center')
    .crop(TargetX, TargetY);// .resize(TargetX, TargetY, '!');
};
export const WindowToTopbar = (ImageState: _gm.State) => ImageState.blur(0, 16).gravity('top')
  .crop(1854, 82, 0, 0);
// export const TopbarToAccentColour = async (ImageState: _gm.State) => new Promise((resolve, reject)=>ImageState.resize(1, 1).setFormat('ppm')
//   .toBuffer((err, buffer) => {
//     if (err)
//       reject(err);
//     const r = buffer.readUint8(buffer.length - 3);
//     const g = buffer.readUint8(buffer.length - 2);
//     const b = buffer.readUint8(buffer.length - 1);
//     const toHexDigit = (int: number) => {
//       let digit =  int.toString(16);
//       if (digit.length === 1)
//         digit = `0${digit}`;
//     };
//     resolve(`#${toHexDigit(r)}${toHexDigit(g)}${toHexDigit(b)}`);
//   }));
// ImageToWindow('input.png').write('Window.png',()=>{})
// WindowToTopbar(ImageToWindow('input.png')).write('Topbar.png',()=>{})
