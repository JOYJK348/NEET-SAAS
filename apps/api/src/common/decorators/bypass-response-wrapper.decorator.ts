import { SetMetadata, CustomDecorator } from '@nestjs/common';

export const BYPASS_RESPONSE_WRAPPER_KEY = 'bypassResponseWrapper';
export const BypassResponseWrapper = (): CustomDecorator<string> =>
  SetMetadata(BYPASS_RESPONSE_WRAPPER_KEY, true);
