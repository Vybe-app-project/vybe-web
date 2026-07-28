import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const html = readFileSync(resolve('open.html'), 'utf8');
const script = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/)?.[1];

if (!script) throw new Error('open.html is missing its handoff script');

const renderHandoff = (search) => {
  const elements = {
    title: { textContent: 'Open in Vybe' },
    description: { textContent: 'Continue to this shared fitness content in the Vybe app.' },
    'open-button': { href: 'vybe://open' },
  };

  vm.runInNewContext(script, {
    document: {
      getElementById: (id) => elements[id],
    },
    URL,
    URLSearchParams,
    window: {
      location: { search },
    },
  });

  return elements;
};

describe('public app handoff', () => {
  it.each([
    ['meal-template', '507f1f77bcf86cd799439011', 'meal template'],
    ['meal-plan', 'a'.repeat(64), 'weekly meal plan'],
  ])('opens an exact shared %s identifier', (type, id, label) => {
    const elements = renderHandoff(`?type=${type}&id=${id}`);

    expect(elements['open-button'].href).toBe(`vybe://open?type=${type}&id=${id}`);
    expect(elements.title.textContent).toBe(`Open this ${label} in Vybe`);
    expect(elements.description.textContent).toContain(`shared ${label}`);
  });

  it.each([
    '?type=meal-plan&id=%3Csvg%20onload%3Dalert(1)%3E',
    `?type=meal-template&id=${'a'.repeat(129)}`,
    '?type=unknown&id=507f1f77bcf86cd799439011',
  ])('rejects malformed handoffs instead of rewriting them (%s)', (search) => {
    const elements = renderHandoff(search);

    expect(elements['open-button'].href).toBe('vybe://open');
    expect(elements.title.textContent).toBe('Open in Vybe');
    expect(elements.description.textContent).toContain('shared fitness content');
  });
});
