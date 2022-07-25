import { App } from 'koishi';
import TargetPlugin from '../src';
import ConsolePlugin from '@koishijs/plugin-console';
import SandboxPlugin from '@koishijs/plugin-sandbox';
import DatabasePlugin from '@koishijs/plugin-database-memory';
import ExtrasInDev from './extras';

const app = new App({
  port: 14514,
  host: 'localhost',
  prefix: '.',
});

// Console and sandbox
app.plugin(SandboxPlugin);
app.plugin(ConsolePlugin, {
  open: false,
});

// Database
app.plugin(DatabasePlugin);

// Some extras
app.plugin(ExtrasInDev);

// Target plugin
app.plugin(TargetPlugin, { useBase64: true });

app.start();
