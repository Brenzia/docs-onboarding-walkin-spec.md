"""Smoke test for the walk-in onboarding prototype.

Plays the full flow for all three user types plus the error paths, in headless
Chromium, and fails if any run errors or does not reach the final screen.
Run it after every restyle or art change.

    pip install -r tests/requirements.txt
    python -m playwright install chromium
    python tests/smoke_test.py            # check only
    python tests/smoke_test.py --frames   # also refresh docs/frames/*.png
"""
import asyncio
import pathlib
import sys

from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = (ROOT / 'prototype' / 'index.html').as_uri()
FRAMES = ROOT / 'docs' / 'frames'
PHONE = {'x': 24, 'y': 24, 'width': 390, 'height': 844}

# frame name -> (user type, stage that must be showing, extra wait in ms)
KEY_FRAMES = {
    'nonmygate': [('01-gate', 'gate', 0), ('02-guard', 'guard', 900), ('03-lift', 'lift', 2600),
                  ('04-door-email', 'door', 1800), ('05-door-chained', 'dotp', 900), ('06-verified', 'done', 1200)],
    'resident': [('07-resident-guard', 'lift', 800), ('08-resident-welcome', 'done', 1200)],
    'returning': [('09-returning-welcome', 'done', 1200)],
}


async def play(page, seg, save_frames):
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    await page.goto(PAGE)
    await page.wait_for_timeout(600)
    if seg != 'nonmygate':
        await page.click(f'input[value={seg}]')
    wanted = list(KEY_FRAMES[seg]) if save_frames else []
    if wanted and wanted[0][1] == 'gate':
        await page.screenshot(path=str(FRAMES / f'{wanted.pop(0)[0]}.png'), clip=PHONE)
    await page.click('#bAuto')
    for _ in range(120):
        await page.wait_for_timeout(250)
        stage = await page.evaluate('stage')
        if wanted and stage == wanted[0][1]:
            name, _, extra = wanted.pop(0)
            await page.wait_for_timeout(extra)
            await page.screenshot(path=str(FRAMES / f'{name}.png'), clip=PHONE)
        if stage == 'done' and not wanted:
            break
    await page.wait_for_timeout(1800)
    stage = await page.evaluate('stage')
    beats = await page.evaluate("[...document.querySelectorAll('#log li')].length")
    return stage, beats, errors


async def edge_cases(page):
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    await page.goto(PAGE)
    await page.wait_for_timeout(500)
    checks = []
    await page.fill('#inPhone', '5123456789')
    await page.click('#bGate')
    await page.wait_for_timeout(600)
    checks.append(('invalid number rejected', 'valid 10-digit' in (await page.text_content('#mPhone'))))
    await page.fill('#inPhone', '9876543210')
    await page.click('#bGate')
    await page.wait_for_timeout(2500)
    for _ in range(3):
        await page.fill('#inOtp', '000000')
        await page.dispatch_event('#inOtp', 'input')
        await page.wait_for_timeout(1300)
    checks.append(('lockout after 3 wrong codes', 'Too many attempts' in (await page.text_content('#mOtp'))))
    await page.click('#cReduced')
    await page.wait_for_timeout(300)
    await page.click('#bAuto')
    for _ in range(60):
        await page.wait_for_timeout(500)
        if await page.evaluate('stage') == 'done':
            break
    checks.append(('reduced motion completes', await page.evaluate('stage') == 'done'))
    return checks, errors


async def main():
    save_frames = '--frames' in sys.argv
    if save_frames:
        FRAMES.mkdir(parents=True, exist_ok=True)
    failed = False
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for seg in KEY_FRAMES:
            page = await browser.new_page(viewport={'width': 820, 'height': 900})
            stage, beats, errors = await play(page, seg, save_frames)
            ok = stage == 'done' and not errors
            failed |= not ok
            print(f"{'PASS' if ok else 'FAIL'}  {seg:<10} final={stage} log_lines={beats} errors={errors}")
            await page.close()
        page = await browser.new_page(viewport={'width': 820, 'height': 900})
        checks, errors = await edge_cases(page)
        for name, ok in checks:
            failed |= not ok
            print(f"{'PASS' if ok else 'FAIL'}  {name}")
        if errors:
            failed = True
            print('FAIL  page errors:', errors)
        await browser.close()
    sys.exit(1 if failed else 0)


asyncio.run(main())
