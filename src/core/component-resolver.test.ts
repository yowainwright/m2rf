import { describe, test, expect } from 'bun:test';
import { normalizeComponentName, resolveComponent } from './component-resolver';
import type { ComponentRegistry } from '../types/index';

describe('component-resolver', () => {
  describe('normalizeComponentName', () => {
    test('converts single word to PascalCase', () => {
      expect(normalizeComponentName('hello')).toBe('Hello');
    });

    test('converts multiple words to PascalCase', () => {
      expect(normalizeComponentName('hello world')).toBe('HelloWorld');
      expect(normalizeComponentName('user profile card')).toBe('UserProfileCard');
    });

    test('removes brackets and parentheses', () => {
      expect(normalizeComponentName('[hello world]')).toBe('HelloWorld');
      expect(normalizeComponentName('(user profile)')).toBe('UserProfile');
      expect(normalizeComponentName('{custom node}')).toBe('CustomNode');
    });

    test('handles mixed brackets and text', () => {
      expect(normalizeComponentName('[User] Profile (Card)')).toBe('UserProfileCard');
      expect(normalizeComponentName('{Some [Component]}')).toBe('SomeComponent');
    });

    test('handles extra whitespace', () => {
      expect(normalizeComponentName('  hello   world  ')).toBe('HelloWorld');
      expect(normalizeComponentName('user\t\tprofile')).toBe('UserProfile');
    });

    test('handles empty string', () => {
      expect(normalizeComponentName('')).toBe('');
    });

    test('handles only brackets', () => {
      expect(normalizeComponentName('[](){}')).toBe('');
    });

    test('preserves already PascalCase names', () => {
      expect(normalizeComponentName('CustomComponent')).toBe('CustomComponent');
    });

    test('handles lowercase with brackets', () => {
      expect(normalizeComponentName('[user card]')).toBe('UserCard');
    });
  });

  describe('resolveComponent', () => {
    test('returns undefined when registry is not provided', () => {
      const result = resolveComponent('hello world');
      expect(result).toBeUndefined();
    });

    test('returns undefined when registry is empty', () => {
      const registry: ComponentRegistry = {};
      const result = resolveComponent('hello world', registry);
      expect(result).toBeUndefined();
    });

    test('returns component name when found in registry', () => {
      const registry: ComponentRegistry = {
        HelloWorld: () => null,
      };
      const result = resolveComponent('hello world', registry);
      expect(result).toBe('HelloWorld');
    });

    test('returns component name with bracket notation', () => {
      const registry: ComponentRegistry = {
        UserCard: () => null,
      };
      const result = resolveComponent('[user card]', registry);
      expect(result).toBe('UserCard');
    });

    test('returns undefined when component not in registry', () => {
      const registry: ComponentRegistry = {
        UserCard: () => null,
      };
      const result = resolveComponent('hello world', registry);
      expect(result).toBeUndefined();
    });

    test('handles multiple components in registry', () => {
      const registry: ComponentRegistry = {
        UserCard: () => null,
        ProfileHeader: () => null,
        CustomNode: () => null,
      };

      expect(resolveComponent('user card', registry)).toBe('UserCard');
      expect(resolveComponent('[profile header]', registry)).toBe('ProfileHeader');
      expect(resolveComponent('custom node', registry)).toBe('CustomNode');
      expect(resolveComponent('unknown', registry)).toBeUndefined();
    });

    test('handles different input casing', () => {
      const registry: ComponentRegistry = {
        HelloWorld: () => null,
        HELLOWORLD: () => null,
        HeLLoWoRLd: () => null,
      };

      expect(resolveComponent('hello world', registry)).toBe('HelloWorld');
      expect(resolveComponent('HELLO WORLD', registry)).toBe('HELLOWORLD');
      expect(resolveComponent('HeLLo WoRLd', registry)).toBe('HeLLoWoRLd');
    });
  });
});
