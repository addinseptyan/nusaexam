import fs from "fs/promises";
import path from "path";
export { IMG_MIME } from "./imgMime";
import { IMG_MIME as M } from "./imgMime";
export const IMG_EXT=Object.keys(M);
export function mediaItemsDir(){
 return process.env.MEDIA_DIR?path.join(process.env.MEDIA_DIR,"items"):path.join(process.cwd(),"media","items");
}
export async function ensureMediaDir(){
 const dir=mediaItemsDir();
 await fs.mkdir(dir,{recursive:true});
 return dir;
}
