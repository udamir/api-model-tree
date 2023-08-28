import { getAnnotations, getValidations } from '../src/accessors';
import { SchemaNodeKind } from '../src/consts';

describe('accessors unit tests', () => {
  describe('getAnnotations util', () => {
    it('should treat example as examples', () => {
      expect(
        getAnnotations({
          example: 'foo',
        }),
      ).toStrictEqual({
        examples: ['foo'],
      });
    });

    it('should prefer examples over example', () => {
      expect(
        getAnnotations({
          examples: ['bar', 'baz'],
          example: 'foo',
        }),
      ).toStrictEqual({
        examples: ['bar', 'baz'],
      });
    });
  });

  describe('getValidations util', () => {
    it('should support integer type', () => {
      expect(
        getValidations(
          {
            minimum: 2,
            exclusiveMaximum: true,
            maximum: 20,
            multipleOf: 2,
          },
          [SchemaNodeKind.Integer],
        ),
      ).toStrictEqual({
        exclusiveMaximum: true,
        maximum: 20,
        minimum: 2,
        multipleOf: 2,
      });
    });
  });

})