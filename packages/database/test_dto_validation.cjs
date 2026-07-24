const { validate } = require('class-validator');
const { PlainToClassSerializer } = require('class-transformer');
const { IsOptional, IsString, IsUUID, Min, Max, IsIn } = require('class-validator');

// Replicate the class with decorators to test
class TestQueryBatchDto {
  constructor() {
    this.page = 1;
    this.limit = 20;
    this.sortBy = 'createdAt';
    this.sortOrder = 'DESC';
  }
}

// Decorate the properties
IsOptional()(TestQueryBatchDto.prototype, 'page');
IsOptional()(TestQueryBatchDto.prototype, 'limit');
IsOptional()(TestQueryBatchDto.prototype, 'perPage');
IsOptional()(TestQueryBatchDto.prototype, 'search');
IsOptional()(TestQueryBatchDto.prototype, 'sortBy');
IsOptional()(TestQueryBatchDto.prototype, 'sortOrder');
IsOptional()(TestQueryBatchDto.prototype, 'courseId');
IsUUID()(TestQueryBatchDto.prototype, 'courseId');
IsOptional()(TestQueryBatchDto.prototype, 'branchId');
IsUUID()(TestQueryBatchDto.prototype, 'branchId');
IsOptional()(TestQueryBatchDto.prototype, 'academicYearId');
IsUUID()(TestQueryBatchDto.prototype, 'academicYearId');
IsOptional()(TestQueryBatchDto.prototype, 'deliveryTypeId');
IsUUID()(TestQueryBatchDto.prototype, 'deliveryTypeId');

const BatchStatusTypeValues = ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED'];
IsOptional()(TestQueryBatchDto.prototype, 'status');
IsIn([...BatchStatusTypeValues, 'ALL'])(TestQueryBatchDto.prototype, 'status');

async function test(payload) {
  const obj = new TestQueryBatchDto();
  Object.assign(obj, payload);

  // Parse numeric values like ClassSerializer does
  if (obj.page !== undefined) obj.page = Number(obj.page);
  if (obj.limit !== undefined) obj.limit = Number(obj.limit);
  if (obj.perPage !== undefined) obj.perPage = Number(obj.perPage);

  const errors = await validate(obj);
  return errors;
}

async function run() {
  const payloads = [
    { page: '1', perPage: '10', search: '', status: 'ALL' },
    {
      page: '1',
      perPage: '10',
      search: '',
      status: 'ALL',
      branchId: '00000000-0000-0000-0000-000000000006',
    },
    {
      page: '1',
      perPage: '10',
      search: '',
      status: 'ALL',
      branchId: '00000000-0000-0000-0000-000000000006',
      courseId: '',
    },
  ];

  for (const p of payloads) {
    const errs = await test(p);
    console.log(`\nTesting payload: ${JSON.stringify(p)}`);
    if (errs.length > 0) {
      console.log(
        'FAIL:',
        errs.map((e) => ({ property: e.property, value: e.value, constraints: e.constraints })),
      );
    } else {
      console.log('PASS');
    }
  }
}

run().catch(console.error);
