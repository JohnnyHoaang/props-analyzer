import { z } from 'zod';
import { parseWithSchema } from './parse.js';

describe('parseWithSchema', () => {
  const schema = z.object({ name: z.string().min(1) });

  it('returns ok:true with parsed data on success', () => {
    const result = parseWithSchema(schema, { name: 'Demo' });
    expect(result).toEqual({ ok: true, data: { name: 'Demo' } });
  });

  it('returns ok:false with readable issues on failure', () => {
    const result = parseWithSchema(schema, { name: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0].path).toBe('name');
    }
  });
});
