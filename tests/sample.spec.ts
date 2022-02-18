import { App } from 'koishi';
import TargetPlugin from '../src';

describe('Test of plugin.', () => {
  let app: App;

  beforeEach(async () => {
    app = new App();
    // app.plugin(TargetPlugin);
    await app.start();
  });

  it('should pass', () => {
    expect(true).toBe(true);
  });
});
