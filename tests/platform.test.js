/**
 * Learning Integration Platform - Tests
 * 
 * Basic tests for platform functionality.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Logger } from '../src/utils/logger.js';
import { Helpers } from '../src/utils/helpers.js';
import { ConfigManager } from '../src/config/manager.js';

test('Logger creates instances with context', () => {
    const logger = new Logger('TestContext');
    assert.equal(logger.context, 'TestContext');
});

test('Helpers.generateId creates unique IDs', () => {
    const id1 = Helpers.generateId('test');
    const id2 = Helpers.generateId('test');
    assert.notEqual(id1, id2);
    assert.ok(id1.startsWith('test_'));
});

test('Helpers.parseTags parses comma-separated tags', () => {
    const tags = Helpers.parseTags('javascript, python, ai');
    assert.deepEqual(tags, ['javascript', 'python', 'ai']);
});

test('Helpers.truncate truncates long strings', () => {
    const long = 'a'.repeat(200);
    const truncated = Helpers.truncate(long, 50);
    assert.equal(truncated.length, 50);
    assert.ok(truncated.endsWith('...'));
});

test('Helpers.deepMerge merges objects', () => {
    const target = { a: 1, b: { c: 2 } };
    const source = { b: { d: 3 }, e: 4 };
    const result = Helpers.deepMerge(target, source);
    assert.deepEqual(result, { a: 1, b: { c: 2, d: 3 }, e: 4 });
});

test('ConfigManager loads default config', async () => {
    const config = new ConfigManager('./nonexistent.json');
    await config.load();
    assert.ok(config.get('mcp.autoDiscover'));
    assert.equal(config.get('server.port'), 3000);
});

test('ConfigManager get returns default for missing keys', () => {
    const config = new ConfigManager();
    config.config = {};
    assert.equal(config.get('nonexistent.key', 'default'), 'default');
});

test('ConfigManager set stores values', () => {
    const config = new ConfigManager();
    config.config = {};
    config.set('test.key', 'value');
    assert.equal(config.get('test.key'), 'value');
});
