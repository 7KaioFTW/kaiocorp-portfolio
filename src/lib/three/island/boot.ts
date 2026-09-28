// src/lib/three/island/boot.ts
import { PREF_KEY } from "./store";

// Inline <script> rendered at the top of the homepage <main>: runs before the sections are parsed,
// so `html[data-island]` (which switches the sticky chapter heights on) is right on first paint.
// Same decision as selectTier() with WebGL2 assumed — boot.test.ts checks parity; the real WebGL2
// probe happens later in IslandJourney. ES5, no dependencies, every access guarded.
export const ISLAND_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,p=null;try{p=localStorage.getItem(${JSON.stringify(PREF_KEY)})}catch(e){}var n=navigator,c=n.connection,m=n.deviceMemory,low=!!(c&&c.saveData)||(typeof m==="number"&&m<4),off=p==="off"||(p!=="on"&&low);d.setAttribute("data-island",off?"off":"pending")}catch(e){}})();`;
