/* Sella las hojas de estilo y los scripts con un número derivado de su propio
   contenido, y lo escribe en el ?v= de todas las páginas.

   Por qué existe
   --------------
   /assets/ se sirve con caché de 7 días. Si se cambia styles.css sin cambiar
   el ?v= del HTML, el navegador de quien ya visitó el sitio sigue usando la
   hoja vieja durante una semana: recibe el HTML nuevo y lo pinta con el CSS
   anterior. Eso pasó dos veces el 23/09/2026. La primera dejó la foto de
   Walter estirada; la segunda dejó las secciones nuevas sin estilos y
   Patriccio no vio ningún cambio en la página.

   Acordarse de subir el número a mano no funcionó, así que aquí el número deja
   de ser una decisión: sale del hash del contenido. Si el contenido no cambió,
   el sello no cambia y no se invalida caché sin motivo.

   Uso
   ---
     node sellar-version.mjs            sella y avisa qué cambió
     node sellar-version.mjs --revisar  no toca nada; sale con error si el
                                        sello no coincide (para las pruebas)
*/
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(RAIZ, 'assets');
const soloRevisar = process.argv.includes('--revisar');

/* El sello cubre TODO lo que el navegador cachea largo y puede cambiar de
   contenido sin cambiar de nombre: las hojas y los scripts. Las imágenes y el
   video no entran: cuando cambian, cambian de nombre. */
const sellables = readdirSync(ASSETS).filter((f) => /\.(css|js)$/.test(f)).sort();

const h = createHash('sha256');
for (const f of sellables) { h.update(f); h.update(readFileSync(join(ASSETS, f))); }
const sello = h.digest('hex').slice(0, 8);

const paginas = readdirSync(RAIZ).filter((f) => f.endsWith('.html')).sort();
const desfasadas = [];
let tocadas = 0;

for (const p of paginas) {
  const ruta = join(RAIZ, p);
  const antes = readFileSync(ruta, 'utf8');
  /* cada referencia a una hoja o script de /assets/ lleva el sello, tenga o no
     un ?v= previo */
  const despues = antes.replace(
    /(["'])(assets\/[A-Za-z0-9._-]+\.(?:css|js))(\?v=[A-Za-z0-9]+)?\1/g,
    (_m, comilla, archivo) => comilla + archivo + '?v=' + sello + comilla);
  if (despues === antes) continue;
  desfasadas.push(p);
  if (!soloRevisar) { writeFileSync(ruta, despues); tocadas++; }
}

if (soloRevisar) {
  if (desfasadas.length) {
    console.error('El sello de versión no coincide en: ' + desfasadas.join(', '));
    console.error('Esperado ?v=' + sello + '. Corre:  node sellar-version.mjs');
    process.exit(1);
  }
  console.log('Sello al día: ?v=' + sello + ' en las ' + paginas.length + ' páginas.');
} else {
  console.log(tocadas
    ? 'Sellado ?v=' + sello + ' en ' + tocadas + ' página(s): ' + desfasadas.join(', ')
    : 'Ya estaba sellado con ?v=' + sello + '. Nada que hacer.');
}
