import { Context } from 'koishi';
import TargetPlugin from '../src';

describe('Test of plugin.', () => {
  let app: Context;

  beforeEach(async () => {
    app = new Context();
    app.plugin(TargetPlugin, { commandName: 'setu' });
    await app.start();
  });

  it('should pass', () => {
    expect(true).toBe(true);
  });
});
