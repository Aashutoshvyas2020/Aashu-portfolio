import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromium } from 'playwright';

// Catches overlapping project pages, lost return focus/page, and a hidden mobile
// menu remaining interactive or making desktop navigation inert after resizing.
test('project navigation preserves page and focus across history and resizing', async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH,
    headless: true
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5173');
    await page.locator('.nav [data-view="portfolio"]').click();
    await page.evaluate(() => {
      const first = document.querySelector('.pagination__link[data-page="1"]');
      const second = document.querySelector('.pagination__link[data-page="2"]');
      second.click();
      first.click();
      second.click();
    });
    await page.waitForTimeout(500);
    assert.equal(await page.locator('.portfolio .entries.is-active').count(), 1);
    assert.equal(await page.locator('.portfolio .entries.is-active').getAttribute('data-page'), '2');
    await page.locator('.portfolio .entries.is-active .details-link[href="#atlas"]').click();
    await page.locator('.view--project.is-active [data-project="atlas"]').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.project__back').evaluate(link => link === document.activeElement), true);
    await page.goBack();
    await page.locator('.view--portfolio.is-active').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.portfolio .entries.is-active').getAttribute('data-page'), '2');
    assert.equal(await page.locator('.portfolio .entries.is-active .details-link[href="#atlas"]').evaluate(link => link === document.activeElement), true);
    await page.goForward();
    await page.locator('.view--project.is-active [data-project="atlas"]').waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    await page.locator('.view--portfolio.is-active').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.portfolio .entries.is-active').getAttribute('data-page'), '2');
    assert.equal(await page.locator('.portfolio .entries.is-active .details-link[href="#atlas"]').evaluate(link => link === document.activeElement), true);
    await page.goto('about:blank');
    await page.goto(`${process.env.BASE_URL || 'http://127.0.0.1:5173'}/#%E0%A4%A`);
    await page.locator('.view--index.is-active').waitFor({ state: 'visible' });
    assert.deepEqual(errors, [], 'Navigation must not throw, including malformed detail hashes');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector('#siteNav').inert);
    await page.locator('#navToggle').click();
    assert.equal(await page.locator('#siteNav').evaluate(nav => nav.inert), false);
    await page.setViewportSize({ width: 1470, height: 801 });
    await page.waitForFunction(() => document.querySelector('#navToggle').getAttribute('aria-expanded') === 'false');
    assert.equal(await page.locator('#siteNav').evaluate(nav => nav.inert), false);
  } finally {
    await browser.close();
  }
});

test('tiny vertical gestures switch sections instead of scrolling their content', async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH,
    headless: true
  });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 600 } });
    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5173');
    const activeView = () => page.locator('.view.is-active').getAttribute('data-view');
    const wheel = deltaY => page.evaluate(deltaY => {
      const event = new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    }, deltaY);
    await page.locator('#navToggle').click();
    await page.locator('.nav [data-view="work"]').click();
    assert.equal(await wheel(0.1), true);
    assert.equal(await activeView(), 'portfolio');
    await wheel(0.05);
    assert.equal(await activeView(), 'portfolio', 'Momentum must not skip another section');
    await wheel(-0.1);
    assert.equal(await activeView(), 'portfolio', 'Direction changes inside the same gesture must not switch another page');
    await page.waitForTimeout(120);
    await wheel(-0.1);
    assert.equal(await activeView(), 'work', 'A new gesture after scrolling stops must move one page');
    await wheel(0);
    assert.equal(await activeView(), 'work');
    await page.waitForTimeout(250);
    const touchScrollBlocked = await page.locator('.view.is-active').evaluate(view => {
      const start = new Touch({ identifier: 1, target: view, clientX: 100, clientY: 300 });
      const moved = new Touch({ identifier: 1, target: view, clientX: 100, clientY: 299 });
      view.dispatchEvent(new TouchEvent('touchstart', { touches: [start], bubbles: true }));
      const move = new TouchEvent('touchmove', { touches: [moved], bubbles: true, cancelable: true });
      view.dispatchEvent(move);
      view.dispatchEvent(new TouchEvent('touchend', { changedTouches: [moved], bubbles: true }));
      return move.defaultPrevented;
    });
    assert.equal(touchScrollBlocked, true, 'Vertical swipes must not scroll section content');
    assert.equal(await activeView(), 'portfolio', 'A one-pixel swipe must switch an overflowing section');
    await page.locator('#navToggle').click();
    await wheel(0.1);
    assert.equal(await activeView(), 'portfolio', 'An open menu must not change the current section');
    await page.keyboard.press('Escape');
    await page.goto(`${process.env.BASE_URL || 'http://127.0.0.1:5173'}/#rift`);
    assert.equal(await wheel(0.1), false, 'Project details must retain native scrolling');
    assert.equal(await activeView(), 'project');
  } finally {
    await browser.close();
  }
});

test('quick successive wheel gestures navigate both directions with the cursor stationary', async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH,
    headless: true
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1470, height: 801 } });
    let wheelTime = Date.now();
    await page.clock.setFixedTime(new Date(wheelTime));
    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5173');
    const image = await page.locator('.slideshow img').boundingBox();
    await page.mouse.move(image.x + image.width / 2, image.y + image.height / 2);
    for (const [direction, expectedViews] of [
      [1, ['info', 'education', 'work', 'portfolio', 'research', 'photography', 'honors', 'currently', 'contact']],
      [-1, ['currently', 'honors', 'photography', 'research', 'portfolio', 'work', 'education', 'info', 'index']]
    ]) {
      for (const expected of expectedViews) {
        wheelTime += 80;
        await page.clock.setFixedTime(new Date(wheelTime));
        await page.mouse.wheel(0, direction);
        await page.waitForTimeout(50);
        assert.equal(await page.locator('.view.is-active').getAttribute('data-view'), expected,
          'A new gesture must respond after a short pause without moving the cursor');
      }
    }
  } finally {
    await browser.close();
  }
});

test('each scroll gesture moves exactly one page regardless of magnitude or direction changes', async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH,
    headless: true
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1470, height: 801 } });
    let wheelTime = Date.now();
    await page.clock.setFixedTime(new Date(wheelTime));
    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5173');
    await page.locator('.nav [data-view="contact"]').click();
    await page.mouse.move(735, 400);
    const wheel = async (deltaY, elapsed) => {
      wheelTime += elapsed;
      await page.clock.setFixedTime(new Date(wheelTime));
      await page.mouse.wheel(0, deltaY);
      await page.waitForTimeout(50);
    };
    for (const [direction, expected] of [[-1, 'currently'], [1, 'contact']]) {
      await wheel(direction * 0.01, 120);
      assert.equal(await page.locator('.view.is-active').getAttribute('data-view'), expected);
      for (let pulse = 0; pulse < 4; pulse++) {
        for (const [magnitude, elapsed] of [
          [0.02, 16], [1000, 32], [0.01, 48], [-1000, 64],
          [2, 16], [4000, 32], [0.001, 48]
        ]) {
          await wheel(direction * magnitude, elapsed);
          assert.equal(await page.locator('.view.is-active').getAttribute('data-view'), expected,
            'Continuous momentum must not advance again even when a gesture lasts over a second');
        }
      }
    }
  } finally {
    await browser.close();
  }
});
