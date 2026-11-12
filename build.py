"""Склеивает js/ и шрифты в один index.html. Нужен только Python 3."""
import base64, glob, os

def datauri(path):
    return 'data:font/woff;base64,' + base64.b64encode(open(path, 'rb').read()).decode()

files = ['js/01_core.js', 'js/02_world.js', 'js/03_game.js'] + sorted(f for f in glob.glob('js/levels/*.js') if not os.path.basename(f).startswith('_'))
js = '\n'.join(open(f).read() for f in files)
js = "'use strict';\n(function(){\n" + js.replace("'use strict';\n", '', 1) + '\n})();'
html = open('index.tpl.html').read()
html = html.replace('__FONT_CYR__', datauri('fonts/press-start-2p-cyrillic-400-normal.woff'))
html = html.replace('__FONT_LAT__', datauri('fonts/press-start-2p-latin-400-normal.woff'))
html = html.replace('__GAME__', js.replace('</script', '<\\/script'))
open('index.html', 'w').write(html)
print('index.html:', os.path.getsize('index.html'), 'bytes')
