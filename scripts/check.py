# Headless check: load page at a width, exercise every widget, collect console errors, take screenshots.
import sys, time
from playwright.sync_api import sync_playwright
url = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8765/'
out = sys.argv[2] if len(sys.argv) > 2 else '/home/claude/work/tmp/shuf'
with sync_playwright() as p:
    b = p.chromium.launch()
    for w in (1100, 360):
        pg = b.new_page(viewport={'width': w, 'height': 900}); errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(url); pg.wait_for_timeout(800)
        r = pg.locator('[data-widget=riffle]')
        for _ in range(3): r.locator('[data-a=riffle]').click()
        print(w, 'riffle:', r.locator('.readout').inner_text())
        r.screenshot(path=f'{out}/riffle-{w}.png')
        g = pg.locator('[data-widget=guess]')
        g.locator('[data-a=odds]').click()
        t0 = time.time()
        for _ in range(10):
            g.locator('button.card:not([disabled])').first.click()
        print(w, 'guess 10 clicks', round(time.time() - t0, 2), 's:', g.locator('.scores').inner_text().replace('\n', ' '))
        g.screenshot(path=f'{out}/guess-{w}.png')
        g.locator('[data-a=auto]').click(); pg.wait_for_timeout(300)
        print(w, 'guess end:', g.locator('.readout').inner_text())
        g.locator('select').select_option('7'); pg.wait_for_timeout(200)
        t = pg.locator('[data-widget=trick]')
        t.locator('.spread button.card').nth(5).click(); t.locator('.spread button.card').nth(30).click()
        t.locator('[data-a=go]').click(); pg.wait_for_timeout(300)
        print(w, 'trick:', t.locator('.readout').inner_text())
        t.screenshot(path=f'{out}/trick-{w}.png')
        t.locator('[data-a=many]').click(); pg.wait_for_timeout(500)
        print(w, 'trick many:', t.locator('.readout').inner_text())
        pg.locator('[data-widget=chart]').screenshot(path=f'{out}/chart-{w}.png')
        sw = pg.evaluate('document.documentElement.scrollWidth')
        print(w, 'scrollWidth', sw, 'errors', errs)
        pg.screenshot(path=f'{out}/full-{w}.png', full_page=True)
    b.close()
