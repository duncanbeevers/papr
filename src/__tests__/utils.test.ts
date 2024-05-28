import { describe, expect, test } from '@jest/globals';
import { ObjectId } from 'mongodb';
import { expectType } from 'ts-expect';
import { DefaultsOption } from '../schema';
import { NestedPaths, ProjectionType, getIds, PropertyType, getDefaultValues } from '../utils';

describe('utils', () => {
  interface TestDocument {
    _id: ObjectId;
    foo: string;
    bar: number;
    ham?: Date;
    tag?: string;
    nestedList: {
      direct: string;
      other?: number;
    }[];
    nestedObject: {
      deep: {
        deeper: string;
        other?: number;
      };
      direct: boolean;
      other?: number;
    };
  }

  describe('NestedPaths', () => {
    test('valid types', () => {
      expectType<NestedPaths<TestDocument, []>>(['_id']);
      expectType<NestedPaths<TestDocument, []>>(['foo']);
      expectType<NestedPaths<TestDocument, []>>(['bar']);
      expectType<NestedPaths<TestDocument, []>>(['ham']);
      expectType<NestedPaths<TestDocument, []>>(['tag']);

      // arrays
      expectType<NestedPaths<TestDocument, []>>(['nestedList']);
      expectType<NestedPaths<TestDocument, []>>(['nestedList', 'direct']);
      expectType<NestedPaths<TestDocument, []>>(['nestedList', 'other']);
      expectType<NestedPaths<TestDocument, []>>(['nestedList', 0]);
      expectType<NestedPaths<TestDocument, []>>(['nestedList', 0, 'direct']);
      expectType<NestedPaths<TestDocument, []>>(['nestedList', 1, 'other']);

      // objects
      expectType<NestedPaths<TestDocument, []>>(['nestedObject']);
      expectType<NestedPaths<TestDocument, []>>(['nestedObject', 'direct']);
      expectType<NestedPaths<TestDocument, []>>(['nestedObject', 'other']);
      expectType<NestedPaths<TestDocument, []>>(['nestedObject', 'deep']);
      expectType<NestedPaths<TestDocument, []>>(['nestedObject', 'deep', 'deeper']);
      expectType<NestedPaths<TestDocument, []>>(['nestedObject', 'deep', 'other']);
    });

    test('invalid types', () => {
      // @ts-expect-error Type mismatch
      expectType<NestedPaths<TestDocument, []>>(['inexistent']);

      // @ts-expect-error Type mismatch
      expectType<NestedPaths<TestDocument, []>>(['nestedList', 'inexistent']);
      // @ts-expect-error Type mismatch
      expectType<NestedPaths<TestDocument, []>>(['nestedList', 0, 'inexistent']);

      // @ts-expect-error Type mismatch
      expectType<NestedPaths<TestDocument, []>>(['nestedObject', 'inexistent']);
      // @ts-expect-error Type mismatch
      expectType<NestedPaths<TestDocument, []>>(['nestedObject', 'deep', 'inexistent']);
    });
  });

  describe('PropertyType', () => {
    describe('valid types', () => {
      test('top-level string', () => {
        expectType<PropertyType<TestDocument, 'foo'>>('any string');
      });

      test('top-level number', () => {
        expectType<PropertyType<TestDocument, 'bar'>>(123);
      });

      test('top-level date', () => {
        expectType<PropertyType<TestDocument, 'ham'>>(new Date());
      });

      describe('arrays', () => {
        test('entire list as readonly constant', () => {
          const value = [{ direct: 'foo' }] as const;
          expectType<PropertyType<TestDocument, 'nestedList'>>(value);
        });

        test('entire list as inline argument without optional number property', () => {
          expectType<PropertyType<TestDocument, 'nestedList'>>([{ direct: 'foo' }]);
        });

        test('list item at index as object with optional number property', () => {
          expectType<PropertyType<TestDocument, 'nestedList.0'>>({ direct: 'foo', other: 123 });
        });

        test('string value for required property of list item at index', () => {
          expectType<PropertyType<TestDocument, 'nestedList.0.direct'>>('foo');
        });

        test('number value for optional property of list item at index', () => {
          expectType<PropertyType<TestDocument, 'nestedList.0.other'>>(123);
        });

        test('undefined value for optional property of list item at index', () => {
          expectType<PropertyType<TestDocument, 'nestedList.0.other'>>(undefined);
        });

        test('string value for string property of list items', () => {
          expectType<PropertyType<TestDocument, 'nestedList.direct'>>('foo');
        });

        test('number value for optional number property of list items', () => {
          expectType<PropertyType<TestDocument, 'nestedList.other'>>(123);
        });

        test('undefined value for optional number property of list items', () => {
          expectType<PropertyType<TestDocument, 'nestedList.other'>>(undefined);
        });
      });

      describe('nested objects', () => {
        test('entire object as readonly constant', () => {
          const value = {
            deep: { deeper: 'foo' },
            direct: true,
          } as const;
          expectType<PropertyType<TestDocument, 'nestedObject'>>(value);
        });

        test('entire object as inline argument', () => {
          // object
          expectType<PropertyType<TestDocument, 'nestedObject'>>({
            deep: { deeper: 'foo' },
            direct: true,
          });
        });

        test('object value for nested property of object', () => {
          expectType<PropertyType<TestDocument, 'nestedObject.deep'>>({
            deeper: 'foo',
            other: 123,
          });
        });

        test('string value for nested string property of object', () => {
          expectType<PropertyType<TestDocument, 'nestedObject.deep.deeper'>>('foo');
        });

        test('number value for nested optional number property of object', () => {
          expectType<PropertyType<TestDocument, 'nestedObject.deep.other'>>(123);
        });

        test('undefined value for nested optional number property of object', () => {
          expectType<PropertyType<TestDocument, 'nestedObject.deep.other'>>(undefined);
        });

        test('boolean value for nested property of object', () => {
          expectType<PropertyType<TestDocument, 'nestedObject.direct'>>(true);
        });
      });
    });

    test('invalid types', () => {
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'foo'>>(123);
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'bar'>>('foo');
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'ham'>>(123);

      // arrays
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'nestedList'>>([{ direct: 123 }]);
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'nestedList.0'>>({ direct: 123, other: 123 });
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'nestedList.0'>>({ direct: 'foo', other: 'foo' });
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'nestedList.0.direct'>>(123);
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'nestedList.0.direct'>>(undefined);
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'nestedList.0.other'>>('foo');
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'nestedList.direct'>>(123);
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'nestedList.direct'>>(undefined);
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'nestedList.other'>>('foo');

      // object
      expectType<PropertyType<TestDocument, 'nestedObject'>>({
        // @ts-expect-error Type mismatch
        deep: { deeper: 123 },
        direct: true,
      });
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'nestedObject.deep'>>({ deeper: 123, other: 123 });
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'nestedObject.deep'>>({ deeper: 'foo', other: 'foo' });
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'nestedObject.deep.deeper'>>(123);
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'nestedObject.deep.deeper'>>(undefined);
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'nestedObject.deep.other'>>('foo');
      // @ts-expect-error Type mismatch
      expectType<PropertyType<TestDocument, 'nestedObject.direct'>>('foo');
    });
  });

  describe('ProjectionType', () => {
    test('required fields', () => {
      const foo = { foo: 1 };

      const testFoo: ProjectionType<TestDocument, typeof foo> = {
        _id: new ObjectId(),
        foo: 'foo',
      };

      expectType<{
        _id: ObjectId;
        foo: string;
      }>(testFoo);
      expectType<string>(testFoo.foo);
      // @ts-expect-error `bar` should be undefined here
      testFoo.bar;
      // @ts-expect-error `ham` should be undefined here
      testFoo.ham;

      const bar = { bar: 1 };

      const testBar: ProjectionType<TestDocument, typeof bar> = {
        _id: new ObjectId(),
        bar: 123,
      };

      expectType<{
        _id: ObjectId;
        bar: number;
      }>(testBar);
      // @ts-expect-error `foo` should be undefined here
      testBar.foo;
      expectType<number>(testBar.bar);
      // @ts-expect-error `ham` should be undefined here
      testBar.ham;
    });

    test('multiple mixed fields', () => {
      const multiple = {
        bar: 1,
        ham: 1,
      };

      const testMultiple: ProjectionType<TestDocument, typeof multiple> = {
        _id: new ObjectId(),
        bar: 123,
        ham: new Date(),
      };

      expectType<{
        _id: ObjectId;
        bar: number;
        ham?: Date;
      }>(testMultiple);
      // @ts-expect-error `foo` should be undefined here
      testMultiple.foo;
      expectType<number>(testMultiple.bar);
      expectType<Date | undefined>(testMultiple.ham);
    });

    test('nested fields', () => {
      const nested = {
        foo: 1,
        'nestedList.0.direct': 1,
        'nestedObject.deep.deeper': 1,
        'nestedObject.direct': 1,
      };

      const testNested: ProjectionType<TestDocument, typeof nested> = {
        _id: new ObjectId(),
        foo: 'foo',
        nestedList: [
          {
            direct: 'in list',
          },
        ],
        nestedObject: {
          deep: {
            deeper: 'in object',
          },
          direct: true,
        },
      };

      expectType<{
        _id: ObjectId;
        foo: string;
        nestedList: {
          direct: string;
        }[];
        nestedObject?: {
          deep?: {
            deeper: string;
          };
          direct: boolean;
        };
      }>(testNested);
      expectType<string>(testNested.foo);
      // @ts-expect-error `bar` should be undefined here
      testNested.bar;
      // @ts-expect-error `ham` should be undefined here
      testNested.ham;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expectType<any[]>(testNested.nestedList);
      expectType<string>(testNested.nestedList[0].direct);
      // @ts-expect-error `nestedList[0].other` should be undefined here
      testNested.nestedList[0].other;
      expectType<object>(testNested.nestedObject);
      expectType<object>(testNested.nestedObject.deep);
      expectType<string>(testNested.nestedObject.deep.deeper);
      // @ts-expect-error `nestedObject.deep.other` should be undefined here
      testNested.nestedObject.deep.other;
      // @ts-expect-error `nestedObject.other` should be undefined here
      testNested.nestedObject.other;
    });

    test('excluding _id', () => {
      const excluding = {
        _id: 0,
        bar: 1,
        ham: 1,
      } as const;

      const testExcluding: ProjectionType<TestDocument, typeof excluding> = {
        bar: 123,
        ham: new Date(),
      };

      expectType<{
        ham?: Date;
      }>(testExcluding);
      // @ts-expect-error `_id` should be undefined here
      testExcluding._id;
      expectType<Date | undefined>(testExcluding.ham);
    });

    test('ProjectionType, full schema except foo', () => {
      const excludingFoo = {
        foo: 0,
      } as const;

      const testExceptFoo: ProjectionType<TestDocument, typeof excludingFoo> = {
        _id: new ObjectId(),
        bar: 123,
        ham: new Date(),
        nestedList: [],
        nestedObject: {
          deep: {
            deeper: 'hi',
          },
          direct: true,
        },
      };

      expectType<Omit<TestDocument, 'foo'>>(testExceptFoo);
      // @ts-expect-error `foo` should be undefined here
      testExceptFoo.foo;
      expectType<number>(testExceptFoo.bar);
      expectType<Date | undefined>(testExceptFoo.ham);
    });

    test('full schema', () => {
      const testFull: ProjectionType<TestDocument, undefined> = {
        _id: new ObjectId(),
        bar: 123,
        foo: 'foo',
        ham: new Date(),
        nestedList: [],
        nestedObject: {
          deep: {
            deeper: 'hi',
          },
          direct: true,
        },
      };

      expectType<TestDocument>(testFull);
      expectType<string>(testFull.foo);
      expectType<number>(testFull.bar);
      expectType<Date | undefined>(testFull.ham);
    });
  });

  describe('getDefaultValues', () => {
    test('static values', async () => {
      const defaults: DefaultsOption<TestDocument> = {
        bar: 1,
        foo: 'test',
      };

      const result = await getDefaultValues(defaults);
      expectType<Partial<TestDocument>>(result);
      expect(result).toStrictEqual(defaults);
    });

    test('dynamic values', async () => {
      const defaults: DefaultsOption<TestDocument> = () => ({
        bar: 1,
        foo: 'test',
        ham: new Date(),
      });

      const result = await getDefaultValues(defaults);
      expectType<Partial<TestDocument>>(result);
      expect(result.ham instanceof Date).toBeTruthy();
    });

    test('dynamic values with async function', async () => {
      function getDateAsync(): Promise<Date> {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(new Date());
          }, 10);
        });
      }

      const defaults: DefaultsOption<TestDocument> = async () => ({
        bar: 1,
        foo: 'test',
        ham: await getDateAsync(),
      });

      const result = await getDefaultValues(defaults);
      expectType<Partial<TestDocument>>(result);
      expect(result.ham instanceof Date).toBeTruthy();
    });
  });

  describe('getIds', () => {
    test.each([
      ['strings', ['123456789012345678900001', '123456789012345678900002']],
      [
        'objectIds',
        [new ObjectId('123456789012345678900001'), new ObjectId('123456789012345678900002')],
      ],
      ['mixed', ['123456789012345678900001', new ObjectId('123456789012345678900002')]],
    ])('%s', (_name, input) => {
      const result = getIds(input);

      expect(result).toHaveLength(2);
      expect(result[0] instanceof ObjectId).toBeTruthy();
      expect(result[0].toHexString()).toBe('123456789012345678900001');
      expect(result[1] instanceof ObjectId).toBeTruthy();
      expect(result[1].toHexString()).toBe('123456789012345678900002');
    });
  });
});
